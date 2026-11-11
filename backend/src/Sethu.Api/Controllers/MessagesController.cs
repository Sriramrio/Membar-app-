using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Layered;

namespace Sethu.Api.Controllers;

public record StartConversationDto(Guid OtherMemberId, string? InitialMessage);
public record SendMessageDto(string Content);

[ApiController]
[Authorize]
[Route("api/messages")]
[Route("messages")]
public class MessagesController : ControllerBase
{
    private readonly SethuDbContext _db;
    private readonly ICurrentNetworkMember _currentMember;

    public MessagesController(SethuDbContext db, ICurrentNetworkMember currentMember)
    {
        _db = db;
        _currentMember = currentMember;
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var memberIdStr = actor.MemberId.ToString();
        var conversations = await _db.Conversations
            .AsNoTracking()
            .Where(c => c.TenantId == actor.TenantId && c.ParticipantIdsJson.Contains(memberIdStr))
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(ct);

        var allUsersRows = await _db.UserIdentities
            .AsNoTracking()
            .Where(u => u.TenantId == actor.TenantId && u.MemberId.HasValue)
            .ToListAsync(ct);
        var allUsers = allUsersRows
            .GroupBy(u => u.MemberId!.Value)
            .ToDictionary(g => g.Key, g => g.First().Name ?? "Member");

        var result = conversations.Select(c =>
        {
            var pIds = JsonSerializer.Deserialize<List<string>>(c.ParticipantIdsJson) ?? new List<string>();
            var otherStr = pIds.FirstOrDefault(p => p != memberIdStr);
            var otherId = Guid.TryParse(otherStr, out var gid) ? gid : Guid.Empty;
            var name = otherId != Guid.Empty && allUsers.TryGetValue(otherId, out var n) ? n : (c.Subject ?? "Conversation");

            return new
            {
                id = c.Id.ToString(),
                otherMemberId = otherId,
                otherMemberName = name,
                subject = c.Subject,
                kind = c.Kind ?? "direct",
                participantIds = pIds,
                unreadBy = new List<string>(),
                pinnedBy = new List<string>(),
                archivedBy = new List<string>(),
                updatedAt = c.UpdatedAt.ToString("o")
            };
        });

        return Ok(result);
    }

    [HttpPost("conversations")]
    public async Task<IActionResult> StartConversation([FromBody] StartConversationDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        if (dto.OtherMemberId == Guid.Empty || dto.OtherMemberId == actor.MemberId)
        {
            return BadRequest(new { code = "INVALID_PARTNER", detail = "Cannot start a conversation with yourself or an invalid member." });
        }

        var memberIdStr = actor.MemberId.ToString();
        var otherMemberIdStr = dto.OtherMemberId.ToString();

        // Check existing conversation between these two members
        var allConvs = await _db.Conversations
            .Where(c => c.TenantId == actor.TenantId && c.Kind == "direct")
            .ToListAsync(ct);

        var conv = allConvs.FirstOrDefault(c =>
            c.ParticipantIdsJson.Contains(memberIdStr) && c.ParticipantIdsJson.Contains(otherMemberIdStr));

        if (conv == null)
        {
            var participants = new List<string> { memberIdStr, otherMemberIdStr };
            conv = new Conversation
            {
                Id = Guid.NewGuid(),
                TenantId = actor.TenantId,
                Kind = "direct",
                Subject = "Direct Message",
                ParticipantIdsJson = JsonSerializer.Serialize(participants),
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
                Version = 1
            };
            _db.Conversations.Add(conv);
            await _db.SaveChangesAsync(ct);
        }

        if (!string.IsNullOrWhiteSpace(dto.InitialMessage))
        {
            var msg = new ConversationMessage
            {
                Id = Guid.NewGuid(),
                TenantId = actor.TenantId,
                ConversationId = conv.Id,
                SenderMemberId = actor.MemberId,
                Text = dto.InitialMessage.Trim(),
                CreatedAt = DateTimeOffset.UtcNow
            };
            _db.Messages.Add(msg);
            conv.UpdatedAt = msg.CreatedAt;
            conv.Version++;
            await _db.SaveChangesAsync(ct);
        }

        return Created($"/api/messages/conversations/{conv.Id}", new
        {
            id = conv.Id,
            otherMemberId = dto.OtherMemberId,
            subject = conv.Subject,
            updatedAt = conv.UpdatedAt
        });
    }

    [HttpGet("conversations/{id:guid}")]
    public async Task<IActionResult> GetConversationById(Guid id, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var memberIdStr = actor.MemberId.ToString();
        var c = await _db.Conversations.AsNoTracking().FirstOrDefaultAsync(
            c => c.Id == id && c.TenantId == actor.TenantId && c.ParticipantIdsJson.Contains(memberIdStr), ct);

        if (c == null) return NotFound();

        var allUsersRows = await _db.UserIdentities
            .AsNoTracking()
            .Where(u => u.TenantId == actor.TenantId && u.MemberId.HasValue)
            .ToListAsync(ct);
        var allUsers = allUsersRows
            .GroupBy(u => u.MemberId!.Value)
            .ToDictionary(g => g.Key, g => g.First().Name ?? "Member");

        var pIds = JsonSerializer.Deserialize<List<string>>(c.ParticipantIdsJson) ?? new List<string>();
        var otherStr = pIds.FirstOrDefault(p => p != memberIdStr);
        var otherId = Guid.TryParse(otherStr, out var gid) ? gid : Guid.Empty;
        var name = otherId != Guid.Empty && allUsers.TryGetValue(otherId, out var n) ? n : (c.Subject ?? "Conversation");

        return Ok(new
        {
            id = c.Id.ToString(),
            otherMemberId = otherId,
            otherMemberName = name,
            subject = c.Subject,
            kind = c.Kind ?? "direct",
            participantIds = pIds,
            unreadBy = new List<string>(),
            pinnedBy = new List<string>(),
            archivedBy = new List<string>(),
            updatedAt = c.UpdatedAt.ToString("o")
        });
    }

    [HttpGet("conversations/{id:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid id, [FromQuery] int page = 1, [FromQuery] int size = 50, CancellationToken ct = default)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        var memberIdStr = actor.MemberId.ToString();
        var conv = await _db.Conversations.AsNoTracking().FirstOrDefaultAsync(
            c => c.Id == id && c.TenantId == actor.TenantId && c.ParticipantIdsJson.Contains(memberIdStr), ct);

        if (conv == null) return NotFound();

        var messages = await _db.Messages
            .AsNoTracking()
            .Where(m => m.ConversationId == id && m.TenantId == actor.TenantId)
            .OrderBy(m => m.CreatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(m => new
            {
                id = m.Id.ToString(),
                conversationId = m.ConversationId.ToString(),
                senderMemberId = m.SenderMemberId.ToString(),
                isFromMe = m.SenderMemberId == actor.MemberId,
                content = m.Text,
                body = m.Text,
                sentAt = m.CreatedAt,
                createdAt = m.CreatedAt.ToString("o")
            })
            .ToListAsync(ct);

        return Ok(messages);
    }

    [HttpPost("conversations/{id:guid}/messages")]
    public async Task<IActionResult> SendMessage(Guid id, [FromBody] SendMessageDto dto, CancellationToken ct)
    {
        var actor = await _currentMember.ResolveAsync(User, ct);
        if (actor == null) return Forbid();

        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { code = "EMPTY_MESSAGE", detail = "Message content cannot be empty." });
        }

        var memberIdStr = actor.MemberId.ToString();
        var conv = await _db.Conversations.FirstOrDefaultAsync(
            c => c.Id == id && c.TenantId == actor.TenantId && c.ParticipantIdsJson.Contains(memberIdStr), ct);

        if (conv == null) return NotFound();

        var idempotencyKey = Request.Headers["Idempotency-Key"].FirstOrDefault();
        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            var existingRecord = await _db.Idempotency.FirstOrDefaultAsync(
                r => r.TenantId == actor.TenantId && r.ActorId == actor.MemberId && r.Operation == "message.send" && r.Key == idempotencyKey, ct);

            if (existingRecord != null)
            {
                return Ok(new { content = dto.Content, duplicate = true });
            }
        }

        var msg = new ConversationMessage
        {
            Id = Guid.NewGuid(),
            TenantId = actor.TenantId,
            ConversationId = conv.Id,
            SenderMemberId = actor.MemberId,
            Text = dto.Content.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Messages.Add(msg);
        conv.UpdatedAt = msg.CreatedAt;
        conv.Version++;

        var payloadHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(JsonSerializer.Serialize(dto))));

        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            _db.Idempotency.Add(new Idempotency
            {
                TenantId = actor.TenantId,
                ActorId = actor.MemberId,
                Operation = "message.send",
                Key = idempotencyKey,
                PayloadSha256 = payloadHash,
                ResultJson = JsonSerializer.Serialize(new { msg.Id }),
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        await _db.SaveChangesAsync(ct);

        return Created($"/api/messages/conversations/{conv.Id}/messages/{msg.Id}", new
        {
            id = msg.Id.ToString(),
            conversationId = conv.Id.ToString(),
            senderMemberId = actor.MemberId.ToString(),
            content = msg.Text,
            body = msg.Text,
            sentAt = msg.CreatedAt,
            createdAt = msg.CreatedAt.ToString("o")
        });
    }
}
