using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public class UpdateVehiclePhotoDto
{
    [Required]
    public string OldPhotoUrl { get; set; } = string.Empty;

    [Required]
    public IFormFile NewPhoto { get; set; } = null!;
}
