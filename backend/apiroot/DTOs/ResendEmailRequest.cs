using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public record ResendEmailRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email);
