using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using apiroot.Data;
using apiroot.DTOs;
using apiroot.Interfaces;
using apiroot.Enums;

namespace apiroot.Services;

public class AuthService(
    UserManager<IdentityUser> userManager,
    SignInManager<IdentityUser> signInManager,
    ITokenService tokenService,
    IEmailService emailService,
    IConfiguration configuration,
    ApplicationDbContext context,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task RegisterAsync(RegisterRequest request,
        CancellationToken cancellationToken = default)
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

        await userManager.AddToRoleAsync(user, nameof(UserRole.USER));

        // Send email verification
        await SendEmailConfirmationAsync(user, cancellationToken);

        logger.LogInformation("User {Username} registered successfully. Awaiting email confirmation.", user.UserName);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByNameAsync(request.Username);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
        {
            throw new UnauthorizedAccessException("Account is locked. Please try again later.");
        }

        if (!result.Succeeded)
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        if (!user.EmailConfirmed)
        {
            throw new UnauthorizedAccessException("Please confirm your email before logging in.");
        }

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = tokenService.GenerateAccessToken(user.Id, user.UserName!, roles);
        var refreshToken = tokenService.GenerateRefreshToken();

        await StoreRefreshTokenAsync(user.Id, refreshToken, cancellationToken);

        logger.LogInformation("User {Username} logged in successfully", user.UserName);

        return new AuthResponse(accessToken, refreshToken);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var storedToken = await context.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && !t.IsRevoked, cancellationToken);

            if (storedToken == null || storedToken.ExpiresAt < DateTime.UtcNow)
            {
                throw new UnauthorizedAccessException("Invalid or expired refresh token");
            }

            storedToken.IsRevoked = true;
            storedToken.RevokedAt = DateTime.UtcNow;

            var user = await userManager.FindByIdAsync(storedToken.UserId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            var roles = await userManager.GetRolesAsync(user);
            var accessToken = tokenService.GenerateAccessToken(user.Id, user.UserName!, roles);
            var newRefreshToken = tokenService.GenerateRefreshToken();

            storedToken.RevokedByToken = newRefreshToken;

            context.RefreshTokens.Add(new RefreshToken
            {
                Token = newRefreshToken,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _ = CleanupOldTokensAsync(user.Id);

            return new AuthResponse(accessToken, newRefreshToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new UnauthorizedAccessException("Refresh token has already been used");
        }
    }

    private async Task CleanupOldTokensAsync(string userId)
    {
        try
        {
            var tokensToDelete = await context.RefreshTokens
                .Where(t => t.UserId == userId && (t.IsRevoked || t.ExpiresAt < DateTime.UtcNow))
                .ToListAsync();

            if (tokensToDelete.Count > 0)
            {
                context.RefreshTokens.RemoveRange(tokensToDelete);
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to cleanup old tokens for user {UserId}", userId);
        }
    }

    public Task<bool> ValidateTokenAsync(string token)
    {
        var principal = tokenService.ValidateToken(token);
        return Task.FromResult(principal != null);
    }

    public async Task<AuthResponse> ConfirmEmailAsync(ConfirmEmailRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        if (!user.EmailConfirmed)
        {
            var result = await userManager.ConfirmEmailAsync(user, request.Token);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Email confirmation failed: {errors}");
            }
        }

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = tokenService.GenerateAccessToken(user.Id, user.UserName!, roles);
        var refreshToken = tokenService.GenerateRefreshToken();

        await StoreRefreshTokenAsync(user.Id, refreshToken, cancellationToken);

        logger.LogInformation("Email confirmed for user {Username}", user.UserName);
        return new AuthResponse(accessToken, refreshToken);
    }

    public async Task ResendEmailConfirmationAsync(ResendEmailRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            logger.LogWarning("Resend email confirmation requested for non-existent email: {Email}", request.Email);
            return;
        }

        if (user.EmailConfirmed)
        {
            logger.LogInformation("Email already confirmed for user {Username}", user.UserName);
            return;
        }

        await SendEmailConfirmationAsync(user, cancellationToken);
        logger.LogInformation("Verification email resent to user {Username}", user.UserName);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            logger.LogWarning("Password reset requested for non-existent email: {Email}", request.Email);
            return;
        }

        if (!user.EmailConfirmed)
        {
            logger.LogWarning("Password reset requested for unconfirmed email: {Email}", request.Email);
            return;
        }

        await SendPasswordResetEmailAsync(user, cancellationToken);
        logger.LogInformation("Password reset email sent to user {Username}", user.UserName);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Password reset failed: {errors}");
        }

        // Revoke all refresh tokens for security
        var userTokens = await context.RefreshTokens
            .Where(t => t.UserId == user.Id && !t.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in userTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Password reset successfully for user {Username}", user.UserName);
    }

    private async Task SendPasswordResetEmailAsync(IdentityUser user, CancellationToken cancellationToken)
    {
        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = Uri.EscapeDataString(token);
        var frontendUrl = configuration["FrontendUrl"];
        var resetLink = $"{frontendUrl}/reset-password?userId={user.Id}&token={encodedToken}";

        var templatePath = Path.Combine(AppContext.BaseDirectory, "EmailTemplates", "reset-password.html");
        var htmlTemplate = await File.ReadAllTextAsync(templatePath, cancellationToken);

        var htmlBody = htmlTemplate
            .Replace("{UserName}", user.UserName)
            .Replace("{ResetLink}", resetLink);

        await emailService.SendAsync(
            user.Email!,
            "Reset your password - Roadify",
            htmlBody,
            cancellationToken);
    }

    private async Task SendEmailConfirmationAsync(IdentityUser user, CancellationToken cancellationToken)
    {
        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = Uri.EscapeDataString(token);
        var frontendUrl = configuration["FrontendUrl"];
        var confirmationLink = $"{frontendUrl}/auth/confirm-email?userId={user.Id}&token={encodedToken}";

        var templatePath = Path.Combine(AppContext.BaseDirectory, "EmailTemplates", "confirm-email.html");
        var htmlTemplate = await File.ReadAllTextAsync(templatePath, cancellationToken);

        var htmlBody = htmlTemplate
            .Replace("{UserName}", user.UserName)
            .Replace("{ConfirmationLink}", confirmationLink);

        await emailService.SendAsync(
            user.Email!,
            "Confirm your email address - Roadify",
            htmlBody,
            cancellationToken);
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

    public async Task LogoutAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var storedToken = await context.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken && !t.IsRevoked, cancellationToken);

        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            storedToken.RevokedAt = DateTime.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}