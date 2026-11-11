using System.Data;
using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using NpgsqlTypes;
using Sethu.Contracts.Emails;
using Sethu.Service.Emails;
using Sethu.Service.Security;

namespace Sethu.Infrastructure.Emails;

public sealed class MemberEmailService : IMemberEmailService
{
    private readonly NpgsqlDataSource _dataSource;
    private readonly IConfiguration _config;
    private readonly ILogger<MemberEmailService> _logger;

    private static readonly SemaphoreSlim _schemaLock = new(1, 1);
    private static volatile bool _schemaInitialized = false;

    public const string DefaultTemplateCode = "MEMBER_WELCOME_CREDENTIALS";
    public const string DefaultTemplateName = "Member Welcome & Credentials";
    public const string DefaultSubject = "Welcome to SETHU — Your Account Credentials & Portal Access";

    private static readonly string[] DefaultVariables = new[]
    {
        "FullName",
        "Email",
        "MembershipId",
        "TemporaryPassword",
        "LoginUrl",
        "ChapterName"
    };

    public MemberEmailService(
        NpgsqlDataSource dataSource,
        IConfiguration config,
        ILogger<MemberEmailService> logger)
    {
        _dataSource = dataSource;
        _config = config;
        _logger = logger;
    }

    private static NpgsqlParameter P(string name, object? value) => new(name, value ?? DBNull.Value);
    private static NpgsqlParameter PString(string name, string? value) =>
        new(name, NpgsqlDbType.Varchar) { Value = (object?)value ?? DBNull.Value };

    private async Task EnsureSchemaAsync(CancellationToken ct)
    {
        if (_schemaInitialized) return;

        await _schemaLock.WaitAsync(ct);
        try
        {
            if (_schemaInitialized) return;

            await using var conn = await _dataSource.OpenConnectionAsync(ct);
            const string sql = @"
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB NOT NULL DEFAULT '[""FullName"",""Email"",""MembershipId"",""TemporaryPassword"",""LoginUrl"",""ChapterName""]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_email_templates_tenant_code UNIQUE (tenant_id, template_code)
);

CREATE TABLE IF NOT EXISTS public.member_email_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    batch_id VARCHAR(128),
    membership_id VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_member_email_dispatches_lookup 
    ON public.member_email_dispatches(tenant_id, batch_id, status);";

            await using var cmd = new NpgsqlCommand(sql, conn);
            await cmd.ExecuteNonQueryAsync(ct);
            _schemaInitialized = true;
        }
        catch (PostgresException ex) when (ex.SqlState == "23505" || ex.Message.Contains("pg_type_typname_nsp_index"))
        {
            // Table was created concurrently by another thread; safely mark initialized
            _schemaInitialized = true;
        }
        finally
        {
            _schemaLock.Release();
        }
    }

    public async Task<IReadOnlyList<TemplateSummaryDto>> ListTemplatesAsync(Guid tenantId, CancellationToken ct)
    {
        await EnsureSchemaAsync(ct);
        var list = new List<TemplateSummaryDto>();
        var seenCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        await using var conn = await _dataSource.OpenConnectionAsync(ct);

        // 1. Fetch custom saved email_templates
        try
        {
            const string sql1 = @"SELECT template_code, name, subject, is_active FROM public.email_templates WHERE tenant_id = @t ORDER BY template_code ASC;";
            await using var cmd1 = new NpgsqlCommand(sql1, conn);
            cmd1.Parameters.Add(P("t", tenantId));
            await using var rdr = await cmd1.ExecuteReaderAsync(ct);
            while (await rdr.ReadAsync(ct))
            {
                var code = rdr.GetString(0);
                seenCodes.Add(code);
                list.Add(new TemplateSummaryDto(
                    code,
                    rdr.GetString(1),
                    rdr.GetString(2),
                    "EMAIL",
                    rdr.GetBoolean(3)
                ));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query email_templates");
        }

        // 2. Fetch platform wide templates from sethu_platform_templates
        try
        {
            const string sql2 = @"SELECT code, name, channel, COALESCE(subject, name), status FROM public.sethu_platform_templates ORDER BY code ASC;";
            await using var cmd2 = new NpgsqlCommand(sql2, conn);
            await using var rdr2 = await cmd2.ExecuteReaderAsync(ct);
            while (await rdr2.ReadAsync(ct))
            {
                var code = rdr2.GetString(0);
                if (!seenCodes.Contains(code))
                {
                    seenCodes.Add(code);
                    list.Add(new TemplateSummaryDto(
                        code,
                        rdr2.GetString(1),
                        rdr2.GetString(3),
                        rdr2.GetString(2),
                        true
                    ));
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query sethu_platform_templates");
        }

        // 3. Ensure DefaultTemplateCode is in list
        if (!seenCodes.Contains(DefaultTemplateCode))
        {
            list.Insert(0, new TemplateSummaryDto(
                DefaultTemplateCode,
                DefaultTemplateName,
                DefaultSubject,
                "EMAIL",
                true
            ));
        }

        return list;
    }

    public async Task<EmailTemplateDto> GetTemplateAsync(Guid tenantId, string templateCode, CancellationToken ct)
    {
        await EnsureSchemaAsync(ct);
        var targetCode = string.IsNullOrWhiteSpace(templateCode) ? DefaultTemplateCode : templateCode.Trim();

        await using var conn = await _dataSource.OpenConnectionAsync(ct);

        // 1. Look up in tenant-specific or global email_templates
        const string sql = @"SELECT template_code, name, subject, body_html, body_text, variables, updated_at 
                             FROM public.email_templates 
                             WHERE (tenant_id = @t OR tenant_id = '11111111-1111-1111-1111-111111111111'::uuid) 
                               AND (lower(template_code) = lower(@c) 
                                    OR (@c = 'MEMBER_WELCOME_CREDENTIALS' AND lower(template_code) = 'tmp_welcome_credentials') 
                                    OR (@c = 'TMP_WELCOME_CREDENTIALS' AND lower(template_code) = 'member_welcome_credentials')) 
                             ORDER BY CASE WHEN tenant_id = @t THEN 0 ELSE 1 END LIMIT 1;";
        await using (var cmd = new NpgsqlCommand(sql, conn))
        {
            cmd.Parameters.Add(P("t", tenantId));
            cmd.Parameters.Add(PString("c", targetCode));

            await using var reader = await cmd.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct))
            {
                var varsJson = reader.IsDBNull(5) ? "[]" : reader.GetString(5);
                var vars = JsonSerializer.Deserialize<List<string>>(varsJson) ?? DefaultVariables.ToList();

                return new EmailTemplateDto(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.IsDBNull(4) ? null : reader.GetString(4),
                    vars,
                    reader.GetDateTime(6)
                );
            }
        }

        // 2. Look up in platform channel templates (sethu_platform_templates)
        try
        {
            const string sqlPlatform = @"SELECT code, name, COALESCE(subject, name), body, variables, updated_at 
                                         FROM public.sethu_platform_templates 
                                         WHERE lower(code) = lower(@c) LIMIT 1;";
            await using var cmdPlat = new NpgsqlCommand(sqlPlatform, conn);
            cmdPlat.Parameters.Add(PString("c", targetCode));
            await using var rdrPlat = await cmdPlat.ExecuteReaderAsync(ct);
            if (await rdrPlat.ReadAsync(ct))
            {
                var code = rdrPlat.GetString(0);
                var name = rdrPlat.GetString(1);
                var subj = rdrPlat.GetString(2);
                var body = rdrPlat.GetString(3);
                var varsJson = rdrPlat.IsDBNull(4) ? "[]" : rdrPlat.GetString(4);
                var vars = JsonSerializer.Deserialize<List<string>>(varsJson) ?? DefaultVariables.ToList();
                var updatedAt = rdrPlat.IsDBNull(5) ? DateTimeOffset.UtcNow : rdrPlat.GetDateTime(5);

                return new EmailTemplateDto(code, name, subj, body, null, vars, updatedAt);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query template from sethu_platform_templates for code {Code}", targetCode);
        }

        // 3. Fallback: look for ANY active email template in public.email_templates
        try
        {
            const string sqlAny = @"SELECT template_code, name, subject, body_html, body_text, variables, updated_at 
                                   FROM public.email_templates 
                                   WHERE is_active = true 
                                   ORDER BY updated_at DESC LIMIT 1;";
            await using var cmdAny = new NpgsqlCommand(sqlAny, conn);
            await using var rdrAny = await cmdAny.ExecuteReaderAsync(ct);
            if (await rdrAny.ReadAsync(ct))
            {
                var varsJson = rdrAny.IsDBNull(5) ? "[]" : rdrAny.GetString(5);
                var vars = JsonSerializer.Deserialize<List<string>>(varsJson) ?? DefaultVariables.ToList();

                return new EmailTemplateDto(
                    rdrAny.GetString(0),
                    rdrAny.GetString(1),
                    rdrAny.GetString(2),
                    rdrAny.GetString(3),
                    rdrAny.IsDBNull(4) ? null : rdrAny.GetString(4),
                    vars,
                    rdrAny.GetDateTime(6)
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query fallback email template from email_templates");
        }

        // 4. Fallback: look for ANY EMAIL template in public.sethu_platform_templates
        try
        {
            const string sqlAnyPlat = @"SELECT code, name, COALESCE(subject, name), body, variables, updated_at 
                                       FROM public.sethu_platform_templates 
                                       WHERE channel = 'EMAIL' 
                                       ORDER BY updated_at DESC LIMIT 1;";
            await using var cmdAnyPlat = new NpgsqlCommand(sqlAnyPlat, conn);
            await using var rdrAnyPlat = await cmdAnyPlat.ExecuteReaderAsync(ct);
            if (await rdrAnyPlat.ReadAsync(ct))
            {
                var varsJson = rdrAnyPlat.IsDBNull(4) ? "[]" : rdrAnyPlat.GetString(4);
                var vars = JsonSerializer.Deserialize<List<string>>(varsJson) ?? DefaultVariables.ToList();
                return new EmailTemplateDto(
                    rdrAnyPlat.GetString(0),
                    rdrAnyPlat.GetString(1),
                    rdrAnyPlat.GetString(2),
                    rdrAnyPlat.GetString(3),
                    null,
                    vars,
                    rdrAnyPlat.IsDBNull(5) ? DateTimeOffset.UtcNow : rdrAnyPlat.GetDateTime(5)
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query fallback platform template");
        }

        throw new InvalidOperationException(
            $"Email template '{targetCode}' was not found in the database. Please verify public.email_templates or public.sethu_platform_templates, or execute backend/database/EMAIL_TEMPLATES_SETUP.sql.");
    }

    public async Task<EmailTemplateDto> SaveTemplateAsync(Guid tenantId, SaveEmailTemplateRequest req, Guid actorId, CancellationToken ct)
    {
        await EnsureSchemaAsync(ct);
        var code = string.IsNullOrWhiteSpace(req.TemplateCode) ? DefaultTemplateCode : req.TemplateCode;
        var name = string.IsNullOrWhiteSpace(req.Name) ? DefaultTemplateName : req.Name;

        await using var conn = await _dataSource.OpenConnectionAsync(ct);
        const string sql = @"
INSERT INTO public.email_templates (id, tenant_id, template_code, name, subject, body_html, body_text, variables, updated_at)
VALUES (gen_random_uuid(), @t, @c, @name, @subj, @html, @text, CAST(@vars AS jsonb), now())
ON CONFLICT (tenant_id, template_code) DO UPDATE
SET name = EXCLUDED.name,
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    updated_at = now();";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.Add(P("t", tenantId));
        cmd.Parameters.Add(PString("c", code));
        cmd.Parameters.Add(PString("name", name));
        cmd.Parameters.Add(PString("subj", req.Subject));
        cmd.Parameters.Add(PString("html", req.BodyHtml));
        cmd.Parameters.Add(PString("text", req.BodyText));
        cmd.Parameters.Add(PString("vars", JsonSerializer.Serialize(DefaultVariables)));

        await cmd.ExecuteNonQueryAsync(ct);

        // Also sync update to sethu_platform_templates if template exists there
        try
        {
            const string sqlPlat = @"UPDATE public.sethu_platform_templates SET subject = @subj, body = @html, updated_at = now() WHERE lower(code) = lower(@c);";
            await using var cmdPlat = new NpgsqlCommand(sqlPlat, conn);
            cmdPlat.Parameters.Add(PString("c", code));
            cmdPlat.Parameters.Add(PString("subj", req.Subject));
            cmdPlat.Parameters.Add(PString("html", req.BodyHtml));
            await cmdPlat.ExecuteNonQueryAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not sync template update to sethu_platform_templates");
        }

        return await GetTemplateAsync(tenantId, code, ct);
    }

    public async Task<(bool Success, string? ErrorMessage)> SendTestEmailAsync(Guid tenantId, TestEmailRequest req, CancellationToken ct)
    {
        var template = await GetTemplateAsync(tenantId, req.TemplateCode ?? DefaultTemplateCode, ct);
        var subject = !string.IsNullOrWhiteSpace(req.Subject) ? req.Subject : template.Subject;
        var bodyHtml = !string.IsNullOrWhiteSpace(req.BodyHtml) ? req.BodyHtml : template.BodyHtml;

        var renderedSubject = RenderTemplate(subject, new Dictionary<string, string>
        {
            ["FullName"] = "Test Member (Preview)",
            ["Email"] = req.RecipientEmail,
            ["MembershipId"] = "SETHU-TEST-001",
            ["TemporaryPassword"] = "Sethu@Preview2026",
            ["LoginUrl"] = GetLoginUrl(),
            ["ChapterName"] = "Chennai Central Chapter"
        });

        var renderedBody = RenderTemplate(bodyHtml, new Dictionary<string, string>
        {
            ["FullName"] = "Test Member (Preview)",
            ["Email"] = req.RecipientEmail,
            ["MembershipId"] = "SETHU-TEST-001",
            ["TemporaryPassword"] = "Sethu@Preview2026",
            ["LoginUrl"] = GetLoginUrl(),
            ["ChapterName"] = "Chennai Central Chapter"
        });

        return await SendMailInternalAsync(req.RecipientEmail, renderedSubject, renderedBody, ct);
    }

    public async Task<DispatchBatchResult> DispatchCredentialsAsync(
        Guid tenantId,
        DispatchCredentialsRequest req,
        Guid actorId,
        CancellationToken ct)
    {
        await EnsureSchemaAsync(ct);
        var template = await GetTemplateAsync(tenantId, req.TemplateCode ?? DefaultTemplateCode, ct);

        // Fetch eligible members
        await using var conn = await _dataSource.OpenConnectionAsync(ct);
        var sql = @"
SELECT 
    m.membership_id, 
    COALESCE(NULLIF(trim(u.""Email""), ''), m.email_normalized) AS email, 
    COALESCE(NULLIF(trim(u.""Name""), ''), s.payload->>'full_name', 'Member') AS full_name, 
    ch.name, 
    COALESCE(m.user_id, u.""Id"") AS user_id, 
    m.batch_id,
    m.temporary_password
FROM public.sethu_legacy_members m
JOIN public.sethu_legacy_batches b ON b.batch_id = m.batch_id
LEFT JOIN public.user_identities u ON u.""TenantId"" = b.tenant_id AND (u.""Id"" = m.user_id OR u.""Subject"" = m.membership_id)
LEFT JOIN public.sethu_legacy_member_import_stage s ON s.batch_id = m.batch_id AND s.membership_id = m.membership_id
LEFT JOIN public.chapters ch ON ch.id = b.chapter_id
WHERE b.tenant_id = @t
  AND (CAST(@b AS text) IS NULL OR m.batch_id = CAST(@b AS text))
  AND m.status IN ('ACTIVE', 'ALREADY_ACTIVE')
ORDER BY m.source_row;";

        var members = new List<(string MembershipId, string Email, string FullName, string ChapterName, Guid? UserId, string BatchId, string? TemporaryPassword)>();
        await using (var cmd = new NpgsqlCommand(sql, conn))
        {
            cmd.Parameters.Add(P("t", tenantId));
            cmd.Parameters.Add(PString("b", string.IsNullOrWhiteSpace(req.BatchId) ? null : req.BatchId));

            await using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var mid = reader.GetString(0);
                var email = reader.GetString(1);
                var name = reader.IsDBNull(2) ? "Member" : reader.GetString(2);
                var chName = reader.IsDBNull(3) ? "SETHU Network Chapter" : reader.GetString(3);
                var uid = reader.IsDBNull(4) ? (Guid?)null : reader.GetGuid(4);
                var bId = reader.GetString(5);
                var tempPwd = reader.IsDBNull(6) ? null : reader.GetString(6);
                members.Add((mid, email, name, chName, uid, bId, tempPwd));
            }
        }

        // Support selecting single or multiple specific members
        if (req.MembershipIds != null && req.MembershipIds.Count > 0)
        {
            var filterSet = new HashSet<string>(req.MembershipIds, StringComparer.OrdinalIgnoreCase);
            members = members.Where(m => filterSet.Contains(m.MembershipId)).ToList();
        }

        var results = new List<DispatchItemResult>();
        int sentCount = 0;
        int failedCount = 0;

        foreach (var m in members)
        {
            ct.ThrowIfCancellationRequested();
            string tempPassword = m.TemporaryPassword ?? "";

            // If member already has a temporary_password in DB, use it directly!
            // Only generate and save if it's missing (older record):
            if (string.IsNullOrWhiteSpace(tempPassword))
            {
                tempPassword = GenerateSecurePassword();
                string passwordHash = PasswordSecurity.HashPassword(tempPassword);

                try
                {
                    await using var updateCmd = new NpgsqlCommand(@"
UPDATE public.user_identities 
SET ""PasswordHash"" = @p, ""Active"" = true, ""FailedLoginAttempts"" = 0
WHERE ""TenantId"" = @t AND (""Id"" = @uid OR ""Subject"" = @mid OR lower(trim(""Email"")) = @email);", conn);
                    updateCmd.Parameters.Add(PString("p", passwordHash));
                    updateCmd.Parameters.Add(P("t", tenantId));
                    updateCmd.Parameters.Add(P("uid", m.UserId ?? Guid.Empty));
                    updateCmd.Parameters.Add(PString("mid", m.MembershipId));
                    updateCmd.Parameters.Add(PString("email", m.Email.ToLowerInvariant().Trim()));
                    var rowsAffected = await updateCmd.ExecuteNonQueryAsync(ct);

                    if (rowsAffected == 0)
                    {
                        await using var insertCmd = new NpgsqlCommand(@"
INSERT INTO public.user_identities 
(""Id"", ""TenantId"", ""Issuer"", ""Subject"", ""Active"", ""MemberId"", ""Email"", ""Name"", ""FailedLoginAttempts"", ""PasswordHash"")
VALUES (gen_random_uuid(), @t, 'SETHU_PORTAL_MEMBER', @mid, true, @mid, @email, @name, 0, @p)
ON CONFLICT (""Issuer"", ""Subject"") DO UPDATE 
SET ""PasswordHash"" = EXCLUDED.""PasswordHash"", ""Active"" = true, ""FailedLoginAttempts"" = 0;", conn);
                        insertCmd.Parameters.Add(P("t", tenantId));
                        insertCmd.Parameters.Add(PString("mid", m.MembershipId));
                        insertCmd.Parameters.Add(PString("email", m.Email.ToLowerInvariant().Trim()));
                        insertCmd.Parameters.Add(PString("name", m.FullName));
                        insertCmd.Parameters.Add(PString("p", passwordHash));
                        await insertCmd.ExecuteNonQueryAsync(ct);
                    }

                    // Save the generated password to sethu_legacy_members
                    await using var savePwdCmd = new NpgsqlCommand(@"
UPDATE public.sethu_legacy_members SET temporary_password = @p WHERE batch_id = @b AND membership_id = @mid;", conn);
                    savePwdCmd.Parameters.Add(PString("p", tempPassword));
                    savePwdCmd.Parameters.Add(PString("b", m.BatchId));
                    savePwdCmd.Parameters.Add(PString("mid", m.MembershipId));
                    await savePwdCmd.ExecuteNonQueryAsync(ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to update identity credentials for {MembershipId}", m.MembershipId);
                }
            }

            try
            {
 
                // Sync sethu_legacy_members email_normalized with the active email
                await using var syncLegacyCmd = new NpgsqlCommand(@"
UPDATE public.sethu_legacy_members
SET email_normalized = @email
WHERE membership_id = @mid AND email_normalized <> @email;", conn);
                syncLegacyCmd.Parameters.Add(PString("email", m.Email.ToLowerInvariant().Trim()));
                syncLegacyCmd.Parameters.Add(PString("mid", m.MembershipId));
                await syncLegacyCmd.ExecuteNonQueryAsync(ct);

                // Render email
                var placeholders = new Dictionary<string, string>
                {
                    ["FullName"] = m.FullName,
                    ["Email"] = m.Email,
                    ["MembershipId"] = m.MembershipId,
                    ["TemporaryPassword"] = tempPassword,
                    ["LoginUrl"] = GetLoginUrl(),
                    ["ChapterName"] = m.ChapterName
                };

                var renderedSubject = RenderTemplate(template.Subject, placeholders);
                var renderedBody = RenderTemplate(template.BodyHtml, placeholders);

                var (success, error) = await SendMailInternalAsync(m.Email, renderedSubject, renderedBody, ct);
                var status = success ? "SENT" : "FAILED";

                if (success) sentCount++;
                else failedCount++;

                // Record dispatch log
                await using var logCmd = new NpgsqlCommand(@"
INSERT INTO public.member_email_dispatches 
(id, tenant_id, batch_id, membership_id, email, full_name, status, error_message, sent_at)
VALUES (gen_random_uuid(), @t, @b, @m, @e, @name, @status, @err, CASE WHEN @status = 'SENT' THEN now() ELSE NULL END);", conn);
                logCmd.Parameters.Add(P("t", tenantId));
                logCmd.Parameters.Add(PString("b", m.BatchId));
                logCmd.Parameters.Add(PString("m", m.MembershipId));
                logCmd.Parameters.Add(PString("e", m.Email));
                logCmd.Parameters.Add(PString("name", m.FullName));
                logCmd.Parameters.Add(PString("status", status));
                logCmd.Parameters.Add(PString("err", error));
                await logCmd.ExecuteNonQueryAsync(ct);

                results.Add(new DispatchItemResult(m.MembershipId, m.Email, m.FullName, status, error, success ? DateTimeOffset.UtcNow : null));

                // Small delay between sends to prevent SMTP rate-limiting
                if (members.Count > 1)
                {
                    await Task.Delay(250, ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to dispatch email credentials to member {MembershipId}", m.MembershipId);
                failedCount++;
                results.Add(new DispatchItemResult(m.MembershipId, m.Email, m.FullName, "FAILED", ex.Message, null));
            }
        }

        return new DispatchBatchResult(
            req.BatchId ?? "ALL_MEMBERS",
            members.Count,
            sentCount,
            failedCount,
            results
        );
    }

    public async Task<IReadOnlyList<EmailDispatchLogItem>> GetDispatchLogsAsync(
        Guid tenantId,
        string? batchId,
        int limit,
        CancellationToken ct)
    {
        await EnsureSchemaAsync(ct);
        await using var conn = await _dataSource.OpenConnectionAsync(ct);
        const string sql = @"
SELECT id, batch_id, membership_id, email, full_name, status, error_message, created_at, sent_at
FROM public.member_email_dispatches
WHERE tenant_id = @t AND (CAST(@b AS text) IS NULL OR batch_id = CAST(@b AS text))
ORDER BY created_at DESC
LIMIT @limit;";

        var list = new List<EmailDispatchLogItem>();
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.Add(P("t", tenantId));
        cmd.Parameters.Add(PString("b", string.IsNullOrWhiteSpace(batchId) ? null : batchId));
        cmd.Parameters.Add(new NpgsqlParameter("limit", NpgsqlDbType.Integer) { Value = limit > 0 ? limit : 100 });

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(new EmailDispatchLogItem(
                reader.GetGuid(0),
                reader.IsDBNull(1) ? null : reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.IsDBNull(4) ? "" : reader.GetString(4),
                reader.GetString(5),
                reader.IsDBNull(6) ? null : reader.GetString(6),
                reader.GetDateTime(7),
                reader.IsDBNull(8) ? (DateTimeOffset?)null : reader.GetDateTime(8)
            ));
        }

        return list;
    }

    public async Task<IReadOnlyList<BatchMemberItemDto>> GetBatchMembersAsync(Guid tenantId, string? batchId, CancellationToken ct)
    {
        await EnsureSchemaAsync(ct);
        await using var conn = await _dataSource.OpenConnectionAsync(ct);
        const string sql = @"
SELECT 
    m.membership_id, 
    COALESCE(NULLIF(trim(u.""Email""), ''), m.email_normalized) AS email, 
    COALESCE(NULLIF(trim(u.""Name""), ''), s.payload->>'full_name', 'Member') AS full_name, 
    m.status, 
    d.sent_at, 
    d.status,
    m.temporary_password,
    COALESCE(u.""PhoneNumber"", s.payload->>'mobile') AS phone,
    COALESCE(u.""IsContactVerified"", false) AS is_contact_verified,
    ch.name AS chapter_name
FROM public.sethu_legacy_members m
JOIN public.sethu_legacy_batches b ON b.batch_id = m.batch_id
LEFT JOIN public.user_identities u ON u.""TenantId"" = b.tenant_id AND (u.""Id"" = m.user_id OR u.""Subject"" = m.membership_id)
LEFT JOIN public.sethu_legacy_member_import_stage s ON s.batch_id = m.batch_id AND s.membership_id = m.membership_id
LEFT JOIN public.chapters ch ON ch.id = b.chapter_id
LEFT JOIN (
    SELECT DISTINCT ON (membership_id) membership_id, sent_at, status 
    FROM public.member_email_dispatches 
    WHERE tenant_id = @t 
    ORDER BY membership_id, created_at DESC
) d ON d.membership_id = m.membership_id
WHERE b.tenant_id = @t 
  AND (CAST(@b AS text) IS NULL OR m.batch_id = CAST(@b AS text))
ORDER BY m.source_row;";

        var list = new List<BatchMemberItemDto>();
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.Add(P("t", tenantId));
        cmd.Parameters.Add(PString("b", string.IsNullOrWhiteSpace(batchId) ? null : batchId));

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(new BatchMemberItemDto(
                reader.GetString(0),
                reader.GetString(1),
                reader.IsDBNull(2) ? "Member" : reader.GetString(2),
                reader.GetString(3),
                reader.IsDBNull(4) ? (DateTimeOffset?)null : reader.GetDateTime(4),
                reader.IsDBNull(5) ? null : reader.GetString(5),
                reader.IsDBNull(6) ? null : reader.GetString(6),
                reader.IsDBNull(7) ? null : reader.GetString(7),
                !reader.IsDBNull(8) && reader.GetBoolean(8),
                reader.IsDBNull(9) ? null : reader.GetString(9)
            ));
        }

        return list;
    }

    private static string RenderTemplate(string text, Dictionary<string, string> values)
    {
        var result = text;
        foreach (var kvp in values)
        {
            result = result.Replace("{{" + kvp.Key + "}}", kvp.Value, StringComparison.OrdinalIgnoreCase);
        }
        return result;
    }

    private static string GenerateSecurePassword()
    {
        // Generates user-friendly secure password like "Sethu@4892K"
        var digits = RandomNumberGenerator.GetInt32(1000, 9999);
        var letter = (char)('A' + RandomNumberGenerator.GetInt32(0, 26));
        return $"Sethu@{digits}{letter}";
    }

    private string GetLoginUrl()
    {
        return _config["MemberPortal:LoginUrl"] 
               ?? _config["Authentication:AudienceUrl"] 
               ?? "https://membersethu.dharmicbusines.com/login";
    }

    private async Task<(bool Success, string? ErrorMessage)> SendMailInternalAsync(
        string recipient,
        string subject,
        string htmlBody,
        CancellationToken ct)
    {
        var smtpHost = _config["Smtp:Host"];
        var fromAddress = _config["Smtp:FromAddress"];
        var fromName = _config["Smtp:FromName"] ?? "SETHU Network";
        var username = _config["Smtp:Username"];
        var password = _config["Smtp:Password"];

        if (string.IsNullOrWhiteSpace(smtpHost))
        {
            // Dev / Mock Mode: Log clearly so admin can inspect without failure
            _logger.LogInformation(
                "[MOCK EMAIL DISPATCH] Host not configured. Email to: {To}, Subject: {Subject}\nBody snippet: {Snippet}",
                recipient, subject, htmlBody.Length > 200 ? htmlBody[..200] + "..." : htmlBody);
            return (true, null);
        }

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return (false, "SMTP configuration error: Username or Password is not configured in appsettings.json.");
        }

        try
        {
            var port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 587;
            var enableSsl = !bool.TryParse(_config["Smtp:EnableSsl"], out var ssl) || ssl;

            // When using Gmail SMTP, From address should match the authenticated Gmail account
            string effectiveFrom = !string.IsNullOrWhiteSpace(fromAddress) ? fromAddress : username;
            if (smtpHost.Contains("gmail.com", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(username))
            {
                effectiveFrom = username.Trim();
            }

            using var message = new MailMessage
            {
                From = new MailAddress(effectiveFrom, fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(new MailAddress(recipient.Trim()));

            using var client = new SmtpClient(smtpHost.Trim(), port)
            {
                EnableSsl = enableSsl,
                Timeout = 15000,
                Credentials = new NetworkCredential(username.Trim(), password.Trim())
            };

            await client.SendMailAsync(message, ct);
            _logger.LogInformation("Successfully sent email to {Recipient} with subject '{Subject}'", recipient, subject);
            return (true, null);
        }
        catch (SmtpException ex)
        {
            _logger.LogError(ex, "SMTP error sending email to {Recipient}: {Message}", recipient, ex.Message);
            return (false, $"SMTP Error: {ex.Message} (StatusCode: {ex.StatusCode})");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Recipient}: {Message}", recipient, ex.Message);
            return (false, ex.Message);
        }
    }
}
