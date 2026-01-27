using apiroot.Models;

public interface IReviewRepository
{
    Task AddAsync(Review review);
    Task<IEnumerable<Review>> GetByUserIdAsync(Guid userId);
    Task<double> GetAverageRatingAsync(Guid userId);
}
