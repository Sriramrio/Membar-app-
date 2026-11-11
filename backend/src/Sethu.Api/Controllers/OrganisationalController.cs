using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Sethu.Service.Abstractions.Organisation;
using Sethu.Service.DTOs.Organisation;

namespace Sethu.Api.Controllers;

[ApiController]
[Authorize]
[TypeFilter(typeof(Sethu.Api.Security.OrgLegacyAuthorizationFilter))]
[Route("v3/organisational")]
[Route("api/v3/organisational")]
[Route("api/organisational")]
public class OrganisationalController : ControllerBase
{
    private readonly IOrganisationalService _service;
    private readonly IScopeResolver _scopeResolver;
    private readonly ILogger<OrganisationalController> _logger;

    public OrganisationalController(
        IOrganisationalService service,
        IScopeResolver scopeResolver,
        ILogger<OrganisationalController> logger)
    {
        _service = service;
        _scopeResolver = scopeResolver;
        _logger = logger;
    }

    // The trusted actor resolver and effective permission filter establish the tenant.
    // Missing trust context must never fall back to a seeded or caller-supplied tenant.
    private Guid GetTenantId() => HttpContext.Items.TryGetValue("Sethu.TrustedTenantId", out var value)
        && value is Guid tenantId && tenantId != Guid.Empty
        ? tenantId : throw new UnauthorizedAccessException("Trusted tenant not resolved");

    [HttpGet("bootstrap")]
    public async Task<IActionResult> GetBootstrap(CancellationToken ct)
    {
        try
        {
            var actorScope = await _scopeResolver.ResolveActorAsync(User, GetTenantId(), ct);
            var result = await _service.GetBootstrapAsync(GetTenantId(), actorScope, ct);
            return Ok(result);
        }
        catch (ScopeSecurityException ex)
        {
            _logger.LogWarning("Scope security exception in GetBootstrap: {Message}", ex.Message);
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message, scope = ex.RequestedScope });
        }
    }

    private static readonly Dictionary<string, string> EndpointToQueryMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "dashboard", "org.today" },
        { "today", "org.today" },
        { "handover", "org.handovers.list" },
        { "handovers", "org.handovers.list" },
        { "handoffs", "org.handoffs.list" },
        { "handoff", "org.handoffs.list" },
        { "jobs", "org.jobs.list" },
        { "exports", "org.jobs.list" },
        { "imports", "org.jobs.list" },
        { "availability", "org.availability.list" },
        { "delegations", "org.delegations.list" },
        { "audit", "org.audit.list" },
        { "people", "org.people.list" },
        { "reports", "org.reports.summary" },
        { "continuity", "org.continuity.summary" },
        { "data-quality", "org.data-quality.list" },
        { "action-centre", "org.action-centre" },
        { "search", "org.search" },
        { "calendar", "org.calendar.list" },
        { "members", "org.members.list" },
        { "committees", "org.committees.list" },
        { "meetings", "org.meetings.list" },
        { "tasks", "org.tasks.list" },
        { "actions", "org.actions.list" },
        { "decisions", "org.decisions.list" },
        { "programmes", "org.programmes.list" },
        { "events", "org.events.list" },
        { "attendance", "org.attendance.list" },
        { "support", "org.support-requests.list" },
        { "escalations", "org.escalations.list" },
        { "exceptions", "org.exceptions.list" },
        { "risks", "org.risks.list" },
        { "issues", "org.issues.list" },
        { "goals", "org.goals.list" },
        { "documents", "org.documents.list" },
        { "resources", "org.documents.list" },
        { "notifications", "org.notifications.list" },
        { "alerts", "org.alerts.list" },
        { "communications", "org.communications.list" },
        { "polls", "org.polls.list" },
        { "surveys", "org.surveys.list" },
        { "volunteer-digest", "org.volunteer-digest.summary" },
        { "kyt", "org.kyt.list" },
        { "networking", "org.networking.summary" },
        { "record", "org.record.get" },
        { "record.get", "org.record.get" },
        { "record-get", "org.record.get" },
        { "converse-inbox", "org.converse.inbox" },
        { "converse-messages", "org.converse.messages" },
        { "converse-participants", "org.converse.participants" },
        { "hierarchy", "org.hierarchy.summary" },
        { "hierarchy-rollup", "org.hierarchy.rollup" },
        { "chapter-operations", "org.chapter.operations.summary" },
        { "agenda-candidates", "org.meeting.agenda-candidates" },
        { "approvals", "org.approvals.list" },
        { "assignments", "org.assignments.list" },
        { "chapter-coordinators", "org.chapter-coordinators.list" },
        { "member-growth", "org.member-growth.list" },
        { "member-cases", "org.member-cases.list" },
        { "member-dues", "org.member-dues.list" },
        { "chapters", "org.chapters.list" },
        { "cities", "org.cities.list" },
        { "regions", "org.regions.list" },
        { "states", "org.states.list" },
        { "member-presentations", "org.member-presentations.list" },
        { "mom", "org.mom.list" },
        { "plans", "org.goals.list" },
        { "projects", "org.programmes.list" },
        { "timeline", "org.audit.list" },
        { "analytics", "org.reports.summary" },
        { "membership-dues", "org.member-dues.list" },
        { "payment-exceptions", "org.member-dues.list" },
        { "roles-access", "org.people.list" },
        { "mc", "org.chapter.operations.summary" },
        { "national", "org.hierarchy.summary" },
        { "management", "org.hierarchy.summary" }
    };

    [HttpPost("query")]
    [HttpPost("query/{queryId}")]
    [HttpPost("record")]
    [HttpPost("record.get")]
    [HttpPost("record-get")]
    [HttpPost("dashboard")]
    [HttpPost("today")]
    [HttpPost("handover")]
    [HttpPost("handovers")]
    [HttpPost("handoffs")]
    [HttpPost("handoff")]
    [HttpPost("jobs")]
    [HttpPost("exports")]
    [HttpPost("imports")]
    [HttpPost("availability")]
    [HttpPost("delegations")]
    [HttpPost("audit")]
    [HttpPost("people")]
    [HttpPost("reports")]
    [HttpPost("continuity")]
    [HttpPost("data-quality")]
    [HttpPost("action-centre")]
    [HttpPost("search")]
    [HttpPost("calendar")]
    [HttpPost("members")]
    [HttpPost("committees")]
    [HttpPost("meetings")]
    [HttpPost("tasks")]
    [HttpPost("actions")]
    [HttpPost("decisions")]
    [HttpPost("programmes")]
    [HttpPost("events")]
    [HttpPost("attendance")]
    [HttpPost("support")]
    [HttpPost("escalations")]
    [HttpPost("exceptions")]
    [HttpPost("risks")]
    [HttpPost("issues")]
    [HttpPost("goals")]
    [HttpPost("documents")]
    [HttpPost("resources")]
    [HttpPost("notifications")]
    [HttpPost("alerts")]
    [HttpPost("communications")]
    [HttpPost("volunteer-digest")]
    [HttpPost("kyt")]
    [HttpPost("networking")]
    [HttpPost("assignments")]
    [HttpPost("chapter-coordinators")]
    [HttpPost("member-growth")]
    [HttpPost("member-cases")]
    [HttpPost("member-dues")]
    [HttpPost("chapters")]
    [HttpPost("cities")]
    [HttpPost("regions")]
    [HttpPost("states")]
    [HttpPost("polls")]
    [HttpPost("surveys")]
    [HttpPost("converse-inbox")]
    [HttpPost("converse-messages")]
    [HttpPost("converse-participants")]
    [HttpPost("hierarchy")]
    [HttpPost("hierarchy-rollup")]
    [HttpPost("agenda-candidates")]
    [HttpPost("approvals")]
    [HttpPost("chapter-operations")]
    [HttpPost("member-presentations")]
    [HttpPost("mom")]
    [HttpPost("plans")]
    [HttpPost("projects")]
    [HttpPost("timeline")]
    [HttpPost("analytics")]
    [HttpPost("membership-dues")]
    [HttpPost("payment-exceptions")]
    [HttpPost("roles-access")]
    [HttpPost("mc")]
    [HttpPost("national")]
    [HttpPost("management")]
    [HttpPost("view/{endpoint}")]
    public async Task<IActionResult> Query([FromBody] OrgQueryRequestDto req, [FromRoute] string? queryId, [FromRoute] string? endpoint, CancellationToken ct)
    {
        try
        {
            var path = Request.Path.Value?.TrimEnd('/') ?? "";
            var lastSegment = path.Contains('/') ? path[(path.LastIndexOf('/') + 1)..] : path;

            string? resolvedQueryId = null;
            if (!string.IsNullOrWhiteSpace(lastSegment) && EndpointToQueryMap.TryGetValue(lastSegment, out var mappedFromSegment))
            {
                resolvedQueryId = mappedFromSegment;
            }
            else if (!string.IsNullOrWhiteSpace(endpoint) && EndpointToQueryMap.TryGetValue(endpoint, out var mappedFromEndpoint))
            {
                resolvedQueryId = mappedFromEndpoint;
            }
            else if (!string.IsNullOrWhiteSpace(queryId))
            {
                resolvedQueryId = queryId;
            }
            else if (!string.IsNullOrWhiteSpace(req.queryId))
            {
                resolvedQueryId = req.queryId;
            }

            if (string.IsNullOrWhiteSpace(resolvedQueryId) && !string.IsNullOrWhiteSpace(lastSegment))
            {
                if (lastSegment.StartsWith("org.", StringComparison.OrdinalIgnoreCase))
                {
                    resolvedQueryId = lastSegment;
                }
                else
                {
                    resolvedQueryId = $"org.{lastSegment.Replace('-', '.')}.list";
                }
            }

            if (!string.IsNullOrWhiteSpace(resolvedQueryId))
            {
                req = req with { queryId = resolvedQueryId };
            }

            var actorScope = await _scopeResolver.ResolveActorAsync(User, GetTenantId(), ct);
            var result = await _service.ExecuteQueryAsync(req, GetTenantId(), actorScope, ct);
            return Ok(result);
        }
        catch (ScopeSecurityException ex)
        {
            _logger.LogWarning("Scope security exception in Query: {Message}", ex.Message);
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message, scope = ex.RequestedScope });
        }
    }

    [HttpPost("commands")]
    [HttpPost("command")]
    [HttpPost("commands/{commandType}")]
    [HttpPost("command/{commandType}")]
    [HttpPost("action/{commandType}")]
    public async Task<IActionResult> Commands([FromBody] OrgCommandRequestDto cmd, [FromRoute] string? commandType, CancellationToken ct)
    {
        try
        {
            string? normalized = null;
            if (!string.IsNullOrWhiteSpace(cmd.commandType) && cmd.commandType.StartsWith("org.", StringComparison.OrdinalIgnoreCase))
            {
                normalized = cmd.commandType;
            }
            else
            {
                var rawCommandType = !string.IsNullOrWhiteSpace(commandType) ? commandType : cmd.commandType;
                if (!string.IsNullOrWhiteSpace(rawCommandType))
                {
                    normalized = rawCommandType.StartsWith("org.", StringComparison.OrdinalIgnoreCase)
                        ? rawCommandType
                        : $"org.{rawCommandType}";
                }
            }
            if (!string.IsNullOrWhiteSpace(normalized))
            {
                cmd = cmd with { commandType = normalized };
            }
            if (string.IsNullOrWhiteSpace(cmd.commandId))
            {
                cmd = cmd with { commandId = $"cmd-{Guid.NewGuid():N}" };
            }
            var actorScope = await _scopeResolver.ResolveActorAsync(User, GetTenantId(), ct);

            var isTrustee = actorScope.Position.Equals("Trust", StringComparison.OrdinalIgnoreCase)
                || actorScope.Position.Equals("Trustee", StringComparison.OrdinalIgnoreCase)
                || actorScope.Role.Contains("trust", StringComparison.OrdinalIgnoreCase);

            if (isTrustee)
            {
                _logger.LogWarning("Trustee {ActorId} attempted write command {CommandType}. Blocked by Read-Only RBAC.", actorScope.ActorId, cmd.commandType);
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    message = "Forbidden: Trustee has strict Read-Only access across all organisational operations. Modification commands are not permitted."
                });
            }

            var result = await _service.ExecuteCommandAsync(cmd, GetTenantId(), actorScope, ct);
            return Ok(result);
        }
        catch (ScopeSecurityException ex)
        {
            _logger.LogWarning("Scope security exception in Commands: {Message}", ex.Message);
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message, scope = ex.RequestedScope });
        }
    }

    [HttpGet("record/{entityType}/{id}")]
    public async Task<IActionResult> GetRecord(string entityType, string id, CancellationToken ct)
    {
        var result = await _service.GetRecordByIdAsync(entityType, id, GetTenantId(), ct);
        return Ok(result);
    }

    [HttpGet("stream")]
    [HttpGet("events")]
    [AllowAnonymous]
    public async Task GetStream(CancellationToken ct)
    {
        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        try
        {
            while (!ct.IsCancellationRequested)
            {
                var data = JsonSerializer.Serialize(new
                {
                    type = "heartbeat",
                    timestamp = DateTimeOffset.UtcNow.ToString("o")
                });
                await Response.WriteAsync($"event: ping\ndata: {data}\n\n", ct);
                await Response.Body.FlushAsync(ct);
                await Task.Delay(15000, ct);
            }
        }
        catch (OperationCanceledException)
        {
            // Client refreshed or closed the connection - normal lifecycle for SSE streams
        }
    }
}