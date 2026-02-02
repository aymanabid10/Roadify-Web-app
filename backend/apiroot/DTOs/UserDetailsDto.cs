namespace apiroot.DTOs;

public class UserDetailsDto
{
    public string Id { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public bool EmailConfirmed { get; set; }
    public string? PhoneNumber { get; set; }
    public bool PhoneNumberConfirmed { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public bool LockoutEnabled { get; set; }
    public int AccessFailedCount { get; set; }
    public List<string> Roles { get; set; } = new();
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    
    // Related entity counts
    public int VehiclesCount { get; set; }
    public int ListingsCount { get; set; }
    public int ExpertisesCount { get; set; }
    public int ReviewsCount { get; set; }
    public int MediaCount { get; set; }
}
