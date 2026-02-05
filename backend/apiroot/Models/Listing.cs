using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace apiroot.Models;

public class Listing
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
    public ListingType ListingType { get; set; }

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

    public bool IsDeleted { get; set; } = false;

    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    [ForeignKey(nameof(OwnerId))]
    public ApplicationUser Owner { get; set; } = null!;

    [ForeignKey(nameof(VehicleId))]
    public Vehicle Vehicle { get; set; } = null!;

    public Expertise? Expertise { get; set; }

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
