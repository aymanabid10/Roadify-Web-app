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
}
