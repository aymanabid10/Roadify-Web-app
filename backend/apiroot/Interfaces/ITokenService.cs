using System.Security.Claims;
using apiroot.DTOs;

namespace apiroot.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(string userId, string username, IList<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
    DateTime GetAccessTokenExpiration();
}
