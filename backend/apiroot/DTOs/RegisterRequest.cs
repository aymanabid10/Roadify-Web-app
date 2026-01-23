using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public record RegisterRequest(
    [Required(ErrorMessage = "Username is required")]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
    [MaxLength(50, ErrorMessage = "Username cannot exceed 50 characters")]
    string Username,
    
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    string Email,
    
    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    string Password);
