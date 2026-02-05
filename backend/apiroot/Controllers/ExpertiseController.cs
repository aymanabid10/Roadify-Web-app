using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using apiroot.DTOs;
using apiroot.Interfaces;

namespace apiroot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "EXPERT")]
public class ExpertiseController : ControllerBase
{
    private readonly IExpertiseService _expertiseService;
    private readonly ILogger<ExpertiseController> _logger;

    public ExpertiseController(IExpertiseService expertiseService, ILogger<ExpertiseController> logger)
    {
        _expertiseService = expertiseService;
        _logger = logger;
    }

    /// <summary>
    /// Create an expertise review for a listing (expert role required)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ExpertiseResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateExpertise([FromBody] CreateExpertiseRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var expertise = await _expertiseService.CreateExpertiseAsync(request, userId, cancellationToken);
            _logger.LogInformation("Expert {ExpertId} created expertise {ExpertiseId} for listing {ListingId}", 
                userId, expertise.Id, request.ListingId);
            return CreatedAtAction(nameof(GetExpertiseByListing), new { listingId = request.ListingId }, expertise);
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
    /// Get expertise review for a listing
    /// </summary>
    /// <remarks>
    /// Expertise details are private and only accessible to:
    /// - The listing owner
    /// - Users with ADMIN role
    /// - Users with EXPERT role
    /// Public users should view expertise summary via the listing details endpoint.
    /// </remarks>
    [HttpGet("listing/{listingId}")]
    [Authorize] // Changed from AllowAnonymous
    [ProducesResponseType(typeof(ExpertiseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetExpertiseByListing(Guid listingId, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var expertise = await _expertiseService.GetExpertiseByListingIdAsync(listingId, cancellationToken);
        
        if (expertise == null)
        {
            return NotFound(new { message = "Expertise not found for this listing" });
        }

        // Verify user has permission to view this expertise
        // Get the listing to check ownership
        var listingService = HttpContext.RequestServices.GetRequiredService<IListingService>();
        var listing = await listingService.GetListingByIdAsync(listingId, userId, cancellationToken);
        
        if (listing == null)
        {
            return StatusCode(StatusCodes.Status403Forbidden, 
                ErrorResponse.Error("You don't have permission to view this expertise", StatusCodes.Status403Forbidden));
        }

        return Ok(expertise);
    }

    /// <summary>
    /// Approve a listing (expert who created the expertise only)
    /// </summary>
    [HttpPost("{id}/approve")]
    [ProducesResponseType(typeof(ExpertiseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ApproveListing(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var expertise = await _expertiseService.ApproveListingAsync(id, userId, cancellationToken);
            _logger.LogInformation("Expert {ExpertId} approved listing via expertise {ExpertiseId}", userId, id);
            return Ok(expertise);
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
    /// Reject a listing with reason and feedback (expert who created the expertise only)
    /// </summary>
    [HttpPost("{id}/reject")]
    [ProducesResponseType(typeof(ExpertiseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RejectListing(Guid id, [FromBody] RejectExpertiseRequest? request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var expertise = await _expertiseService.RejectListingAsync(
                id, 
                userId, 
                request?.Reason, 
                request?.Feedback, 
                cancellationToken);
            _logger.LogInformation("Expert {ExpertId} rejected listing via expertise {ExpertiseId} with reason: {Reason}", 
                userId, id, request?.Reason);
            return Ok(expertise);
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
    /// Upload a document to an expertise report (expert who created the expertise only)
    /// </summary>
    [HttpPost("{id}/upload-document")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ExpertiseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UploadDocument(Guid id, [FromForm] ExpertiseDocumentUploadRequestDto dto, CancellationToken cancellationToken)
    {
        var file = dto.File;
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(ErrorResponse.Error("No file provided", StatusCodes.Status400BadRequest));
        }

        try
        {
            // First verify the expertise exists and get its vehicle ID
            var context = HttpContext.RequestServices.GetRequiredService<apiroot.Data.ApplicationDbContext>();
            var expertise = await context.Expertises
                .Include(e => e.Listing)
                    .ThenInclude(l => l.Vehicle)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (expertise == null)
            {
                return NotFound(ErrorResponse.Error("Expertise not found", StatusCodes.Status404NotFound));
            }

            if (expertise.ExpertId != userId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, 
                    ErrorResponse.Error("You can only upload documents to your own expertise reviews", StatusCodes.Status403Forbidden));
            }

            // Use MediaService to handle the file upload with the listing's vehicle ID
            var mediaService = HttpContext.RequestServices.GetRequiredService<IMediaService>();
            
            var (success, url, errorMessage, statusCode) = await mediaService.UploadMediaAsync(
                file, 
                Enums.MediaType.REPORT_DOCUMENT, 
                expertise.Listing.VehicleId, // Use the vehicle from the listing
                userId);

            if (!success || url == null)
            {
                return StatusCode(statusCode ?? StatusCodes.Status500InternalServerError, 
                    ErrorResponse.Error(errorMessage ?? "Failed to upload document", statusCode ?? StatusCodes.Status500InternalServerError));
            }

            var result = await _expertiseService.UploadDocumentAsync(id, userId, url, cancellationToken);
            _logger.LogInformation("Expert {ExpertId} uploaded document to expertise {ExpertiseId}", userId, id);
            return Ok(result);
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
