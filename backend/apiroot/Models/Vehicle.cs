using System.ComponentModel.DataAnnotations;

namespace apiroot.Models;

public class Vehicle
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Brand { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Model { get; set; } = string.Empty;

    [Required]
    public int Year { get; set; }

    [Required]
    [MaxLength(50)]
    public string RegistrationNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string VehicleType { get; set; } = string.Empty; // Car, Truck, Van, etc.

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public string Status { get; set; } = "Available"; // Available, InUse, Maintenance, Retired

    public decimal? Mileage { get; set; }

    [MaxLength(50)]
    public string? Color { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
}
