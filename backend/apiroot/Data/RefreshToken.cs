using System.ComponentModel.DataAnnotations;

namespace apiroot.Data;

public class RefreshToken
{
    [Key] public int Id { get; set; }
    [MaxLength(200)] public string Token { get; set; } = string.Empty;
    [MaxLength(200)] public string UserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }
    [MaxLength(200)] public string? RevokedByToken { get; set; }
}