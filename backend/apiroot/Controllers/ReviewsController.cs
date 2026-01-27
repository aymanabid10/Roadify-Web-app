using System.Security.Claims;
using apiroot.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) 
        ?? throw new UnauthorizedAccessException("User ID not found in token"));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
    {
        await _reviewService.AddReviewAsync(CurrentUserId, dto);
        return StatusCode(StatusCodes.Status201Created, new { message = "Review created successfully" });
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(IEnumerable<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetMyReviews()
    {
        var reviews = await _reviewService.GetMyReviewsAsync(CurrentUserId);
        return Ok(reviews);
    }

    [AllowAnonymous]
    [HttpGet("user/{targetUserId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetUserReviews(Guid targetUserId)
    {
        var reviews = await _reviewService.GetUserReviewsAsync(targetUserId);
        return Ok(reviews);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateReviewDto dto)
    {
        await _reviewService.UpdateReviewAsync(id, CurrentUserId, dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        await _reviewService.DeleteReviewAsync(id, CurrentUserId);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("user/{userId:guid}/average")]
    [ProducesResponseType(typeof(double), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<double>> GetAverageRating(Guid userId)
    {
        var average = await _reviewService.GetAverageRatingAsync(userId);
        return Ok(average);
    }
}