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
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _emailService;

    public ExpertiseService(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IEmailService emailService)
    {
        _context = context;
        _userManager = userManager;
        _emailService = emailService;
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
            InspectionDate = request.InspectionDate.HasValue 
                ? DateTime.SpecifyKind(request.InspectionDate.Value, DateTimeKind.Utc)
                : DateTime.UtcNow
        };

        _context.Expertises.Add(expertise);

        // NOTE: Listing status is NOT changed here
        // Expert must explicitly call ApproveListingAsync or RejectListingAsync
        // This allows experts to: create expertise → upload documents → then approve/reject
        
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
                .ThenInclude(l => l.Owner)
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

        // Send approval notification email
        if (expertise.Listing?.Owner?.Email != null)
        {
            try
            {
                var subject = "Your listing has been approved!";
                var body = $@"
                    <h2>Listing Approved</h2>
                    <p>Dear {expertise.Listing.Owner.UserName},</p>
                    <p>Great news! Your listing <strong>{expertise.Listing.Title}</strong> has been approved by our expert team.</p>
                    <p><strong>Status:</strong> Published</p>
                    <p><strong>Condition Score:</strong> {expertise.ConditionScore}/100</p>
                    {(expertise.EstimatedValue.HasValue ? $"<p><strong>Estimated Value:</strong> {expertise.EstimatedValue:C}</p>" : "")}
                    <p>Your listing is now live and visible to potential buyers/renters.</p>
                ";
                await _emailService.SendAsync(expertise.Listing.Owner.Email, subject, body, cancellationToken);
            }
            catch (Exception ex)
            {
                // Log but don't fail the operation if email fails
                Console.WriteLine($"Failed to send approval email: {ex.Message}");
            }
        }

        return await MapToResponseAsync(expertise, cancellationToken);
    }

    public async Task<ExpertiseResponse> RejectListingAsync(Guid expertiseId, string expertId, string? reason = null, string? feedback = null, CancellationToken cancellationToken = default)
    {
        var expertise = await _context.Expertises
            .Include(e => e.Listing)
                .ThenInclude(l => l.Owner)
            .FirstOrDefaultAsync(e => e.Id == expertiseId, cancellationToken);

        if (expertise == null)
        {
            throw new InvalidOperationException("Expertise not found");
        }

        if (expertise.ExpertId != expertId)
        {
            throw new UnauthorizedAccessException("You can only reject your own expertise reviews");
        }

        expertise.Reject(reason, feedback);
        await _context.SaveChangesAsync(cancellationToken);

        // Send rejection notification email
        if (expertise.Listing?.Owner?.Email != null)
        {
            try
            {
                var subject = "Your listing has been reviewed";
                var body = $@"
                    <h2>Listing Review Result</h2>
                    <p>Dear {expertise.Listing.Owner.UserName},</p>
                    <p>Your listing <strong>{expertise.Listing.Title}</strong> has been reviewed by our expert team.</p>
                    <p><strong>Status:</strong> Rejected</p>
                    {(reason != null ? $"<p><strong>Reason:</strong> {reason}</p>" : "")}
                    {(feedback != null ? $"<p><strong>Feedback:</strong> {feedback}</p>" : "")}
                    <p>Please review the feedback and make necessary adjustments before resubmitting.</p>
                ";
                await _emailService.SendAsync(expertise.Listing.Owner.Email, subject, body, cancellationToken);
            }
            catch (Exception ex)
            {
                // Log but don't fail the operation if email fails
                Console.WriteLine($"Failed to send rejection email: {ex.Message}");
            }
        }

        return await MapToResponseAsync(expertise, cancellationToken);
    }

    public async Task<ExpertiseResponse> UploadDocumentAsync(Guid expertiseId, string expertId, string documentUrl, CancellationToken cancellationToken = default)
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
            throw new UnauthorizedAccessException("You can only upload documents to your own expertise reviews");
        }

        // Prevent document upload after listing has been approved or rejected
        if (expertise.Listing.Status == ListingStatus.PUBLISHED)
        {
            throw new InvalidOperationException("Cannot upload documents to approved listings. The listing has already been published.");
        }

        if (expertise.Listing.Status == ListingStatus.REJECTED)
        {
            throw new InvalidOperationException("Cannot upload documents to rejected listings. Create a new expertise review if the listing is resubmitted.");
        }

        expertise.DocumentUrl = documentUrl;
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(expertise, cancellationToken);
    }

    public async Task<ExpertiseResponse> UpdateDocumentAsync(Guid expertiseId, string expertId, string newDocumentUrl, CancellationToken cancellationToken = default)
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
            throw new UnauthorizedAccessException("You can only update documents for your own expertise reviews");
        }

        // Prevent document update after listing has been approved or rejected
        if (expertise.Listing.Status == ListingStatus.PUBLISHED)
        {
            throw new InvalidOperationException("Cannot update documents for approved listings. The listing has already been published.");
        }

        if (expertise.Listing.Status == ListingStatus.REJECTED)
        {
            throw new InvalidOperationException("Cannot update documents for rejected listings. Create a new expertise review if the listing is resubmitted.");
        }

        // Store old document URL for cleanup
        var oldDocumentUrl = expertise.DocumentUrl;

        // Update with new document URL
        expertise.DocumentUrl = newDocumentUrl;
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(expertise, cancellationToken);
    }

    public async Task<ExpertiseResponse> DeleteDocumentAsync(Guid expertiseId, string expertId, CancellationToken cancellationToken = default)
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
            throw new UnauthorizedAccessException("You can only delete documents for your own expertise reviews");
        }

        // Prevent document deletion after listing has been approved or rejected
        if (expertise.Listing.Status == ListingStatus.PUBLISHED)
        {
            throw new InvalidOperationException("Cannot delete documents for approved listings. The listing has already been published.");
        }

        if (expertise.Listing.Status == ListingStatus.REJECTED)
        {
            throw new InvalidOperationException("Cannot delete documents for rejected listings.");
        }

        if (string.IsNullOrEmpty(expertise.DocumentUrl))
        {
            throw new InvalidOperationException("No document to delete");
        }

        // Clear document URL
        expertise.DocumentUrl = null;
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(expertise, cancellationToken);
    }

    public async Task<ExpertiseResponse> UpdateExpertiseReportAsync(Guid expertiseId, UpdateExpertiseRequest request, string expertId, CancellationToken cancellationToken = default)
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
            throw new UnauthorizedAccessException("You can only update your own expertise reviews");
        }

        // Prevent updates after listing has been approved or rejected
        if (expertise.Listing.Status == ListingStatus.PUBLISHED)
        {
            throw new InvalidOperationException("Cannot update approved expertise. The listing has already been published.");
        }

        if (expertise.Listing.Status == ListingStatus.REJECTED)
        {
            throw new InvalidOperationException("Cannot update rejected expertise. Create a new expertise review if the listing is resubmitted.");
        }

        // Update only provided fields
        if (request.TechnicalReport != null)
        {
            expertise.TechnicalReport = request.TechnicalReport;
        }

        if (request.ConditionScore.HasValue)
        {
            expertise.ConditionScore = request.ConditionScore.Value;
        }

        if (request.EstimatedValue.HasValue)
        {
            expertise.EstimatedValue = request.EstimatedValue;
        }

        if (request.InspectionDate.HasValue)
        {
            expertise.InspectionDate = DateTime.SpecifyKind(request.InspectionDate.Value, DateTimeKind.Utc);
        }

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
            RejectionReason = expertise.RejectionReason,
            RejectionFeedback = expertise.RejectionFeedback,
            CreatedAt = expertise.CreatedAt
        };
    }
}
