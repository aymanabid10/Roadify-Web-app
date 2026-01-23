using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public record ConfirmEmailRequest(
    [Required(ErrorMessage = "User ID is required")]
    string UserId,
    
    [Required(ErrorMessage = "Token is required")]
    string Token);
