using System.Security.Claims;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;

namespace Sethu.Service.Security;

public sealed class OrganisationalCommandService(IAuthenticatedActorResolver resolver,
    ITrustedPermissionStore permissionStore, IOrganisationCommandStore store, TimeProvider clock)
{
    private static OrganisationCommandResult Deny(string reason) => new(false, reason, null, null);
    private async Task<(TrustedActor? Actor, string Error)> ResolveAsync(ClaimsPrincipal principal, CancellationToken ct)
    {
        try
        {
            var resolved = await resolver.ResolveAsync(principal,ct);
            return resolved.Succeeded ? (resolved.Actor, "") : (null, resolved.Reason);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception) { return (null, "trusted_identity_unavailable"); }
    }
    private async Task<PolicyDecision> AuthorizeAsync(TrustedActor actor, ScopedResource resource,
        string permission, CancellationToken ct)
    {
        try
        {
            var grants = await permissionStore.ReadGrantsAsync(actor.UserId,actor.TenantId,ct);
            return RoleScopePolicy.Evaluate(actor,resource,new PermissionRequest(permission),grants!,clock.GetUtcNow());
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception) { return new(false,"permission_store_unavailable"); }
    }
    private static string HashPayload<T>(T value) => Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value))));
    private async Task<OrganisationCommandResult?> ReplayAsync(TrustedActor actor,string operation,
        string key,string hash,CancellationToken ct)
    {
        var prior = await store.FindCommittedOutcomeAsync(actor.TenantId,actor.UserId,operation,key,ct);
        if (prior is null) return null;
        return prior.PayloadSha256 == hash ? prior.Outcome : Deny("idempotency_payload_conflict");
    }
    public async Task<OrganisationCommandResult> ReparentAsync(ClaimsPrincipal principal,
        ReparentUnitCommand command,string correlationId,CancellationToken ct)
    {
        if (command.UnitId == Guid.Empty || command.NewParentId == Guid.Empty || command.UnitId == command.NewParentId ||
            command.ExpectedVersion < 0 || command.RequestId == Guid.Empty || string.IsNullOrWhiteSpace(command.IdempotencyKey) ||
            command.IdempotencyKey.Length > 128) return Deny("invalid_command");
        var (actor,error) = await ResolveAsync(principal,ct);
        if (actor is null) return Deny(error);
        var hash = HashPayload(command);
        var replay = await ReplayAsync(actor,"organisation.unit.reparent",command.IdempotencyKey,hash,ct);
        if (replay is not null) return replay;
        var current = await store.LoadUnitAsync(command.UnitId,ct);
        if (current is null || current.Unit.TenantId != actor.TenantId) return Deny("resource_not_found");
        if (current.Version != command.ExpectedVersion) return Deny("stale_version");
        var decision = await AuthorizeAsync(actor,new ScopedResource(actor.TenantId,
            current.Unit.Level == UnitLevel.Chapter ? current.Unit.Id : (Guid?)null,null),
            "organisation.unit.reparent",ct);
        if (!decision.Allowed) return Deny(decision.Reason);
        var hierarchy = await store.LoadTenantHierarchyAsync(actor.TenantId,ct);
        if (hierarchy is null || !hierarchy.ContainsKey(command.NewParentId)) return Deny("hierarchy_unavailable");
        var candidate = current.Unit with { ParentId = command.NewParentId };
        var validation = OrganisationHierarchy.Validate(candidate,hierarchy);
        if (!validation.Allowed) return Deny(validation.Code);
        // A commit implementation must lock/check the full hierarchy snapshot against concurrent reparenting.
        var change = new AtomicChange(actor.TenantId,command.UnitId,command.ExpectedVersion,
            "organisation.unit.reparent",command.IdempotencyKey,hash,actor.UserId,correlationId,
            clock.GetUtcNow(),candidate,null,"OrganisationUnitReparented","OrganisationUnitReparented");
        return await store.CommitAsync(change,ct);
    }
    public async Task<OrganisationCommandResult> AppointAsync(ClaimsPrincipal principal,
        CreateAppointmentCommand command,string correlationId,CancellationToken ct)
    {
        if (command.AppointmentId == Guid.Empty || command.AppointeeId == Guid.Empty || command.TenantId == Guid.Empty ||
            command.ChapterId == Guid.Empty || command.RequestId == Guid.Empty || command.ExpectedCommitteeVersion < 0 ||
            string.IsNullOrWhiteSpace(command.RoleCode) || command.EndsAt <= command.StartsAt ||
            string.IsNullOrWhiteSpace(command.IdempotencyKey) || command.IdempotencyKey.Length > 128)
            return Deny("invalid_command");
        var (actor,error) = await ResolveAsync(principal,ct);
        if (actor is null) return Deny(error);
        if (actor.UserId == command.AppointeeId) return Deny("self_appointment_denied");
        if (actor.TenantId != command.TenantId) return Deny("tenant_scope_denied");
        var hash = HashPayload(command);
        var replay = await ReplayAsync(actor,"organisation.committee.appoint",command.IdempotencyKey,hash,ct);
        if (replay is not null) return replay;
        var decision = await AuthorizeAsync(actor,new ScopedResource(command.TenantId,command.ChapterId,command.AppointeeId),
            "organisation.committee.appoint",ct);
        if (!decision.Allowed) return Deny(decision.Reason);
        var committee = await store.LoadCommitteeAsync(command.TenantId,command.ChapterId,ct);
        if (committee is null) return Deny("committee_not_found");
        if (committee.Version != command.ExpectedCommitteeVersion) return Deny("stale_version");
        var existing = await store.LoadAppointmentsAsync(command.TenantId,command.ChapterId,ct);
        if (existing is null) return Deny("appointments_unavailable");
        var appointment = new CommitteeAppointment(command.AppointmentId,command.TenantId,command.ChapterId,
            command.AppointeeId,command.RoleCode,command.StartsAt,command.EndsAt,AppointmentStatus.Proposed,
            command.Exclusive);
        var conflict = AppointmentAuthority.CheckExclusiveConflict(appointment,existing);
        if (!conflict.Allowed) return Deny(conflict.Reason);
        var change = new AtomicChange(command.TenantId,command.ChapterId,committee.Version,
            "organisation.committee.appoint",command.IdempotencyKey,hash,actor.UserId,correlationId,
            clock.GetUtcNow(),null,appointment,"CommitteeAppointmentProposed","CommitteeAppointmentProposed");
        return await store.CommitAsync(change,ct);
    }

    private async Task<OrganisationCommandResult> AuthorizedMutationAsync(ClaimsPrincipal principal,
        Guid chapterId, long expectedVersion, string operation, string key, object payload,
        Guid requestId, string correlationId,
        Func<TrustedActor,CancellationToken,Task<(AtomicChange? Change,string Error)>> compose,
        CancellationToken ct)
    {
        if (chapterId == Guid.Empty || requestId == Guid.Empty || expectedVersion < 0 ||
            string.IsNullOrWhiteSpace(key) || key.Length > 128) return Deny("invalid_command");
        var (actor,error) = await ResolveAsync(principal,ct);
        if(actor is null) return Deny(error);
        var hash=HashPayload(payload);
        var replay=await ReplayAsync(actor,operation,key,hash,ct);
        if(replay is not null) return replay;
        var decision=await AuthorizeAsync(actor,new ScopedResource(actor.TenantId,chapterId,null),operation,ct);
        if(!decision.Allowed) return Deny(decision.Reason);
        var committee=await store.LoadCommitteeAsync(actor.TenantId,chapterId,ct);
        if(committee is null) return Deny("committee_not_found");
        if(committee.Version != expectedVersion) return Deny("stale_version");
        var (change, failure)=await compose(actor,ct);
        if(change is null) return Deny(failure);
        return await store.CommitAsync(change with { PayloadSha256=hash,IdempotencyKey=key,
            ActorId=actor.UserId,CorrelationId=correlationId,OccurredAt=clock.GetUtcNow() },ct);
    }
    public Task<OrganisationCommandResult> TransitionAppointmentAsync(ClaimsPrincipal principal,
        TransitionAppointmentCommand command,string correlationId,CancellationToken ct)
    {
        var operation=command.RenewUntil is not null ? "organisation.committee.renew" :
            "organisation.committee."+command.TargetStatus.ToString().ToLowerInvariant();
        return AuthorizedMutationAsync(principal,command.ChapterId,command.ExpectedCommitteeVersion,
            operation,command.IdempotencyKey,command,command.RequestId,correlationId,
            async (actor,token) =>
            {
                var existing=await store.LoadAppointmentsAsync(actor.TenantId,command.ChapterId,token);
                if(existing is null) return (null,"appointments_unavailable");
                var current=existing.SingleOrDefault(x=>x.Id==command.AppointmentId);
                if(current is null) return (null,"appointment_not_found");
                if(current.UserId==actor.UserId && (command.TargetStatus==AppointmentStatus.Approved || command.RenewUntil is not null))
                    return (null,"self_approval_denied");
                var result=command.RenewUntil is { } until ?
                    AppointmentLifecycle.Renew(current,until,clock.GetUtcNow()) :
                    AppointmentLifecycle.Transition(current,command.TargetStatus,clock.GetUtcNow());
                if(result.Value is null) return (null,result.Error);
                var conflict=AppointmentAuthority.CheckExclusiveConflict(result.Value,existing);
                if(!conflict.Allowed) return (null,conflict.Reason);
                return (new AtomicChange(actor.TenantId,command.ChapterId,command.ExpectedCommitteeVersion,
                    operation,"","",actor.UserId,"",clock.GetUtcNow(),null,null,
                    "CommitteeAppointmentChanged","CommitteeAppointmentChanged",UpdatedAppointment:result.Value),"");
            },ct);
    }
    public Task<OrganisationCommandResult> IssueDelegationAsync(ClaimsPrincipal principal,
        IssueDelegationCommand command,string correlationId,CancellationToken ct)
    {
        const string operation="organisation.delegation.issue";
        return AuthorizedMutationAsync(principal,command.Grant.ChapterId,command.ExpectedCommitteeVersion,
            operation,command.IdempotencyKey,command,command.RequestId,correlationId,
            async (actor,token) =>
            {
                if(command.Grant.TenantId!=actor.TenantId || command.Grant.DelegatorId!=actor.UserId)
                    return (null,"delegation_scope_denied");
                var offices=await store.LoadAppointmentsAsync(actor.TenantId,command.Grant.ChapterId,token);
                if(offices is null) return (null,"appointments_unavailable");
                var office=offices.SingleOrDefault(x=>x.Id==command.DelegatorAppointmentId);
                if(office is null) return (null,"delegator_office_not_found");
                var grants=await permissionStore.ReadGrantsAsync(actor.UserId,actor.TenantId,token);
                if(grants is null) return (null,"assignment_unavailable");
                var permitted=grants.Where(x=>!x.Revoked && x.StartsAt<=clock.GetUtcNow() &&
                    (x.EndsAt is null || clock.GetUtcNow()<x.EndsAt) &&
                    (x.ChapterId is null || x.ChapterId==command.Grant.ChapterId)).Select(x=>x.Permission).ToArray();
                var result=DelegationLifecycle.Issue(command.Grant,office,permitted,clock.GetUtcNow());
                if(result.Value is null) return (null,result.Error);
                return (new AtomicChange(actor.TenantId,command.Grant.ChapterId,command.ExpectedCommitteeVersion,
                    operation,"","",actor.UserId,"",clock.GetUtcNow(),null,null,
                    "DelegationIssued","DelegationIssued",NewDelegation:result.Value),"");
            },ct);
    }
    public Task<OrganisationCommandResult> RevokeDelegationAsync(ClaimsPrincipal principal,
        RevokeDelegationCommand command,string correlationId,CancellationToken ct)
    {
        const string operation="organisation.delegation.revoke";
        return AuthorizedMutationAsync(principal,command.ChapterId,command.ExpectedCommitteeVersion,
            operation,command.IdempotencyKey,command,command.RequestId,correlationId,
            async (actor,token) =>
            {
                var existing=await store.LoadDelegationAsync(command.DelegationId,actor.TenantId,token);
                if(existing is null || existing.ChapterId!=command.ChapterId) return (null,"delegation_not_found");
                var result=DelegationLifecycle.Revoke(existing);
                if(result.Value is null) return (null,result.Error);
                return (new AtomicChange(actor.TenantId,command.ChapterId,command.ExpectedCommitteeVersion,
                    operation,"","",actor.UserId,"",clock.GetUtcNow(),null,null,
                    "DelegationRevoked","DelegationRevoked",UpdatedDelegation:result.Value),"");
            },ct);
    }
}
