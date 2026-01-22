using apiroot.Data;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace apiroot.HealthChecks;

public class DatabaseHealthCheck(ApplicationDbContext context) : IHealthCheck
{
    private readonly ApplicationDbContext _context = context;

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? HealthCheckResult.Healthy("Database connection is healthy")
                : HealthCheckResult.Unhealthy("Cannot connect to database");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connection failed", exception: ex);
        }
    }
}