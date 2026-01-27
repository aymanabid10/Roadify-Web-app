using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using apiroot.DTOs;
using apiroot.Interfaces;
using System.Security.Claims;

namespace apiroot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly IMediaService _mediaService;
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    public MediaController(IMediaService mediaService)
    {
        _mediaService = mediaService;
    }

    // GET: api/Media/{id}
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MediaResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MediaResponseDto>> GetMedia(Guid id)
    {
        var media = await _mediaService.GetMediaByIdAsync(id, UserId);

        if (media == null)
        {
            return NotFound(new { message = "Media not found or access denied" });
        }

        return Ok(media);
    }

    // GET: api/Media/vehicle/{vehicleId}
    [HttpGet("vehicle/{vehicleId}")]
    [ProducesResponseType(typeof(List<MediaResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<MediaResponseDto>>> GetMediaByVehicle(
        Guid vehicleId,
        [FromQuery] bool includeDeleted = false)
    {
        var mediaList = await _mediaService.GetMediaByVehicleIdAsync(vehicleId, UserId, includeDeleted);
        return Ok(mediaList);
    }

    // POST: api/Media/upload
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UploadMedia([FromForm] CreateMediaDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _mediaService.UploadMediaAsync(dto.File, dto.Type, dto.VehicleId, UserId);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode ?? StatusCodes.Status400BadRequest,
                new { message = result.ErrorMessage });
        }

        return Created(result.Url!, new { url = result.Url });
    }

    // PUT: api/Media/{id}
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMedia(Guid id, UpdateMediaDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _mediaService.UpdateMediaAsync(id, dto, UserId);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode ?? StatusCodes.Status400BadRequest,
                new { message = result.ErrorMessage });
        }

        return NoContent();
    }

    // DELETE: api/Media/{id}
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMedia(Guid id)
    {
        var result = await _mediaService.SoftDeleteMediaAsync(id, UserId);

        if (!result.Success)
        {
            return NotFound(new { message = result.ErrorMessage });
        }

        return NoContent();
    }
}
