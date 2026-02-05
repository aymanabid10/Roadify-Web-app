public interface IReviewService
{
    Task AddReviewAsync(Guid reviewerId, CreateReviewDto dto);
    Task<IEnumerable<ReviewDto>> GetMyReviewsAsync(Guid userId);
    Task<IEnumerable<ReviewDto>> GetUserReviewsAsync(Guid targetUserId);
    Task UpdateReviewAsync(string id, Guid currentUserId, UpdateReviewDto dto);
    Task DeleteReviewAsync(string id, Guid currentUserId);
    Task<double> GetAverageRatingAsync(Guid userId);
    Task SoftDeleteUserReviewsAsync(string userId);
    Task RestoreUserReviewsAsync(string userId);
}
