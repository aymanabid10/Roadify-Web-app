using System.ComponentModel.DataAnnotations;
using apiroot.Models;

namespace apiroot.DTOs;

// Base request for common listing properties
public abstract class CreateListingRequestBase
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [Range(0, 100000000)]
    public decimal Price { get; set; }

    public Currency Currency { get; set; }
    public bool IsPriceNegotiable { get; set; }
    
    [MaxLength(20)]
    public string? ContactPhone { get; set; }

    [Required]
    public int VehicleId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Location { get; set; } = string.Empty;

    public List<string> Features { get; set; } = new();
}

// Request for creating a sale listing
public class CreateSaleListingRequest : CreateListingRequestBase
{
    public bool HasClearTitle { get; set; } = true;
    public bool FinancingAvailable { get; set; } = false;
    public bool TradeInAccepted { get; set; } = false;
    
    [MaxLength(200)]
    public string? WarrantyInfo { get; set; }
}

// Request for creating a rent listing
public class CreateRentListingRequest : CreateListingRequestBase
{
    [Range(0, 100000000)]
    public decimal? WeeklyRate { get; set; }

    [Range(0, 100000000)]
    public decimal? MonthlyRate { get; set; }

    [Required]
    [Range(0, 100000000)]
    public decimal SecurityDeposit { get; set; }

    [Required]
    [MaxLength(50)]
    public string MinimumRentalPeriod { get; set; } = "1 day";

    [MaxLength(50)]
    public string? MaximumRentalPeriod { get; set; }

    [Range(0, 10000)]
    public int? MileageLimitPerDay { get; set; }

    public bool InsuranceIncluded { get; set; } = false;

    [MaxLength(100)]
    public string? FuelPolicy { get; set; }

    public bool DeliveryAvailable { get; set; } = false;

    [Range(0, 100000000)]
    public decimal? DeliveryFee { get; set; }
}

// Legacy DTO for backward compatibility - will be removed later
[Obsolete("Use CreateSaleListingRequest or CreateRentListingRequest instead")]
public class CreateListingRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [Range(0, 100000000)]
    public decimal Price { get; set; }

    public Currency Currency { get; set; }
    public bool IsPriceNegotiable { get; set; }
    
    [MaxLength(20)]
    public string? ContactPhone { get; set; }

    [Required]
    public ListingType ListingType { get; set; }

    [Required]
    public Guid VehicleId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Location { get; set; } = string.Empty;

    public List<string> Features { get; set; } = new();
}

// Base update request
public abstract class UpdateListingRequestBase
{
    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(0, 100000000)]
    public decimal? Price { get; set; }

    public Currency? Currency { get; set; }
    public bool? IsPriceNegotiable { get; set; }

    [MaxLength(20)]
    public string? ContactPhone { get; set; }

    [MaxLength(100)]
    public string? Location { get; set; }
    
    public List<string>? Features { get; set; }
}

// Update request for sale listings
public class UpdateSaleListingRequest : UpdateListingRequestBase
{
    public bool? HasClearTitle { get; set; }
    public bool? FinancingAvailable { get; set; }
    public bool? TradeInAccepted { get; set; }
    
    [MaxLength(200)]
    public string? WarrantyInfo { get; set; }
}

// Update request for rent listings
public class UpdateRentListingRequest : UpdateListingRequestBase
{
    [Range(0, 100000000)]
    public decimal? WeeklyRate { get; set; }

    [Range(0, 100000000)]
    public decimal? MonthlyRate { get; set; }

    [Range(0, 100000000)]
    public decimal? SecurityDeposit { get; set; }

    [MaxLength(50)]
    public string? MinimumRentalPeriod { get; set; }

    [MaxLength(50)]
    public string? MaximumRentalPeriod { get; set; }

    [Range(0, 10000)]
    public int? MileageLimitPerDay { get; set; }

    public bool? InsuranceIncluded { get; set; }

    [MaxLength(100)]
    public string? FuelPolicy { get; set; }

    public bool? DeliveryAvailable { get; set; }

    [Range(0, 100000000)]
    public decimal? DeliveryFee { get; set; }
}

// Legacy update request for backward compatibility
[Obsolete("Use UpdateSaleListingRequest or UpdateRentListingRequest instead")]
public class UpdateListingRequest
{
    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(0, 100000000)]
    public decimal? Price { get; set; }

    public Currency? Currency { get; set; }
    public bool? IsPriceNegotiable { get; set; }

    [MaxLength(20)]
    public string? ContactPhone { get; set; }

    public ListingType? ListingType { get; set; }

    [MaxLength(100)]
    public string? Location { get; set; }
    
    public List<string>? Features { get; set; }
}

// Base response class
public abstract class ListingResponseBase
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public Currency Currency { get; set; }
    public bool IsPriceNegotiable { get; set; }
    public string? ContactPhone { get; set; }
    public ListingType ListingType { get; set; }
    public ListingStatus Status { get; set; }
    public string Location { get; set; } = string.Empty;
    public List<string> Features { get; set; } = new();
    public DateTime? ExpirationDate { get; set; }
    public Guid VehicleId { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string? OwnerUsername { get; set; }
    public int ViewCount { get; set; }
    public float TrustScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public ExpertiseResponse? Expertise { get; set; }
}

// Response for sale listings
public class SaleListingResponse : ListingResponseBase
{
    public bool HasClearTitle { get; set; }
    public bool FinancingAvailable { get; set; }
    public bool TradeInAccepted { get; set; }
    public string? WarrantyInfo { get; set; }
}

// Response for rent listings
public class RentListingResponse : ListingResponseBase
{
    public decimal? WeeklyRate { get; set; }
    public decimal? MonthlyRate { get; set; }
    public decimal SecurityDeposit { get; set; }
    public string MinimumRentalPeriod { get; set; } = string.Empty;
    public string? MaximumRentalPeriod { get; set; }
    public int? MileageLimitPerDay { get; set; }
    public bool InsuranceIncluded { get; set; }
    public string? FuelPolicy { get; set; }
    public bool DeliveryAvailable { get; set; }
    public decimal? DeliveryFee { get; set; }
}

// Generic response for backward compatibility or when type doesn't matter
public class ListingResponse : ListingResponseBase
{
    // Sale-specific properties (nullable for rent listings)
    public bool? HasClearTitle { get; set; }
    public bool? FinancingAvailable { get; set; }
    public bool? TradeInAccepted { get; set; }
    public string? WarrantyInfo { get; set; }

    // Rent-specific properties (nullable for sale listings)
    public decimal? WeeklyRate { get; set; }
    public decimal? MonthlyRate { get; set; }
    public decimal? SecurityDeposit { get; set; }
    public string? MinimumRentalPeriod { get; set; }
    public string? MaximumRentalPeriod { get; set; }
    public int? MileageLimitPerDay { get; set; }
    public bool? InsuranceIncluded { get; set; }
    public string? FuelPolicy { get; set; }
    public bool? DeliveryAvailable { get; set; }
    public decimal? DeliveryFee { get; set; }
}
