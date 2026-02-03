using apiroot.Data;
using apiroot.DTOs;
using apiroot.Helpers;
using apiroot.Interfaces;
using apiroot.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace apiroot.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IReviewService _reviewService;
    private readonly ILogger<UserService> _logger;

    public UserService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IReviewService reviewService,
        ILogger<UserService> logger)
    {
        _context = context;
        _userManager = userManager;
        _reviewService = reviewService;
        _logger = logger;
    }

    public async Task<PaginatedResponse<UserResponseDto>> GetPaginatedUsersAsync(UserFilterRequest filterRequest, string? currentUserId = null)
    {
        // Use a persistent query that doesn't change after filter application
        var query = _context.Users.IgnoreQueryFilters().AsQueryable();

        // Apply filters to IQueryable
        if (filterRequest.IsDeleted.HasValue)
        {
            query = query.Where(u => u.IsDeleted == filterRequest.IsDeleted.Value);
        }
        else
        {
            query = query.Where(u => !u.IsDeleted);
        }

        if (!string.IsNullOrWhiteSpace(filterRequest.SearchTerm))
        {
            var searchTerm = filterRequest.SearchTerm.ToLower();
            query = query.Where(u =>
                (u.UserName != null && u.UserName.ToLower().Contains(searchTerm)) ||
                (u.Email != null && u.Email.ToLower().Contains(searchTerm)));
        }

        if (filterRequest.EmailConfirmed.HasValue)
        {
            query = query.Where(u => u.EmailConfirmed == filterRequest.EmailConfirmed.Value);
        }

        // Apply role filter on the DB level via Identity tables to ensure pagination works correctly
        if (!string.IsNullOrWhiteSpace(filterRequest.Role))
        {
            var roleName = filterRequest.Role.ToUpper();
            query = from user in query
                    join userRole in _context.UserRoles on user.Id equals userRole.UserId
                    join role in _context.Roles on userRole.RoleId equals role.Id
                    where role.Name == roleName
                    select user;
        }

        // Filter out current user and skip ADMINs if requested (and not specifically searching for ADMINs)
        if (!string.IsNullOrWhiteSpace(currentUserId))
        {
            // Specifically exclude the current user
            query = query.Where(u => u.Id != currentUserId);
            
            // Only exclude all ADMINs if we aren't specifically filtering for the ADMIN role
            if (string.IsNullOrWhiteSpace(filterRequest.Role) || filterRequest.Role.ToUpper() != "ADMIN")
            {
                query = from user in query
                        where !_context.UserRoles.Any(ur => 
                            ur.UserId == user.Id && 
                            _context.Roles.Any(r => r.Id == ur.RoleId && r.Name == "ADMIN"))
                        select user;
            }
        }

        // Order and Paginate
        query = query.OrderByDescending(u => u.UserName);
        var paginatedResult = await PaginationHelper.PaginateAsync(query, filterRequest.Page, filterRequest.PageSize);

        // Map to DTOs and fetch roles in bulk for the page
        var userDtos = new List<UserResponseDto>();
        foreach (var user in paginatedResult.Data)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(MapToUserResponseDto(user, roles.ToList()));
        }

        return new PaginatedResponse<UserResponseDto>
        {
            Data = userDtos,
            Page = paginatedResult.Page,
            PageSize = paginatedResult.PageSize,
            TotalCount = paginatedResult.TotalCount,
            TotalPages = paginatedResult.TotalPages,
            HasPrevious = paginatedResult.HasPrevious,
            HasNext = paginatedResult.HasNext
        };
    }

    public async Task<UserDetailsDto?> GetUserByIdAsync(string userId)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return null;

        var roles = await _userManager.GetRolesAsync(user);

        // Get counts of related entities (including soft-deleted ones)
        var vehiclesCount = await _context.Vehicles
            .IgnoreQueryFilters()
            .Where(v => v.UserId == userId && v.IsDeleted == user.IsDeleted)
            .CountAsync();

        var listingsCount = await _context.Listings
            .IgnoreQueryFilters()
            .Where(l => l.OwnerId == userId && l.IsDeleted == user.IsDeleted)
            .CountAsync();

        var expertisesCount = await _context.Expertises
            .IgnoreQueryFilters()
            .Where(e => e.ExpertId == userId && e.IsDeleted == user.IsDeleted)
            .CountAsync();

        var mediaCount = await _context.Media
            .IgnoreQueryFilters()
            .Where(m => m.UserId == userId && m.IsDeleted == user.IsDeleted)
            .CountAsync();

        // Note: Reviews are in MongoDB, we'll set to 0 for now
        // Could enhance this by calling review service if needed
        var reviewsCount = 0;

        return new UserDetailsDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            EmailConfirmed = user.EmailConfirmed,
            PhoneNumber = user.PhoneNumber,
            PhoneNumberConfirmed = user.PhoneNumberConfirmed,
            TwoFactorEnabled = user.TwoFactorEnabled,
            LockoutEnd = user.LockoutEnd,
            LockoutEnabled = user.LockoutEnabled,
            AccessFailedCount = user.AccessFailedCount,
            Roles = roles.ToList(),
            IsDeleted = user.IsDeleted,
            DeletedAt = user.DeletedAt,
            VehiclesCount = vehiclesCount,
            ListingsCount = listingsCount,
            ExpertisesCount = expertisesCount,
            ReviewsCount = reviewsCount,
            MediaCount = mediaCount
        };
    }

    public async Task<(bool success, string? error)> UpdateUserAsync(string userId, UpdateUserDto updateDto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return (false, "User not found");

        if (user.IsDeleted)
            return (false, "Cannot update a deleted user. Restore the user first.");

        // Update basic properties
        if (!string.IsNullOrWhiteSpace(updateDto.UserName))
        {
            var existingUser = await _userManager.FindByNameAsync(updateDto.UserName);
            if (existingUser != null && existingUser.Id != userId)
                return (false, "Username already taken");
            
            user.UserName = updateDto.UserName;
        }

        if (!string.IsNullOrWhiteSpace(updateDto.Email))
        {
            var existingUser = await _userManager.FindByEmailAsync(updateDto.Email);
            if (existingUser != null && existingUser.Id != userId)
                return (false, "Email already in use");
            
            user.Email = updateDto.Email;
        }

        if (updateDto.EmailConfirmed.HasValue)
            user.EmailConfirmed = updateDto.EmailConfirmed.Value;

        if (updateDto.PhoneNumber != null)
            user.PhoneNumber = updateDto.PhoneNumber;

        if (updateDto.PhoneNumberConfirmed.HasValue)
            user.PhoneNumberConfirmed = updateDto.PhoneNumberConfirmed.Value;

        if (updateDto.TwoFactorEnabled.HasValue)
            user.TwoFactorEnabled = updateDto.TwoFactorEnabled.Value;

        if (updateDto.LockoutEnabled.HasValue)
            user.LockoutEnabled = updateDto.LockoutEnabled.Value;

        if (updateDto.LockoutEnd.HasValue)
            user.LockoutEnd = updateDto.LockoutEnd.Value;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            return (false, string.Join(", ", updateResult.Errors.Select(e => e.Description)));

        // Update roles if provided
        if (updateDto.Roles != null)
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
                return (false, "Failed to remove old roles");

            if (updateDto.Roles.Count > 0)
            {
                var addResult = await _userManager.AddToRolesAsync(user, updateDto.Roles);
                if (!addResult.Succeeded)
                    return (false, "Failed to add new roles");
            }
        }

        return (true, null);
    }

    public async Task<(bool success, string? error)> SoftDeleteUserAsync(string userId)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return (false, "User not found");

        if (user.IsDeleted)
            return (false, "User is already deleted");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Soft delete the user
            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;

            // Soft delete all related entities
            var vehicles = await _context.Vehicles
                .IgnoreQueryFilters()
                .Where(v => v.UserId == userId && !v.IsDeleted)
                .ToListAsync();
            
            foreach (var vehicle in vehicles)
            {
                vehicle.IsDeleted = true;
                vehicle.DeletedAt = DateTime.UtcNow;
            }

            var listings = await _context.Listings
                .IgnoreQueryFilters()
                .Where(l => l.OwnerId == userId && !l.IsDeleted)
                .ToListAsync();
            
            foreach (var listing in listings)
            {
                listing.IsDeleted = true;
                listing.DeletedAt = DateTime.UtcNow;
            }

            var expertises = await _context.Expertises
                .IgnoreQueryFilters()
                .Where(e => e.ExpertId == userId && !e.IsDeleted)
                .ToListAsync();
            
            foreach (var expertise in expertises)
            {
                expertise.IsDeleted = true;
                expertise.DeletedAt = DateTime.UtcNow;
            }

            var media = await _context.Media
                .IgnoreQueryFilters()
                .Where(m => m.UserId == userId && !m.IsDeleted)
                .ToListAsync();
            
            foreach (var mediaItem in media)
            {
                mediaItem.IsDeleted = true;
                mediaItem.DeletedAt = DateTime.UtcNow;
            }

            // Soft delete RefreshTokens (hard delete since they don't have soft delete)
            var refreshTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId)
                .ToListAsync();
            
            _context.RefreshTokens.RemoveRange(refreshTokens);

            // Save SQL changes
            await _context.SaveChangesAsync();

            // Soft delete MongoDB reviews
            await _reviewService.SoftDeleteUserReviewsAsync(userId);

            await transaction.CommitAsync();

            _logger.LogInformation("User {UserId} and all related entities were soft deleted", userId);
            return (true, null);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to soft delete user {UserId}", userId);
            return (false, $"Failed to delete user: {ex.Message}");
        }
    }

    public async Task<(bool success, string? error)> RestoreUserAsync(string userId)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return (false, "User not found");

        if (!user.IsDeleted)
            return (false, "User is not deleted");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Restore the user
            user.IsDeleted = false;
            user.DeletedAt = null;

            // Restore all related entities
            var vehicles = await _context.Vehicles
                .IgnoreQueryFilters()
                .Where(v => v.UserId == userId && v.IsDeleted)
                .ToListAsync();
            
            foreach (var vehicle in vehicles)
            {
                vehicle.IsDeleted = false;
                vehicle.DeletedAt = null;
            }

            var listings = await _context.Listings
                .IgnoreQueryFilters()
                .Where(l => l.OwnerId == userId && l.IsDeleted)
                .ToListAsync();
            
            foreach (var listing in listings)
            {
                listing.IsDeleted = false;
                listing.DeletedAt = null;
            }

            var expertises = await _context.Expertises
                .IgnoreQueryFilters()
                .Where(e => e.ExpertId == userId && e.IsDeleted)
                .ToListAsync();
            
            foreach (var expertise in expertises)
            {
                expertise.IsDeleted = false;
                expertise.DeletedAt = null;
            }

            var media = await _context.Media
                .IgnoreQueryFilters()
                .Where(m => m.UserId == userId && m.IsDeleted)
                .ToListAsync();
            
            foreach (var mediaItem in media)
            {
                mediaItem.IsDeleted = false;
                mediaItem.DeletedAt = null;
            }

            // Save SQL changes
            await _context.SaveChangesAsync();

            // Restore MongoDB reviews
            await _reviewService.RestoreUserReviewsAsync(userId);

            await transaction.CommitAsync();

            _logger.LogInformation("User {UserId} and all related entities were restored", userId);
            return (true, null);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to restore user {UserId}", userId);
            return (false, $"Failed to restore user: {ex.Message}");
        }
    }

    private static UserResponseDto MapToUserResponseDto(ApplicationUser user, List<string> roles)
    {
        return new UserResponseDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            EmailConfirmed = user.EmailConfirmed,
            PhoneNumber = user.PhoneNumber,
            PhoneNumberConfirmed = user.PhoneNumberConfirmed,
            TwoFactorEnabled = user.TwoFactorEnabled,
            LockoutEnd = user.LockoutEnd,
            LockoutEnabled = user.LockoutEnabled,
            AccessFailedCount = user.AccessFailedCount,
            Roles = roles,
            IsDeleted = user.IsDeleted,
            DeletedAt = user.DeletedAt
        };
    }
}
