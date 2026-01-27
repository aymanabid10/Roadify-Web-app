using apiroot.Models;
using Microsoft.AspNetCore.Identity;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviewRepository;
    private readonly UserManager<IdentityUser> _userManager;

    public ReviewService(IReviewRepository reviewRepository, UserManager<IdentityUser> userManager)
    {
        _reviewRepository = reviewRepository;
        _userManager = userManager;
    }

    public async Task AddReviewAsync(Guid reviewerId, CreateReviewDto dto)
    {
        if (reviewerId == dto.TargetUserId)
            throw new Exception("Auto-notation is not allowed!");

        if (await _userManager.FindByIdAsync(dto.TargetUserId.ToString()) == null)
            throw new Exception("Target user is not found!");

        await _reviewRepository.AddAsync(new Review
        {
            ReviewerId = reviewerId,
            TargetUserId = dto.TargetUserId,
            Rating = dto.Rating,
            Comment = dto.Comment
        });
    }

    public async Task UpdateReviewAsync(string id, Guid currentUserId, UpdateReviewDto dto)
    {
        var review = await GetAndValidateOwnerAsync(id, currentUserId);

        review.Rating = dto.Rating;
        review.Comment = dto.Comment;

        await _reviewRepository.UpdateAsync(id, review);
    }

    public async Task DeleteReviewAsync(string id, Guid currentUserId)
    {
        await GetAndValidateOwnerAsync(id, currentUserId);
        await _reviewRepository.DeleteAsync(id);
    }

    public async Task<IEnumerable<ReviewDto>> GetMyReviewsAsync(Guid userId) 
        => (await _reviewRepository.GetByReviewerIdAsync(userId)).Select(MapToDto);

    public async Task<IEnumerable<ReviewDto>> GetUserReviewsAsync(Guid targetUserId) 
        => (await _reviewRepository.GetByTargetUserIdAsync(targetUserId)).Select(MapToDto);

    public async Task<double> GetAverageRatingAsync(Guid userId)
    {
        // Vérification Identity (SQL)
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            throw new KeyNotFoundException("User not found");

        return await _reviewRepository.GetAverageRatingAsync(userId);
    }
    //Private Helpers

    private async Task<Review> GetAndValidateOwnerAsync(string id, Guid currentUserId)
    {
        var review = await _reviewRepository.GetByIdAsync(id) 
                     ?? throw new Exception("Review not found!");

        if (review.ReviewerId != currentUserId) 
            throw new Exception("Action is not allowed!");

        return review;
    }

    private static ReviewDto MapToDto(Review r) => new()
    {
        Rating = r.Rating,
        Comment = r.Comment,
        CreatedAt = r.CreatedAt
    };
}
