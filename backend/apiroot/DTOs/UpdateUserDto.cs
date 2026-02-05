using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public class UpdateUserDto
{
    [MaxLength(256)]
    public string? UserName { get; set; }
    
    [EmailAddress]
    [MaxLength(256)]
    public string? Email { get; set; }
    
    public bool? EmailConfirmed { get; set; }
    
    [Phone]
    public string? PhoneNumber { get; set; }
    
    public bool? PhoneNumberConfirmed { get; set; }
    
    public bool? TwoFactorEnabled { get; set; }
    
    public bool? LockoutEnabled { get; set; }
    
    public DateTimeOffset? LockoutEnd { get; set; }
    
    public List<string>? Roles { get; set; }
}
