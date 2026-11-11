using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MembershipIntake;
using Sethu.Domain.Membership;
using Sethu.Domain.MemberBusiness;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.MembershipIntake;
using Sethu.Infrastructure.MemberBusiness;
using Sethu.Infrastructure.Taxonomy;
using Sethu.Infrastructure.Finance;
using Sethu.Domain.Finance;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.MembershipWorkflow;

public sealed class EfIntakeWorkflowStore(SethuDbContext db,IDbContextFactory<SethuDbContext> factory):IIntakeWorkflowStore
{
    public async Task<IntakeWorkflowOutcome> ExecuteAsync(Guid tenantId,Guid actorId,string issuer,string sessionId,IntakeWorkflowCommand cmd,CancellationToken ct)
    {
        var operation="intake."+cmd.Operation;
        var fingerprint=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(cmd))));
        async Task<IntakeWorkflowOutcome> RecoverAsync()
        {
            try {
                await using var fresh=await factory.CreateDbContextAsync(ct);
                var old=await fresh.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.ActorId==actorId&&x.Operation==operation&&x.Key==cmd.IdempotencyKey,ct);
                if(old is null)return new(false,"commit_outcome_indeterminate",cmd.ApplicationId,null);
                if(old.PayloadSha256!=fingerprint)return new(false,"idempotency_conflict",cmd.ApplicationId,null);
                return JsonSerializer.Deserialize<IntakeWorkflowOutcome>(old.ResultJson)??new(false,"stored_result_invalid",cmd.ApplicationId,null);
            } catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;} catch(Exception){return new(false,"commit_outcome_indeterminate",cmd.ApplicationId,null);}
        }
        try {
            await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
            var prior=await db.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.ActorId==actorId&&x.Operation==operation&&x.Key==cmd.IdempotencyKey,ct);
            if(prior is not null){if(prior.PayloadSha256!=fingerprint)return new(false,"idempotency_conflict",cmd.ApplicationId,null);return JsonSerializer.Deserialize<IntakeWorkflowOutcome>(prior.ResultJson)??new(false,"stored_result_invalid",cmd.ApplicationId,null);}
            // Lock the precise session and identity during the mutation. The actual authentication middleware
            // remains an independent deployment gate; caller claims are never sufficient as authority.
            var sessionRows=await db.Sessions.FromSqlInterpolated($"SELECT * FROM public.sessions WHERE \"Issuer\" = {issuer} AND \"SessionId\" = {sessionId} AND \"UserId\" = {actorId} FOR UPDATE").ToListAsync(ct);
            var session=sessionRows.SingleOrDefault();
            if(session is null||session.Revoked||session.ExpiresAt<=DateTimeOffset.UtcNow)return new(false,"session_invalid",cmd.ApplicationId,null);
            var userRows=await db.UserIdentities.FromSqlInterpolated($"SELECT * FROM public.user_identities WHERE \"Id\" = {actorId} AND \"TenantId\" = {tenantId} FOR UPDATE").ToListAsync(ct);
            var user=userRows.SingleOrDefault();
            if(user is null||!user.Active)return new(false,"identity_inactive",cmd.ApplicationId,null);
            var intakeRows=await db.Set<MemberIntake>().FromSqlInterpolated($"SELECT * FROM public.member_intakes WHERE \"Id\" = {cmd.ApplicationId} AND \"TenantId\" = {tenantId} FOR UPDATE").ToListAsync(ct);
            var intake=intakeRows.SingleOrDefault();
            if(intake is null)return new(false,"application_not_found",cmd.ApplicationId,null);
            if(intake.Version!=cmd.ExpectedVersion)return new(false,"stale_version",cmd.ApplicationId,intake.Version);
            var isApplicant=intake.ApplicantUserId==actorId;
            var permission=cmd.Operation switch {
                IntakeOperation.VerifyDocuments=>"onboarding.documents.verify", IntakeOperation.ApproveCommittee=>"onboarding.committee.approve",
                IntakeOperation.IssuePaymentRequest=>"onboarding.payment.issue",IntakeOperation.ReconcileFinance=>"onboarding.finance.verify",
                IntakeOperation.Activate=>"onboarding.member.activate",IntakeOperation.RecordCertificate=>"onboarding.certificate.deliver",_=>""};
            if(permission.Length>0){
                if(isApplicant)return new(false,"self_approval_denied",cmd.ApplicationId,intake.Version);
                var now=DateTimeOffset.UtcNow;
                // Direct trusted grants only; delegated authority is unavailable until canonical chain consistency is proven.
                var grantRows=await db.PermissionGrants.FromSqlInterpolated($"SELECT * FROM public.permission_grants WHERE \"UserId\" = {actorId} AND \"TenantId\" = {tenantId} AND \"Permission\" = {permission} FOR UPDATE").ToListAsync(ct);
                var grant=grantRows.Any(x=>!x.Revoked && !x.IndependentGovernance && x.ChapterId==intake.ChapterId && x.StartsAt<=now && (x.EndsAt==null || x.EndsAt>now));
                if(!grant)return new(false,"authority_denied",cmd.ApplicationId,intake.Version);
            }
            Guid? createdMemberId=null;
            var next=intake.State;
            switch(cmd.Operation){
                case IntakeOperation.RecordDocument:
                    if(!isApplicant||intake.State is not(IntakeState.Draft or IntakeState.Submitted or IntakeState.ClarificationRequired)||string.IsNullOrWhiteSpace(cmd.EvidenceReference)||string.IsNullOrWhiteSpace(cmd.DocumentKind)||cmd.DocumentKind.Length>80)return Deny("document_update_denied");
                    if(!await db.Set<IntakeRequiredDocumentPolicy>().AnyAsync(x=>x.TenantId==tenantId&&x.ChapterId==intake.ChapterId&&x.DocumentKind==cmd.DocumentKind&&x.Active&&x.EffectiveFrom<=DateTimeOffset.UtcNow&&(x.EffectiveUntil==null||x.EffectiveUntil>DateTimeOffset.UtcNow),ct))return Deny("document_kind_not_allowed");
                    db.Set<IntakeDocument>().Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,IntakeId=intake.Id,Kind=cmd.DocumentKind!,SecureReference=cmd.EvidenceReference,SubmittedBy=actorId,SubmittedAt=DateTimeOffset.UtcNow,ApplicationVersion=intake.Version+1,DocumentVersion=await db.Set<IntakeDocument>().CountAsync(x=>x.TenantId==tenantId&&x.IntakeId==intake.Id&&x.Kind==cmd.DocumentKind,ct)+1});
                    if(intake.State==IntakeState.ClarificationRequired)next=IntakeState.Submitted;break;
                case IntakeOperation.VerifyDocuments:
                    if(intake.State!=IntakeState.Submitted)return Deny("documents_not_submitted");
                    var requiredPolicies=await db.Set<IntakeRequiredDocumentPolicy>().AsNoTracking().Where(x=>x.TenantId==tenantId&&x.ChapterId==intake.ChapterId&&x.Active&&x.Required&&x.EffectiveFrom<=DateTimeOffset.UtcNow&&(x.EffectiveUntil==null||x.EffectiveUntil>DateTimeOffset.UtcNow)).ToListAsync(ct);
                    if(requiredPolicies.Count==0)return Deny("document_policy_not_configured");
                    var requiredVersion=requiredPolicies.Max(x=>x.PolicyVersion);
                    if(requiredPolicies.Any(x=>x.PolicyVersion!=requiredVersion))return Deny("document_policy_ambiguous");
                    var submitted=await db.Set<IntakeDocument>().AsNoTracking().Where(x=>x.TenantId==tenantId&&x.IntakeId==intake.Id).ToListAsync(ct);
                    if(requiredPolicies.Any(x=>!submitted.Any(d=>d.Kind==x.DocumentKind&&d.ApplicationVersion<=intake.Version&&d.SubmittedAt>=x.EffectiveFrom)))return Deny("documents_required");
                    if(await db.Set<IntakeDecision>().AnyAsync(x=>x.TenantId==tenantId&&x.IntakeId==intake.Id&&x.Decision=="VerifyDocuments"&&x.ApplicationVersion==intake.Version,ct))return Deny("already_verified");
                    next=IntakeState.DocumentsVerified;break;
                case IntakeOperation.ApproveCommittee:
                    if(intake.State!=IntakeState.DocumentsVerified)return Deny("documents_not_verified");
                    var approvalTime=DateTimeOffset.UtcNow;
                    var matchingPolicies=await db.Set<CommitteeApprovalPolicy>().AsNoTracking()
                        .Where(x=>x.TenantId==tenantId&&x.ChapterId==intake.ChapterId&&x.Active&&
                            x.EffectiveFrom<=approvalTime&&(x.EffectiveUntil==null||x.EffectiveUntil>approvalTime))
                        .ToListAsync(ct);
                    if(matchingPolicies.Count!=1 || matchingPolicies[0].RequiredApprovals<1)
                        return Deny("committee_policy_not_satisfied");
                    var policy=matchingPolicies[0];
                    var latestVerification=await db.Set<IntakeDecision>().AsNoTracking()
                        .Where(x=>x.TenantId==tenantId&&x.IntakeId==intake.Id&&
                            x.Decision=="VerifyDocuments"&&x.ApplicationVersion<=intake.Version)
                        .OrderByDescending(x=>x.ApplicationVersion).ThenByDescending(x=>x.At)
                        .FirstOrDefaultAsync(ct);
                    if(latestVerification is null)return Deny("document_verification_missing");
                    if(latestVerification.ActorId==actorId)
                        return Deny("committee_document_reviewer_conflict");
                    if(await db.Set<IntakeDecision>().AnyAsync(x=>x.TenantId==tenantId&&x.IntakeId==intake.Id&&x.ActorId==actorId&&x.Decision=="ApproveCommittee",ct))return Deny("duplicate_committee_decision");
                    var approvedCount=await db.Set<IntakeDecision>().Where(x=>x.TenantId==tenantId&&
                        x.IntakeId==intake.Id&&x.Decision=="ApproveCommittee"&&
                        x.ApplicationVersion>latestVerification.ApplicationVersion&&
                        x.ActorId!=latestVerification.ActorId).Select(x=>x.ActorId).Distinct().CountAsync(ct);
                    // Count prior distinct approvers plus the current vote; the unique index enforces one vote per actor.
                    next=approvedCount+1>=policy.RequiredApprovals?IntakeState.CommitteeApproved:IntakeState.DocumentsVerified;break;
                case IntakeOperation.IssuePaymentRequest:
                    if(intake.State!=IntakeState.CommitteeApproved)return Deny("committee_approval_required");
                    var trustAccounts=await db.Set<ReceivingAccount>().Where(x=>x.TenantId==tenantId&&x.OwnerType==FinanceOwnerType.Trust&&x.Active).ToListAsync(ct);
                    var trustAccount=trustAccounts.SingleOrDefault();
                    var fee=await db.Set<FinanceBeneficiaryPolicy>().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.Active,ct);
                    if(trustAccount is null||fee is null||trustAccount.Currency!=fee.Currency)return Deny("trust_payment_configuration_missing");
                    if(await db.Set<GovernedPayment>().AnyAsync(x=>x.TenantId==tenantId&&x.ContextId==intake.Id&&x.Purpose==FinancePurpose.NewMembership,ct))return Deny("payment_request_already_exists");
                    db.Set<GovernedPayment>().Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,PayerUserId=intake.ApplicantUserId,ChapterId=intake.ChapterId,ContextId=intake.Id,Purpose=FinancePurpose.NewMembership,OwnerType=FinanceOwnerType.Trust,ReceivingAccountId=trustAccount.Id,AccountVersion=trustAccount.Version,ExpectedAmount=fee.ExpectedAmount,Currency=fee.Currency,Status="Requested",Version=1});
                    next=IntakeState.PaymentRequested;break;
                case IntakeOperation.ReportPayment:
                    // Payment claims are submitted via ManualPaymentService against the issued Trust request.
                    // Legacy intake payment reporting cannot mark a Trust payment as verified.
                    return Deny("use_governed_payment_submission");
                case IntakeOperation.ReconcileFinance:
                    // Finance V2 is the sole approval authority; legacy intake reconciliation is disabled.
                    return Deny("finance_v2_only");
                case IntakeOperation.Activate:
                    // Finance V2 automatic/manual processing uses FinanceEffectProcessor.
                    // No second interactive member-creation mutation is permitted.
                    return Deny("finance_v2_activation_only");
                case IntakeOperation.RecordCertificate:
                    if(intake.State!=IntakeState.Activated||string.IsNullOrWhiteSpace(cmd.EvidenceReference))return Deny("certificate_not_permitted");
                    var member=await db.Set<MemberRecord>().AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.UserId==intake.ApplicantUserId&&x.Status==MemberRecordStatus.Active,ct);
                    if(member is null)return Deny("member_not_active");
                    db.Set<IntakeCertificate>().Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,MemberId=member.Id,SecureReference=cmd.EvidenceReference,IssuerId=actorId,IssuedAt=DateTimeOffset.UtcNow});break;
                default:return Deny("unsupported_operation");
            }
            intake.AdvanceTo(next);
            db.Set<IntakeDecision>().Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,IntakeId=intake.Id,ActorId=actorId,Decision=cmd.Operation.ToString(),EvidenceReference=cmd.Operation==IntakeOperation.RecordDocument?"":(cmd.EvidenceReference??""),At=DateTimeOffset.UtcNow,ApplicationVersion=intake.Version});
            var result=new IntakeWorkflowOutcome(true,"intake_"+cmd.Operation.ToString().ToLowerInvariant(),intake.Id,intake.Version,createdMemberId);
            var stamp=DateTimeOffset.UtcNow;
            db.Idempotency.Add(new(){TenantId=tenantId,ActorId=actorId,Operation=operation,Key=cmd.IdempotencyKey,PayloadSha256=fingerprint,ResultJson=JsonSerializer.Serialize(result),CreatedAt=stamp});
            db.Audits.Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,ActorId=actorId,ResourceId=intake.Id,Operation=operation,Event=result.Code,CorrelationId="",OccurredAt=stamp});
            db.Outbox.Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,ResourceId=intake.Id,Event=result.Code,OccurredAt=stamp});
            await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);return result;
            IntakeWorkflowOutcome Deny(string code)=>new(false,code,cmd.ApplicationId,intake.Version);
        }
        catch(DbUpdateConcurrencyException){return new(false,"stale_version",cmd.ApplicationId,null);}
        catch(DbUpdateException e) when(e.InnerException is PostgresException p && p.SqlState==PostgresErrorCodes.UniqueViolation){return await RecoverAsync();}
        catch(PostgresException e) when(e.SqlState==PostgresErrorCodes.SerializationFailure||e.SqlState==PostgresErrorCodes.DeadlockDetected||e.SqlState==PostgresErrorCodes.UniqueViolation){return await RecoverAsync();}
        catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return await RecoverAsync();}
    }
}
