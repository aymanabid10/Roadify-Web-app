using apiroot.DTOs;

namespace apiroot.Interfaces;

public interface IUserService
{
    Task<PaginatedResponse<UserResponseDto>> GetPaginatedUsersAsync(UserFilterRequest filterRequest, string? currentUserId = null);
    Task<UserDetailsDto?> GetUserByIdAsync(string userId);
    Task<(bool success, string? error)> UpdateUserAsync(string userId, UpdateUserDto updateDto);
    Task<(bool success, string? error)> SoftDeleteUserAsync(string userId);
    Task<(bool success, string? error)> RestoreUserAsync(string userId);
}
