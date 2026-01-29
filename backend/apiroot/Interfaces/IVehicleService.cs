using apiroot.DTOs;
using Microsoft.AspNetCore.Http;

namespace apiroot.Interfaces;

public interface IVehicleService
{
    Task<object> GetVehicleOptionsAsync();
    Task<PaginatedResponse<VehicleResponseDto>> GetVehiclesAsync(
        string userId,
        string? brand,
        string? model,
        int? year,
        string? vehicleType,
        string? status,
        string? color,
        string? search,
        string sortBy,
        string sortOrder,
        int page,
        int pageSize);
    Task<VehicleResponseDto?> GetVehicleByIdAsync(Guid id, string userId);
    Task<(bool Success, VehicleResponseDto? Vehicle, string? ErrorMessage, int? StatusCode)> CreateVehicleAsync(CreateVehicleDto dto, string userId);
    Task<(bool Success, string? ErrorMessage, int? StatusCode)> UpdateVehicleAsync(Guid id, UpdateVehicleDto dto, string userId);
    Task<(bool Success, string? ErrorMessage)> DeleteVehicleAsync(Guid id, string userId);
    Task<(bool Success, List<string>? PhotoUrls, string? ErrorMessage, int? StatusCode)> UploadVehiclePhotosAsync(Guid id, List<IFormFile> photos, string userId);
    Task<(bool Success, string? ErrorMessage, int? StatusCode)> DeleteVehiclePhotoAsync(Guid id, string photoUrl, string userId);
}
