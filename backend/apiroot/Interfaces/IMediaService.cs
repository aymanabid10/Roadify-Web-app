using apiroot.DTOs;
using apiroot.Enums;
using Microsoft.AspNetCore.Http;

namespace apiroot.Interfaces;

public interface IMediaService
{
    Task<(bool Success, Guid? MediaId, string? ErrorMessage, int? StatusCode)> CreateMediaAsync(
        string url, MediaType type, Guid vehicleId, string userId);

    Task<(bool Success, string? ErrorMessage)> SoftDeleteMediaAsync(Guid id, string userId);

    Task<List<MediaResponseDto>> GetMediaByVehicleIdAsync(Guid vehicleId, string userId, bool includeDeleted = false);

    Task<MediaResponseDto?> GetMediaByIdAsync(Guid id, string userId);

    Task<(bool Success, string? Url, string? ErrorMessage, int? StatusCode)> UploadMediaAsync(
        IFormFile file, MediaType type, Guid vehicleId, string userId);
}
