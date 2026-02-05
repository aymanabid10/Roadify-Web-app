namespace apiroot.DTOs;

public class UserFilterRequest
{
    public string? SearchTerm { get; set; } // Search by username or email
    public string? Role { get; set; } // Filter by role (USER, ADMIN, EXPERT)
    public bool? EmailConfirmed { get; set; } // Filter by email confirmation status
    public bool? IsDeleted { get; set; } // Include deleted users or only show deleted
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
