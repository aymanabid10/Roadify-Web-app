using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public class UpdateVehicleDto
{
    [Required(ErrorMessage = "Brand is required")]
    [MaxLength(100)]
    public string Brand { get; set; } = string.Empty;

    [Required(ErrorMessage = "Model is required")]
    [MaxLength(100)]
    public string Model { get; set; } = string.Empty;

    [Required(ErrorMessage = "Year is required")]
    public int Year { get; set; }

    [Required(ErrorMessage = "Registration number is required")]
    [MaxLength(50)]
    public string RegistrationNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vehicle type is required")]
    [MaxLength(50)]
    public string VehicleType { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = "Available";

    public decimal? Mileage { get; set; }

    [MaxLength(50)]
    public string? Color { get; set; }
}
