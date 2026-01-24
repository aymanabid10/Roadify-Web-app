using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using apiroot.Data;
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
    public async Task<ActionResult<IEnumerable<Vehicle>>> GetVehicles()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var vehicles = await _context.Vehicles
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();

        return Ok(vehicles);
    }

    // GET: api/Vehicle/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Vehicle>> GetVehicle(int id)
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

        return Ok(vehicle);
    }

    // POST: api/Vehicle
    [HttpPost]
    public async Task<ActionResult<Vehicle>> CreateVehicle(Vehicle vehicle)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Business validation
        var validationErrors = VehicleValidator.ValidateVehicle(
            vehicle.Year,
            vehicle.RegistrationNumber,
            vehicle.VehicleType,
            vehicle.Status,
            vehicle.Mileage
        );

        if (validationErrors.Any())
        {
            return BadRequest(new { errors = validationErrors });
        }

        // Check if registration number already exists
        var existingVehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.RegistrationNumber == vehicle.RegistrationNumber);

        if (existingVehicle != null)
        {
            return Conflict(new { message = "A vehicle with this registration number already exists" });
        }

        vehicle.UserId = userId;
        vehicle.CreatedAt = DateTime.UtcNow;
        vehicle.UpdatedAt = null;

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Vehicle created with ID {VehicleId} by user {UserId}", vehicle.Id, userId);

        return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.Id }, vehicle);
    }

    // PUT: api/Vehicle/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVehicle(int id, Vehicle vehicle)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (id != vehicle.Id)
        {
            return BadRequest(new { message = "ID mismatch" });
        }

        var existingVehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);

        if (existingVehicle == null)
        {
            return NotFound(new { message = "Vehicle not found" });
        }

        // Business validation
        var validationErrors = VehicleValidator.ValidateVehicle(
            vehicle.Year,
            vehicle.RegistrationNumber,
            vehicle.VehicleType,
            vehicle.Status,
            vehicle.Mileage
        );

        if (validationErrors.Any())
        {
            return BadRequest(new { errors = validationErrors });
        }

        // Check if registration number is being changed and if it already exists
        if (vehicle.RegistrationNumber != existingVehicle.RegistrationNumber)
        {
            var duplicateVehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.RegistrationNumber == vehicle.RegistrationNumber && v.Id != id);

            if (duplicateVehicle != null)
            {
                return Conflict(new { message = "A vehicle with this registration number already exists" });
            }
        }

        existingVehicle.Brand = vehicle.Brand;
        existingVehicle.Model = vehicle.Model;
        existingVehicle.Year = vehicle.Year;
        existingVehicle.RegistrationNumber = vehicle.RegistrationNumber;
        existingVehicle.VehicleType = vehicle.VehicleType;
        existingVehicle.Description = vehicle.Description;
        existingVehicle.Status = vehicle.Status;
        existingVehicle.Mileage = vehicle.Mileage;
        existingVehicle.Color = vehicle.Color;
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
