using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sethu.Api.Controllers;
using Sethu.Infrastructure.Persistence;
using Sethu.Infrastructure.Seed;
using Xunit;

namespace Sethu.Persistence.Tests;

public class MemberModulesApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private static readonly string ConnectionString = 
        Environment.GetEnvironmentVariable("SETHU_EF_DESIGNTIME_CONNECTION") 
        ?? "Host=localhost;Port=5432;Database=sethudev;Username=postgres;Password=Atribs@123";

    public MemberModulesApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
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

    private async Task<string> LoginAsMemberAsync(string identifier = "member@sethu.local")
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SethuDbContext>();
        await DevDataSeeder.SeedAsync(db);

        var loginResp = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(identifier, "Sethu@123456"));
        Assert.Equal(HttpStatusCode.OK, loginResp.StatusCode);
        var loginData = await loginResp.Content.ReadFromJsonAsync<AppAccountResponseDto>();
        Assert.NotNull(loginData?.Token);
        return loginData.Token;
    }

    [Fact]
    public async Task Notifications_GetAndMarkRead_Works()
    {
        var token = await LoginAsMemberAsync();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/notifications");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var items = doc.RootElement.GetProperty("items");
        Assert.True(items.GetArrayLength() > 0);

        var firstId = items[0].GetProperty("id").GetGuid();
        var readReq = new HttpRequestMessage(HttpMethod.Post, $"/api/notifications/{firstId}/read");
        readReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var readResp = await _client.SendAsync(readReq);
        Assert.Equal(HttpStatusCode.NoContent, readResp.StatusCode);
    }

    [Fact]
    public async Task Messages_StartConversationAndSendMessage_Works()
    {
        var token = await LoginAsMemberAsync();

        // 1. Get Meera's member ID from seeded secretary account
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SethuDbContext>();
        var meera = await db.UserIdentities.FirstAsync(u => u.Email == "secretary@sethu.local");

        // 2. Start conversation
        var startReq = new HttpRequestMessage(HttpMethod.Post, "/api/messages/conversations");
        startReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        startReq.Content = JsonContent.Create(new StartConversationDto(meera.MemberId!.Value, "Hi Meera, looking forward to our chapter conclave!"));
        var startResp = await _client.SendAsync(startReq);
        Assert.True(startResp.StatusCode is HttpStatusCode.Created or HttpStatusCode.OK);

        using var startDoc = await JsonDocument.ParseAsync(await startResp.Content.ReadAsStreamAsync());
        var convId = startDoc.RootElement.GetProperty("id").GetGuid();

        // 3. Send message with Idempotency-Key
        var sendReq = new HttpRequestMessage(HttpMethod.Post, $"/api/messages/conversations/{convId}/messages");
        sendReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        sendReq.Headers.Add("Idempotency-Key", $"msg-test-{Guid.NewGuid():N}");
        sendReq.Content = JsonContent.Create(new SendMessageDto("Can we schedule our 1-to-1 sync for Thursday?"));
        var sendResp = await _client.SendAsync(sendReq);
        Assert.Equal(HttpStatusCode.Created, sendResp.StatusCode);

        // 4. Retrieve messages
        var getReq = new HttpRequestMessage(HttpMethod.Get, $"/api/messages/conversations/{convId}/messages");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var getResp = await _client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
    }

    [Fact]
    public async Task Attendance_GetHistoryAndSummary_Works()
    {
        var token = await LoginAsMemberAsync();

        var histReq = new HttpRequestMessage(HttpMethod.Get, "/api/attendance/my");
        histReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var histResp = await _client.SendAsync(histReq);
        Assert.Equal(HttpStatusCode.OK, histResp.StatusCode);

        var sumReq = new HttpRequestMessage(HttpMethod.Get, "/api/attendance/summary");
        sumReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var sumResp = await _client.SendAsync(sumReq);
        Assert.Equal(HttpStatusCode.OK, sumResp.StatusCode);
    }

    [Fact]
    public async Task Transactions_CreateAndStatusUpdateWithETag_Works()
    {
        var token = await LoginAsMemberAsync();

        // 1. Record transaction
        var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/transactions");
        createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        createReq.Headers.Add("Idempotency-Key", $"tx-test-{Guid.NewGuid():N}");
        createReq.Content = JsonContent.Create(new CreateTransactionDto(
            BuyerBusinessId: null,
            CounterpartyBusinessId: null,
            ReferenceId: null,
            OpportunityId: null,
            Amount: 150000m,
            Currency: "INR",
            Notes: "Closed cloud migration project contract."
        ));
        var createResp = await _client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        using var doc = await JsonDocument.ParseAsync(await createResp.Content.ReadAsStreamAsync());
        var txId = doc.RootElement.GetProperty("id").GetGuid();
        var version = doc.RootElement.GetProperty("version").GetInt64();

        // 2. Update status with correct If-Match
        var updateReq = new HttpRequestMessage(HttpMethod.Post, $"/api/transactions/{txId}/status");
        updateReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        updateReq.Headers.IfMatch.Add(new EntityTagHeaderValue($"\"{version}\""));
        updateReq.Content = JsonContent.Create(new UpdateTransactionStatusDto("acknowledged"));
        var updateResp = await _client.SendAsync(updateReq);
        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);

        // 3. Test concurrent conflict with stale If-Match (expect 412 Precondition Failed)
        var staleReq = new HttpRequestMessage(HttpMethod.Post, $"/api/transactions/{txId}/status");
        staleReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        staleReq.Headers.IfMatch.Add(new EntityTagHeaderValue($"\"{version}\"")); // Old version
        staleReq.Content = JsonContent.Create(new UpdateTransactionStatusDto("closed"));
        var staleResp = await _client.SendAsync(staleReq);
        Assert.Equal(HttpStatusCode.PreconditionFailed, staleResp.StatusCode);
    }

    [Fact]
    public async Task Membership_GetAndRenew_Works()
    {
        var token = await LoginAsMemberAsync();

        var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/membership/me");
        meReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var meResp = await _client.SendAsync(meReq);
        Assert.Equal(HttpStatusCode.OK, meResp.StatusCode);

        var renewReq = new HttpRequestMessage(HttpMethod.Post, "/api/membership/renew");
        renewReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        renewReq.Content = JsonContent.Create(new MembershipRenewalRequestDto("Executive Gold", 12, "Annual renewal"));
        var renewResp = await _client.SendAsync(renewReq);
        Assert.Equal(HttpStatusCode.OK, renewResp.StatusCode);
    }

    [Fact]
    public async Task Categories_GetTaxonomy_Works()
    {
        var token = await LoginAsMemberAsync();
        var req = new HttpRequestMessage(HttpMethod.Get, "/api/categories");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var resp = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task SavedItems_ToggleAndGet_Works()
    {
        var token = await LoginAsMemberAsync();
        var targetId = Guid.NewGuid();

        // Save
        var saveReq = new HttpRequestMessage(HttpMethod.Post, "/api/saved-items/toggle");
        saveReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        saveReq.Content = JsonContent.Create(new ToggleSavedItemDto("opportunity", targetId));
        var saveResp = await _client.SendAsync(saveReq);
        Assert.Equal(HttpStatusCode.OK, saveResp.StatusCode);

        // Retrieve
        var getReq = new HttpRequestMessage(HttpMethod.Get, "/api/saved-items");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var getResp = await _client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);

        // Toggle again to remove
        var removeReq = new HttpRequestMessage(HttpMethod.Post, "/api/saved-items/toggle");
        removeReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        removeReq.Content = JsonContent.Create(new ToggleSavedItemDto("opportunity", targetId));
        var removeResp = await _client.SendAsync(removeReq);
        Assert.Equal(HttpStatusCode.OK, removeResp.StatusCode);
    }

    [Fact]
    public async Task CommunityEndpoints_AllRespondSuccessfully()
    {
        var token = await LoginAsMemberAsync();

        string[] endpoints = 
        {
            "/api/announcements",
            "/api/news",
            "/api/gallery",
            "/api/partners",
            "/api/resources",
            "/api/support/tickets",
            "/api/family",
            "/api/settings",
            "/api/connections/suggestions",
            "/api/v1/me/context",
            "/api/v1/me/profile",
            "/api/calendar/events"
        };

        foreach (var endpoint in endpoints)
        {
            var req = new HttpRequestMessage(HttpMethod.Get, endpoint);
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var resp = await _client.SendAsync(req);
            Assert.True(resp.IsSuccessStatusCode, $"Endpoint {endpoint} failed with status {resp.StatusCode}");
        }
    }
}
