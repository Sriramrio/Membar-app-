using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sethu.Domain.Finance;
using Sethu.Domain.MemberBusiness;
using Sethu.Domain.Membership;
using Sethu.Infrastructure.Finance;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.MembershipIntake;
using Sethu.Infrastructure.MembershipWorkflow;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.Taxonomy;
using Sethu.Domain.Entities;

namespace Sethu.Infrastructure.FinanceEffects;

public sealed class FinanceEffectProcessor(IDbContextFactory<SethuDbContext> factory, TimeProvider clock)
{
    public async Task<string> ExecuteAsync(Guid eventId, Guid workerId, CancellationToken ct)
    {
        await using var db = await factory.CreateDbContextAsync(ct);
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var messages = await db.Outbox.FromSqlInterpolated($"SELECT * FROM public.outbox_messages WHERE \"Id\" = {eventId} FOR UPDATE").ToListAsync(ct);
        var message = messages.SingleOrDefault();
        if (message is null) return "event_not_found";
        if (message.DispatchedAt is not null) return "already_processed";
        if(message.LeaseOwner!=workerId || message.LeaseExpiresAt<=clock.GetUtcNow()) return "lease_not_owned";
        var paymentRows = await db.Set<GovernedPayment>().FromSqlInterpolated($"SELECT * FROM public.governed_payments WHERE \"Id\" = {message.ResourceId} AND \"TenantId\" = {message.TenantId} FOR UPDATE").ToListAsync(ct);
        var payment = paymentRows.SingleOrDefault();
        if (payment is null) return "payment_not_found";
        if (payment.Status != "Approved" || FinanceCompletionRouting.EffectFor(payment.Purpose) != message.Event)
            return "finance_decision_no_longer_effective";
        // The effective decision must refer to the current (non-superseded) claim.
        // An old approved decision cannot authorize an effect after a correction.
        var decision = await (from d in db.Set<ManualPaymentDecision>().AsNoTracking()
            join c in db.Set<PaymentClaim>().AsNoTracking() on d.ClaimId equals c.Id
            where d.TenantId==message.TenantId && d.PaymentId==payment.Id &&
                c.TenantId==message.TenantId && c.PaymentId==payment.Id && !c.Superseded &&
                d.Decision==ManualFinanceDecision.Approved && d.OwnerType==payment.OwnerType
            select d.Id).AnyAsync(ct);
        if (!decision) return "effective_finance_approval_absent";
        // Reject a stale approval after later clarification, rejection or reversal.
        var latestDecision=await db.Set<ManualPaymentDecision>().AsNoTracking()
            .Where(x=>x.TenantId==payment.TenantId&&x.PaymentId==payment.Id)
            .OrderByDescending(x=>x.DecidedAt).ThenByDescending(x=>x.Id)
            .FirstOrDefaultAsync(ct);
        if(latestDecision is null || latestDecision.Decision!=ManualFinanceDecision.Approved)
            return "latest_finance_decision_not_approved";
        // A member cannot verify their own payment. The current finance decision
        // must identify a non-empty independent verifier.
        if (latestDecision.VerifierId == Guid.Empty ||
            latestDecision.VerifierId == payment.PayerUserId)
            return "independent_finance_verifier_required";
        var effectiveClaim = await db.Set<PaymentClaim>().AsNoTracking().SingleOrDefaultAsync(x =>
            x.Id == latestDecision.ClaimId && x.TenantId == payment.TenantId &&
            x.PaymentId == payment.Id && !x.Superseded, ct);
        if (effectiveClaim is null || effectiveClaim.SubmittedBy == latestDecision.VerifierId)
            return "finance_maker_checker_separation_required";
        var nowPolicy=clock.GetUtcNow();
        var account=await db.Set<ReceivingAccount>().AsNoTracking()
            .SingleOrDefaultAsync(x=>x.Id==payment.ReceivingAccountId&&x.TenantId==payment.TenantId,ct);
        if(account is null || account.OwnerType!=payment.OwnerType ||
            (payment.OwnerType==FinanceOwnerType.Chapter&&account.OwnerUnitId!=payment.ChapterId))
            return "finance_owner_mismatch";
        var policies=await db.Set<FinanceProcessingPolicy>().AsNoTracking().Where(x=>
            x.TenantId==payment.TenantId&&x.Purpose==payment.Purpose&&x.OwnerType==payment.OwnerType&&
            x.OwnerUnitId==account.OwnerUnitId&&x.Approved&&x.EffectiveFrom<=nowPolicy&&
            (x.EffectiveUntil==null||x.EffectiveUntil>nowPolicy)).ToListAsync(ct);
        if(policies.Count!=1)return "processing_policy_not_effective";
        if(policies[0].PostVerificationMode=="MANUAL")
        {
            // A manual finance effect is released by an authenticated/authorised command.
            // The worker still runs the very same canonical business-effect mutation.
            if(!await db.Outbox.AnyAsync(x=>x.TenantId==payment.TenantId&&x.ResourceId==payment.Id&&
                x.Event=="finance.business.manual-release-authorized.v1",ct))return "manual_release_absent";
        }
        else if(policies[0].PostVerificationMode!="AUTOMATIC")return "processing_mode_invalid";
        string outcome = payment.Purpose switch
        {
            FinancePurpose.NewMembership => await ActivateAsync(db,payment,ct),
            FinancePurpose.MembershipRenewal => await RenewAsync(db,payment,ct),
            FinancePurpose.ChapterMeeting => await ConfirmActivityAsync(db,payment,false,ct),
            FinancePurpose.ChapterEvent => await ConfirmActivityAsync(db,payment,true,ct),
            _ => "unsupported_finance_purpose"
        };
        if (outcome is not ("activated" or "already_activated" or "renewed" or "already_renewed" or "meeting_payment_confirmed" or "event_payment_confirmed" or "already_confirmed"))
            return outcome; // unacknowledged; transaction rolls back
        var now=clock.GetUtcNow();
        db.Audits.Add(new Audit { Id=Guid.NewGuid(),TenantId=payment.TenantId,ActorId=Guid.Empty,ResourceId=payment.ContextId,Operation="finance.internal.business.effect",Event=outcome,OccurredAt=now });
        db.Outbox.Add(new Outbox {Id=Guid.NewGuid(),TenantId=payment.TenantId,ResourceId=payment.ContextId,Event="finance.business."+outcome,OccurredAt=now});
        message.DispatchedAt=now;
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return outcome;
    }
    private async Task<string> ActivateAsync(SethuDbContext db, GovernedPayment p,CancellationToken ct)
    {
        if(p.OwnerType!=FinanceOwnerType.Trust)return "trust_ownership_required";
        var intakes=await db.Set<MemberIntake>().FromSqlInterpolated($"SELECT * FROM public.member_intakes WHERE \"Id\" = {p.ContextId} AND \"TenantId\" = {p.TenantId} FOR UPDATE").ToListAsync(ct);
        var intake=intakes.SingleOrDefault();
        if(intake is null || intake.ChapterId!=p.ChapterId || intake.ApplicantUserId!=p.PayerUserId)return "intake_inconsistent";
        // No legacy registration may be silently treated as the governed application.
        // Where an earlier public registration exists for the same verified account,
        // a separately reviewed one-to-one crosswalk must precede activation.
        var applicant = await db.UserIdentities.AsNoTracking().SingleOrDefaultAsync(x =>
            x.Id == intake.ApplicantUserId && x.TenantId == p.TenantId && x.Active, ct);
        if (applicant is null || !applicant.IsContactVerified ||
            string.IsNullOrWhiteSpace(applicant.Issuer) || string.IsNullOrWhiteSpace(applicant.Subject))
            return "verified_canonical_identity_required";
        var legacyRegistrations = await db.DbnMemberRegistrations.AsNoTracking().Where(x =>
            x.TenantId == p.TenantId && x.ChapterId == intake.ChapterId &&
            x.Email != null && applicant.Email != null && x.Email.ToLower() == applicant.Email.ToLower())
            .Select(x => x.Id).ToListAsync(ct);
        if (legacyRegistrations.Count > 0)
        {
            var approvedLinks = await db.MembershipRegistrationLinks.AsNoTracking().Where(x =>
                x.TenantId == p.TenantId && x.IntakeId == intake.Id &&
                x.ApplicantUserId == applicant.Id && x.ChapterId == intake.ChapterId)
                .Select(x => x.RegistrationId).ToListAsync(ct);
            if (legacyRegistrations.Count != 1 || approvedLinks.Count != 1 ||
                !legacyRegistrations.Contains(approvedLinks[0]))
                return "legacy_registration_reconciliation_required";
        }
        if(intake.State==IntakeState.Activated)return "already_activated";
        if(intake.State!=IntakeState.PaymentRequested && intake.State!=IntakeState.FinanceVerified)return "intake_not_ready";
        var policies=await db.Set<IntakeRequiredDocumentPolicy>().AsNoTracking().Where(x=>x.TenantId==p.TenantId&&x.ChapterId==intake.ChapterId&&x.Active&&x.Required&&x.EffectiveFrom<=clock.GetUtcNow()&&
            (x.EffectiveUntil==null||x.EffectiveUntil>clock.GetUtcNow())).ToListAsync(ct);
        if(policies.Count==0)return "document_policy_missing";
        var doc=await db.Set<IntakeDocument>().AsNoTracking().Where(x=>x.TenantId==p.TenantId&&x.IntakeId==intake.Id).ToListAsync(ct);
        var decisions=await db.Set<IntakeDecision>().AsNoTracking()
            .Where(x=>x.TenantId==p.TenantId&&x.IntakeId==intake.Id).ToListAsync(ct);
        // Decisions are stamped BEFORE AdvanceTo increments the intake version.
        // They cannot equal the later PaymentRequested version. Select the latest
        // verification and reject evidence that was modified after that review.
        var documentReview = decisions.Where(x => x.Decision == "VerifyDocuments" &&
            x.ApplicationVersion <= intake.Version)
            .OrderByDescending(x => x.ApplicationVersion).ThenByDescending(x => x.At)
            .FirstOrDefault();
        if (documentReview is null) return "document_verification_missing";
        if (documentReview.ActorId == Guid.Empty || documentReview.ActorId == intake.ApplicantUserId)
            return "independent_document_verification_required";
        if (doc.Any(x => x.ApplicationVersion > documentReview.ApplicationVersion ||
            x.SubmittedAt > documentReview.At)) return "documents_changed_after_verification";
        if (policies.Any(policy => !doc.Any(d => d.Kind == policy.DocumentKind &&
            d.ApplicationVersion <= documentReview.ApplicationVersion &&
            d.SubmittedAt <= documentReview.At && d.SubmittedAt >= policy.EffectiveFrom)))
            return "mandatory_document_missing";
        var committeePolicies=await db.Set<CommitteeApprovalPolicy>().AsNoTracking()
            .Where(x=>x.TenantId==p.TenantId&&x.ChapterId==intake.ChapterId&&x.Active&&
                x.EffectiveFrom<=clock.GetUtcNow()&&
                (x.EffectiveUntil==null||x.EffectiveUntil>clock.GetUtcNow())).ToListAsync(ct);
        if (committeePolicies.Count != 1 || committeePolicies[0].RequiredApprovals < 1)
            return "committee_policy_missing_or_ambiguous";
        var committee=committeePolicies[0];
        // Committee approvals must follow the effective document verification,
        // and must precede the current payment-stage version. Count distinct,
        // independent actors rather than historical approval events.
        var effectiveCommittee = decisions.Where(x => x.Decision == "ApproveCommittee" &&
            x.ApplicationVersion > documentReview.ApplicationVersion &&
            x.ApplicationVersion <= intake.Version && x.At >= documentReview.At)
            .ToList();
        if (effectiveCommittee.Any(x => x.ActorId == Guid.Empty ||
            x.ActorId == intake.ApplicantUserId || x.ActorId == documentReview.ActorId))
            return "committee_separation_of_duties_required";
        if (effectiveCommittee.Select(x => x.ActorId).Distinct().Count() < committee.RequiredApprovals)
            return "committee_not_approved";
        if(!await db.Units.AnyAsync(x=>x.Id==intake.ChapterId&&x.TenantId==p.TenantId&&x.Active,ct))return "chapter_inactive";
        if(!await db.Set<Specialisation>().AnyAsync(x=>x.Id==intake.ProposedSpecialisationId&&x.Active,ct))return "specialisation_inactive";
        if(await db.Set<MemberRecord>().AnyAsync(x=>x.TenantId==p.TenantId&&x.UserId==intake.ApplicantUserId,ct))return "member_conflict";
        if(await db.Set<ChapterSpecialisationClaim>().AnyAsync(x=>x.TenantId==p.TenantId&&x.ChapterId==intake.ChapterId&&x.SpecialisationId==intake.ProposedSpecialisationId&&x.Active,ct))return "specialisation_occupied";
        var memberId=Guid.NewGuid();
        var newMember=MemberRecord.Create(memberId,p.TenantId,intake.ApplicantUserId);newMember.Activate(true,true);db.Set<MemberRecord>().Add(newMember);
        var newAffiliation=MemberChapterAffiliation.Create(Guid.NewGuid(),p.TenantId,memberId,intake.ChapterId);newAffiliation.Approve();db.Set<MemberChapterAffiliation>().Add(newAffiliation);
        var newBusiness=BusinessRecord.Create(Guid.NewGuid(),p.TenantId,memberId,intake.BusinessName,intake.ProposedSpecialisationId);newBusiness.Activate(true);db.Set<BusinessRecord>().Add(newBusiness);
        db.Set<ChapterSpecialisationClaim>().Add(new(){Id=Guid.NewGuid(),TenantId=p.TenantId,ChapterId=intake.ChapterId,SpecialisationId=intake.ProposedSpecialisationId,MemberId=memberId,Active=true});
        // Attach conversion credit to the SAME serializable finance activation transaction.
        // An unlinked visitor does not prevent legitimate membership activation.
        var reviewedLinks = await db.VisitorIntakeLinks.AsNoTracking()
            .Where(x => x.TenantId == p.TenantId && x.IntakeId == intake.Id && x.ChapterId == intake.ChapterId)
            .ToListAsync(ct);
        if (reviewedLinks.Count > 1) return "ambiguous_visitor_intake_link";
        if (reviewedLinks.Count == 1)
        {
            var link = reviewedLinks[0];
            var visitor = await db.VisitorRegistrations.AsNoTracking().SingleOrDefaultAsync(x =>
                x.TenantId == p.TenantId && x.Id == link.RegistrationId &&
                x.ChapterId == intake.ChapterId && x.Verified, ct);
            if (visitor is null) return "visitor_link_verification_revoked";
            // Official conversion credit is only awarded when the verified
            // visitor identity matches the actual applicant identity. The
            // membership activation itself is independent of attribution.
            var matchesApplicant = !string.IsNullOrWhiteSpace(applicant.Email) &&
                !string.IsNullOrWhiteSpace(visitor.Email) &&
                string.Equals(applicant.Email.Trim(), visitor.Email.Trim(),
                    StringComparison.OrdinalIgnoreCase);
            var candidates = await db.VisitorInvitations.AsNoTracking().Where(x =>
                x.TenantId == p.TenantId && x.ChapterId == intake.ChapterId &&
                x.VisitorRegistrationId == link.RegistrationId && x.Status != "Cancelled")
                .Select(x => new { x.Id, x.InviterMemberId, x.Email, x.CreatedAt }).ToListAsync(ct);
            // An ambiguous/malformed invitation is not official conversion evidence.
            // Finance activation continues without attribution, to be reviewed separately.
            var activatedAt = clock.GetUtcNow();
            if (matchesApplicant && candidates.Count == 1 && candidates[0].InviterMemberId != Guid.Empty &&
                !string.IsNullOrWhiteSpace(visitor.Email) &&
                string.Equals(candidates[0].Email?.Trim(), visitor.Email.Trim(), StringComparison.OrdinalIgnoreCase) &&
                candidates[0].CreatedAt <= activatedAt && visitor.CreatedAt <= activatedAt &&
                await db.Set<MemberRecord>().AsNoTracking().AnyAsync(x =>
                    x.TenantId == p.TenantId && x.Id == candidates[0].InviterMemberId, ct))
            {
                db.VisitorConversionCredits.Add(new VisitorConversionCredit
                {
                    Id = Guid.NewGuid(), TenantId = p.TenantId, ChapterId = link.ChapterId,
                    RegistrationId = link.RegistrationId, IntakeId = intake.Id, MemberId = memberId,
                    InvitationId = candidates[0].Id, InviterMemberId = candidates[0].InviterMemberId,
                    ActivatedAt = activatedAt
                });
            }
        }
        intake.AdvanceTo(IntakeState.Activated);
        return "activated";
    }
    private static async Task<string> ConfirmActivityAsync(SethuDbContext db, GovernedPayment p, bool capacityRequired, CancellationToken ct)
    {
        if(p.OwnerType!=FinanceOwnerType.Chapter)return "chapter_ownership_required";
        // Lock the activity before evaluating remaining seats; SERIALIZABLE alone does not
        // excuse an in-memory capacity read followed by a non-atomic allocation.
        var activities=await db.Set<ChapterActivity>().FromSqlInterpolated(
            $"SELECT * FROM public.chapter_activities WHERE \"Id\" = {p.ContextId} AND \"TenantId\" = {p.TenantId} FOR UPDATE").ToListAsync(ct);
        var activity=activities.SingleOrDefault();
        if(activity is null || activity.ChapterId!=p.ChapterId || activity.Purpose!=p.Purpose || activity.Cancelled)
            return "activity_invalid_or_cancelled";
        var registrations=await db.Set<ChapterActivityRegistration>().FromSqlInterpolated(
            $"SELECT * FROM public.chapter_activity_registrations WHERE \"TenantId\" = {p.TenantId} AND \"ActivityId\" = {p.ContextId} FOR UPDATE").ToListAsync(ct);
        var registration=registrations.SingleOrDefault(r=>r.PaymentId==p.Id);
        if(registration is null || registration.Cancelled)return "payable_registration_not_found";
        if(registration.PaymentVerified)return "already_confirmed";
        var member=await db.Set<MemberRecord>().AsNoTracking().SingleOrDefaultAsync(
            x=>x.TenantId==p.TenantId&&x.Id==registration.MemberId&&x.UserId==p.PayerUserId&&x.Status==MemberRecordStatus.Active,ct);
        if(member is null)return "registration_member_ineligible";
        registration.PaymentVerified=true;
        if(capacityRequired)
        {
            if(activity.Capacity is null || activity.Capacity<=0)return "event_capacity_policy_missing";
            if(registrations.Count(x=>x.SeatConfirmed&&!x.Cancelled)>=activity.Capacity)
            {
                registration.Waitlisted=true;
                registration.SeatConfirmed=false;
            }
            else
            {
                registration.SeatConfirmed=true;
                registration.Waitlisted=false;
            }
        }
        // Intentionally never touches registration.Attended.
        registration.Version++;
        return capacityRequired?"event_payment_confirmed":"meeting_payment_confirmed";
    }
    private async Task<string> RenewAsync(SethuDbContext db, GovernedPayment p, CancellationToken ct)
    {
        if(p.OwnerType!=FinanceOwnerType.Trust)return "trust_ownership_required";
        var memberRows=await db.Set<MemberRecord>().FromSqlInterpolated($"SELECT * FROM public.members WHERE \"Id\" = {p.ContextId} AND \"TenantId\" = {p.TenantId} FOR UPDATE").ToListAsync(ct);
        var member=memberRows.SingleOrDefault();
        if(member is null||member.UserId!=p.PayerUserId||member.Status!=MemberRecordStatus.Active)return "member_ineligible";
        if(await db.Set<MembershipPeriod>().AnyAsync(x=>x.TenantId==p.TenantId&&x.PaymentId==p.Id,ct))return "already_renewed";
        var now=clock.GetUtcNow();
        var policies=await db.Set<RenewalValidityPolicy>().Where(x=>x.TenantId==p.TenantId&&x.Approved&&x.EffectiveFrom<=now&&(x.EffectiveUntil==null||x.EffectiveUntil>now)).ToListAsync(ct);
        if(policies.Count!=1||policies[0].DurationMonths<=0 || policies[0].StartRule is not ("ExtendFromExpiry" or "StartToday"))return "renewal_policy_missing_or_ambiguous";
        var previous=await db.Set<MembershipPeriod>().Where(x=>x.TenantId==p.TenantId&&x.MemberId==member.Id).OrderByDescending(x=>x.EndsOn).FirstOrDefaultAsync(ct);
        var today=DateOnly.FromDateTime(now.UtcDateTime);
        var start=policies[0].StartRule=="ExtendFromExpiry" && previous is not null && previous.EndsOn>=today?previous.EndsOn.AddDays(1):today;
        var end=start.AddMonths(policies[0].DurationMonths).AddDays(-1);
        db.Set<MembershipPeriod>().Add(new(){Id=Guid.NewGuid(),TenantId=p.TenantId,MemberId=member.Id,PaymentId=p.Id,StartsOn=start,EndsOn=end,AppliedAt=now});
        return "renewed";
    }
}
