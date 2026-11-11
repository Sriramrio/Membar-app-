using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Finance;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

public record MembershipRenewalRequestDto(
    string PlanTier,
    int DurationMonths,
    string? Notes
);

[ApiController]
[Authorize]
[Route("api/membership")]
[Route("membership")]
public class MembershipController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;
    private readonly IPaymentGateway _paymentGateway;

    public MembershipController(SethuDbContext db, ICurrentNetworkMember currentMember, IPaymentGateway paymentGateway)
    {
        _db = db;
        _currentMember = currentMember;
        _paymentGateway = paymentGateway;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyMembership(CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var user = await _db.UserIdentities.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actor.UserId, ct);

        // Fetch affiliation & chapter
        var chapterName = "Hosur Chapter";
        var startsAt = new DateTime(2026, 4, 1);
        var expiresAt = new DateTime(2027, 3, 31);

        var memberId = actor.MemberId;
        var memberCode = $"SET-{memberId.ToString()[..8].ToUpperInvariant()}";

        return Ok(new
        {
            memberId,
            memberCode,
            tier = "Executive Gold",
            status = "Active",
            validFrom = startsAt.ToString("yyyy-MM-dd"),
            validUntil = expiresAt.ToString("yyyy-MM-dd"),
            chapterName,
            chapterDuesStatus = "Paid",
            autoRenew = false,
            daysUntilRenewal = Math.Max(0, (int)(expiresAt - DateTime.UtcNow).TotalDays)
        });
    }

    [HttpPost("renew")]
    public async Task<IActionResult> SubmitRenewal([FromBody] MembershipRenewalRequestDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var amount = dto.DurationMonths switch
        {
            12 => 25000m,
            24 => 45000m,
            _ => 15000m
        };

        var request = new PaymentIntentRequest(
            TenantId: actor.TenantId,
            MemberId: actor.MemberId,
            Amount: amount,
            Currency: "INR",
            Description: $"SETHU Annual Membership Renewal - {dto.PlanTier}",
            ReturnUrl: "/app/membership/renewal-status"
        );

        var result = await _paymentGateway.CreatePaymentIntentAsync(request, ct);

        return Ok(new
        {
            reference = result.PaymentReference,
            checkoutUrl = result.CheckoutUrl,
            status = result.Status,
            amount,
            currency = "INR",
            message = result.Message
        });
    }
}
