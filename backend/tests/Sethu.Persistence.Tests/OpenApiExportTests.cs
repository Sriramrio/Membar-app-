using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Sethu.Persistence.Tests;

public class OpenApiExportTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public OpenApiExportTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Export_OpenApi_Json_Successfully()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/swagger/v1/swagger.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("/api/directory/members", json);
        Assert.Contains("/api/connections", json);
        Assert.Contains("/api/notifications", json);
        Assert.Contains("/api/messages/conversations", json);
        Assert.Contains("/api/attendance/my", json);
        Assert.Contains("/api/transactions", json);
        Assert.Contains("/api/membership/me", json);

        var docPaths = new[]
        {
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../docs/sethu-member-rest-openapi.json")),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../docs/sethu-member-rest-openapi.json"))
        };

        foreach (var path in docPaths)
        {
            var dir = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(dir) && Directory.Exists(dir))
            {
                await File.WriteAllTextAsync(path, json);
            }
        }
    }
}
