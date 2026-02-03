using apiroot.DTOs;
using apiroot.Models;

namespace apiroot.Interfaces;

public interface IListingService
{
    // New type-specific methods
    Task<SaleListingResponse> CreateSaleListingAsync(CreateSaleListingRequest request, string userId, CancellationToken cancellationToken = default);
    Task<RentListingResponse> CreateRentListingAsync(CreateRentListingRequest request, string userId, CancellationToken cancellationToken = default);
    Task<ListingResponse> UpdateSaleListingAsync(Guid id, UpdateSaleListingRequest request, string userId, CancellationToken cancellationToken = default);
    Task<ListingResponse> UpdateRentListingAsync(Guid id, UpdateRentListingRequest request, string userId, CancellationToken cancellationToken = default);
    
    // Legacy methods for backward compatibility
    [Obsolete("Use CreateSaleListingAsync or CreateRentListingAsync instead")]
    Task<ListingResponse> CreateListingAsync(CreateListingRequest request, string userId, CancellationToken cancellationToken = default);
    [Obsolete("Use UpdateSaleListingAsync or UpdateRentListingAsync instead")]
    Task<ListingResponse> UpdateListingAsync(Guid id, UpdateListingRequest request, string userId, CancellationToken cancellationToken = default);
    
    // Common methods
    Task<ListingResponse?> GetListingByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ListingResponse?> GetListingByIdAsync(Guid id, string? currentUserId, CancellationToken cancellationToken = default);
    Task<PaginatedResponse<ListingResponse>> GetPublicListingsAsync(ListingFilterRequest filter, CancellationToken cancellationToken = default);
    Task<PaginatedResponse<ListingResponse>> GetAllListingsAsync(ListingFilterRequest filter, CancellationToken cancellationToken = default);
    Task DeleteListingAsync(Guid id, string userId, CancellationToken cancellationToken = default);
    Task<ListingResponse> SubmitForReviewAsync(Guid id, string userId, CancellationToken cancellationToken = default);
    Task<ListingResponse> PublishListingAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ListingResponse> ArchiveListingAsync(Guid id, string userId, CancellationToken cancellationToken = default);
}
