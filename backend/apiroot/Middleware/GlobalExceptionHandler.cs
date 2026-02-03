using System.Net;
using System.Net.Mail;
using System.Text.Json;
using apiroot.DTOs;

namespace apiroot.Middleware;

public class GlobalExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message) = exception switch
        {
            InvalidOperationException ex => (HttpStatusCode.BadRequest, ex.Message),
            UnauthorizedAccessException ex => (HttpStatusCode.Unauthorized, ex.Message),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Resource not found"),
            ArgumentException ex => (HttpStatusCode.BadRequest, ex.Message),
            SmtpException => (HttpStatusCode.ServiceUnavailable, "Email service is temporarily unavailable"),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred")
        };

        context.Response.StatusCode = (int)statusCode;

        var response = new ErrorResponse(message, context.Response.StatusCode);

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}

public static class GlobalExceptionHandlerExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionHandler>();
    }
}