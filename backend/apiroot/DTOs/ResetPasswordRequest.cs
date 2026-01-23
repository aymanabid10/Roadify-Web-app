using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public record ResetPasswordRequest(
    [Required(ErrorMessage = "User ID is required")]
    string UserId,
    
    [Required(ErrorMessage = "Token is required")]
    string Token,
    
    [Required(ErrorMessage = "New password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    string NewPassword);
