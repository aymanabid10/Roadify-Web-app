using Microsoft.EntityFrameworkCore;
using apiroot.Data;
using apiroot.DTOs;
using apiroot.Enums;
using apiroot.Interfaces;
using apiroot.Models;

namespace apiroot.Services;

public class MediaService(ApplicationDbContext context) : IMediaService
{
    private readonly ApplicationDbContext _context = context;

    // File upload security constants
    private const int MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB
    private const int MaxImageSizeBytes = 5 * 1024 * 1024; // 5MB for images
    private const int MaxDocumentSizeBytes = 10 * 1024 * 1024; // 10MB for documents
    private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private static readonly string[] AllowedDocumentExtensions = { ".pdf", ".doc", ".docx" };
    private static readonly string MediaUploadPath = Path.Combine("wwwroot", "uploads", "media");

    public async Task<(bool Success, Guid? MediaId, string? ErrorMessage, int? StatusCode)> CreateMediaAsync(
        string url, MediaType type, Guid vehicleId, string userId)
    {
        // Verify vehicle exists and belongs to user
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == vehicleId && v.UserId == userId);

        if (vehicle == null)
        {
            return (false, null, "Vehicle not found or access denied", StatusCodes.Status404NotFound);
        }

        var media = new Media
        {
            Id = Guid.NewGuid(),
            Url = url,
            Type = type,
            VehicleId = vehicleId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        _context.Media.Add(media);
        await _context.SaveChangesAsync();

        return (true, media.Id, null, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> SoftDeleteMediaAsync(Guid id, string userId)
    {
        var media = await _context.Media
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId && !m.IsDeleted);

        if (media == null)
        {
            return (false, "Media not found or access denied");
        }

        media.IsDeleted = true;
        media.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return (true, null);
    }

    public async Task<List<MediaResponseDto>> GetMediaByVehicleIdAsync(Guid vehicleId, string userId, bool includeDeleted = false)
    {
        var query = _context.Media
            .Include(m => m.Vehicle)
            .Where(m => m.VehicleId == vehicleId && m.Vehicle.UserId == userId);

        if (!includeDeleted)
        {
            query = query.Where(m => !m.IsDeleted);
        }

        var mediaList = await query.ToListAsync();

        return mediaList.Select(MapToDto).ToList();
    }

    public async Task<MediaResponseDto?> GetMediaByIdAsync(Guid id, string userId)
    {
        var media = await _context.Media
            .Include(m => m.Vehicle)
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId && !m.IsDeleted);

        return media == null ? null : MapToDto(media);
    }

    private static MediaResponseDto MapToDto(Media media)
    {
        return new MediaResponseDto
        {
            Id = media.Id,
            Url = media.Url,
            Type = media.Type.ToString(),
            CreatedAt = media.CreatedAt,
            VehicleId = media.VehicleId
        };
    }

    public async Task<(bool Success, string? Url, string? ErrorMessage, int? StatusCode)> UploadMediaAsync(
        IFormFile file, MediaType type, Guid vehicleId, string userId)
    {
        // Verify vehicle exists and belongs to user
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == vehicleId && v.UserId == userId);

        if (vehicle == null)
        {
            return (false, null, "Vehicle not found or access denied", StatusCodes.Status404NotFound);
        }

        // Validate file
        var validationResult = ValidateFile(file, type);
        if (!validationResult.IsValid)
        {
            return (false, null, validationResult.ErrorMessage, StatusCodes.Status400BadRequest);
        }

        // Create upload directory if it doesn't exist
        if (!Directory.Exists(MediaUploadPath))
        {
            Directory.CreateDirectory(MediaUploadPath);
        }

        // Generate unique filename
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(MediaUploadPath, fileName);

        // Save file to disk
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Generate URL
        var url = $"/uploads/media/{fileName}";

        // Create media record
        var media = new Media
        {
            Id = Guid.NewGuid(),
            Url = url,
            Type = type,
            VehicleId = vehicleId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        _context.Media.Add(media);
        await _context.SaveChangesAsync();

        return (true, url, null, null);
    }

    private static (bool IsValid, string? ErrorMessage) ValidateFile(IFormFile file, MediaType type)
    {
        if (file == null || file.Length == 0)
        {
            return (false, "No file provided");
        }

        // Check file size based on type
        var maxSize = type == MediaType.REPORT_DOCUMENT ? MaxDocumentSizeBytes : MaxImageSizeBytes;
        if (file.Length > maxSize)
        {
            var maxSizeMb = maxSize / (1024 * 1024);
            return (false, $"File size exceeds maximum allowed size of {maxSizeMb}MB");
        }

        // Check file extension based on type
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = type == MediaType.REPORT_DOCUMENT ? AllowedDocumentExtensions : AllowedImageExtensions;

        if (!allowedExtensions.Contains(fileExtension))
        {
            var allowedList = string.Join(", ", allowedExtensions);
            return (false, $"File type not allowed. Allowed types: {allowedList}");
        }

        // Validate content type matches extension
        var contentType = file.ContentType.ToLowerInvariant();
        var isValidContentType = type == MediaType.REPORT_DOCUMENT
            ? contentType.StartsWith("application/pdf") || contentType.StartsWith("application/msword") || contentType.StartsWith("application/vnd.openxmlformats")
            : contentType.StartsWith("image/");

        if (!isValidContentType)
        {
            return (false, "Invalid file content type");
        }

        return (true, null);
    }
}
