using apiroot.Enums;
using apiroot.Interfaces;

namespace apiroot.Services;

/// <summary>
/// Generic file storage service - handles physical file operations only
/// No business logic, no database operations, no authorization
/// </summary>
public class MediaService : IMediaService
{
    // File upload security constants
    private const int MaxImageSizeBytes = 5 * 1024 * 1024; // 5MB for images
    private const int MaxDocumentSizeBytes = 10 * 1024 * 1024; // 10MB for documents
    private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private static readonly string[] AllowedDocumentExtensions = { ".pdf", ".doc", ".docx" };
    private static readonly string MediaUploadPath = Path.Combine("wwwroot", "uploads", "media");

    /// <summary>
    /// Upload a file to storage and return the URL
    /// </summary>
    public async Task<string> UploadFileAsync(IFormFile file, MediaType type)
    {
        // Validate file
        var validation = ValidateFile(file, type);
        if (!validation.IsValid)
        {
            throw new InvalidOperationException(validation.ErrorMessage ?? "File validation failed");
        }

        // Ensure upload directory exists
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), MediaUploadPath);
        if (!Directory.Exists(fullPath))
        {
            Directory.CreateDirectory(fullPath);
        }

        // Generate unique filename
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(fullPath, fileName);

        // Save file to disk
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return URL
        return $"/uploads/media/{fileName}";
    }

    /// <summary>
    /// Delete a file from storage
    /// </summary>
    public Task DeleteFileAsync(string url)
    {
        try
        {
            var fileName = Path.GetFileName(url);
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), MediaUploadPath);
            var filePath = Path.Combine(fullPath, fileName);

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
        catch
        {
            // Silently fail - file might already be deleted or path might be invalid
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Validate file based on type
    /// </summary>
    public (bool IsValid, string? ErrorMessage) ValidateFile(IFormFile file, MediaType type)
    {
        if (file == null || file.Length == 0)
        {
            return (false, "No file provided");
        }

        // Check file size based on type
        var maxSize = type == MediaType.DOCUMENT ? MaxDocumentSizeBytes : MaxImageSizeBytes;
        if (file.Length > maxSize)
        {
            var maxSizeMb = maxSize / (1024 * 1024);
            return (false, $"File size exceeds maximum allowed size of {maxSizeMb}MB");
        }

        // Check file extension based on type
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = type == MediaType.DOCUMENT ? AllowedDocumentExtensions : AllowedImageExtensions;

        if (!allowedExtensions.Contains(fileExtension))
        {
            var allowedList = string.Join(", ", allowedExtensions);
            return (false, $"File type not allowed. Allowed types: {allowedList}");
        }

        // Validate content type matches extension
        var contentType = file.ContentType.ToLowerInvariant();
        var isValidContentType = type == MediaType.DOCUMENT
            ? contentType.StartsWith("application/pdf") || contentType.StartsWith("application/msword") || contentType.StartsWith("application/vnd.openxmlformats")
            : contentType.StartsWith("image/");

        if (!isValidContentType)
        {
            return (false, "Invalid file content type");
        }

        return (true, null);
    }
}

