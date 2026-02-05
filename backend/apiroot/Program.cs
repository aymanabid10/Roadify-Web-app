using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using apiroot.Data;
using apiroot.Data.Mongo;
using apiroot.Enums;
using apiroot.HealthChecks;
using apiroot.Interfaces;
using apiroot.Models;
using apiroot.Middleware;
using apiroot.Services;
using MongoDB.Driver;
using apiroot.Data.Mongo.Configuration;
using Microsoft.AspNetCore.SignalR;
using apiroot.Data.Mongo.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Rate limiting configuration
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Strict rate limit for email-sending endpoints (forgot-password, resend-confirmation, register)
    options.AddPolicy("EmailRateLimit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(15),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Moderate rate limit for login attempts
    options.AddPolicy("LoginRateLimit", httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(5),
                SegmentsPerWindow = 5,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // General auth rate limit
    options.AddPolicy("AuthRateLimit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Roadify API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Scheme = "Bearer",
        Description = "JWT Authorization header using the Bearer scheme."
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document),
            []
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<ConnectionStrings>(builder.Configuration.GetSection("ConnectionStrings"));

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Validate JWT key length at startup
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey) || Encoding.UTF8.GetBytes(jwtKey).Length < 32)
{
    throw new InvalidOperationException("JWT Key must be at least 256 bits (32 characters) for HMAC-SHA256");
}

// Add MongoDB settings
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

builder.Services.AddSingleton<IMongoClient>(_ =>
{
    var settings = builder.Configuration
        .GetSection("MongoDbSettings")
        .Get<MongoDbSettings>();

    return new MongoClient(settings?.ConnectionString ??
                           throw new InvalidOperationException("MongoDB ConnectionString is not configured."));
});

//Add MongoDB context
builder.Services.AddSingleton<MongoDbContext>();

//Inject ReviewRepository and ReviewService
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IReviewService, ReviewService>();

// SignalR and UserIdProvider
builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings?.Issuer,
            ValidAudience = jwtSettings?.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings?.Key ?? string.Empty)),
            RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
            NameClaimType = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/hubs/chat"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };

    });

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IMediaService, MediaService>();
builder.Services.AddScoped<IListingService, ListingService>();
builder.Services.AddScoped<IExpertiseService, ExpertiseService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database", HealthStatus.Healthy);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles(); // Enable serving static files from wwwroot

app.UseCors("AllowNextJs");

app.UseGlobalExceptionHandler();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.MapHealthChecks("/health");

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    await SeedRolesAsync(roleManager);
    await SeedAdminUserAsync(userManager, dbContext);
    await SeedUsersAsync(userManager, dbContext);
}

app.Run();
return;

async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
{
    if (!await roleManager.RoleExistsAsync(nameof(UserRole.USER)))
    {
        await roleManager.CreateAsync(new IdentityRole(nameof(UserRole.USER)));
    }

    if (!await roleManager.RoleExistsAsync(nameof(UserRole.ADMIN)))
    {
        await roleManager.CreateAsync(new IdentityRole(nameof(UserRole.ADMIN)));
    }

    if (!await roleManager.RoleExistsAsync(nameof(UserRole.EXPERT)))
    {
        await roleManager.CreateAsync(new IdentityRole(nameof(UserRole.EXPERT)));
    }
}

async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager, ApplicationDbContext dbContext)
{
    const string adminEmail = "admin@roadify.com";
    const string adminUsername = "admin";

    var existingUser = await dbContext.Users
        .IgnoreQueryFilters()
        .FirstOrDefaultAsync(u => u.Email == adminEmail || u.UserName == adminUsername);

    if (existingUser != null)
    {
        app.Logger.LogInformation(existingUser.IsDeleted
            ? "Admin user exists but is soft-deleted. Skipping creation."
            : "Admin user already exists.");
        return;
    }

    // Create new admin user
    var admin = new ApplicationUser
    {
        UserName = adminUsername,
        Email = adminEmail,
        EmailConfirmed = true
    };

    var password = builder.Configuration.GetSection("AdminPassword").Value;
    if (string.IsNullOrEmpty(password))
    {
        app.Logger.LogWarning("AdminPassword not configured. Admin user will not be created.");
        return;
    }

    var result = await userManager.CreateAsync(admin, password);
    if (result.Succeeded)
    {
        await userManager.AddToRoleAsync(admin, nameof(UserRole.ADMIN));
        await userManager.AddToRoleAsync(admin, nameof(UserRole.USER));
        app.Logger.LogInformation("Admin user created successfully.");
    }
    else
    {
        app.Logger.LogError("Failed to create admin user: {Errors}",
            string.Join(", ", result.Errors.Select(e => e.Description)));
    }
}

async Task SeedUsersAsync(UserManager<ApplicationUser> userManager, ApplicationDbContext dbContext)
{
    app.Logger.LogInformation("Seeding 100 users...");
    for (int i = 1; i <= 100; i++)
    {
        var email = $"user{i}@roadify.com";
        var username = $"user{i}";

        var existingUser = await dbContext.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == email || u.UserName == username);

        if (existingUser != null) continue;

        var user = new ApplicationUser
        {
            UserName = username,
            Email = email,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, "Password123!");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(user, nameof(UserRole.USER));

            // Make every 4th user an EXPERT for variety
            if (i % 4 == 0)
            {
                await userManager.AddToRoleAsync(user, nameof(UserRole.EXPERT));
                app.Logger.LogInformation("Expert user {Username} seeded.", username);
            }
            else
            {
                app.Logger.LogInformation("Standard user {Username} seeded.", username);
            }
        }
        else
        {
            app.Logger.LogError("Failed to seed user {Username}: {Errors}",
                username, string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }
}