using System.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Domain.Entities;
using Sethu.Domain.Membership;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.MembershipIntake;

namespace Sethu.Infrastructure.MembershipIntake;

public sealed class EfRegistrationLinkStore(SethuDbContext db) : IRegistrationLinkStore
{
    public async Task<RegistrationLinkResult> LinkAsync(Guid tenantId, Guid reviewerId,
        RegistrationLinkRequest request, CancellationToken ct)
    {
        // Serializable transaction and two unique indices prevent many-to-one crosswalks.
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var now = DateTimeOffset.UtcNow;
        var reviewer = await db.UserIdentities.AsNoTracking().SingleOrDefaultAsync(
            x => x.Id == reviewerId && x.TenantId == tenantId && x.Active, ct);
        if (reviewer is null) return new(false, "reviewer_invalid");
        var reg = await db.DbnMemberRegistrations.AsNoTracking().SingleOrDefaultAsync(
            x => x.Id == request.RegistrationId && x.TenantId == tenantId, ct);
        var intake = await db.Set<MemberIntake>().SingleOrDefaultAsync(
            x => x.Id == request.IntakeId && x.TenantId == tenantId, ct);
        if (reg is null || intake is null) return new(false, "application_not_found");
        if (!reg.ChapterId.HasValue || reg.ChapterId.Value != intake.ChapterId)
            return new(false, "chapter_mismatch");
        if (intake.ApplicantUserId != request.ApplicantUserId ||
            !await db.UserIdentities.AnyAsync(x => x.Id == request.ApplicantUserId &&
                x.TenantId == tenantId && x.Active && x.IsContactVerified, ct))
            return new(false, "applicant_identity_unverified");
        // A verified account alone does not establish ownership of this legacy submission.
        // Contact must match the registration record; conflicting records require stewardship review.
        var applicant = await db.UserIdentities.AsNoTracking().SingleAsync(
            x => x.Id == request.ApplicantUserId && x.TenantId == tenantId, ct);
        if (string.IsNullOrWhiteSpace(reg.Email) || string.IsNullOrWhiteSpace(applicant.Email) ||
            !string.Equals(reg.Email.Trim(), applicant.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            return new(false, "registration_contact_unresolved");
        if (reviewerId == request.ApplicantUserId) return new(false, "self_review_denied");
        var grant = await db.PermissionGrants.AsNoTracking().AnyAsync(x =>
            x.TenantId == tenantId && x.UserId == reviewerId && !x.Revoked &&
            x.Permission == "membership.registration.reconcile" &&
            x.StartsAt <= now && (!x.EndsAt.HasValue || x.EndsAt > now) &&
            (!x.ChapterId.HasValue || x.ChapterId == intake.ChapterId), ct);
        if (!grant) return new(false, "permission_denied");
        if (intake.State is IntakeState.Activated or IntakeState.Rejected or IntakeState.Withdrawn)
            return new(false, "invalid_intake_state");
        var existing = await db.MembershipRegistrationLinks.AsNoTracking().FirstOrDefaultAsync(x =>
            x.TenantId == tenantId && (x.RegistrationId == request.RegistrationId || x.IntakeId == request.IntakeId), ct);
        if (existing is not null)
            return existing.RegistrationId == request.RegistrationId && existing.IntakeId == request.IntakeId
                ? new(true, "already_linked", existing.Id) : new(false, "link_conflict");
        var link = new MembershipRegistrationLink { Id = Guid.NewGuid(), TenantId = tenantId,
            ChapterId = intake.ChapterId, RegistrationId = request.RegistrationId,
            IntakeId = request.IntakeId, ApplicantUserId = request.ApplicantUserId,
            ReviewerUserId = reviewerId, EvidenceReference = request.EvidenceReference.Trim(), ReviewedAt = now };
        db.MembershipRegistrationLinks.Add(link);
        db.Audits.Add(new Audit { Id = Guid.NewGuid(), TenantId = tenantId, ActorId = reviewerId,
            ResourceId = intake.Id, Operation = "membership.registration.reconcile", Event = "verified_registration_link",
            CorrelationId = link.Id.ToString("N"), OccurredAt = now });
        try
        {
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return new(true, "registration_linked", link.Id);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg &&
            pg.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return new(false, "link_conflict");
        }
    }
}
