using apiroot.Models;

namespace apiroot.DTOs;

public class ListingFilterRequest
{
    public ListingStatus? Status { get; set; }
    public ListingType? ListingType { get; set; }
    public string? OwnerId { get; set; }
    public Guid? VehicleId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Location { get; set; }
    public string? Search { get; set; }
    public string SortBy { get; set; } = "CreatedAt";
    public string SortOrder { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
