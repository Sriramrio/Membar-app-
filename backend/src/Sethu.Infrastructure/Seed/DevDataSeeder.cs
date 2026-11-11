using Microsoft.EntityFrameworkCore;
using Npgsql.Internal.Postgres;
using Sethu.Domain.Entities;
using Sethu.Domain.MemberBusiness;
using Sethu.Domain.Organisation;
using Sethu.Infrastructure.Persistence;
using Sethu.Service.Security;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Sethu.Infrastructure.Seed;

public static class DevDataSeeder
{
    public static readonly Guid DefaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public const string DefaultPassword = "Sethu@123456";

    private static readonly string[] PlatformAdminPermissions = new[]
    {
        "platform.dashboard.read",
        "platform.action-centre.read",
        "platform.identity.read",
        "platform.identity.manage",
        "platform.session.read",
        "platform.session.manage",
        "platform.organisation.read",
        "platform.organisation.manage",
        "platform.roles.read",
        "platform.roles.manage",
        "platform.permissions.read",
        "platform.permissions.manage",
        "platform.assignment.view",
        "platform.assignment.manage",
        "platform.rbac.read",
        "platform.rbac.manage",
        "platform.raci.read",
        "platform.raci.manage",
        "platform.sod.read",
        "platform.sod.manage",
        "platform.access.explain",
        "platform.configuration.view",
        "platform.configuration.propose",
        "platform.configuration-profile.read",
        "platform.configuration-profile.manage",
        "platform.configuration.explain",
        "platform.change-set.read",
        "platform.change-set.manage",
        "platform.change-set.review",
        "platform.change-set.publish",
        "platform.taxonomy.read",
        "platform.taxonomy.manage",
        "platform.taxonomy.review",
        "platform.taxonomy.publish",
        "platform.master-data.read",
        "platform.master-data.manage",
        "platform.reference-data.read",
        "platform.reference-data.manage",
        "platform.forms.read",
        "platform.form.manage",
        "platform.form.review",
        "platform.form.publish",
        "platform.workflow.read",
        "platform.workflow.manage",
        "platform.workflow.review",
        "platform.workflow.publish",
        "platform.sla.read",
        "platform.sla.manage",
        "platform.calendar.read",
        "platform.calendar.manage",
        "platform.features.read",
        "platform.features.manage",
        "platform.notification.read",
        "platform.notification.manage",
        "platform.template.read",
        "platform.template.manage",
        "platform.integration.read",
        "platform.integration.manage",
        "platform.integration.test",
        "platform.import.read",
        "platform.import.manage",
        "platform.import.review",
        "platform.export.read",
        "platform.export.manage",
        "platform.jobs.read",
        "platform.jobs.manage",
        "platform.data-quality.read",
        "platform.data-quality.manage",
        "platform.data-quality.remediate",
        "platform.data-quality.review",
        "platform.correction.read",
        "platform.correction.manage",
        "platform.correction.review",
        "platform.moderation.read",
        "platform.moderation.manage",
        "platform.moderation.review",
        "platform.audit.read",
        "platform.impact.read",
        "platform.diagnostics.read",
        "platform.security.view",
        "platform.security.manage",
        "platform.privacy.read",
        "platform.privacy.manage",
        "platform.handoff.read",
        "platform.handoff.manage",
        "platform.handoff.review",
        "platform.reports.read",
        "platform.consumer-capability.read",
        "platform.legacy_members.read",
        "platform.legacy_members.prepare",
        "platform.legacy_members.chapter_attest",
        "platform.legacy_members.finance_attest",
        "platform.legacy_members.activate",
        "platform.legacy_members.finance_reconcile"
    };

    public static Guid DeterministicGuid(string input)
    {
        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(input));
        return new Guid(hash);
    }

    public static async Task SeedAsync(SethuDbContext db, CancellationToken ct = default)
    {
        await db.Database.ExecuteSqlRawAsync(@"
CREATE TABLE IF NOT EXISTS public.dbn_member_registrations (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""TenantId"" uuid NOT NULL,
    ""ChapterId"" uuid NULL,
    ""ChapterName"" text NOT NULL DEFAULT 'Hosur Chapter',
    ""ApplicantFullName"" text NOT NULL,
    ""DateOfBirth"" text NOT NULL DEFAULT '',
    ""MobileNumber"" text NOT NULL,
    ""Email"" text NOT NULL,
    ""ResidentialAddress"" text NOT NULL DEFAULT '',
    ""ResidentialCity"" text NOT NULL DEFAULT '',
    ""ResidentialPinCode"" text NOT NULL DEFAULT '',
    ""BusinessName"" text NOT NULL DEFAULT '',
    ""ApplicantDesignation"" text NOT NULL DEFAULT '',
    ""PrimaryBusinessCategory"" text NOT NULL DEFAULT '',
    ""ProductsServicesOffered"" text NOT NULL DEFAULT '',
    ""YearEstablished"" text NOT NULL DEFAULT '',
    ""EmployeeCountRange"" text NOT NULL DEFAULT '1–5',
    ""BusinessAddress"" text NOT NULL DEFAULT '',
    ""BusinessCity"" text NOT NULL DEFAULT '',
    ""BusinessPinCode"" text NOT NULL DEFAULT '',
    ""Gstin"" text NULL,
    ""WebsiteOrLinkedIn"" text NULL,
    ""ConnectionsCanGiveJson"" text NULL,
    ""FatherName"" text NULL,
    ""Gothram"" text NULL,
    ""HobbiesInterests"" text NULL,
    ""SpecialMention"" text NULL,
    ""BusinessDescription"" text NULL,
    ""IdealCustomerProfilesJson"" text NULL,
    ""BusinessConnectionsSought"" text NULL,
    ""GeographicMarketsServedJson"" text NULL,
    ""KeyDifferentiator"" text NULL,
    ""BusinessContactEmail"" text NULL,
    ""AgreedToGuidelines"" boolean NOT NULL DEFAULT false,
    ""InformationAccurate"" boolean NOT NULL DEFAULT false,
    ""DataUsageConsent"" boolean NOT NULL DEFAULT false,
    ""BirthdayGreetingConsent"" boolean NOT NULL DEFAULT false,
    ""VoluntaryContributionAcknowledged"" boolean NOT NULL DEFAULT false,
    ""ElectronicSignature"" text NOT NULL DEFAULT '',
    ""DeclarationDate"" text NOT NULL DEFAULT '',
    ""DonationAmount"" numeric NOT NULL DEFAULT 6000,
    ""PaymentMode"" text NOT NULL DEFAULT 'UPI',
    ""UpiReference"" text NULL,
    ""NeftReference"" text NULL,
    ""ChequeNumber"" text NULL,
    ""ChequeDate"" text NULL,
    ""BankFavoring"" text NOT NULL DEFAULT 'Dharmic Business Network Trust',
    ""Stage"" text NOT NULL DEFAULT 'Submitted',
    ""DocumentsVerifiedBy"" text NULL,
    ""DocumentsVerifiedRole"" text NULL,
    ""DocumentsVerifiedAt"" timestamp with time zone NULL,
    ""CommitteeApprovedBy"" text NULL,
    ""CommitteeApprovedRole"" text NULL,
    ""CommitteeApprovedAt"" timestamp with time zone NULL,
    ""TrustPaymentVerifiedBy"" text NULL,
    ""TrustPaymentVerifiedRole"" text NULL,
    ""TrustPaymentVerifiedAt"" timestamp with time zone NULL,
    ""AssignedMemberId"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.chapter_leaders (
    ""id"" uuid NOT NULL PRIMARY KEY,
    ""organization_id"" uuid NOT NULL,
    ""chapter_id"" uuid NULL,
    ""full_name"" text NOT NULL,
    ""email"" text NOT NULL,
    ""phone"" text NULL,
    ""position"" text NOT NULL,
    ""role"" text NOT NULL DEFAULT 'chapter_leader',
    ""password_hash"" text NOT NULL,
    ""must_change_password"" boolean NOT NULL DEFAULT true,
    ""is_active"" boolean NOT NULL DEFAULT true,
    ""failed_login_attempts"" integer NOT NULL DEFAULT 0,
    ""lockout_end"" timestamp with time zone NULL,
    ""created_at"" timestamp with time zone NOT NULL DEFAULT now(),
    ""updated_at"" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_chapter_leaders_chapter_position 
ON public.chapter_leaders (""chapter_id"", ""position"") 
WHERE ""is_active"" = true AND ""chapter_id"" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ix_chapter_leaders_org_trust 
ON public.chapter_leaders (""organization_id"", ""position"") 
WHERE ""is_active"" = true AND ""position"" = 'Trust';

CREATE INDEX IF NOT EXISTS ix_chapter_leaders_email 
ON public.chapter_leaders (""email"");

ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS ""verified_by"" text NULL;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS ""remarks"" text NULL;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS ""rejection_reason"" text NULL;

ALTER TABLE public.member_registrations ADD COLUMN IF NOT EXISTS ""registered_by"" text NULL;
ALTER TABLE public.member_registrations ADD COLUMN IF NOT EXISTS ""registered_by_position"" text NULL;

CREATE TABLE IF NOT EXISTS public.organisation_handovers (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""TenantId"" uuid NOT NULL,
    ""AssignmentId"" text NOT NULL,
    ""OutgoingMemberId"" text NOT NULL,
    ""IncomingMemberId"" text NOT NULL,
    ""ScopeId"" text NOT NULL,
    ""Status"" text NOT NULL DEFAULT 'Prepared',
    ""PreparedAt"" text NOT NULL,
    ""AcceptedAt"" text NULL,
    ""CompletedAt"" text NULL,
    ""OpenTaskIdsJson"" text NOT NULL DEFAULT '[]',
    ""OpenActionIdsJson"" text NOT NULL DEFAULT '[]',
    ""OpenCaseIdsJson"" text NOT NULL DEFAULT '[]',
    ""MeetingIdsJson"" text NOT NULL DEFAULT '[]',
    ""ProgrammeIdsJson"" text NOT NULL DEFAULT '[]',
    ""DocumentIdsJson"" text NOT NULL DEFAULT '[]',
    ""SummaryJson"" text NULL,
    ""Version"" bigint NOT NULL DEFAULT 1,
    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chapter_leaders ADD COLUMN IF NOT EXISTS relieved_at timestamptz NULL;
ALTER TABLE public.chapter_leaders ADD COLUMN IF NOT EXISTS suspended_at timestamptz NULL;
ALTER TABLE public.chapter_leaders ADD COLUMN IF NOT EXISTS action_reason text NULL;

CREATE TABLE IF NOT EXISTS public.event_rsvps (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""TenantId"" uuid NOT NULL,
    ""EventId"" uuid NOT NULL,
    ""MemberId"" text NOT NULL,
    ""MemberName"" text NOT NULL,
    ""MemberEmail"" text NOT NULL DEFAULT '',
    ""MemberPhone"" text NOT NULL DEFAULT '',
    ""ChapterId"" text NULL,
    ""ChapterName"" text NULL,
    ""Status"" text NOT NULL,
    ""SubstituteName"" text NULL,
    ""SubstitutePhone"" text NULL,
    ""Notes"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_event_rsvps_event_member ON public.event_rsvps(""EventId"", ""MemberId"");
", ct);

        var tenantId = DefaultTenantId;
        var issuer = "https://auth.sethu.network";
        var passwordHash = PasswordSecurity.HashPassword(DefaultPassword);

        // 1. Chapters (Units)
        var chapHosurId = DeterministicGuid("chapter:Hosur Chapter");
        var chapChennaiId = DeterministicGuid("chapter:Chennai Chapter");
        var chapCoimbatoreId = DeterministicGuid("chapter:Coimbatore Chapter");

        if (!await db.Units.AnyAsync(u => u.Id == chapHosurId, ct))
        {
            db.Units.Add(new Unit { Id = chapHosurId, TenantId = tenantId, Code = "HOSUR", Active = true });
        }
        if (!await db.Units.AnyAsync(u => u.Id == chapChennaiId, ct))
        {
            db.Units.Add(new Unit { Id = chapChennaiId, TenantId = tenantId, Code = "CHENNAI", Active = true });
        }
        if (!await db.Units.AnyAsync(u => u.Id == chapCoimbatoreId, ct))
        {
            db.Units.Add(new Unit { Id = chapCoimbatoreId, TenantId = tenantId, Code = "COIMBATORE", Active = true });
        }

        // 2. Taxonomy (Sectors, Segments, Specialisations)
        var secTechId = DeterministicGuid("sector:Information Technology");
        var secLogId = DeterministicGuid("sector:Logistics");
        var secFinId = DeterministicGuid("sector:Finance");

        if (!await db.Set<Sector>().AnyAsync(s => s.Id == secTechId, ct))
            db.Set<Sector>().Add(new Sector { Id = secTechId, TenantId = tenantId, Name = "Information Technology", Active = true });
        if (!await db.Set<Sector>().AnyAsync(s => s.Id == secLogId, ct))
            db.Set<Sector>().Add(new Sector { Id = secLogId, TenantId = tenantId, Name = "Logistics & Supply Chain", Active = true });
        if (!await db.Set<Sector>().AnyAsync(s => s.Id == secFinId, ct))
            db.Set<Sector>().Add(new Sector { Id = secFinId, TenantId = tenantId, Name = "Professional & Financial Services", Active = true });

        var segSoftwareId = DeterministicGuid("segment:Software");
        var segFreightId = DeterministicGuid("segment:Freight");
        var segTaxId = DeterministicGuid("segment:Taxation");

        if (!await db.Set<Segment>().AnyAsync(s => s.Id == segSoftwareId, ct))
            db.Set<Segment>().Add(new Segment { Id = segSoftwareId, TenantId = tenantId, SectorId = secTechId, Name = "Software Development", Active = true });
        if (!await db.Set<Segment>().AnyAsync(s => s.Id == segFreightId, ct))
            db.Set<Segment>().Add(new Segment { Id = segFreightId, TenantId = tenantId, SectorId = secLogId, Name = "Freight & Warehousing", Active = true });
        if (!await db.Set<Segment>().AnyAsync(s => s.Id == segTaxId, ct))
            db.Set<Segment>().Add(new Segment { Id = segTaxId, TenantId = tenantId, SectorId = secFinId, Name = "Accounting & Tax", Active = true });

        var specCloudId = DeterministicGuid("spec:Cloud Solutions");
        var specSupplyId = DeterministicGuid("spec:Supply Chain Management");
        var specAuditId = DeterministicGuid("spec:Audit & Tax");

        if (!await db.Set<Specialisation>().AnyAsync(s => s.Id == specCloudId, ct))
            db.Set<Specialisation>().Add(new Specialisation { Id = specCloudId, TenantId = tenantId, SegmentId = segSoftwareId, Name = "Cloud & AI Solutions", Active = true });
        if (!await db.Set<Specialisation>().AnyAsync(s => s.Id == specSupplyId, ct))
            db.Set<Specialisation>().Add(new Specialisation { Id = specSupplyId, TenantId = tenantId, SegmentId = segFreightId, Name = "Supply Chain Logistics", Active = true });
        if (!await db.Set<Specialisation>().AnyAsync(s => s.Id == specAuditId, ct))
            db.Set<Specialisation>().Add(new Specialisation { Id = specAuditId, TenantId = tenantId, SegmentId = segTaxId, Name = "Corporate Tax & Audit", Active = true });


        // 13. Default Chapter Leaders and Tenant Trust Position
        var leaderPasswordHash = PasswordSecurity.HashPassword("Leader@123");
        var defaultOrgId = DefaultTenantId;

        // Trust Leader (Tenant-Level)
        if (!await db.ChapterLeaders.AnyAsync(x => x.Email == "trust@dbn.network" || (x.OrganizationId == defaultOrgId && x.Position == ChapterRole.Trust), ct))
        {
            db.ChapterLeaders.Add(new ChapterLeader
            {
                Id = DeterministicGuid("leader:trust-tenant"),
                OrganizationId = defaultOrgId,
                ChapterId = null,
                FullName = "Ravi Kumar",
                Email = "trust@dbn.network",
                Phone = "+91 98400 11223",
                Position = ChapterRole.Trust,
                Role = "trust_leader",
                PasswordHash = leaderPasswordHash,
                MustChangePassword = false,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
        }

        // Central Leadership Head (National Scope - Master Head across all Chapters)
        var centralLeader = await db.ChapterLeaders.FirstOrDefaultAsync(x => x.Email == "leadership@dbn.network", ct);
        if (centralLeader == null)
        {
            db.ChapterLeaders.Add(new ChapterLeader
            {
                Id = DeterministicGuid("leader:central-leadership-head"),
                OrganizationId = defaultOrgId,
                ChapterId = null,
                FullName = "Central Leadership Head",
                Email = "leadership@dbn.network",
                Phone = "+91 98400 99887",
                Position = "Leadership Team",
                Role = "leadership_team",
                PasswordHash = leaderPasswordHash,
                MustChangePassword = false,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
        }
        else
        {
            centralLeader.FullName = "Central Leadership Head";
            centralLeader.Email = "leadership@dbn.network";
            centralLeader.Position = "Leadership Team";
            centralLeader.Role = "leadership_team";
            centralLeader.PasswordHash = leaderPasswordHash;
            centralLeader.MustChangePassword = false;
            centralLeader.IsActive = true;
            centralLeader.UpdatedAt = DateTimeOffset.UtcNow;
        }

        // Leadership Finance Head (National Scope - Payment Verification across All Chapters)
        var financeLeader = await db.ChapterLeaders.FirstOrDefaultAsync(x => x.Email == "finance@dbn.network", ct);
        if (financeLeader == null)
        {
            db.ChapterLeaders.Add(new ChapterLeader
            {
                Id = DeterministicGuid("leader:central-finance-head"),
                OrganizationId = defaultOrgId,
                ChapterId = null,
                FullName = "Leadership Finance Head",
                Email = "finance@dbn.network",
                Phone = "+91 98400 55443",
                Position = ChapterRole.LeadershipFinance,
                Role = "leadership_finance",
                PasswordHash = leaderPasswordHash,
                MustChangePassword = false,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
        }
        else
        {
            financeLeader.FullName = "Leadership Finance Head";
            financeLeader.Email = "finance@dbn.network";
            financeLeader.Position = ChapterRole.LeadershipFinance;
            financeLeader.Role = "leadership_finance";
            financeLeader.PasswordHash = leaderPasswordHash;
            financeLeader.MustChangePassword = false;
            financeLeader.IsActive = true;
            financeLeader.UpdatedAt = DateTimeOffset.UtcNow;
        }

        // Central Member Coordinator (National Scope - Document Verification across All Chapters)
        var mcLeader = await db.ChapterLeaders.FirstOrDefaultAsync(x => x.Email == "mc@dbn.network" || x.Email == "mc@hosur.dbn.network", ct);
        if (mcLeader == null)
        {
            db.ChapterLeaders.Add(new ChapterLeader
            {
                Id = DeterministicGuid("leader:central-mc-head"),
                OrganizationId = defaultOrgId,
                ChapterId = null,
                FullName = "Central Member Coordinator",
                Email = "mc@dbn.network",
                Phone = "+91 98400 33221",
                Position = ChapterRole.MemberCoordinator,
                Role = "member_coordinator",
                PasswordHash = leaderPasswordHash,
                MustChangePassword = false,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
        }
        else
        {
            mcLeader.FullName = "Central Member Coordinator";
            mcLeader.Email = "mc@dbn.network";
            mcLeader.ChapterId = null;
            mcLeader.Position = ChapterRole.MemberCoordinator;
            mcLeader.Role = "member_coordinator";
            mcLeader.PasswordHash = leaderPasswordHash;
            mcLeader.MustChangePassword = false;
            mcLeader.IsActive = true;
            mcLeader.UpdatedAt = DateTimeOffset.UtcNow;
        }

        // Hosur Chapter Leaders (President, Treasurer [Trusser], Secretary)
        var hosurChapter = await db.Chapters.FirstOrDefaultAsync(c => c.Name.ToLower().Contains("hosur"), ct);
        var hosurChapterId = hosurChapter?.Id ?? Guid.Parse("11111111-1111-1111-1111-111111111111");

        var defaultLeaders = new[]
        {
            new { Name = "Hari Krishnan", Email = "president@hosur.dbn.network", Position = ChapterRole.President, LegacyPosition = "President" },
            new { Name = "Karthik N", Email = "treasurer@hosur.dbn.network", Position = ChapterRole.Treasurer, LegacyPosition = "Vice President" },
            new { Name = "Meera S", Email = "secretary@hosur.dbn.network", Position = ChapterRole.Secretary, LegacyPosition = "Secretary" },
        };

        foreach (var dl in defaultLeaders)
        {
            var leader = await db.ChapterLeaders.FirstOrDefaultAsync(x =>
                x.Email == dl.Email ||
                (x.ChapterId == hosurChapterId && (x.Position == dl.Position || x.Position == dl.LegacyPosition)), ct);

            if (leader != null)
            {
                leader.Position = dl.Position;
                leader.Email = dl.Email;
                leader.FullName = dl.Name;
                leader.Role = "chapter_leader";
                leader.PasswordHash = leaderPasswordHash;
                leader.IsActive = true;
                leader.UpdatedAt = DateTimeOffset.UtcNow;
            }
            else
            {
                db.ChapterLeaders.Add(new ChapterLeader
                {
                    Id = DeterministicGuid($"leader:{dl.Email}"),
                    OrganizationId = defaultOrgId,
                    ChapterId = hosurChapterId,
                    FullName = dl.Name,
                    Email = dl.Email,
                    Phone = "+91 98400 00000",
                    Position = dl.Position,
                    Role = "chapter_leader",
                    PasswordHash = leaderPasswordHash,
                    MustChangePassword = false,
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                });
            }
        }

        var saravananLeader = await db.ChapterLeaders.FirstOrDefaultAsync(l => l.Email.ToLower() == "saravana@gmail.com", ct);
        if (saravananLeader != null)
        {
            saravananLeader.PasswordHash = PasswordSecurity.HashPassword("Leader@123");
            saravananLeader.MustChangePassword = true;
        }

        await db.SaveChangesAsync(ct);

        // 3. Members, Users, Businesses, Affiliations
        var demoMembers = new[]
        {
            (accId: "member", name: "Anand Kumar", email: "member@sethu.local", chap: "Hosur Chapter", chapId: chapHosurId, bName: "Kumar Tech Innovations", specId: specCloudId),
            (accId: "secretary", name: "Meera Narayanan", email: "secretary@sethu.local", chap: "Hosur Chapter", chapId: chapHosurId, bName: "Narayanan Logistics & Supply Chain", specId: specSupplyId),
            (accId: "treasurer", name: "Karthik Iyer", email: "treasurer@sethu.local", chap: "Chennai Chapter", chapId: chapChennaiId, bName: "Iyer & Associates Financial Services", specId: specAuditId),
            //(accId: "regional", name: "Ravi Shankar", email: "regional@sethu.local", chap: "Coimbatore Chapter", chapId: chapCoimbatoreId, bName: "Shankar Green Energy & Solar", specId: specCloudId),
            //(accId: "board", name: "Lakshmi Subramanian", email: "board@sethu.local", chap: "Chennai Chapter", chapId: chapChennaiId, bName: "Subramanian Legal Advisors", specId: specAuditId),
            //(accId: "qa", name: "System Reviewer", email: "reviewer@sethu.local", chap: "Chennai Chapter", chapId: chapChennaiId, bName: "Enterprise Network QA & Review Services", specId: specCloudId),
            //(accId: "superadmin", name: "Super Admin", email: "superadmin@sethu.local", chap: "Chennai Chapter", chapId: chapChennaiId, bName: "Platform Administration & Operations", specId: specCloudId),
             (accId: "platformadmin", name: "Platform Administrator", email: "platformadmin@dbn.network", chap: "Chennai Chapter", chapId: chapChennaiId, bName: "Platform Administration & Operations", specId: specCloudId),
        };
    var platformPasswordHash = PasswordSecurity.HashPassword("Platform@123456");
        foreach (var m in demoMembers)
        {
            var uId = DeterministicGuid($"user:{m.accId}");
    var mId = DeterministicGuid($"member:{m.accId}");
    var bId = DeterministicGuid($"business:{m.accId}");

    // User Identity
    var identity = await db.UserIdentities.FirstOrDefaultAsync(x => x.Id == uId || x.Email == m.email || x.Subject == m.accId, ct);
            if (identity == null)
            {
                identity = new UserIdentity
                {
        Id = uId,
                    TenantId = tenantId,
                    Issuer = issuer,
                    Subject = m.accId,
                    Email = m.email,
                    Name = m.name,
              PasswordHash = m.accId == "platformadmin" ? platformPasswordHash : passwordHash,                    Active = true,
                    MemberId = mId,
                    PhoneNumber = "+91 98765 43210",
                    IsContactVerified = true
                };
    db.UserIdentities.Add(identity);
            }
            else
            {
                identity.Subject = m.accId;
 identity.PasswordHash = m.accId == "platformadmin" ? platformPasswordHash : passwordHash;                identity.Email = m.email;
                identity.Name = m.name;
                identity.Active = true;
                identity.MemberId = mId;
            }

            // Member Record
            var member = await db.Set<MemberRecord>().FirstOrDefaultAsync(x => x.Id == mId, ct);
if (member == null)
{
    member = MemberRecord.Create(mId, tenantId, uId);
    member.Activate(true, true);
    db.Set<MemberRecord>().Add(member);
}

// Affiliation
var affiliation = await db.Set<MemberChapterAffiliation>().FirstOrDefaultAsync(x => x.TenantId == tenantId && x.MemberId == mId, ct);
if (affiliation == null)
{
    var affId = DeterministicGuid($"aff:{mId}:{m.chapId}");
    affiliation = MemberChapterAffiliation.Create(affId, tenantId, mId, m.chapId);
    affiliation.Approve();
    db.Set<MemberChapterAffiliation>().Add(affiliation);
}

// Business Record
var business = await db.Set<BusinessRecord>().FirstOrDefaultAsync(x => x.Id == bId, ct);
if (business == null)
{
    business = BusinessRecord.Create(bId, tenantId, mId, m.bName, m.specId);
    business.Activate(true);
    db.Set<BusinessRecord>().Add(business);
}
        }

        await db.SaveChangesAsync(ct);

        // 3b. Platform Administrator Permission Grants
        var platformUser = await db.UserIdentities.FirstOrDefaultAsync(u => u.Email == "platformadmin@dbn.network", ct);
        if (platformUser != null)
        {
            var existingGrants = await db.PermissionGrants
                .Where(g => g.UserId == platformUser.Id && g.TenantId == tenantId && !g.Revoked)
                .Select(g => g.Permission)
                .ToListAsync(ct);

            var grantsToAdd = new List<PermissionGrant>();
            foreach (var perm in PlatformAdminPermissions)
            {
                if (!existingGrants.Contains(perm, StringComparer.Ordinal))
                {
                    grantsToAdd.Add(new PermissionGrant
                    {
                        Id = DeterministicGuid($"grant:{platformUser.Id}:{perm}"),
                        UserId = platformUser.Id,
                        TenantId = tenantId,
                        ChapterId = null,
                        Permission = perm,
                        StartsAt = DateTimeOffset.UtcNow.AddDays(-1),
                        EndsAt = DateTimeOffset.UtcNow.AddYears(10),
                        Revoked = false,
                        IndependentGovernance = true
                    });
                }
            }
            if (grantsToAdd.Count > 0)
            {
                db.PermissionGrants.AddRange(grantsToAdd);
                await db.SaveChangesAsync(ct);
            }
        }

// 4. Connections
//var anandId = DeterministicGuid("member:member");
//var meeraId = DeterministicGuid("member:secretary");
//var karthikId = DeterministicGuid("member:treasurer");
//var raviId = DeterministicGuid("member:regional");

//async Task EnsureConnectionAsync(Guid fromId, Guid toId, ConnectionState state)
//{
//    var lower = fromId.CompareTo(toId) < 0 ? fromId : toId;
//    var upper = fromId.CompareTo(toId) < 0 ? toId : fromId;
//    var connId = DeterministicGuid($"conn:{lower}:{upper}");
//    var existing = await db.Set<Connection>().FirstOrDefaultAsync(x => x.Id == connId, ct);
//    if (existing == null)
//    {
//        db.Set<Connection>().Add(new Connection
//        {
//            Id = connId,
//            TenantId = tenantId,
//            LowerMemberId = lower,
//            UpperMemberId = upper,
//            InitiatorId = fromId,
//            State = state,
//            Version = 1,
//            UpdatedAt = DateTimeOffset.UtcNow
//        });
//    }
//}

//await EnsureConnectionAsync(anandId, meeraId, ConnectionState.Accepted);
//await EnsureConnectionAsync(anandId, karthikId, ConnectionState.Accepted);
//await EnsureConnectionAsync(anandId, raviId, ConnectionState.Pending);

//// 5. Notes
//var note1Id = DeterministicGuid("note:anand-meera-collab");
//if (!await db.Set<NetworkNote>().AnyAsync(x => x.Id == note1Id, ct))
//{
//    db.Set<NetworkNote>().Add(new NetworkNote
//    {
//        Id = note1Id,
//        TenantId = tenantId,
//        AuthorMemberId = anandId,
//        ContextType = "Member",
//        ContextId = meeraId,
//        Text = "Discussed Q3 cloud logistics warehouse integration. Follow up on API contracts next Tuesday.",
//        UpdatedAt = DateTimeOffset.UtcNow.AddDays(-2),
//        Version = 1
//    });
//}

//// 6. Opportunities & Responses
//var bAnandId = DeterministicGuid("business:member");
//var bMeeraId = DeterministicGuid("business:secretary");
//var opp1Id = DeterministicGuid("opp:cloud-migration");
//if (!await db.Set<NetworkOpportunity>().AnyAsync(x => x.Id == opp1Id, ct))
//{
//    db.Set<NetworkOpportunity>().Add(new NetworkOpportunity
//    {
//        Id = opp1Id,
//        TenantId = tenantId,
//        OwnerMemberId = anandId,
//        BusinessId = bAnandId,
//        Title = "Enterprise Cloud Migration Consulting",
//        SpecialisationId = specCloudId,
//        Status = "Open",
//        Scope = "YourNetwork",
//        Version = 1
//    });
//}

//var opp2Id = DeterministicGuid("opp:warehouse-logistics");
//if (!await db.Set<NetworkOpportunity>().AnyAsync(x => x.Id == opp2Id, ct))
//{
//    db.Set<NetworkOpportunity>().Add(new NetworkOpportunity
//    {
//        Id = opp2Id,
//        TenantId = tenantId,
//        OwnerMemberId = meeraId,
//        BusinessId = bMeeraId,
//        Title = "Warehouse Logistics Automation RFP",
//        SpecialisationId = specSupplyId,
//        Status = "Open",
//        Scope = "YourNetwork",
//        Version = 1
//    });
//}

//var resp1Id = DeterministicGuid("resp:anand-to-meera-opp");
//if (!await db.Set<NetworkOpportunityResponse>().AnyAsync(x => x.Id == resp1Id, ct))
//{
//    db.Set<NetworkOpportunityResponse>().Add(new NetworkOpportunityResponse
//    {
//        Id = resp1Id,
//        TenantId = tenantId,
//        OpportunityId = opp2Id,
//        MemberId = anandId,
//        Status = "Submitted"
//    });
//}

//// 7. Events & Registrations
//var evt1Id = DeterministicGuid("event:hosur-weekly-conclave");
//if (!await db.Set<NetworkFreeEvent>().AnyAsync(x => x.Id == evt1Id, ct))
//{
//    db.Set<NetworkFreeEvent>().Add(new NetworkFreeEvent
//    {
//        Id = evt1Id,
//        TenantId = tenantId,
//        ChapterId = chapHosurId,
//        OrganiserMemberId = anandId,
//        Title = "Hosur Chapter Weekly Business Conclave",
//        StartsAt = DateTimeOffset.UtcNow.AddDays(3),
//        EndsAt = DateTimeOffset.UtcNow.AddDays(3).AddHours(2),
//        Capacity = 60,
//        Registered = 1,
//        Status = "Published",
//        Version = 1
//    });
//}

//var evt2Id = DeterministicGuid("event:chennai-networking-meet");
//if (!await db.Set<NetworkFreeEvent>().AnyAsync(x => x.Id == evt2Id, ct))
//{
//    db.Set<NetworkFreeEvent>().Add(new NetworkFreeEvent
//    {
//        Id = evt2Id,
//        TenantId = tenantId,
//        ChapterId = chapChennaiId,
//        OrganiserMemberId = karthikId,
//        Title = "Chennai Chapter Annual Business Networking Meet",
//        StartsAt = DateTimeOffset.UtcNow.AddDays(-14),
//        EndsAt = DateTimeOffset.UtcNow.AddDays(-14).AddHours(3),
//        Capacity = 120,
//        Registered = 25,
//        Status = "Completed",
//        Version = 1
//    });
//}

//var reg1Id = DeterministicGuid("reg:anand-hosur-conclave");
//if (!await db.Set<NetworkFreeRegistration>().AnyAsync(x => x.Id == reg1Id, ct))
//{
//    db.Set<NetworkFreeRegistration>().Add(new NetworkFreeRegistration
//    {
//        Id = reg1Id,
//        TenantId = tenantId,
//        EventId = evt1Id,
//        MemberId = anandId,
//        Status = "Registered",
//        UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1)
//    });
//}

//// 8. Notifications
//var notif1Id = DeterministicGuid("notif:anand-welcome");
//if (!await db.Notifications.AnyAsync(x => x.Id == notif1Id, ct))
//{
//    db.Notifications.Add(new NetworkNotification
//    {
//        Id = notif1Id,
//        TenantId = tenantId,
//        MemberId = anandId,
//        Title = "Welcome to SETHU Member Network",
//        Body = "Your profile is verified and active in Hosur Chapter.",
//        Type = "system",
//        IsRead = false,
//        CreatedAt = DateTimeOffset.UtcNow.AddDays(-7)
//    });
//}

//var notif2Id = DeterministicGuid("notif:anand-opp-match");
//if (!await db.Notifications.AnyAsync(x => x.Id == notif2Id, ct))
//{
//    db.Notifications.Add(new NetworkNotification
//    {
//        Id = notif2Id,
//        TenantId = tenantId,
//        MemberId = anandId,
//        Title = "New Opportunity in your sector",
//        Body = "Warehouse Logistics Automation RFP posted in your chapter.",
//        Type = "opportunity",
//        ReferenceId = opp2Id.ToString(),
//        IsRead = false,
//        CreatedAt = DateTimeOffset.UtcNow.AddDays(-2)
//    });
//}

//// 9. Conversations & Messages - remove obsolete demo seeds if present
//var conv1Id = DeterministicGuid("conv:anand-meera");
//var oldConv = await db.Conversations.FirstOrDefaultAsync(x => x.Id == conv1Id, ct);
//if (oldConv != null)
//{
//    var oldMsgs = await db.Messages.Where(x => x.ConversationId == conv1Id).ToListAsync(ct);
//    if (oldMsgs.Count > 0) db.Messages.RemoveRange(oldMsgs);
//    db.Conversations.Remove(oldConv);
//    await db.SaveChangesAsync(ct);
//}

//// 10. Transactions
//var tx1Id = DeterministicGuid("tx:anand-meera-1");
//if (!await db.Transactions.AnyAsync(x => x.Id == tx1Id, ct))
//{
//    db.Transactions.Add(new NetworkTransaction
//    {
//        Id = tx1Id,
//        TenantId = tenantId,
//        MemberId = anandId,
//        BuyerBusinessId = bMeeraId,
//        CounterpartyBusinessId = bAnandId,
//        Amount = 150000m,
//        Currency = "INR",
//        Status = "recorded",
//        Notes = "Enterprise portal phase 1 milestone delivered.",
//        CreatedAt = DateTimeOffset.UtcNow.AddDays(-3),
//        Version = 1
//    });
//}

//// 11. Attendance Records
//var att1Id = DeterministicGuid("att:anand-chennai-meet");
//if (!await db.AttendanceRecords.AnyAsync(x => x.Id == att1Id, ct))
//{
//    db.AttendanceRecords.Add(new AttendanceRecord
//    {
//        Id = att1Id,
//        TenantId = tenantId,
//        MemberId = anandId,
//        EventId = evt2Id,
//        Status = "present",
//        Finalised = true,
//        CorrectionStatus = "none",
//        UpdatedAt = DateTimeOffset.UtcNow.AddDays(-14)
//    });
//}

//// 12. News & Announcements
//var news1Id = DeterministicGuid("news:sethu-annual-conclave");
//if (!await db.NewsItems.AnyAsync(x => x.Id == news1Id, ct))
//{
//    db.NewsItems.Add(new NetworkNewsItem
//    {
//        Id = news1Id,
//        TenantId = tenantId,
//        Title = "SETHU Annual Leadership Conclave Announced",
//        Summary = "The national networking summit will bring together 500+ Dharmic entrepreneurs in Chennai.",
//        Content = "Registrations open for all verified network members. Special breakout tracks for manufacturing, technology and services.",
//        Category = "Conferences",
//        PublishedAt = DateTimeOffset.UtcNow.AddDays(-10)
//    });
//}

//var ann1Id = DeterministicGuid("ann:expansion-guidelines");
//if (!await db.Announcements.AnyAsync(x => x.Id == ann1Id, ct))
//{
//    db.Announcements.Add(new NetworkAnnouncement
//    {
//        Id = ann1Id,
//        TenantId = tenantId,
//        ChapterId = chapHosurId,
//        Title = "New Chapter Working Groups Active",
//        Content = "Hosur Chapter has inaugurated three specialised peer circles in tech, retail, and manufacturing.",
//        Priority = "info",
//        PublishedAt = DateTimeOffset.UtcNow.AddDays(-5)
//    });
//}

await db.SaveChangesAsync(ct);
    }
}
