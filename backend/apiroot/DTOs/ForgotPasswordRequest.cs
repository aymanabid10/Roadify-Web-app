using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public record ForgotPasswordRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email);
