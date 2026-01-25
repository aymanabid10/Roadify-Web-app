using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace apiroot.Models;

public class Review
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string ReviewerId { get; set; } = string.Empty;

    [Required]
    public string TargetUserId { get; set; } = string.Empty;

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }

    [Required]
    public bool IsVisible { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(ReviewerId))]
    public IdentityUser Reviewer { get; set; } = null!;

    [ForeignKey(nameof(TargetUserId))]
    public IdentityUser TargetUser { get; set; } = null!;
}
