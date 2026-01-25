using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using apiroot.Data;
using apiroot.DTOs;
using apiroot.Interfaces;
using apiroot.Models;

namespace apiroot.Services;

public class ReviewService : IReviewService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public ReviewService(ApplicationDbContext context, UserManager<IdentityUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<ReviewResponse> CreateReviewAsync(CreateReviewRequest request, string reviewerId)
    {
        // Don't allow self-review
        if (request.TargetUserId == reviewerId)
        {
            throw new InvalidOperationException("You cannot review yourself");
        }

        // Verify target user exists
        var targetUser = await _userManager.FindByIdAsync(request.TargetUserId);
        if (targetUser == null)
        {
            throw new InvalidOperationException("Target user not found");
        }

        var review = new Review
        {
            ReviewerId = reviewerId,
            TargetUserId = request.TargetUserId,
            Rating = request.Rating,
            Comment = request.Comment,
            IsVisible = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return await MapToResponseAsync(review);
    }

    public async Task<PaginatedResponse<ReviewResponse>> GetUserReviewsAsync(string targetUserId, int page = 1, int pageSize = 10)
    {
        var query = _context.Reviews
            .Include(r => r.Reviewer)
            .Where(r => r.TargetUserId == targetUserId && r.IsVisible)
            .OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync();
        var reviews = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = new List<ReviewResponse>();
        foreach (var review in reviews)
        {
            items.Add(await MapToResponseAsync(review));
        }

        return new PaginatedResponse<ReviewResponse>
        {
            Data = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            HasPrevious = page > 1,
            HasNext = page < (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<bool> DeleteReviewAsync(Guid id, string userId)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null) return false;

        // Only reviewer can delete their review
        if (review.ReviewerId != userId)
        {
            throw new UnauthorizedAccessException("You can only delete your own reviews");
        }

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<ReviewResponse> MapToResponseAsync(Review review)
    {
        if (review.Reviewer == null)
        {
            await _context.Entry(review).Reference(r => r.Reviewer).LoadAsync();
        }

        return new ReviewResponse
        {
            Id = review.Id,
            ReviewerId = review.ReviewerId,
            ReviewerUsername = review.Reviewer?.UserName,
            TargetUserId = review.TargetUserId,
            Rating = review.Rating,
            Comment = review.Comment,
            IsVisible = review.IsVisible,
            CreatedAt = review.CreatedAt
        };
    }
}
