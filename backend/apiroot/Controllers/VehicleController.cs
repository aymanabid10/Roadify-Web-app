using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using apiroot.Data;
using apiroot.DTOs;
using apiroot.Models;
using apiroot.Validators;
using System.Security.Claims;

namespace apiroot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehicleController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<VehicleController> _logger;

    public VehicleController(ApplicationDbContext context, ILogger<VehicleController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/Vehicle/options
    [HttpGet("options")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<object> GetVehicleOptions()
    {
        return Ok(new
        {
            vehicleTypes = VehicleValidator.GetValidVehicleTypes(),
            statuses = VehicleValidator.GetValidStatuses()
        });
    }

    // GET: api/Vehicle
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedVehicleResponse<VehicleResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginatedVehicleResponse<VehicleResponseDto>>> GetVehicles(
        [FromQuery] string? brand = null,
        [FromQuery] string? model = null,
        [FromQuery] int? year = null,
        [FromQuery] string? vehicleType = null,
        [FromQuery] string? status = null,
        [FromQuery] string? color = null,
        [FromQuery] string? search = null,
        [FromQuery] string sortBy = "CreatedAt",
        [FromQuery] string sortOrder = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Validate pagination parameters
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100; // Max page size

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

        // Global search across multiple fields
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

        // Get total count before pagination
        var totalCount = await query.CountAsync();

        // Apply sorting
        query = sortBy.ToLower() switch
        {
            "brand" => sortOrder.ToLower() == "asc"
                ? query.OrderBy(v => v.Brand)
                : query.OrderByDescending(v => v.Brand),
            "model" => sortOrder.ToLower() == "asc"
                ? query.OrderBy(v => v.Model)
                : query.OrderByDescending(v => v.Model),
            "year" => sortOrder.ToLower() == "asc"
                ? query.OrderBy(v => v.Year)
                : query.OrderByDescending(v => v.Year),
            "registrationnumber" => sortOrder.ToLower() == "asc"
                ? query.OrderBy(v => v.RegistrationNumber)
                : query.OrderByDescending(v => v.RegistrationNumber),
            "vehicletype" => sortOrder.ToLower() == "asc"
                ? query.OrderBy(v => v.VehicleType)
                : query.OrderByDescending(v => v.VehicleType),
            "status" => sortOrder.ToLower() == "asc"
                ? query.OrderBy(v => v.Status)
                : query.OrderByDescending(v => v.Status),
            "mileage" => sortOrder.ToLower() == "asc"
                ? query.OrderBy(v => v.Mileage)
                : query.OrderByDescending(v => v.Mileage),
            "updatedat" => sortOrder.ToLower() == "asc"
                ? query.OrderBy(v => v.UpdatedAt)
                : query.OrderByDescending(v => v.UpdatedAt),
            _ => sortOrder.ToLower() == "asc"
                ? query.OrderBy(v => v.CreatedAt)
                : query.OrderByDescending(v => v.CreatedAt)
        };

        // Apply pagination
        var vehicles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new VehicleResponseDto
            {
                Id = v.Id,
                Brand = v.Brand,
                Model = v.Model,
                Year = v.Year,
                RegistrationNumber = v.RegistrationNumber,
                VehicleType = v.VehicleType,
                Description = v.Description,
                Status = v.Status,
                Mileage = v.Mileage,
                Color = v.Color,
                PhotoUrls = v.PhotoUrls,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            })
            .ToListAsync();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var response = new PaginatedVehicleResponse<VehicleResponseDto>
        {
            Data = vehicles,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPrevious = page > 1,
            HasNext = page < totalPages
        };

        return Ok(response);
    }

    // GET: api/Vehicle/5
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(VehicleResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehicleResponseDto>> GetVehicle(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var vehicle = await _context.Vehicles
            .Where(v => v.Id == id && v.UserId == userId)
            .Select(v => new VehicleResponseDto
            {
                Id = v.Id,
                Brand = v.Brand,
                Model = v.Model,
                Year = v.Year,
                RegistrationNumber = v.RegistrationNumber,
                VehicleType = v.VehicleType,
                Description = v.Description,
                Status = v.Status,
                Mileage = v.Mileage,
                Color = v.Color,
                PhotoUrls = v.PhotoUrls,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (vehicle == null)
        {
            return NotFound(new { message = "Vehicle not found" });
        }

        return Ok(vehicle);
    }

    // POST: api/Vehicle
    [HttpPost]
    [ProducesResponseType(typeof(VehicleResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<VehicleResponseDto>> CreateVehicle(CreateVehicleDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
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
            return BadRequest(new { errors = validationErrors });
        }

        // Check if registration number already exists
        var existingVehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.RegistrationNumber == dto.RegistrationNumber);

        if (existingVehicle != null)
        {
            return Conflict(new { message = "A vehicle with this registration number already exists" });
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

        var response = new VehicleResponseDto
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

        return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.Id }, response);
    }

    // PUT: api/Vehicle/5
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateVehicle(int id, UpdateVehicleDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var existingVehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);

        if (existingVehicle == null)
        {
            return NotFound(new { message = "Vehicle not found" });
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
            return BadRequest(new { errors = validationErrors });
        }

        // Check if registration number is being changed and if it already exists
        if (dto.RegistrationNumber != existingVehicle.RegistrationNumber)
        {
            var duplicateVehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.RegistrationNumber == dto.RegistrationNumber && v.Id != id);

            if (duplicateVehicle != null)
            {
                return Conflict(new { message = "A vehicle with this registration number already exists" });
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
            if (!await VehicleExists(id))
            {
                return NotFound(new { message = "Vehicle not found" });
            }
            throw;
        }

        return NoContent();
    }

    // DELETE: api/Vehicle/5
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteVehicle(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);

        if (vehicle == null)
        {
            return NotFound(new { message = "Vehicle not found" });
        }

        // Delete associated photos from file system
        foreach (var photoUrl in vehicle.PhotoUrls)
        {
            var photoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", photoUrl.TrimStart('/'));
            if (System.IO.File.Exists(photoPath))
            {
                System.IO.File.Delete(photoPath);
            }
        }

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Vehicle {VehicleId} deleted by user {UserId}", id, userId);

        return NoContent();
    }

    // POST: api/Vehicle/5/photos
    [HttpPost("{id}/photos")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UploadVehiclePhotos(int id, [FromForm] List<IFormFile> photos)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);

        if (vehicle == null)
        {
            return NotFound(new { message = "Vehicle not found" });
        }

        if (photos == null || photos.Count == 0)
        {
            return BadRequest(new { message = "No photos provided" });
        }

        // Validate file count (max 10 photos per vehicle)
        if (vehicle.PhotoUrls.Count + photos.Count > 10)
        {
            return BadRequest(new { message = $"Cannot upload more than 10 photos per vehicle. Current: {vehicle.PhotoUrls.Count}" });
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var maxFileSize = 5 * 1024 * 1024; // 5MB

        var uploadedUrls = new List<string>();
        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "vehicles");

        // Create directory if it doesn't exist
        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }

        foreach (var photo in photos)
        {
            // Validate file extension
            var extension = Path.GetExtension(photo.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = $"Invalid file type: {extension}. Allowed: {string.Join(", ", allowedExtensions)}" });
            }

            // Validate file size
            if (photo.Length > maxFileSize)
            {
                return BadRequest(new { message = $"File {photo.FileName} exceeds maximum size of 5MB" });
            }

            // Generate unique filename
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

        return Ok(new { message = $"Successfully uploaded {photos.Count} photo(s)", photoUrls = uploadedUrls });
    }

    // DELETE: api/Vehicle/5/photos
    [HttpDelete("{id}/photos")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteVehiclePhoto(int id, [FromQuery] string photoUrl)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);

        if (vehicle == null)
        {
            return NotFound(new { message = "Vehicle not found" });
        }

        if (string.IsNullOrWhiteSpace(photoUrl))
        {
            return BadRequest(new { message = "Photo URL is required" });
        }

        if (!vehicle.PhotoUrls.Contains(photoUrl))
        {
            return NotFound(new { message = "Photo not found for this vehicle" });
        }

        // Delete file from file system
        var photoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", photoUrl.TrimStart('/'));
        if (System.IO.File.Exists(photoPath))
        {
            System.IO.File.Delete(photoPath);
        }

        vehicle.PhotoUrls.Remove(photoUrl);
        vehicle.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted photo {PhotoUrl} from vehicle {VehicleId} by user {UserId}", photoUrl, id, userId);

        return Ok(new { message = "Photo deleted successfully" });
    }

    private async Task<bool> VehicleExists(int id)
    {
        return await _context.Vehicles.AnyAsync(e => e.Id == id);
    }
}
