using apiroot.DTOs;

namespace apiroot.Interfaces;

public interface IReviewService
{
    Task<ReviewResponse> CreateReviewAsync(CreateReviewRequest request, string reviewerId);
    Task<PaginatedResponse<ReviewResponse>> GetUserReviewsAsync(string targetUserId, int page = 1, int pageSize = 10);
    Task<bool> DeleteReviewAsync(Guid id, string userId);
}
