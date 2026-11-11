using System.Diagnostics;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Sethu.Api;
using Sethu.Service;
using Sethu.Infrastructure;
using Sethu.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Standard API Core Services
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<InvalidRequestExceptionHandler>();
builder.Services.AddHealthChecks();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Cross-Origin Resource Sharing (CORS) Configuration
var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        // V31 P04C: credentialed CORS permits only explicitly configured HTTPS origins.
        // Development HTTP loopback must be explicitly configured outside production.
        policy.SetIsOriginAllowed(origin =>
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
                !string.IsNullOrEmpty(uri.UserInfo) || uri.AbsolutePath != "/" ||
                !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment))
                return false;
            var isLoopbackDevelopment = builder.Environment.IsDevelopment() &&
                (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) && uri.IsLoopback;
            if (isLoopbackDevelopment) return true;
            if (uri.Scheme != Uri.UriSchemeHttps) return false;
            return configuredOrigins.Any(configured =>
                Uri.TryCreate(configured, UriKind.Absolute, out var approved) &&
                Uri.Compare(uri, approved, UriComponents.SchemeAndServer,
                    UriFormat.Unescaped, StringComparison.OrdinalIgnoreCase) == 0 &&
                string.Equals(uri.AbsoluteUri.TrimEnd('/'), approved.AbsoluteUri.TrimEnd('/'),
                    StringComparison.OrdinalIgnoreCase));
        })
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()
        .WithExposedHeaders("X-Correlation-Id", "Content-Disposition");
    });
});

// Clean Architecture Layer Dependency Registrations
builder.Services.AddApplicationServices();
builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration);

// Authentication & Authorization Configuration
var issuer = builder.Configuration["Authentication:TrustedIssuer"];
var audience = builder.Configuration["Authentication:Audience"];
var authority = builder.Configuration["Authentication:Authority"];
if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience) || string.IsNullOrWhiteSpace(authority))
{
    throw new InvalidOperationException(
        "Authentication:TrustedIssuer, Authentication:Audience, and Authentication:Authority must be configured.");
}

if (!Uri.TryCreate(authority, UriKind.Absolute, out var trustedAuthorityUri) ||
    trustedAuthorityUri.Scheme != Uri.UriSchemeHttps ||
    !Uri.TryCreate(issuer, UriKind.Absolute, out var trustedIssuerUri) ||
    trustedIssuerUri.Scheme != Uri.UriSchemeHttps)
{
    throw new InvalidOperationException("JWT trusted issuer and authority must be absolute HTTPS URIs.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    var signingKeyString = builder.Configuration["Authentication:SigningKey"]
        ?? Environment.GetEnvironmentVariable("SETHU_JWT_SIGNING_KEY");
    if (string.IsNullOrWhiteSpace(signingKeyString) ||
        System.Text.Encoding.UTF8.GetByteCount(signingKeyString) < 32)
        throw new InvalidOperationException("A deployment-provided JWT signing key of at least 32 bytes is required.");
    var signingKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(signingKeyString));

    options.Authority = authority;
    options.Audience = audience;
    options.RequireHttpsMetadata = true;
    options.Configuration = new Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration
    {
        Issuer = issuer
    };

    options.TokenValidationParameters.ValidateIssuer = true;
    options.TokenValidationParameters.ValidIssuer = issuer;
    options.TokenValidationParameters.ValidateAudience = true;
    options.TokenValidationParameters.ValidateLifetime = true;
    options.TokenValidationParameters.RequireExpirationTime = true;
    options.TokenValidationParameters.ValidateIssuerSigningKey = true;
    options.TokenValidationParameters.IssuerSigningKey = signingKey;
    options.TokenValidationParameters.ClockSkew = TimeSpan.FromMinutes(5);

    options.Events = new JwtBearerEvents
    {
        // Do not silently authenticate a bearer session using ambient cookies.
        // Cookie authentication requires a distinct CSRF-protected scheme.
        OnMessageReceived = context => Task.CompletedTask,
        OnTokenValidated = async context =>
        {
            try
            {
                var actorResolver = context.HttpContext.RequestServices
                    .GetRequiredService<Sethu.Service.Security.IAuthenticatedActorResolver>();
                if (context.Principal is null)
                {
                    context.Fail("Trusted principal required");
                    return;
                }
                // JWT handlers can omit iss from the projected ClaimsPrincipal.
                // Its value is sourced only from the already-validated security token.
                if (context.Principal.FindFirst("iss") is null &&
                    context.Principal.Identity is System.Security.Claims.ClaimsIdentity claimsIdentity &&
                    string.Equals(context.SecurityToken?.Issuer, issuer, StringComparison.Ordinal))
                    claimsIdentity.AddClaim(new System.Security.Claims.Claim("iss", issuer));
                var resolution = await actorResolver.ResolveAsync(
                    context.Principal, context.HttpContext.RequestAborted);
                if (!resolution.Succeeded || resolution.Actor is null)
                {
                    context.Fail("Trusted active identity and session required");
                    return;
                }
                context.HttpContext.Items["Sethu.V31.AuthenticatedActor"] = resolution.Actor;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // Do not convert permission-store or DB outages into successful authentication.
                context.Fail("Trusted session verification unavailable");
            }
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddSethuApplicationSecurity();

// Swagger / OpenAPI Configuration
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SETHU Backend API",
        Version = "v1",
        Description = "Clean Architecture API for SETHU Member Network"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token to authenticate requests."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    options.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
});

var app = builder.Build();

app.UseExceptionHandler();

// Interactive API documentation is only available in Development.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SETHU Backend API v1");
        c.RoutePrefix = "swagger";
    });

    // Automatically seed development data and demo login credentials into the database
}

// Automatically create database (if not exists), apply pending migrations, and seed initial data on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var configuration = services.GetRequiredService<IConfiguration>();

    try
    {
        // Production database provisioning belongs to infrastructure deployment, not API startup.
        // The configured database must already exist, with least-privilege application credentials.
        var db = services.GetRequiredService<SethuDbContext>();
        logger.LogInformation("Checking and applying EF Core database migrations...");
        await db.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied and database is up to date.");

        if (app.Environment.IsDevelopment())
        {
            await Sethu.Infrastructure.Seed.DevDataSeeder.SeedAsync(db);
            logger.LogInformation("Database seeded and schema guarantees verified for Development.");
        }
        else
        {
            logger.LogInformation("Production mode: skipping development seed credentials.");
        }
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "Database initialization failed. Refusing to serve requests.");
        throw;
    }
}

app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Correlation ID Tracking & Safe Client Disconnect Handling
app.Use(async (context, next) =>
{
    var correlationId = Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N");
    context.Response.Headers["X-Correlation-Id"] = correlationId;
    try
    {
        await next(context);
    }
    catch (BadHttpRequestException ex) when (context.RequestAborted.IsCancellationRequested || ex.StatusCode == 400)
    {
        // Client aborted/closed connection mid-request (e.g. React StrictMode remount, page reload, or timeout)
        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
        }
    }
    catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
    {
        // Client cancelled request
    }
    catch (IOException ex) when (context.RequestAborted.IsCancellationRequested || 
                                 ex.Message.Contains("reset", StringComparison.OrdinalIgnoreCase) || 
                                 ex.Message.Contains("aborted", StringComparison.OrdinalIgnoreCase) ||
                                 ex.Message.Contains("broken", StringComparison.OrdinalIgnoreCase))
    {
        // Client closed or reset the request connection stream (normal when user reloads, navigates away, or React StrictMode aborts)
    }
});

// Map Endpoints
app.MapControllers();

app.MapGet("/", () => Results.Ok(new { service = "SETHU API" }));

app.MapGet("/health/live", () => Results.Ok(new { status = "live" }))
   .WithName("Liveness");

app.MapGet("/health/ready", async (SethuDbContext db, CancellationToken cancellationToken) =>
{
    try
    {
        var connected = await db.Database.CanConnectAsync(cancellationToken);
        return connected
            ? Results.Ok(new { status = "ready" })
            : Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    }
    catch (Exception)
    {
        return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    }
}).WithName("Readiness");

if (app.Environment.IsDevelopment())
{
    app.MapPost("/api/dev/seed", async (SethuDbContext db, CancellationToken ct) =>
    {
        await Sethu.Infrastructure.Seed.DevDataSeeder.SeedAsync(db, ct);
        return Results.Ok(new { success = true, message = "Database seeded successfully with demo login credentials." });
    }).AllowAnonymous();
}

// Database is initialized and migrated during application startup.

app.Run();

public partial class Program { }

