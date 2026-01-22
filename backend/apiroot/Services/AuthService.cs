using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using apiroot.Data;
using apiroot.DTOs;
using apiroot.Interfaces;

namespace apiroot.Services;

public class AuthService(
    UserManager<IdentityUser> userManager,
    SignInManager<IdentityUser> signInManager,
    ITokenService tokenService,
    ApplicationDbContext context,
    ILogger<AuthService> logger) : IAuthService
{

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var existingUser = await userManager.FindByNameAsync(request.Username);
        if (existingUser != null)
        {
            throw new InvalidOperationException("Username already exists");
        }

        var existingEmail = await userManager.FindByEmailAsync(request.Email);
        if (existingEmail != null)
        {
            throw new InvalidOperationException("Email already registered");
        }

        var user = new IdentityUser
        {
            UserName = request.Username,
            Email = request.Email,
            SecurityStamp = Guid.NewGuid().ToString()
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"User creation failed: {errors}");
        }

        await userManager.AddToRoleAsync(user, "USER");

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = tokenService.GenerateAccessToken(user.Id, user.UserName, roles);
        var refreshToken = tokenService.GenerateRefreshToken();

        await StoreRefreshTokenAsync(user.Id, refreshToken, cancellationToken);

        logger.LogInformation("User {Username} registered successfully", user.UserName);

        return new AuthResponse(accessToken, refreshToken, tokenService.GetAccessTokenExpiration(), user.UserName, roles);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByNameAsync(request.Username);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = tokenService.GenerateAccessToken(user.Id, user.UserName!, roles);
        var refreshToken = tokenService.GenerateRefreshToken();

        await StoreRefreshTokenAsync(user.Id, refreshToken, cancellationToken);

        logger.LogInformation("User {Username} logged in successfully", user.UserName);

        return new AuthResponse(accessToken, refreshToken, tokenService.GetAccessTokenExpiration(), user.UserName!, roles);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var storedToken = await context.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken, cancellationToken);

        if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiresAt < DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token");
        }

        var user = await userManager.FindByIdAsync(storedToken.UserId);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = tokenService.GenerateAccessToken(user.Id, user.UserName!, roles);
        var newRefreshToken = tokenService.GenerateRefreshToken();

        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.RevokedByToken = request.RefreshToken;
        storedToken.IsRevoked = true;
        
        context.RefreshTokens.Add(new RefreshToken
        {
            Token = newRefreshToken,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await context.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken, newRefreshToken, tokenService.GetAccessTokenExpiration(), user.UserName!, roles);
    }

    public Task<bool> ValidateTokenAsync(string token)
    {
        var principal = tokenService.ValidateToken(token);
        return Task.FromResult(principal != null);
    }

    private async Task StoreRefreshTokenAsync(string userId, string token, CancellationToken cancellationToken)
    {
        var refreshToken = new RefreshToken
        {
            Token = token,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        context.RefreshTokens.Add(refreshToken);
        await context.SaveChangesAsync(cancellationToken);
    }
}
