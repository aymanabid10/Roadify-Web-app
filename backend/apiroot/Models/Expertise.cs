using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace apiroot.Models;

public class Expertise
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ListingId { get; set; }

    [Required]
    public string ExpertId { get; set; } = string.Empty;

    [Required]
    [MaxLength(5000)]
    public string TechnicalReport { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? DocumentUrl { get; set; }

    [Range(0, 100)]
    public int ConditionScore { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? EstimatedValue { get; set; }

    public DateTime InspectionDate { get; set; } = DateTime.UtcNow;

    [Required]
    public bool IsApproved { get; set; }

    [MaxLength(200)]
    public string? RejectionReason { get; set; }

    [MaxLength(1000)]
    public string? RejectionFeedback { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;

    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    [ForeignKey(nameof(ListingId))]
    public Listing Listing { get; set; } = null!;

    [ForeignKey(nameof(ExpertId))]
    public ApplicationUser Expert { get; set; } = null!;

    // Methods
    public void Approve()
    {
        IsApproved = true;
        Listing?.Publish();
    }

    public void Reject(string? reason = null, string? feedback = null)
    {
        IsApproved = false;
        RejectionReason = reason;
        RejectionFeedback = feedback;
        Listing?.Reject();
    }
}
