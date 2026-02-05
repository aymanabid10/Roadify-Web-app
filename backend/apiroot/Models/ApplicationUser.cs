using Microsoft.AspNetCore.Identity;

namespace apiroot.Models;

public class ApplicationUser : IdentityUser
{
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
