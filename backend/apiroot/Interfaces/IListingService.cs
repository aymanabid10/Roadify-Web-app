using apiroot.DTOs;
using apiroot.Models;

namespace apiroot.Interfaces;

public interface IListingService
{
    Task<ListingResponse> CreateListingAsync(CreateListingRequest request, string userId, CancellationToken cancellationToken = default);
    Task<ListingResponse?> GetListingByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PaginatedResponse<ListingResponse>> GetListingsAsync(ListingFilterRequest filter, CancellationToken cancellationToken = default);
    Task<ListingResponse> UpdateListingAsync(Guid id, UpdateListingRequest request, string userId, CancellationToken cancellationToken = default);
    Task DeleteListingAsync(Guid id, string userId, CancellationToken cancellationToken = default);
    Task<ListingResponse> SubmitForReviewAsync(Guid id, string userId, CancellationToken cancellationToken = default);
    Task<ListingResponse> PublishListingAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ListingResponse> ArchiveListingAsync(Guid id, string userId, CancellationToken cancellationToken = default);
}
