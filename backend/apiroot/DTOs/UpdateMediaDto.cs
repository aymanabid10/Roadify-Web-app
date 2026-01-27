using System.ComponentModel.DataAnnotations;
using apiroot.Enums;

namespace apiroot.DTOs;

public class UpdateMediaDto
{
    [StringLength(500, ErrorMessage = "URL cannot exceed 500 characters")]
    public string? Url { get; set; }

    public MediaType? Type { get; set; }
}
