using apiroot.Enums;
using Microsoft.AspNetCore.Http;

namespace apiroot.Interfaces;

/// <summary>
/// Generic file storage service - handles file upload/download/delete operations
/// Business logic (authorization, database) should be in domain services (VehicleService, ExpertiseService)
/// </summary>
public interface IMediaService
{
    /// <summary>
    /// Upload a file to storage and return the URL
    /// Throws InvalidOperationException if validation fails
    /// </summary>
    Task<string> UploadFileAsync(IFormFile file, MediaType type);

    /// <summary>
    /// Delete a file from storage by URL
    /// </summary>
    Task DeleteFileAsync(string url);

    /// <summary>
    /// Validate file based on type (size, extension, content type)
    /// </summary>
    (bool IsValid, string? ErrorMessage) ValidateFile(IFormFile file, MediaType type);
}

