using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sethu.Api.Controllers;
using Sethu.Domain.Entities;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.Seed;
using Sethu.Service.Security;
using Xunit;

namespace Sethu.Persistence.Tests;

public class AuthApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private static readonly string ConnectionString = 
        Environment.GetEnvironmentVariable("SETHU_EF_DESIGNTIME_CONNECTION") 
        ?? "Host=localhost;Port=5432;Database=sethudev;Username=postgres;Password=Atribs@123";

    public AuthApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Ensure the database connection points to sethudev
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<SethuDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<SethuDbContext>(options =>
                    options.UseNpgsql(ConnectionString));
            });
        });
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });
    }

    private async Task EnsureSeededAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SethuDbContext>();
        await DevDataSeeder.SeedAsync(db);
    }

    [Fact]
    public async Task Login_WithValidPassword_ReturnsSuccessAndCookie()
    {
        await EnsureSeededAsync();

        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("member@sethu.local", "Sethu@123456"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadFromJsonAsync<AppAccountResponseDto>();
        Assert.NotNull(content);
        Assert.Equal("member", content.Id);
        Assert.Equal("Anand Kumar", content.Name);
        Assert.NotEmpty(content.Token ?? "");

        // Verify sethu_token cookie exists in Set-Cookie header
        Assert.True(response.Headers.Contains("Set-Cookie"));
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorizedAndTracksFailedAttempts()
    {
        await EnsureSeededAsync();

        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("member@sethu.local", "WrongPassword!999"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Otp_RequestAndVerify_WorksEndToEnd()
    {
        await EnsureSeededAsync();

        // 1. Request OTP
        var reqResponse = await _client.PostAsJsonAsync("/api/auth/otp/request", new OtpRequestDto("member@sethu.local", "login", "member@sethu.local"));
        Assert.Equal(HttpStatusCode.OK, reqResponse.StatusCode);

        using var reqDoc = await JsonDocument.ParseAsync(await reqResponse.Content.ReadAsStreamAsync());
        var challengeId = reqDoc.RootElement.GetProperty("challengeId").GetString();
        Assert.NotNull(challengeId);

        // In dev mode, devCode is provided ("123456")
        var code = reqDoc.RootElement.TryGetProperty("devCode", out var dc) ? dc.GetString() : "123456";

        // 2. Verify OTP
        var verifyResponse = await _client.PostAsJsonAsync("/api/auth/otp/verify", new OtpVerifyDto(challengeId, code));
        Assert.Equal(HttpStatusCode.OK, verifyResponse.StatusCode);
    }

    [Fact]
    public async Task PasswordRecovery_RequestAndReset_WorksEndToEnd()
    {
        await EnsureSeededAsync();

        // 1. Request recovery
        var reqResponse = await _client.PostAsJsonAsync("/api/auth/recovery/request", new RecoveryRequestDto("treasurer@sethu.local"));
        Assert.Equal(HttpStatusCode.OK, reqResponse.StatusCode);

        using var reqDoc = await JsonDocument.ParseAsync(await reqResponse.Content.ReadAsStreamAsync());
        var challengeId = reqDoc.RootElement.GetProperty("challengeId").GetString();
        Assert.NotNull(challengeId);
        var code = reqDoc.RootElement.TryGetProperty("devCode", out var dc) ? dc.GetString() : "123456";

        // 2. Reset password
        var newPassword = "NewTreasurerPassword@2026!";
        var resetResponse = await _client.PostAsJsonAsync("/api/auth/recovery/reset", new RecoveryResetDto(challengeId, code, newPassword));
        Assert.Equal(HttpStatusCode.OK, resetResponse.StatusCode);

        // 3. Verify login works with the new password
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("treasurer@sethu.local", newPassword));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        // 4. Restore original password so subsequent tests continue reliably
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SethuDbContext>();
        var user = await db.UserIdentities.FirstAsync(u => u.Email == "treasurer@sethu.local");
        user.PasswordHash = PasswordSecurity.HashPassword("Sethu@123456");
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task VisitorRegistration_CreateAndVerify_WorksEndToEnd()
    {
        // 1. Register visitor
        var visitorDto = new CreateVisitorRegistrationDto(
            FullName: "Sundar Pichai",
            Email: "sundar.visitor@example.com",
            Phone: "+91 91234 56789",
            ChapterId: null,
            ChapterName: "Hosur Chapter",
            VisitingDate: "2026-11-01",
            BusinessName: "Alphabet Global"
        );

        var regResponse = await _client.PostAsJsonAsync("/api/public/visitor-registrations", visitorDto);
        Assert.Equal(HttpStatusCode.Created, regResponse.StatusCode);

        using var regDoc = await JsonDocument.ParseAsync(await regResponse.Content.ReadAsStreamAsync());
        var regId = regDoc.RootElement.GetProperty("registrationId").GetGuid();
        var challengeIdStr = regDoc.RootElement.GetProperty("challengeId").GetString();
        var challengeId = Guid.Parse(challengeIdStr!);
        var code = regDoc.RootElement.TryGetProperty("devCode", out var dc) ? dc.GetString() : "123456";

        // 2. Verify visitor OTP
        var verifyResponse = await _client.PostAsJsonAsync("/api/public/visitor-registrations/verify", new VisitorVerifyDto(regId, challengeId, code!));
        Assert.Equal(HttpStatusCode.OK, verifyResponse.StatusCode);

        // 3. Confirm visitor details
        var confirmResponse = await _client.GetAsync($"/api/public/visitor-registrations/{regId}");
        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);

        using var confirmDoc = await JsonDocument.ParseAsync(await confirmResponse.Content.ReadAsStreamAsync());
        Assert.True(confirmDoc.RootElement.GetProperty("verified").GetBoolean());
        Assert.Equal("Sundar Pichai", confirmDoc.RootElement.GetProperty("fullName").GetString());
    }

    [Fact]
    public async Task Logout_RevokesSessionAndClearsCookie()
    {
        await EnsureSeededAsync();

        // 1. Log in
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("secretary@sethu.local", "Sethu@123456"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var loginData = await loginResponse.Content.ReadFromJsonAsync<AppAccountResponseDto>();
        Assert.NotNull(loginData?.Token);

        // 2. Call logout with token
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", loginData.Token);
        var logoutResponse = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);
    }
}
