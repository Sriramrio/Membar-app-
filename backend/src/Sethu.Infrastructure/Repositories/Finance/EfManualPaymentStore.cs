using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sethu.Service.Finance;
using Sethu.Domain.Finance;
using Sethu.Infrastructure.Persistence;
using Sethu.Domain.Entities;

namespace Sethu.Infrastructure.Finance;

public sealed class EfManualPaymentStore(SethuDbContext db, IDbContextFactory<SethuDbContext> factory): IManualPaymentStore
{
    private async Task<bool> ValidSession(Guid tenantId,Guid userId,string issuer,string session,CancellationToken ct)
    {
        var ss=await db.Sessions.FromSqlInterpolated($"SELECT * FROM public.sessions WHERE \"Issuer\" = {issuer} AND \"SessionId\" = {session} AND \"UserId\" = {userId} FOR UPDATE").ToListAsync(ct);
        if(ss.Count!=1 || ss[0].Revoked || ss[0].ExpiresAt<=DateTimeOffset.UtcNow)return false;
        var users=await db.UserIdentities.FromSqlInterpolated($"SELECT * FROM public.user_identities WHERE \"Id\" = {userId} AND \"TenantId\" = {tenantId} FOR UPDATE").ToListAsync(ct);
        return users.Count==1 && users[0].Active;
    }
    private static ManualPaymentView Project(GovernedPayment payment, PaymentClaim? claim)
        => new(payment.Id, payment.ChapterId, payment.ExpectedAmount, payment.Currency,
            payment.Status, payment.Version, payment.Purpose.ToString(), claim?.Utr,
            claim?.PaymentDate, claim?.Mode);

    public async Task<IReadOnlyList<ManualPaymentView>> ListMineAsync(Guid tenantId, Guid userId,
        string issuer, string session, CancellationToken ct)
    {
        if (!await ValidSession(tenantId, userId, issuer, session, ct))
            throw new UnauthorizedAccessException("Session invalid or revoked.");
        var payments = await db.Set<GovernedPayment>().AsNoTracking()
            .Where(p => p.TenantId == tenantId && p.PayerUserId == userId)
            .OrderBy(p => p.Id).Take(200).ToListAsync(ct);
        var ids = payments.Select(p => p.Id).ToArray();
        var claims = await db.Set<PaymentClaim>().AsNoTracking()
            .Where(c => c.TenantId == tenantId && ids.Contains(c.PaymentId) && !c.Superseded)
            .ToListAsync(ct);
        var active = claims.GroupBy(c => c.PaymentId).ToDictionary(g => g.Key,
            g => g.OrderByDescending(c => c.SubmittedAt).First());
        return payments.Select(p => Project(p, active.GetValueOrDefault(p.Id))).ToArray();
    }

    public async Task<IReadOnlyList<ManualPaymentView>> ListFinanceQueueAsync(Guid tenantId,
        Guid userId, string issuer, string session, CancellationToken ct)
    {
        if (!await ValidSession(tenantId, userId, issuer, session, ct))
            throw new UnauthorizedAccessException("Session invalid or revoked.");
        var now = DateTimeOffset.UtcNow;
        var grants = await db.PermissionGrants.AsNoTracking()
            .Where(g => g.TenantId == tenantId && g.UserId == userId && !g.Revoked &&
                !g.IndependentGovernance && g.StartsAt <= now &&
                (g.EndsAt == null || g.EndsAt > now))
            .Select(g => new {g.Permission, g.ChapterId}).ToListAsync(ct);
        // Never infer finance authority from a role label or client-requested Chapter.
        // Permission is evaluated for each payment's actual purpose and owning scope.
        var candidates = await db.Set<GovernedPayment>().AsNoTracking()
            .Where(p => p.TenantId == tenantId && p.Status == "VerificationPending")
            .OrderBy(p => p.Id).Take(500).ToListAsync(ct);
        var authorised = candidates.Where(p => grants.Any(g =>
            g.Permission == FinanceRoutingPolicy.VerificationPermission(p.Purpose) &&
            (p.OwnerType == FinanceOwnerType.Trust ? g.ChapterId == null : g.ChapterId == p.ChapterId)))
            .ToList();
        var ids = authorised.Select(p => p.Id).ToArray();
        var claims = await db.Set<PaymentClaim>().AsNoTracking()
            .Where(c => c.TenantId == tenantId && ids.Contains(c.PaymentId) && !c.Superseded)
            .ToListAsync(ct);
        var active = claims.GroupBy(c => c.PaymentId).ToDictionary(g => g.Key,
            g => g.OrderByDescending(c => c.SubmittedAt).First());
        return authorised.Where(p => active.ContainsKey(p.Id))
            .Select(p => Project(p, active[p.Id])).ToArray();
    }

    private static string Hash(object command)=>Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(command))));
    private async Task<ManualPaymentResult> Recover(Guid tenantId,Guid actor,string operation,string key,string hash,Guid paymentId,CancellationToken ct)
    {
        try { await using var fresh=await factory.CreateDbContextAsync(ct);
            var old=await fresh.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.ActorId==actor&&x.Operation==operation&&x.Key==key,ct);
            if(old is null)return new(false,"commit_outcome_indeterminate",paymentId);
            if(old.PayloadSha256!=hash)return new(false,"idempotency_conflict",paymentId);
            return JsonSerializer.Deserialize<ManualPaymentResult>(old.ResultJson)??new(false,"stored_result_invalid",paymentId);
        } catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}catch(Exception){return new(false,"commit_outcome_indeterminate",paymentId);}
    }
    public async Task<ManualPaymentResult> ReportAsync(Guid tenantId,Guid userId,string issuer,string session,ManualPaymentClaim cmd,CancellationToken ct)
    {
        const string operation="manualpayment.report";var hash=Hash(cmd);
        if(cmd.PaymentRequestId==Guid.Empty||cmd.Amount<=0||cmd.Currency.Length!=3||string.IsNullOrWhiteSpace(cmd.Utr)||cmd.Utr.Length>140||cmd.PaymentDate> DateOnly.FromDateTime(DateTime.UtcNow)||string.IsNullOrWhiteSpace(cmd.IdempotencyKey)||cmd.IdempotencyKey.Length>128)
            return new(false,"invalid_claim",cmd.PaymentRequestId);
        try {await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
            var prior=await db.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.ActorId==userId&&x.Operation==operation&&x.Key==cmd.IdempotencyKey,ct);
            if(prior!=null)return prior.PayloadSha256==hash?(JsonSerializer.Deserialize<ManualPaymentResult>(prior.ResultJson)??new(false,"stored_result_invalid",cmd.PaymentRequestId)):new(false,"idempotency_conflict",cmd.PaymentRequestId);
            if(!await ValidSession(tenantId,userId,issuer,session,ct))return new(false,"session_invalid",cmd.PaymentRequestId);
            var rows=await db.Set<GovernedPayment>().FromSqlInterpolated($"SELECT * FROM public.governed_payments WHERE \"TenantId\" = {tenantId} AND \"Id\" = {cmd.PaymentRequestId} FOR UPDATE").ToListAsync(ct);
            var p=rows.SingleOrDefault();if(p is null||p.PayerUserId!=userId)return new(false,"payment_not_owned",cmd.PaymentRequestId);
            if(p.Currency!=cmd.Currency||p.ExpectedAmount!=cmd.Amount)return new(false,"amount_or_currency_mismatch",p.Id,p.Version);
            // A correction supersedes the prior effective claim in the SAME transaction.
            // The partial unique index allows only one non-superseded claim per payment.
            var activeClaims=await db.Set<PaymentClaim>()
                .Where(x=>x.TenantId==tenantId && x.PaymentId==p.Id && !x.Superseded).ToListAsync(ct);
            if(!ManualPaymentClaimLifecycle.CanSubmit(p.Status,activeClaims.Count))
                return new(false,"invalid_claim_lifecycle",p.Id,p.Version);
            foreach(var previous in activeClaims)previous.Superseded=true;
            // Flush updates before inserting a replacement: PostgreSQL partial uniqueness
            // otherwise depends on EF's unordered UPDATE/INSERT scheduling. The enclosing
            // transaction still commits both changes, audit and outbox atomically.
            if(activeClaims.Count>0) await db.SaveChangesAsync(ct);
            var now=DateTimeOffset.UtcNow;
            db.Set<PaymentClaim>().Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,PaymentId=p.Id,SubmittedBy=userId,Utr=cmd.Utr.Trim(),Amount=cmd.Amount,Currency=cmd.Currency.ToUpperInvariant(),PaymentDate=cmd.PaymentDate,Mode=cmd.Mode,SubmittedAt=now});
            p.Status="VerificationPending";p.Version++;
            var result=new ManualPaymentResult(true,"payment_reported",p.Id,p.Version);
            SaveControl(tenantId,userId,p.Id,operation,cmd.IdempotencyKey,hash,result,now);
            await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);return result;
        }catch(DbUpdateConcurrencyException){return new(false,"stale_version",cmd.PaymentRequestId);}catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return await Recover(tenantId,userId,operation,cmd.IdempotencyKey,hash,cmd.PaymentRequestId,ct);}
    }
    public async Task<ManualPaymentResult> VerifyAsync(Guid tenantId,Guid userId,string issuer,string session,FinanceManualCheck cmd,CancellationToken ct)
    {
        const string operation="manualpayment.verify";var hash=Hash(cmd);
        if(cmd.PaymentRequestId==Guid.Empty||cmd.ExpectedVersion<1||(cmd.CheckedSource is not ("OfficialBankStatement" or "AuthorisedBankPortal" or "FinanceBankRecord"))||string.IsNullOrWhiteSpace(cmd.CheckedUtr)||string.IsNullOrWhiteSpace(cmd.ReasonCode)||cmd.CheckedAmount<=0||cmd.Currency.Length!=3||string.IsNullOrWhiteSpace(cmd.IdempotencyKey)||cmd.IdempotencyKey.Length>128||cmd.Decision is not (ManualFinanceDecision.Approved or ManualFinanceDecision.ClarificationRequired or ManualFinanceDecision.Rejected))return new(false,"invalid_verification",cmd.PaymentRequestId);
        try {await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
            var prior=await db.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.ActorId==userId&&x.Operation==operation&&x.Key==cmd.IdempotencyKey,ct);
            if(prior!=null)return prior.PayloadSha256==hash?(JsonSerializer.Deserialize<ManualPaymentResult>(prior.ResultJson)??new(false,"stored_result_invalid",cmd.PaymentRequestId)):new(false,"idempotency_conflict",cmd.PaymentRequestId);
            if(!await ValidSession(tenantId,userId,issuer,session,ct))return new(false,"session_invalid",cmd.PaymentRequestId);
            var rows=await db.Set<GovernedPayment>().FromSqlInterpolated($"SELECT * FROM public.governed_payments WHERE \"TenantId\" = {tenantId} AND \"Id\" = {cmd.PaymentRequestId} FOR UPDATE").ToListAsync(ct);
            var p=rows.SingleOrDefault();if(p is null)return new(false,"payment_not_found",cmd.PaymentRequestId);
            if(p.Version!=cmd.ExpectedVersion)return new(false,"stale_version",p.Id,p.Version);
            if(p.Status!="VerificationPending")return new(false,"not_pending_verification",p.Id,p.Version);
            var claims=await db.Set<PaymentClaim>().Where(x=>x.TenantId==tenantId&&x.PaymentId==p.Id&&!x.Superseded).ToListAsync(ct);
            var claim=claims.SingleOrDefault();if(claim is null||claim.SubmittedBy==userId)return new(false,"separation_of_duties_denied",p.Id,p.Version);
            var accounts=await db.Set<ReceivingAccount>().Where(x=>x.TenantId==tenantId&&x.Id==p.ReceivingAccountId).ToListAsync(ct);
            var account=accounts.SingleOrDefault();if(account is null||!account.Active||account.OwnerType!=FinanceRoutingPolicy.OwnerFor(p.Purpose)||account.OwnerType!=p.OwnerType||account.Version!=p.AccountVersion)return new(false,"receiving_account_invalid",p.Id,p.Version);
            if(p.OwnerType==FinanceOwnerType.Chapter&&account.OwnerUnitId!=p.ChapterId)return new(false,"chapter_account_mismatch",p.Id,p.Version);
            if(p.OwnerType==FinanceOwnerType.Trust&&account.OwnerUnitId==Guid.Empty)return new(false,"trust_owner_missing",p.Id,p.Version);
            if(account.Currency!=p.Currency||cmd.Currency!=p.Currency||claim.Currency!=p.Currency)
                return new(false,"receiving_account_currency_mismatch",p.Id,p.Version);
            if(cmd.Decision==ManualFinanceDecision.Approved &&
                (string.IsNullOrWhiteSpace(cmd.ReasonCode)||cmd.ReasonCode.Length>120 || cmd.CheckedDate==default || cmd.CheckedDate> DateOnly.FromDateTime(DateTime.UtcNow) || cmd.CheckedDate < claim.PaymentDate))
                return new(false,"manual_verification_record_incomplete",p.Id,p.Version);
            // Trust permissions are Trust-wide; Chapter Treasurer permissions are restricted to the owning Chapter.
            var needed=FinanceRoutingPolicy.VerificationPermission(p.Purpose);var now=DateTimeOffset.UtcNow;
            var grants=await db.PermissionGrants.FromSqlInterpolated($"SELECT * FROM public.permission_grants WHERE \"TenantId\" = {tenantId} AND \"UserId\" = {userId} AND \"Permission\" = {needed} FOR UPDATE").ToListAsync(ct);
            if(!grants.Any(g=>!g.Revoked&&!g.IndependentGovernance&&g.StartsAt<=now&&(g.EndsAt==null||g.EndsAt>now)&& (p.OwnerType==FinanceOwnerType.Trust?g.ChapterId==null:g.ChapterId==p.ChapterId)))return new(false,"finance_authority_denied",p.Id,p.Version);
            if(cmd.Decision==ManualFinanceDecision.Approved&& !FinanceRoutingPolicy.MayApprove(true,true,true,cmd.AmountMatched&&cmd.CheckedAmount==p.ExpectedAmount&&cmd.CheckedAmount==claim.Amount,cmd.UtrMatched&&cmd.CheckedUtr==claim.Utr,cmd.BeneficiaryMatched,false))return new(false,"manual_evidence_mismatch",p.Id,p.Version);
            if(cmd.Decision==ManualFinanceDecision.Approved&&(!cmd.DateMatched||cmd.Currency!=p.Currency))return new(false,"manual_evidence_mismatch",p.Id,p.Version);
            if(cmd.Decision==ManualFinanceDecision.Approved&&await db.Set<ManualPaymentDecision>().AnyAsync(d=>d.TenantId==tenantId&&d.Decision==ManualFinanceDecision.Approved&&d.CheckedUtr==cmd.CheckedUtr&&d.OwnerType==p.OwnerType&&d.OwnerUnitId==account.OwnerUnitId&&d.PaymentId!=p.Id,ct))return new(false,"utr_already_allocated",p.Id,p.Version);
            // Fail closed on missing/ambiguous policy. A human always verifies bank evidence;
            // the mode governs ONLY subsequent business processing.
            var processingPolicies=await db.Set<FinanceProcessingPolicy>().AsNoTracking()
                .Where(x=>x.TenantId==tenantId&&x.Purpose==p.Purpose&&x.OwnerType==p.OwnerType
                    &&x.OwnerUnitId==account.OwnerUnitId&&x.Approved&&x.EffectiveFrom<=now
                    &&(x.EffectiveUntil==null||x.EffectiveUntil>now)).ToListAsync(ct);
            if(cmd.Decision==ManualFinanceDecision.Approved&&processingPolicies.Count!=1)
                return new(false,"processing_policy_missing_or_ambiguous",p.Id,p.Version);
            var processingMode=processingPolicies.SingleOrDefault()?.PostVerificationMode;
            if(cmd.Decision==ManualFinanceDecision.Approved&&!FinanceProcessingModes.IsSupported(processingMode))
                return new(false,"processing_mode_invalid",p.Id,p.Version);
            db.Set<ManualPaymentDecision>().Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,PaymentId=p.Id,ClaimId=claim.Id,VerifierId=userId,OwnerType=p.OwnerType,OwnerUnitId=account.OwnerUnitId,CheckedSource=cmd.CheckedSource,CheckedDate=cmd.CheckedDate,CheckedUtr=cmd.CheckedUtr,CheckedAmount=cmd.CheckedAmount,Currency=cmd.Currency,BeneficiaryMatched=cmd.BeneficiaryMatched,UtrMatched=cmd.UtrMatched,AmountMatched=cmd.AmountMatched,DateMatched=cmd.DateMatched,Decision=cmd.Decision,ReasonCode=cmd.ReasonCode,DecidedAt=now});
            p.Status=cmd.Decision switch {ManualFinanceDecision.Approved=>"Approved",ManualFinanceDecision.ClarificationRequired=>"ClarificationRequired",_=>"Rejected"};p.Version++;
            // Durable business-effect intent, NOT proof that downstream activation, renewal,
            // meeting or event registration has been updated. Requires an admitted handler.
            if(cmd.Decision==ManualFinanceDecision.Approved && FinanceProcessingModes.ShouldQueueAutomaticEffect(true,processingMode))
                db.Outbox.Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,ResourceId=p.Id,
                    Event=FinanceCompletionRouting.EffectFor(p.Purpose),OccurredAt=now});
            if(cmd.Decision==ManualFinanceDecision.Approved&&processingMode==FinanceProcessingModes.Manual)
                db.Outbox.Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,ResourceId=p.Id,
                    Event="finance.business.pending-manual-action.v1",OccurredAt=now});
            var result=new ManualPaymentResult(true,cmd.Decision==ManualFinanceDecision.Approved
                ? (processingMode==FinanceProcessingModes.Manual?"verified_pending_manual_action":"verified_automatic_processing_queued")
                : "manual_finance_"+p.Status.ToLowerInvariant(),p.Id,p.Version);
            SaveControl(tenantId,userId,p.Id,operation,cmd.IdempotencyKey,hash,result,now);
            await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);return result;
        }catch(DbUpdateConcurrencyException){return new(false,"stale_version",cmd.PaymentRequestId);}catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return await Recover(tenantId,userId,operation,cmd.IdempotencyKey,hash,cmd.PaymentRequestId,ct);}
    }
    // An authorised manual action releases the SAME business effect consumed by FinanceEffectWorker.
    // It never creates a second member/renewal/registration implementation.
    public async Task<ManualPaymentResult> ExecuteManualActionAsync(Guid tenantId,Guid userId,string issuer,string session,ManualBusinessAction cmd,CancellationToken ct)
    {
        const string operation="financev2.manual.execute";var hash=Hash(cmd);
        if(cmd.PaymentRequestId==Guid.Empty||cmd.ExpectedVersion<1||string.IsNullOrWhiteSpace(cmd.Reason)||cmd.Reason.Length>500||
            string.IsNullOrWhiteSpace(cmd.IdempotencyKey)||cmd.IdempotencyKey.Length>128)
            return new(false,"invalid_manual_action",cmd.PaymentRequestId);
        try
        {
            await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
            var old=await db.Idempotency.AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.ActorId==userId&&x.Operation==operation&&x.Key==cmd.IdempotencyKey,ct);
            if(old is not null)return old.PayloadSha256==hash?(JsonSerializer.Deserialize<ManualPaymentResult>(old.ResultJson)??new(false,"stored_result_invalid",cmd.PaymentRequestId)):new(false,"idempotency_conflict",cmd.PaymentRequestId);
            if(!await ValidSession(tenantId,userId,issuer,session,ct))return new(false,"session_invalid",cmd.PaymentRequestId);
            var rows=await db.Set<GovernedPayment>().FromSqlInterpolated($"SELECT * FROM public.governed_payments WHERE \"TenantId\" = {tenantId} AND \"Id\" = {cmd.PaymentRequestId} FOR UPDATE").ToListAsync(ct);
            var payment=rows.SingleOrDefault();if(payment is null)return new(false,"payment_not_found",cmd.PaymentRequestId);
            if(payment.Version!=cmd.ExpectedVersion)return new(false,"stale_version",payment.Id,payment.Version);
            if(payment.Status!="Approved")return new(false,"payment_not_approved",payment.Id,payment.Version);
            var account=await db.Set<ReceivingAccount>().AsNoTracking().SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.Id==payment.ReceivingAccountId,ct);
            if(account is null||account.OwnerType!=payment.OwnerType||
                (payment.OwnerType==FinanceOwnerType.Chapter&&account.OwnerUnitId!=payment.ChapterId))return new(false,"financial_owner_mismatch",payment.Id,payment.Version);
            var now=DateTimeOffset.UtcNow;
            var policies=await db.Set<FinanceProcessingPolicy>().AsNoTracking().Where(x=>x.TenantId==tenantId&&x.Purpose==payment.Purpose&&
                x.OwnerType==payment.OwnerType&&x.OwnerUnitId==account.OwnerUnitId&&x.Approved&&x.EffectiveFrom<=now&&
                (x.EffectiveUntil==null||x.EffectiveUntil>now)).ToListAsync(ct);
            if(policies.Count!=1||policies[0].PostVerificationMode!="MANUAL")return new(false,"manual_policy_not_effective",payment.Id,payment.Version);
            var permission=FinanceRoutingPolicy.VerificationPermission(payment.Purpose);
            var grants=await db.PermissionGrants.FromSqlInterpolated($"SELECT * FROM public.permission_grants WHERE \"TenantId\" = {tenantId} AND \"UserId\" = {userId} AND \"Permission\" = {permission} FOR UPDATE").ToListAsync(ct);
            if(!grants.Any(g=>!g.Revoked&&!g.IndependentGovernance&&g.StartsAt<=now&&(g.EndsAt==null||g.EndsAt>now)&&
                (payment.OwnerType==FinanceOwnerType.Trust?g.ChapterId==null:g.ChapterId==payment.ChapterId)))
                return new(false,"finance_authority_denied",payment.Id,payment.Version);
            if(!await (from d in db.Set<ManualPaymentDecision>() join c in db.Set<PaymentClaim>() on d.ClaimId equals c.Id
                where d.TenantId==tenantId&&d.PaymentId==payment.Id&&d.Decision==ManualFinanceDecision.Approved&&
                    d.OwnerType==payment.OwnerType&&!c.Superseded select d.Id).AnyAsync(ct))return new(false,"effective_approval_missing",payment.Id,payment.Version);
            var effect=FinanceCompletionRouting.EffectFor(payment.Purpose);
            if(await db.Outbox.AnyAsync(x=>x.TenantId==tenantId&&x.ResourceId==payment.Id&&x.Event==effect,ct))return new(false,"effect_already_queued",payment.Id,payment.Version);
            if(!await db.Outbox.AnyAsync(x=>x.TenantId==tenantId&&x.ResourceId==payment.Id&&x.Event=="finance.business.pending-manual-action.v1",ct))
                return new(false,"manual_action_not_pending",payment.Id,payment.Version);
            db.Outbox.Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,ResourceId=payment.Id,Event=effect,OccurredAt=now});
            // Release evidence is committed with the effect and its idempotency result.
            db.Outbox.Add(new(){Id=Guid.NewGuid(),TenantId=tenantId,ResourceId=payment.Id,
                Event="finance.business.manual-release-authorized.v1",OccurredAt=now});
            var result=new ManualPaymentResult(true,"manual_business_effect_queued",payment.Id,payment.Version);
            SaveControl(tenantId,userId,payment.Id,operation,cmd.IdempotencyKey,hash,result,now);
            await db.SaveChangesAsync(ct);await tx.CommitAsync(ct);return result;
        }
        catch(DbUpdateConcurrencyException){return new(false,"stale_version",cmd.PaymentRequestId);}
        catch(OperationCanceledException) when(ct.IsCancellationRequested){throw;}
        catch(Exception){return await Recover(tenantId,userId,operation,cmd.IdempotencyKey,hash,cmd.PaymentRequestId,ct);}
    }
    private void SaveControl(Guid tenant,Guid actor,Guid payment,string operation,string key,string hash,ManualPaymentResult result,DateTimeOffset when)
    {
        db.Idempotency.Add(new(){TenantId=tenant,ActorId=actor,Operation=operation,Key=key,PayloadSha256=hash,ResultJson=JsonSerializer.Serialize(result),CreatedAt=when});
        db.Audits.Add(new(){Id=Guid.NewGuid(),TenantId=tenant,ActorId=actor,ResourceId=payment,Operation=operation,Event=result.Code,OccurredAt=when});
        db.Outbox.Add(new(){Id=Guid.NewGuid(),TenantId=tenant,ResourceId=payment,Event=result.Code,OccurredAt=when});
    }
}
