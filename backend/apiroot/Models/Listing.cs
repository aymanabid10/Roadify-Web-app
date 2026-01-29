using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace apiroot.Models;

/// <summary>
/// Abstract base class for all listing types
/// Uses Table-Per-Hierarchy (TPH) inheritance pattern
/// </summary>
public abstract class Listing
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public Currency Currency { get; set; } = Currency.TND;
    public bool IsPriceNegotiable { get; set; } = false;

    [MaxLength(20)]
    public string? ContactPhone { get; set; }

    [Required]
    [MaxLength(100)]
    public string Location { get; set; } = string.Empty;

    public List<string> Features { get; set; } = new();

    public DateTime? ExpirationDate { get; set; }

    [Required]
    public ListingStatus Status { get; set; } = ListingStatus.DRAFT;

    [Required]
    public Guid VehicleId { get; set; }

    [Required]
    public string OwnerId { get; set; } = string.Empty;

    public int ViewCount { get; set; } = 0;

    public float TrustScore { get; set; } = 0.0f;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey(nameof(OwnerId))]
    public IdentityUser Owner { get; set; } = null!;

    [ForeignKey(nameof(VehicleId))]
    public Vehicle Vehicle { get; set; } = null!;

    public Expertise? Expertise { get; set; }

    // Abstract method to get listing type
    public abstract ListingType GetListingType();

    // State machine methods
    public void SubmitForReview()
    {
        if (Status != ListingStatus.DRAFT)
        {
            throw new InvalidOperationException($"Cannot submit listing with status {Status} for review");
        }
        Status = ListingStatus.PENDING_REVIEW;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Publish()
    {
        if (Status != ListingStatus.PENDING_REVIEW)
        {
            throw new InvalidOperationException($"Cannot publish listing with status {Status}");
        }
        Status = ListingStatus.PUBLISHED;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Archive()
    {
        if (Status == ListingStatus.ARCHIVED)
        {
            throw new InvalidOperationException("Listing is already archived");
        }
        Status = ListingStatus.ARCHIVED;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reject()
    {
        if (Status != ListingStatus.PENDING_REVIEW)
        {
            throw new InvalidOperationException($"Cannot reject listing with status {Status}");
        }
        Status = ListingStatus.REJECTED;
        UpdatedAt = DateTime.UtcNow;
    }
}

/// <summary>
/// Represents a vehicle listing for sale
/// </summary>
public class SaleListing : Listing
{
    /// <summary>
    /// Whether the vehicle has a clear title/ownership
    /// </summary>
    public bool HasClearTitle { get; set; } = true;

    /// <summary>
    /// Whether financing options are available
    /// </summary>
    public bool FinancingAvailable { get; set; } = false;

    /// <summary>
    /// Whether trade-in is accepted
    /// </summary>
    public bool TradeInAccepted { get; set; } = false;

    /// <summary>
    /// Warranty information (e.g., "6 months", "1 year manufacturer warranty")
    /// </summary>
    [MaxLength(200)]
    public string? WarrantyInfo { get; set; }

    public override ListingType GetListingType() => ListingType.SALE;
}

/// <summary>
/// Represents a vehicle listing for rent
/// </summary>
public class RentListing : Listing
{
    /// <summary>
    /// Daily rental rate (Price field represents this)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? WeeklyRate { get; set; }

    /// <summary>
    /// Monthly rental rate
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? MonthlyRate { get; set; }

    /// <summary>
    /// Security deposit required
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal SecurityDeposit { get; set; }

    /// <summary>
    /// Minimum rental period (e.g., "1 day", "3 days", "1 week")
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string MinimumRentalPeriod { get; set; } = "1 day";

    /// <summary>
    /// Maximum rental period (null = unlimited)
    /// </summary>
    [MaxLength(50)]
    public string? MaximumRentalPeriod { get; set; }

    /// <summary>
    /// Mileage limit per day (null = unlimited)
    /// </summary>
    public int? MileageLimitPerDay { get; set; }

    /// <summary>
    /// Insurance included in rental price
    /// </summary>
    public bool InsuranceIncluded { get; set; } = false;

    /// <summary>
    /// Fuel policy (e.g., "Full to Full", "Same to Same")
    /// </summary>
    [MaxLength(100)]
    public string? FuelPolicy { get; set; }

    /// <summary>
    /// Delivery available to renter
    /// </summary>
    public bool DeliveryAvailable { get; set; } = false;

    /// <summary>
    /// Delivery fee if delivery is available
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? DeliveryFee { get; set; }

    public override ListingType GetListingType() => ListingType.RENT;
}
