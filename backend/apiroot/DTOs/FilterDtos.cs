using apiroot.Models;
using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

/// <summary>
/// Request model for filtering and sorting listing queries
/// </summary>
public class ListingFilterRequest
{
    /// <summary>
    /// Filter by listing status (0=DRAFT, 1=PENDING_REVIEW, 2=PUBLISHED, 3=REJECTED, 4=ARCHIVED)
    /// </summary>
    public ListingStatus? Status { get; set; }

    /// <summary>
    /// Filter by listing type (0=SALE, 1=RENT)
    /// </summary>
    public ListingType? ListingType { get; set; }

    /// <summary>
    /// Filter for listings by a specific type using string value ("SALE" or "RENT")
    /// </summary>
    public string? ListingTypeString { get; set; }

    /// <summary>
    /// Filter by owner user ID
    /// </summary>
    public string? OwnerId { get; set; }

    /// <summary>
    /// Filter by vehicle ID
    /// </summary>
    public Guid? VehicleId { get; set; }

    /// <summary>
    /// Minimum price filter
    /// </summary>
    [Range(0, double.MaxValue)]
    public decimal? MinPrice { get; set; }

    /// <summary>
    /// Maximum price filter
    /// </summary>
    [Range(0, double.MaxValue)]
    public decimal? MaxPrice { get; set; }

    /// <summary>
    /// Filter by location (partial match)
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// Search query for title and description
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// Sort field: "CreatedAt", "Price", "Title", "Status", "ViewCount"
    /// </summary>
    public string SortBy { get; set; } = "CreatedAt";

    /// <summary>
    /// Sort order: "asc" or "desc"
    /// </summary>
    public string SortOrder { get; set; } = "desc";

    /// <summary>
    /// Page number (starts from 1)
    /// </summary>
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    /// <summary>
    /// Number of items per page
    /// </summary>
    [Range(1, 100)]
    public int PageSize { get; set; } = 10;
}
