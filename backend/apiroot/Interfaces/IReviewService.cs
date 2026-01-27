public interface IReviewService
{
    Task AddReviewAsync(Guid reviewerId, CreateReviewDto dto);
    Task<double> GetUserRatingAsync(Guid userId);
}
