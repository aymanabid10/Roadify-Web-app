using System.Security.Claims;
using apiroot.DTOs;
using apiroot.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace apiroot.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("")]
    public async Task<ActionResult<PaginatedResponse<UserResponseDto>>> GetUsers(
        [FromQuery] UserFilterRequest filterRequest)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _userService.GetPaginatedUsersAsync(filterRequest, currentUserId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDetailsDto>> GetUserById(string id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
            return NotFound(new ErrorResponse("User not found", StatusCodes.Status404NotFound));

        return Ok(user);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult> UpdateUser(string id, [FromBody] UpdateUserDto updateDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (success, error) = await _userService.UpdateUserAsync(id, updateDto);
        if (!success)
            return BadRequest(new ErrorResponse(error ?? "Failed to update user", StatusCodes.Status400BadRequest));

        return Ok(new { message = "User updated successfully" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult> DeleteUser(string id)
    {
        var (success, error) = await _userService.SoftDeleteUserAsync(id);
        if (!success)
            return BadRequest(new ErrorResponse(error ?? "Failed to delete user", StatusCodes.Status400BadRequest));

        return Ok(new { message = "User and all related entities deleted successfully" });
    }

    [HttpPost("{id}/restore")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult> RestoreUser(string id)
    {
        var (success, error) = await _userService.RestoreUserAsync(id);
        if (!success)
            return BadRequest(new ErrorResponse(error ?? "Failed to restore user", StatusCodes.Status400BadRequest));

        return Ok(new { message = "User and all related entities restored successfully" });
    }
}