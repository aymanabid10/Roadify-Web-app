using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using apiroot.DTOs;
using apiroot.Interfaces;
using System.Security.Claims;

namespace apiroot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReviewController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpPost]
    public async Task<ActionResult<ReviewResponse>> CreateReview(CreateReviewRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        try
        {
            var result = await _reviewService.CreateReviewAsync(request, userId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("user/{targetUserId}")]
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedResponse<ReviewResponse>>> GetUserReviews(
        string targetUserId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        var result = await _reviewService.GetUserReviewsAsync(targetUserId, page, pageSize);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReview(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        try
        {
            var success = await _reviewService.DeleteReviewAsync(id, userId);
            if (!success) return NotFound();
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
    }
}
