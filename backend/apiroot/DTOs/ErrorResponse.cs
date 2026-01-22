namespace apiroot.DTOs;

public record ErrorResponse(string Message, int StatusCode, string? Details = null);