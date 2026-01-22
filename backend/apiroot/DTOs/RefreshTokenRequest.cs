using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public record RefreshTokenRequest(
    [Required(ErrorMessage = "Refresh token is required")]
    string RefreshToken);
