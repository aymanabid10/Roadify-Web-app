using apiroot.Data;
using apiroot.DTOs;
using apiroot.Enums;
using apiroot.Interfaces;
using apiroot.Models;
using apiroot.Validators;
using Microsoft.EntityFrameworkCore;

namespace apiroot.Services;

public class VehicleService : IVehicleService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<VehicleService> _logger;
    private readonly IMediaService _mediaService;

    private const int DefaultPage = 1;
    private const int DefaultPageSize = 10;
    private const int MaxPageSize = 100;
    private const int MaxPhotosPerVehicle = 10;

    public VehicleService(ApplicationDbContext context, ILogger<VehicleService> logger, IMediaService mediaService)
    {
        _context = context;
        _logger = logger;
        _mediaService = mediaService;
    }

    public Task<object> GetVehicleOptionsAsync()
    {
        var options = new
        {
            vehicleTypes = VehicleValidator.GetValidVehicleTypes(),
            statuses = VehicleValidator.GetValidStatuses()
        };
        return Task.FromResult<object>(options);
    }

    public async Task<PaginatedResponse<VehicleResponseDto>> GetVehiclesAsync(
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
        int pageSize)
    {
        // Validate pagination parameters
        if (page < 1) page = DefaultPage;
        if (pageSize < 1) pageSize = DefaultPageSize;
        if (pageSize > MaxPageSize) pageSize = MaxPageSize;

        var query = _context.Vehicles.Where(v => v.UserId == userId);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(brand))
        {
            query = query.Where(v => v.Brand.ToLower().Contains(brand.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(model))
        {
            query = query.Where(v => v.Model.ToLower().Contains(model.ToLower()));
        }

        if (year.HasValue)
        {
            query = query.Where(v => v.Year == year.Value);
        }

        if (!string.IsNullOrWhiteSpace(vehicleType))
        {
            query = query.Where(v => v.VehicleType == vehicleType);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(v => v.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            query = query.Where(v => v.Color != null && v.Color.ToLower().Contains(color.ToLower()));
        }

        // Global search
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(v =>
                v.Brand.ToLower().Contains(search) ||
                v.Model.ToLower().Contains(search) ||
                v.RegistrationNumber.ToLower().Contains(search) ||
                (v.Description != null && v.Description.ToLower().Contains(search)) ||
                (v.Color != null && v.Color.ToLower().Contains(search))
            );
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply sorting
        query = ApplySorting(query, sortBy, sortOrder);

        // Apply pagination
        var vehicles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PaginatedResponse<VehicleResponseDto>
        {
            Data = vehicles.Select(MapToDto).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPrevious = page > 1,
            HasNext = page < totalPages
        };
    }

    // Admin method to get ALL vehicles (no user filter)
    public async Task<PaginatedResponse<VehicleResponseDto>> GetAllVehiclesAsync(
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
        int pageSize)
    {
        // Validate pagination parameters
        if (page < 1) page = DefaultPage;
        if (pageSize < 1) pageSize = DefaultPageSize;
        if (pageSize > MaxPageSize) pageSize = MaxPageSize;

        var query = _context.Vehicles.AsQueryable(); // No userId filter for admin

        // Apply filters
        if (!string.IsNullOrWhiteSpace(brand))
        {
            query = query.Where(v => v.Brand.ToLower().Contains(brand.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(model))
        {
            query = query.Where(v => v.Model.ToLower().Contains(model.ToLower()));
        }

        if (year.HasValue)
        {
            query = query.Where(v => v.Year == year.Value);
        }

        if (!string.IsNullOrWhiteSpace(vehicleType))
        {
            query = query.Where(v => v.VehicleType == vehicleType);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(v => v.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            query = query.Where(v => v.Color != null && v.Color.ToLower().Contains(color.ToLower()));
        }

        // Global search
        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(v =>
                v.Brand.ToLower().Contains(search) ||
                v.Model.ToLower().Contains(search) ||
                v.RegistrationNumber.ToLower().Contains(search) ||
                (v.Description != null && v.Description.ToLower().Contains(search)) ||
                (v.Color != null && v.Color.ToLower().Contains(search))
            );
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply sorting
        query = ApplySorting(query, sortBy, sortOrder);

        // Apply pagination
        var vehicles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PaginatedResponse<VehicleResponseDto>
        {
            Data = vehicles.Select(MapToDto).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPrevious = page > 1,
            HasNext = page < totalPages
        };
    }

    public async Task<VehicleResponseDto?> GetVehicleByIdAsync(Guid id, string? userId)
    {
        Vehicle? vehicle;
        
        if (string.IsNullOrEmpty(userId))
        {
            // Public access - get vehicle without user check
            vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id);
        }
        else
        {
            // User-specific access - verify ownership
            vehicle = await GetVehicleByIdAndUserAsync(id, userId);
        }
        
        return vehicle == null ? null : MapToDto(vehicle);
    }

    public async Task<(bool Success, VehicleResponseDto? Vehicle, string? ErrorMessage, int? StatusCode)> CreateVehicleAsync(
        CreateVehicleDto dto, string userId)
    {
        // Business validation
        var validationErrors = VehicleValidator.ValidateVehicle(
            dto.Year,
            dto.RegistrationNumber,
            dto.VehicleType,
            dto.Status,
            dto.Mileage
        );

        if (validationErrors.Any())
        {
            return (false, null, string.Join(", ", validationErrors), 400);
        }

        // Check for duplicate registration number
        var existingVehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.RegistrationNumber == dto.RegistrationNumber);

        if (existingVehicle != null)
        {
            return (false, null, "A vehicle with this registration number already exists", 409);
        }

        var vehicle = new Vehicle
        {
            Brand = dto.Brand,
            Model = dto.Model,
            Year = dto.Year,
            RegistrationNumber = dto.RegistrationNumber,
            VehicleType = dto.VehicleType,
            Description = dto.Description,
            Status = dto.Status,
            Mileage = dto.Mileage,
            Color = dto.Color,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Vehicle created with ID {VehicleId} by user {UserId}", vehicle.Id, userId);

        return (true, MapToDto(vehicle), null, null);
    }

    public async Task<(bool Success, string? ErrorMessage, int? StatusCode)> UpdateVehicleAsync(
        Guid id, UpdateVehicleDto dto, string userId)
    {
        var existingVehicle = await GetVehicleByIdAndUserAsync(id, userId);

        if (existingVehicle == null)
        {
            return (false, "Vehicle not found", 404);
        }

        // Business validation
        var validationErrors = VehicleValidator.ValidateVehicle(
            dto.Year,
            dto.RegistrationNumber,
            dto.VehicleType,
            dto.Status,
            dto.Mileage
        );

        if (validationErrors.Any())
        {
            return (false, string.Join(", ", validationErrors), 400);
        }

        // Check for duplicate registration number
        if (dto.RegistrationNumber != existingVehicle.RegistrationNumber)
        {
            var duplicateVehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.RegistrationNumber == dto.RegistrationNumber && v.Id != id);

            if (duplicateVehicle != null)
            {
                return (false, "A vehicle with this registration number already exists", 409);
            }
        }

        existingVehicle.Brand = dto.Brand;
        existingVehicle.Model = dto.Model;
        existingVehicle.Year = dto.Year;
        existingVehicle.RegistrationNumber = dto.RegistrationNumber;
        existingVehicle.VehicleType = dto.VehicleType;
        existingVehicle.Description = dto.Description;
        existingVehicle.Status = dto.Status;
        existingVehicle.Mileage = dto.Mileage;
        existingVehicle.Color = dto.Color;
        existingVehicle.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Vehicle {VehicleId} updated by user {UserId}", id, userId);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await VehicleExistsAsync(id))
            {
                return (false, "Vehicle not found", 404);
            }
            throw;
        }

        return (true, null, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteVehicleAsync(Guid id, string userId)
    {
        var vehicle = await GetVehicleByIdAndUserAsync(id, userId);

        if (vehicle == null)
        {
            return (false, "Vehicle not found");
        }

        // Delete associated photos from file system using MediaService
        foreach (var photoUrl in vehicle.PhotoUrls)
        {
            await _mediaService.DeleteFileAsync(photoUrl);
        }

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Vehicle {VehicleId} deleted by user {UserId}", id, userId);

        return (true, null);
    }

    public async Task<(bool Success, List<string>? PhotoUrls, string? ErrorMessage, int? StatusCode)> UploadVehiclePhotosAsync(
        Guid id, List<IFormFile> photos, string userId)
    {
        // Authorization: verify user owns the vehicle
        var vehicle = await GetVehicleByIdAndUserAsync(id, userId);
        if (vehicle == null)
        {
            return (false, null, "Vehicle not found", 404);
        }

        // Business validation
        if (photos == null || photos.Count == 0)
        {
            return (false, null, "No photos provided", 400);
        }

        if (vehicle.PhotoUrls.Count + photos.Count > MaxPhotosPerVehicle)
        {
            return (false, null, $"Cannot upload more than {MaxPhotosPerVehicle} photos per vehicle. Current: {vehicle.PhotoUrls.Count}", 400);
        }

        var uploadedUrls = new List<string>();

        try
        {
            // Delegate file storage to MediaService
            foreach (var photo in photos)
            {
                if (photo.Length == 0) continue;

                var photoUrl = await _mediaService.UploadFileAsync(photo, MediaType.PHOTO);
                uploadedUrls.Add(photoUrl);
                vehicle.PhotoUrls.Add(photoUrl);
            }

            // Database operations stay in VehicleService
            vehicle.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Uploaded {Count} photos for vehicle {VehicleId} by user {UserId}", photos.Count, id, userId);

            return (true, uploadedUrls, null, null);
        }
        catch (InvalidOperationException ex)
        {
            // Clean up uploaded files on error
            foreach (var url in uploadedUrls)
            {
                await _mediaService.DeleteFileAsync(url);
            }
            return (false, null, ex.Message, 400);
        }
        catch (Exception ex)
        {
            // Clean up uploaded files on error
            foreach (var url in uploadedUrls)
            {
                await _mediaService.DeleteFileAsync(url);
            }
            _logger.LogError(ex, "Error uploading photos for vehicle {VehicleId}", id);
            return (false, null, "An error occurred while uploading photos", 500);
        }
    }

    public async Task<(bool Success, string? ErrorMessage, int? StatusCode)> DeleteVehiclePhotoAsync(
        Guid id, string photoUrl, string userId)
    {
        // Authorization: verify user owns the vehicle
        var vehicle = await GetVehicleByIdAndUserAsync(id, userId);
        if (vehicle == null)
        {
            return (false, "Vehicle not found", 404);
        }

        // Business validation
        if (string.IsNullOrWhiteSpace(photoUrl))
        {
            return (false, "Photo URL is required", 400);
        }

        if (!vehicle.PhotoUrls.Contains(photoUrl))
        {
            return (false, "Photo not found for this vehicle", 404);
        }

        // Delegate file deletion to MediaService
        await _mediaService.DeleteFileAsync(photoUrl);

        // Database operations stay in VehicleService
        vehicle.PhotoUrls.Remove(photoUrl);
        vehicle.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted photo {PhotoUrl} from vehicle {VehicleId} by user {UserId}", photoUrl, id, userId);

        return (true, null, null);
    }

    public async Task<(bool Success, string? NewPhotoUrl, string? ErrorMessage, int? StatusCode)> UpdateVehiclePhotoAsync(
        Guid id, string oldPhotoUrl, IFormFile newPhoto, string userId)
    {
        // Authorization: verify user owns the vehicle
        var vehicle = await GetVehicleByIdAndUserAsync(id, userId);
        if (vehicle == null)
        {
            return (false, null, "Vehicle not found", 404);
        }

        // Business validation
        if (string.IsNullOrWhiteSpace(oldPhotoUrl))
        {
            return (false, null, "Old photo URL is required", 400);
        }

        if (!vehicle.PhotoUrls.Contains(oldPhotoUrl))
        {
            return (false, null, "Old photo not found for this vehicle", 404);
        }

        if (newPhoto == null || newPhoto.Length == 0)
        {
            return (false, null, "New photo file is required", 400);
        }

        string? newPhotoUrl = null;
        try
        {
            // Upload new photo first
            newPhotoUrl = await _mediaService.UploadFileAsync(newPhoto, MediaType.PHOTO);

            // Delete old photo
            await _mediaService.DeleteFileAsync(oldPhotoUrl);

            // Update database - replace old URL with new URL
            var index = vehicle.PhotoUrls.IndexOf(oldPhotoUrl);
            vehicle.PhotoUrls[index] = newPhotoUrl;
            vehicle.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated photo from {OldUrl} to {NewUrl} for vehicle {VehicleId} by user {UserId}", 
                oldPhotoUrl, newPhotoUrl, id, userId);

            return (true, newPhotoUrl, null, null);
        }
        catch (InvalidOperationException ex)
        {
            // Clean up new photo if it was uploaded
            if (newPhotoUrl != null)
            {
                await _mediaService.DeleteFileAsync(newPhotoUrl);
            }
            return (false, null, ex.Message, 400);
        }
        catch (Exception ex)
        {
            // Clean up new photo if it was uploaded
            if (newPhotoUrl != null)
            {
                await _mediaService.DeleteFileAsync(newPhotoUrl);
            }
            _logger.LogError(ex, "Error updating photo for vehicle {VehicleId}", id);
            return (false, null, "An error occurred while updating photo", 500);
        }
    }

    private async Task<bool> VehicleExistsAsync(Guid id)
    {
        return await _context.Vehicles.AnyAsync(e => e.Id == id);
    }

    private static VehicleResponseDto MapToDto(Vehicle vehicle)
    {
        return new VehicleResponseDto
        {
            Id = vehicle.Id,
            Brand = vehicle.Brand,
            Model = vehicle.Model,
            Year = vehicle.Year,
            RegistrationNumber = vehicle.RegistrationNumber,
            VehicleType = vehicle.VehicleType,
            Description = vehicle.Description,
            Status = vehicle.Status,
            Mileage = vehicle.Mileage,
            Color = vehicle.Color,
            PhotoUrls = vehicle.PhotoUrls,
            CreatedAt = vehicle.CreatedAt,
            UpdatedAt = vehicle.UpdatedAt
        };
    }

    private async Task<Vehicle?> GetVehicleByIdAndUserAsync(Guid id, string userId)
    {
        return await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
    }



    private static IQueryable<Vehicle> ApplySorting(IQueryable<Vehicle> query, string sortBy, string sortOrder)
    {
        var isAscending = sortOrder.ToLower() == "asc";

        return sortBy.ToLower() switch
        {
            "brand" => isAscending ? query.OrderBy(v => v.Brand) : query.OrderByDescending(v => v.Brand),
            "model" => isAscending ? query.OrderBy(v => v.Model) : query.OrderByDescending(v => v.Model),
            "year" => isAscending ? query.OrderBy(v => v.Year) : query.OrderByDescending(v => v.Year),
            "registrationnumber" => isAscending ? query.OrderBy(v => v.RegistrationNumber) : query.OrderByDescending(v => v.RegistrationNumber),
            "vehicletype" => isAscending ? query.OrderBy(v => v.VehicleType) : query.OrderByDescending(v => v.VehicleType),
            "status" => isAscending ? query.OrderBy(v => v.Status) : query.OrderByDescending(v => v.Status),
            "mileage" => isAscending ? query.OrderBy(v => v.Mileage) : query.OrderByDescending(v => v.Mileage),
            "updatedat" => isAscending ? query.OrderBy(v => v.UpdatedAt) : query.OrderByDescending(v => v.UpdatedAt),
            _ => isAscending ? query.OrderBy(v => v.CreatedAt) : query.OrderByDescending(v => v.CreatedAt)
        };
    }
}

