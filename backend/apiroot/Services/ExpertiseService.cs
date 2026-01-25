using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using apiroot.Data;
using apiroot.DTOs;
using apiroot.Interfaces;
using apiroot.Models;

namespace apiroot.Services;

public class ExpertiseService : IExpertiseService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public ExpertiseService(ApplicationDbContext context, UserManager<IdentityUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<ExpertiseResponse> CreateExpertiseAsync(CreateExpertiseRequest request, string expertId, CancellationToken cancellationToken = default)
    {
        // Verify expert has EXPERT role
        var expert = await _userManager.FindByIdAsync(expertId);
        if (expert == null || !await _userManager.IsInRoleAsync(expert, "EXPERT"))
        {
            throw new UnauthorizedAccessException("Only experts can create expertise reviews");
        }

        // Verify listing exists and is in PENDING_REVIEW status
        var listing = await _context.Listings
            .Include(l => l.Expertise)
            .FirstOrDefaultAsync(l => l.Id == request.ListingId, cancellationToken);

        if (listing == null)
        {
            throw new InvalidOperationException("Listing not found");
        }

        if (listing.Status != ListingStatus.PENDING_REVIEW)
        {
            throw new InvalidOperationException("Listing must be in PENDING_REVIEW status to create expertise");
        }

        if (listing.Expertise != null)
        {
            throw new InvalidOperationException("Listing already has an expertise review");
        }

        var expertise = new Expertise
        {
            ListingId = request.ListingId,
            ExpertId = expertId,
            TechnicalReport = request.TechnicalReport,
            DocumentUrl = request.DocumentUrl,
            IsApproved = request.IsApproved,
            ConditionScore = request.ConditionScore,
            EstimatedValue = request.EstimatedValue,
            InspectionDate = request.InspectionDate ?? DateTime.UtcNow
        };

        _context.Expertises.Add(expertise);

        // Update listing status based on approval
        if (request.IsApproved)
        {
            listing.Publish();
        }
        else
        {
            listing.Reject();
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(expertise, cancellationToken);
    }

    public async Task<ExpertiseResponse?> GetExpertiseByListingIdAsync(Guid listingId, CancellationToken cancellationToken = default)
    {
        var expertise = await _context.Expertises
            .Include(e => e.Expert)
            .Include(e => e.Listing)
            .FirstOrDefaultAsync(e => e.ListingId == listingId, cancellationToken);

        if (expertise == null)
        {
            return null;
        }

        return await MapToResponseAsync(expertise, cancellationToken);
    }

    public async Task<ExpertiseResponse> ApproveListingAsync(Guid expertiseId, string expertId, CancellationToken cancellationToken = default)
    {
        var expertise = await _context.Expertises
            .Include(e => e.Listing)
            .FirstOrDefaultAsync(e => e.Id == expertiseId, cancellationToken);

        if (expertise == null)
        {
            throw new InvalidOperationException("Expertise not found");
        }

        if (expertise.ExpertId != expertId)
        {
            throw new UnauthorizedAccessException("You can only approve your own expertise reviews");
        }

        expertise.Approve();
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(expertise, cancellationToken);
    }

    public async Task<ExpertiseResponse> RejectListingAsync(Guid expertiseId, string expertId, CancellationToken cancellationToken = default)
    {
        var expertise = await _context.Expertises
            .Include(e => e.Listing)
            .FirstOrDefaultAsync(e => e.Id == expertiseId, cancellationToken);

        if (expertise == null)
        {
            throw new InvalidOperationException("Expertise not found");
        }

        if (expertise.ExpertId != expertId)
        {
            throw new UnauthorizedAccessException("You can only reject your own expertise reviews");
        }

        expertise.Reject();
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(expertise, cancellationToken);
    }

    private async Task<ExpertiseResponse> MapToResponseAsync(Expertise expertise, CancellationToken cancellationToken)
    {
        // Ensure navigation properties are loaded
        if (expertise.Expert == null)
        {
            await _context.Entry(expertise).Reference(e => e.Expert).LoadAsync(cancellationToken);
        }

        return new ExpertiseResponse
        {
            Id = expertise.Id,
            ListingId = expertise.ListingId,
            ExpertId = expertise.ExpertId,
            ExpertUsername = expertise.Expert?.UserName,
            TechnicalReport = expertise.TechnicalReport,
            DocumentUrl = expertise.DocumentUrl,
            IsApproved = expertise.IsApproved,
            ConditionScore = expertise.ConditionScore,
            EstimatedValue = expertise.EstimatedValue,
            InspectionDate = expertise.InspectionDate,
            CreatedAt = expertise.CreatedAt
        };
    }
}
