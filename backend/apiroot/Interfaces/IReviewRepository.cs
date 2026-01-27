using apiroot.Models;

public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(string id);
    Task<IEnumerable<Review>> GetByTargetUserIdAsync(Guid userId);
    Task<IEnumerable<Review>> GetByReviewerIdAsync(Guid userId);
    Task AddAsync(Review review);
    Task UpdateAsync(string id, Review review);
    Task DeleteAsync(string id);
    Task<double> GetAverageRatingAsync(Guid userId);
}