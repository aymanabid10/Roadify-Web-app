using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using apiroot.Data;
using apiroot.Models;
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

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Vehicle {VehicleId} deleted by user {UserId}", id, userId);

        return NoContent();
    }

    private async Task<bool> VehicleExists(int id)
    {
        return await _context.Vehicles.AnyAsync(e => e.Id == id);
    }
}
