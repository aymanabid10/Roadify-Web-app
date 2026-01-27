using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using apiroot.DTOs;
using apiroot.Interfaces;
using apiroot.Models;

namespace apiroot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ListingController : ControllerBase
{
    private readonly IListingService _listingService;
    private readonly ILogger<ListingController> _logger;

    public ListingController(IListingService listingService, ILogger<ListingController> logger)
    {
        _listingService = listingService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new listing
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ListingResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateListing([FromBody] CreateListingRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var listing = await _listingService.CreateListingAsync(request, userId, cancellationToken);
            _logger.LogInformation("User {UserId} created listing {ListingId}", userId, listing.Id);
            return CreatedAtAction(nameof(GetListing), new { id = listing.Id }, listing);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ErrorResponse.Error(ex.Message, StatusCodes.Status400BadRequest));
        }
    }

    /// <summary>
    /// Get a listing by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ListingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetListing(Guid id, CancellationToken cancellationToken)
    {
        var listing = await _listingService.GetListingByIdAsync(id, cancellationToken);
        
        if (listing == null)
        {
            return NotFound(new { message = "Listing not found" });
        }

        return Ok(listing);
    }

    /// <summary>
    /// Get all listings with filtering and pagination
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PaginatedResponse<ListingResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetListings([FromQuery] ListingFilterRequest filter, CancellationToken cancellationToken)
    {
        var result = await _listingService.GetListingsAsync(filter, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Update a listing (owner only, DRAFT status only)
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ListingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateListing(Guid id, [FromBody] UpdateListingRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var listing = await _listingService.UpdateListingAsync(id, request, userId, cancellationToken);
            _logger.LogInformation("User {UserId} updated listing {ListingId}", userId, id);
            return Ok(listing);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ErrorResponse.Error(ex.Message, StatusCodes.Status400BadRequest));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ErrorResponse.Error(ex.Message, StatusCodes.Status403Forbidden));
        }
    }

    /// <summary>
    /// Delete a listing (owner only)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteListing(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            await _listingService.DeleteListingAsync(id, userId, cancellationToken);
            _logger.LogInformation("User {UserId} deleted listing {ListingId}", userId, id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ErrorResponse.Error(ex.Message, StatusCodes.Status404NotFound));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ErrorResponse.Error(ex.Message, StatusCodes.Status403Forbidden));
        }
    }

    /// <summary>
    /// Submit a listing for expert review (owner only)
    /// </summary>
    [HttpPost("{id}/submit")]
    [ProducesResponseType(typeof(ListingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SubmitForReview(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var listing = await _listingService.SubmitForReviewAsync(id, userId, cancellationToken);
            _logger.LogInformation("User {UserId} submitted listing {ListingId} for review", userId, id);
            return Ok(listing);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ErrorResponse.Error(ex.Message, StatusCodes.Status400BadRequest));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ErrorResponse.Error(ex.Message, StatusCodes.Status403Forbidden));
        }
    }

    /// <summary>
    /// Publish a listing (admin only)
    /// </summary>
    [HttpPost("{id}/publish")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(ListingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PublishListing(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var listing = await _listingService.PublishListingAsync(id, cancellationToken);
            _logger.LogInformation("Admin published listing {ListingId}", id);
            return Ok(listing);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ErrorResponse.Error(ex.Message, StatusCodes.Status400BadRequest));
        }
    }

    /// <summary>
    /// Archive a listing (owner or admin)
    /// </summary>
    [HttpPost("{id}/archive")]
    [ProducesResponseType(typeof(ListingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ArchiveListing(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var listing = await _listingService.ArchiveListingAsync(id, userId, cancellationToken);
            _logger.LogInformation("User {UserId} archived listing {ListingId}", userId, id);
            return Ok(listing);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ErrorResponse.Error(ex.Message, StatusCodes.Status400BadRequest));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ErrorResponse.Error(ex.Message, StatusCodes.Status403Forbidden));
        }
    }
}
