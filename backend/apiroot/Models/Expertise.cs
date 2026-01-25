using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

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

    [Required]
    public bool IsApproved { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(ListingId))]
    public Listing Listing { get; set; } = null!;

    [ForeignKey(nameof(ExpertId))]
    public IdentityUser Expert { get; set; } = null!;

    // Methods
    public void Approve()
    {
        IsApproved = true;
        Listing?.Publish();
    }

    public void Reject()
    {
        IsApproved = false;
        Listing?.Reject();
    }
}
