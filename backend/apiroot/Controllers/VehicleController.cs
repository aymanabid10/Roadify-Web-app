using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using apiroot.DTOs;
using apiroot.Interfaces;
using System.Security.Claims;

namespace apiroot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehicleController : ControllerBase
{
    private readonly IVehicleService _vehicleService;

    public VehicleController(IVehicleService vehicleService)
    {
        _vehicleService = vehicleService;
    }

    // GET: api/Vehicle/options
    [HttpGet("options")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetVehicleOptions()
    {
        var options = await _vehicleService.GetVehicleOptionsAsync();
        return Ok(options);
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

        var result = await _vehicleService.GetVehiclesAsync(
            userId, brand, model, year, vehicleType, status, color, search, sortBy, sortOrder, page, pageSize);

        return Ok(result);
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

        var vehicle = await _vehicleService.GetVehicleByIdAsync(id, userId);

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

        var (success, vehicle, errorMessage, statusCode) = await _vehicleService.CreateVehicleAsync(dto, userId);

        if (!success)
        {
            return statusCode switch
            {
                400 => BadRequest(new { message = errorMessage }),
                409 => Conflict(new { message = errorMessage }),
                _ => BadRequest(new { message = errorMessage })
            };
        }

        return CreatedAtAction(nameof(GetVehicle), new { id = vehicle!.Id }, vehicle);
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

        var (success, errorMessage, statusCode) = await _vehicleService.UpdateVehicleAsync(id, dto, userId);

        if (!success)
        {
            return statusCode switch
            {
                400 => BadRequest(new { message = errorMessage }),
                404 => NotFound(new { message = errorMessage }),
                409 => Conflict(new { message = errorMessage }),
                _ => BadRequest(new { message = errorMessage })
            };
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

        var (success, errorMessage) = await _vehicleService.DeleteVehicleAsync(id, userId);

        if (!success)
        {
            return NotFound(new { message = errorMessage });
        }

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

        var (success, photoUrls, errorMessage, statusCode) = await _vehicleService.UploadVehiclePhotosAsync(id, photos, userId);

        if (!success)
        {
            return statusCode switch
            {
                400 => BadRequest(new { message = errorMessage }),
                404 => NotFound(new { message = errorMessage }),
                _ => BadRequest(new { message = errorMessage })
            };
        }

        return Ok(new { message = $"Successfully uploaded {photoUrls!.Count} photo(s)", photoUrls });
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

        var (success, errorMessage, statusCode) = await _vehicleService.DeleteVehiclePhotoAsync(id, photoUrl, userId);

        if (!success)
        {
            return statusCode switch
            {
                400 => BadRequest(new { message = errorMessage }),
                404 => NotFound(new { message = errorMessage }),
                _ => BadRequest(new { message = errorMessage })
            };
        }

        return Ok(new { message = "Photo deleted successfully" });
    }
}
