using System.ComponentModel.DataAnnotations;
using apiroot.Enums;

namespace apiroot.DTOs;

public class CreateMediaDto
{
    [Required(ErrorMessage = "File is required")]
    public IFormFile File { get; set; } = null!;

    [Required(ErrorMessage = "Media type is required")]
    public MediaType Type { get; set; }

    [Required(ErrorMessage = "Vehicle ID is required")]
    public Guid VehicleId { get; set; }
}
