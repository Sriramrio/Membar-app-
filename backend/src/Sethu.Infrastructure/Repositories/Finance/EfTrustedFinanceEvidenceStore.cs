using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.MembershipIntake;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.MembershipWorkflow;
using Sethu.Infrastructure.MembershipIntake;
using Sethu.Domain.Membership;
using Sethu.Domain.Entities;
namespace Sethu.Infrastructure.Finance;

// Two independent authorized Finance officers establish evidence: one admits, one approves.
// Both operate against locked sessions, identity and direct Finance grants. This is a controlled
// Finance-evidence intake, NOT a claim of external bank API verification.
public sealed class EfTrustedFinanceEvidenceStore(SethuDbContext db,IDbContextFactory<SethuDbContext> factory):ITrustedFinanceEvidenceStore
{
    public async Task<BankEvidenceResult> ApproveAsync(Guid actorId,string issuer,string sessionId,BankEvidenceApproval cmd,CancellationToken ct)
    {
        if(cmd.TenantId==Guid.Empty||string.IsNullOrWhiteSpace(cmd.Reference)||string.IsNullOrWhiteSpace(cmd.IdempotencyKey)||cmd.IdempotencyKey.Length>128)
            return new(false,"invalid_approval_request");
        const string operation="finance.bank_evidence.approve";
        var hash=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(cmd))));
        async Task<BankEvidenceResult> Recover()
        {
            try{await using var fresh=await factory.CreateDbContextAsync(ct);
                var prior=await fresh.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==cmd.TenantId&&x.ActorId==actorId&&x.Operation==operation&&x.Key==cmd.IdempotencyKey,ct);
                if(prior==null)return new(false,"commit_outcome_indeterminate");
                if(prior.PayloadSha256!=hash)return new(false,"idempotency_conflict");
                return JsonSerializer.Deserialize<BankEvidenceResult>(prior.ResultJson)??new(false,"stored_outcome_invalid");
            }catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}catch(Exception){return new(false,"commit_outcome_indeterminate");}
        }
        try
        {
            await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
            var prior=await db.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==cmd.TenantId&&x.ActorId==actorId&&x.Operation==operation&&x.Key==cmd.IdempotencyKey,ct);
            if(prior!=null)return prior.PayloadSha256==hash?(JsonSerializer.Deserialize<BankEvidenceResult>(prior.ResultJson)??new(false,"stored_outcome_invalid")):new(false,"idempotency_conflict");
            var sessions=await db.Sessions.FromSqlInterpolated($"SELECT * FROM public.sessions WHERE \"Issuer\" = {issuer} AND \"SessionId\" = {sessionId} AND \"UserId\" = {actorId} FOR UPDATE").ToListAsync(ct);
            if(sessions.Count!=1||sessions[0].Revoked||sessions[0].ExpiresAt<=DateTimeOffset.UtcNow)return new(false,"session_invalid");
            var users=await db.UserIdentities.FromSqlInterpolated($"SELECT * FROM public.user_identities WHERE \"Id\" = {actorId} AND \"TenantId\" = {cmd.TenantId} FOR UPDATE").ToListAsync(ct);
            if(users.Count!=1||!users[0].Active)return new(false,"identity_inactive");
            var banks=await db.Set<FinanceBankRecord>().FromSqlInterpolated($"SELECT * FROM public.verified_finance_bank_records WHERE \"TenantId\" = {cmd.TenantId} AND \"Reference\" = {cmd.Reference} FOR UPDATE").ToListAsync(ct);
            var bank=banks.SingleOrDefault();
            if(bank==null||bank.AssignedIntakeId==null||bank.IngestedBy==actorId||bank.Reversed||bank.IndependentlyVerified||!bank.BankOriginAuthenticated)return new(false,"bank_origin_not_authenticated");
            var intake=await db.Set<MemberIntake>().AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==cmd.TenantId&&x.Id==bank.AssignedIntakeId.Value,ct);
            if(intake==null||intake.ApplicantUserId==actorId)return new(false,"finance_separation_denied");
            var now=DateTimeOffset.UtcNow;
            var grants=await db.PermissionGrants.FromSqlInterpolated($"SELECT * FROM public.permission_grants WHERE \"TenantId\" = {cmd.TenantId} AND \"UserId\" = {actorId} AND \"Permission\" = {"onboarding.finance.approve_evidence"} FOR UPDATE").ToListAsync(ct);
            if(!grants.Any(x=>!x.Revoked&&!x.IndependentGovernance&&x.ChapterId==intake.ChapterId&&x.StartsAt<=now&&(x.EndsAt==null||x.EndsAt>now)))return new(false,"finance_approval_authority_denied");
            var beneficiary=await db.Set<FinanceBeneficiaryPolicy>().AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==cmd.TenantId&&x.Active,ct);
            if(beneficiary==null||beneficiary.Beneficiary!=bank.Beneficiary||beneficiary.ExpectedAmount!=bank.Amount||beneficiary.Currency!=bank.Currency)return new(false,"beneficiary_or_amount_mismatch");
            if(string.IsNullOrWhiteSpace(bank.Provenance))return new(false,"missing_bank_provenance");
            bank.IndependentlyVerified=true;bank.ApprovedBy=actorId;
            var outcome=new BankEvidenceResult(true,"bank_evidence_independently_approved");
            db.Idempotency.Add(new(){TenantId=cmd.TenantId,ActorId=actorId,Operation=operation,Key=cmd.IdempotencyKey,PayloadSha256=hash,ResultJson=JsonSerializer.Serialize(outcome),CreatedAt=now});
            db.Audits.Add(new(){Id=Guid.NewGuid(),TenantId=cmd.TenantId,ActorId=actorId,ResourceId=intake.Id,Operation=operation,Event=outcome.Code,OccurredAt=now});
            db.Outbox.Add(new(){Id=Guid.NewGuid(),TenantId=cmd.TenantId,ResourceId=intake.Id,Event=outcome.Code,OccurredAt=now});
            await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);return outcome;
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException pg&&pg.SqlState==PostgresErrorCodes.UniqueViolation){return await Recover();}
        catch(PostgresException ex) when(ex.SqlState==PostgresErrorCodes.SerializationFailure||ex.SqlState==PostgresErrorCodes.DeadlockDetected){return await Recover();}
        catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return await Recover();}
    }
    public async Task<BankEvidenceResult> AdmitAsync(Guid actorId,string issuer,string sessionId,BankEvidenceAdmission cmd,CancellationToken ct)
    {
        if(cmd.ApplicationId==Guid.Empty||cmd.TenantId==Guid.Empty||string.IsNullOrWhiteSpace(cmd.Reference)||
           string.IsNullOrWhiteSpace(cmd.Beneficiary)||string.IsNullOrWhiteSpace(cmd.Provenance)||
           cmd.Amount<=0||cmd.Currency.Length!=3||string.IsNullOrWhiteSpace(cmd.IdempotencyKey)||cmd.IdempotencyKey.Length>128)
            return new(false,"invalid_finance_evidence");
        const string operation="finance.bank_evidence.admit";
        var hash=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(cmd))));
        async Task<BankEvidenceResult> Recover()
        {
            try {await using var fresh=await factory.CreateDbContextAsync(ct);
                var record=await fresh.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==cmd.TenantId&&x.ActorId==actorId&&x.Operation==operation&&x.Key==cmd.IdempotencyKey,ct);
                if(record==null)return new(false,"commit_outcome_indeterminate");
                if(record.PayloadSha256!=hash)return new(false,"idempotency_conflict");
                return JsonSerializer.Deserialize<BankEvidenceResult>(record.ResultJson)??new(false,"invalid_stored_result");
            }catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
            catch(Exception){return new(false,"commit_outcome_indeterminate");}
        }
        try
        {
            await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
            var replay=await db.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==cmd.TenantId&&x.ActorId==actorId&&x.Operation==operation&&x.Key==cmd.IdempotencyKey,ct);
            if(replay!=null)return replay.PayloadSha256==hash?(JsonSerializer.Deserialize<BankEvidenceResult>(replay.ResultJson)??new(false,"invalid_stored_result")):new(false,"idempotency_conflict");
            var ss=await db.Sessions.FromSqlInterpolated($"SELECT * FROM public.sessions WHERE \"Issuer\" = {issuer} AND \"SessionId\" = {sessionId} AND \"UserId\" = {actorId} FOR UPDATE").ToListAsync(ct);
            if(ss.Count!=1||ss[0].Revoked||ss[0].ExpiresAt<=DateTimeOffset.UtcNow)return new(false,"session_invalid");
            var uu=await db.UserIdentities.FromSqlInterpolated($"SELECT * FROM public.user_identities WHERE \"Id\" = {actorId} AND \"TenantId\" = {cmd.TenantId} FOR UPDATE").ToListAsync(ct);
            if(uu.Count!=1||!uu[0].Active)return new(false,"identity_inactive");
            var intake=await db.Set<MemberIntake>().AsNoTracking().SingleOrDefaultAsync(x=>x.Id==cmd.ApplicationId&&x.TenantId==cmd.TenantId,ct);
            if(intake==null||intake.ApplicantUserId==actorId)return new(false,"finance_separation_denied");
            var now=DateTimeOffset.UtcNow;
            var grants=await db.PermissionGrants.FromSqlInterpolated($"SELECT * FROM public.permission_grants WHERE \"TenantId\" = {cmd.TenantId} AND \"UserId\" = {actorId} AND \"Permission\" = {"onboarding.finance.evidence"} FOR UPDATE").ToListAsync(ct);
            if(!grants.Any(x=>!x.Revoked&&!x.IndependentGovernance&&x.ChapterId==intake.ChapterId&&x.StartsAt<=now&&(x.EndsAt==null||x.EndsAt>now)))return new(false,"finance_authority_denied");
            var beneficiary=await db.Set<FinanceBeneficiaryPolicy>().AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==cmd.TenantId&&x.Active,ct);
            if(beneficiary==null||beneficiary.Beneficiary!=cmd.Beneficiary||beneficiary.ExpectedAmount!=cmd.Amount||beneficiary.Currency!=cmd.Currency)return new(false,"beneficiary_or_fee_mismatch");
            if(await db.Set<FinanceBankRecord>().AnyAsync(x=>x.TenantId==cmd.TenantId&&x.Reference==cmd.Reference,ct))return new(false,"bank_reference_already_registered");
            db.Set<FinanceBankRecord>().Add(new(){Id=Guid.NewGuid(),TenantId=cmd.TenantId,Reference=cmd.Reference,Amount=cmd.Amount,Currency=cmd.Currency,
                Beneficiary=cmd.Beneficiary,Provenance=cmd.Provenance,IngestedBy=actorId,AssignedIntakeId=cmd.ApplicationId,RecordedAt=now,
                IndependentlyVerified=false,BankOriginAuthenticated=false,ApprovedBy=Guid.Empty});
            var outcome=new BankEvidenceResult(true,"bank_evidence_admitted_pending_independent_approval");
            db.Idempotency.Add(new(){TenantId=cmd.TenantId,ActorId=actorId,Operation=operation,Key=cmd.IdempotencyKey,PayloadSha256=hash,ResultJson=JsonSerializer.Serialize(outcome),CreatedAt=now});
            db.Audits.Add(new(){Id=Guid.NewGuid(),TenantId=cmd.TenantId,ActorId=actorId,ResourceId=cmd.ApplicationId,Operation=operation,Event=outcome.Code,OccurredAt=now});
            db.Outbox.Add(new(){Id=Guid.NewGuid(),TenantId=cmd.TenantId,ResourceId=cmd.ApplicationId,Event=outcome.Code,OccurredAt=now});
            await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);return outcome;
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException pg && pg.SqlState==PostgresErrorCodes.UniqueViolation){return await Recover();}
        catch(PostgresException ex) when(ex.SqlState==PostgresErrorCodes.SerializationFailure||ex.SqlState==PostgresErrorCodes.DeadlockDetected){return await Recover();}
        catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return await Recover();}
    }
}
