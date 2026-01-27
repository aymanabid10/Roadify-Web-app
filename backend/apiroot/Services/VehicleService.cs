using apiroot.Data;
using apiroot.DTOs;
using apiroot.Interfaces;
using apiroot.Models;
using apiroot.Validators;
using Microsoft.EntityFrameworkCore;

namespace apiroot.Services;

public class VehicleService : IVehicleService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<VehicleService> _logger;

    private const int DefaultPage = 1;
    private const int DefaultPageSize = 10;
    private const int MaxPageSize = 100;
    private const int MaxPhotosPerVehicle = 10;
    private const int MaxPhotoSizeBytes = 5 * 1024 * 1024; // 5MB
    private static readonly string[] AllowedPhotoExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private static readonly string PhotoUploadPath = Path.Combine("wwwroot", "uploads", "vehicles");

    public VehicleService(ApplicationDbContext context, ILogger<VehicleService> logger)
    {
        _context = context;
        _logger = logger;
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

    public async Task<VehicleResponseDto?> GetVehicleByIdAsync(Guid id, string userId)
    {
        var vehicle = await GetVehicleByIdAndUserAsync(id, userId);
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

        // Delete associated photos from file system
        foreach (var photoUrl in vehicle.PhotoUrls)
        {
            var photoPath = GetPhotoPath(photoUrl);
            if (File.Exists(photoPath))
            {
                File.Delete(photoPath);
            }
        }

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Vehicle {VehicleId} deleted by user {UserId}", id, userId);

        return (true, null);
    }

    public async Task<(bool Success, List<string>? PhotoUrls, string? ErrorMessage, int? StatusCode)> UploadVehiclePhotosAsync(
        Guid id, List<IFormFile> photos, string userId)
    {
        var vehicle = await GetVehicleByIdAndUserAsync(id, userId);

        if (vehicle == null)
        {
            return (false, null, "Vehicle not found", 404);
        }

        if (photos == null || photos.Count == 0)
        {
            return (false, null, "No photos provided", 400);
        }

        // Validate photo count
        if (vehicle.PhotoUrls.Count + photos.Count > MaxPhotosPerVehicle)
        {
            return (false, null, $"Cannot upload more than {MaxPhotosPerVehicle} photos per vehicle. Current: {vehicle.PhotoUrls.Count}", 400);
        }

        var uploadedUrls = new List<string>();
        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), PhotoUploadPath);

        // Create directory if needed
        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }

        foreach (var photo in photos)
        {
            // Validate photo
            var validationError = ValidatePhoto(photo);
            if (validationError != null)
            {
                return (false, null, validationError, 400);
            }

            // Generate unique filename
            var extension = Path.GetExtension(photo.FileName).ToLowerInvariant();
            var fileName = $"{id}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await photo.CopyToAsync(stream);
            }

            var photoUrl = $"/uploads/vehicles/{fileName}";
            uploadedUrls.Add(photoUrl);
            vehicle.PhotoUrls.Add(photoUrl);
        }

        vehicle.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Uploaded {Count} photos for vehicle {VehicleId} by user {UserId}", photos.Count, id, userId);

        return (true, uploadedUrls, null, null);
    }

    public async Task<(bool Success, string? ErrorMessage, int? StatusCode)> DeleteVehiclePhotoAsync(
        Guid id, string photoUrl, string userId)
    {
        var vehicle = await GetVehicleByIdAndUserAsync(id, userId);

        if (vehicle == null)
        {
            return (false, "Vehicle not found", 404);
        }

        if (string.IsNullOrWhiteSpace(photoUrl))
        {
            return (false, "Photo URL is required", 400);
        }

        if (!vehicle.PhotoUrls.Contains(photoUrl))
        {
            return (false, "Photo not found for this vehicle", 404);
        }

        // Delete file from file system
        var photoPath = GetPhotoPath(photoUrl);
        if (File.Exists(photoPath))
        {
            File.Delete(photoPath);
        }

        vehicle.PhotoUrls.Remove(photoUrl);
        vehicle.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted photo {PhotoUrl} from vehicle {VehicleId} by user {UserId}", photoUrl, id, userId);

        return (true, null, null);
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

    private static string GetPhotoPath(string photoUrl)
    {
        return Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", photoUrl.TrimStart('/'));
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

    private static string? ValidatePhoto(IFormFile photo)
    {
        // Validate extension
        var extension = Path.GetExtension(photo.FileName).ToLowerInvariant();
        if (!AllowedPhotoExtensions.Contains(extension))
        {
            return $"Invalid file type: {extension}. Allowed: {string.Join(", ", AllowedPhotoExtensions)}";
        }

        // Validate size
        if (photo.Length > MaxPhotoSizeBytes)
        {
            return $"File {photo.FileName} exceeds maximum size of 5MB";
        }

        return null;
    }
}
