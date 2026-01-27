namespace apiroot.DTOs;

public record ErrorResponse(string Message, int StatusCode, string? Details = null)
{
    public static ErrorResponse Error(string message, int statusCode, string? details = null)
    {
        return new ErrorResponse(message, statusCode, details);
    }
}