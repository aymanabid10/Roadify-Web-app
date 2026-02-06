using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using apiroot.DTOs;
using apiroot.Enums;
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
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (dto.File == null || dto.File.Length == 0)
        {
            return BadRequest(ErrorResponse.Error("No file provided", StatusCodes.Status400BadRequest));
        }

        try
        {
            // Get expertise and verify ownership
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

            // Use generic MediaService for file storage
            var mediaService = HttpContext.RequestServices.GetRequiredService<IMediaService>();
            var url = await mediaService.UploadFileAsync(dto.File, MediaType.DOCUMENT);

            // Update expertise with document URL
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

    /// <summary>
    /// Update/replace the document for an expertise report (expert who created the expertise only)
    /// </summary>
    [HttpPut("{id}/document")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ExpertiseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDocument(Guid id, [FromForm] ExpertiseDocumentUploadRequestDto dto, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (dto.File == null || dto.File.Length == 0)
        {
            return BadRequest(ErrorResponse.Error("No file provided", StatusCodes.Status400BadRequest));
        }

        string? newDocumentUrl = null;
        string? oldDocumentUrl = null;

        try
        {
            // Get expertise and verify ownership
            var context = HttpContext.RequestServices.GetRequiredService<apiroot.Data.ApplicationDbContext>();
            var expertise = await context.Expertises
                .Include(e => e.Listing)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (expertise == null)
            {
                return NotFound(ErrorResponse.Error("Expertise not found", StatusCodes.Status404NotFound));
            }

            if (expertise.ExpertId != userId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, 
                    ErrorResponse.Error("You can only update documents for your own expertise reviews", StatusCodes.Status403Forbidden));
            }

            oldDocumentUrl = expertise.DocumentUrl;

            // Use generic MediaService for file storage
            var mediaService = HttpContext.RequestServices.GetRequiredService<IMediaService>();
            
            // Upload new document first
            newDocumentUrl = await mediaService.UploadFileAsync(dto.File, MediaType.DOCUMENT);

            // Delete old document if exists
            if (!string.IsNullOrEmpty(oldDocumentUrl))
            {
                await mediaService.DeleteFileAsync(oldDocumentUrl);
            }

            // Update expertise with new document URL
            var result = await _expertiseService.UpdateDocumentAsync(id, userId, newDocumentUrl, cancellationToken);
            _logger.LogInformation("Expert {ExpertId} updated document for expertise {ExpertiseId} from {OldUrl} to {NewUrl}", 
                userId, id, oldDocumentUrl, newDocumentUrl);
            
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            // Clean up new document if it was uploaded
            if (newDocumentUrl != null)
            {
                var mediaService = HttpContext.RequestServices.GetRequiredService<IMediaService>();
                await mediaService.DeleteFileAsync(newDocumentUrl);
            }
            return BadRequest(ErrorResponse.Error(ex.Message, StatusCodes.Status400BadRequest));
        }
        catch (UnauthorizedAccessException ex)
        {
            // Clean up new document if it was uploaded
            if (newDocumentUrl != null)
            {
                var mediaService = HttpContext.RequestServices.GetRequiredService<IMediaService>();
                await mediaService.DeleteFileAsync(newDocumentUrl);
            }
            return StatusCode(StatusCodes.Status403Forbidden, ErrorResponse.Error(ex.Message, StatusCodes.Status403Forbidden));
        }
        catch (Exception ex)
        {
            // Clean up new document if it was uploaded
            if (newDocumentUrl != null)
            {
                var mediaService = HttpContext.RequestServices.GetRequiredService<IMediaService>();
                await mediaService.DeleteFileAsync(newDocumentUrl);
            }
            _logger.LogError(ex, "Error updating document for expertise {ExpertiseId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ErrorResponse.Error("An error occurred while updating the document", StatusCodes.Status500InternalServerError));
        }
    }

    /// <summary>
    /// Delete an expertise document (expert who created the expertise only)
    /// </summary>
    [HttpDelete("{id}/document")]
    [ProducesResponseType(typeof(ExpertiseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        string? oldDocumentUrl = null;

        try
        {
            // Get expertise to store document URL before deletion
            var context = HttpContext.RequestServices.GetRequiredService<apiroot.Data.ApplicationDbContext>();
            var expertise = await context.Expertises.FindAsync(new object[] { id }, cancellationToken);

            if (expertise == null)
            {
                return NotFound(ErrorResponse.Error("Expertise not found", StatusCodes.Status404NotFound));
            }

            oldDocumentUrl = expertise.DocumentUrl;

            // Delete from database
            var result = await _expertiseService.DeleteDocumentAsync(id, userId, cancellationToken);

            // Delete physical file if exists
            if (!string.IsNullOrEmpty(oldDocumentUrl))
            {
                var mediaService = HttpContext.RequestServices.GetRequiredService<IMediaService>();
                await mediaService.DeleteFileAsync(oldDocumentUrl);
                _logger.LogInformation("Expert {ExpertId} deleted document {DocumentUrl} for expertise {ExpertiseId}", 
                    userId, oldDocumentUrl, id);
            }

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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document for expertise {ExpertiseId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ErrorResponse.Error("An error occurred while deleting the document", StatusCodes.Status500InternalServerError));
        }
    }

    /// <summary>
    /// Update an expertise report (expert who created the expertise only)
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ExpertiseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateExpertiseReport(Guid id, [FromBody] UpdateExpertiseRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var expertise = await _expertiseService.UpdateExpertiseReportAsync(id, request, userId, cancellationToken);
            _logger.LogInformation("Expert {ExpertId} updated expertise report {ExpertiseId}", userId, id);
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
}
