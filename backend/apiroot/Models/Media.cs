using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using apiroot.Enums;

namespace apiroot.Models;

public class Media
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [StringLength(500)]
    public string Url { get; set; } = string.Empty;

    [Required]
    public MediaType Type { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    // Foreign Keys
    public string? UserId { get; set; }

    [Required]
    public Guid VehicleId { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(UserId))]
    public ApplicationUser? User { get; set; }

    [ForeignKey(nameof(VehicleId))]
    public Vehicle Vehicle { get; set; } = null!;
}
