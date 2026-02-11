using apiroot.DTOs;

namespace apiroot.Interfaces;

public interface IExpertiseService
{
    Task<ExpertiseResponse> CreateExpertiseAsync(CreateExpertiseRequest request, string expertId, CancellationToken cancellationToken = default);
    Task<ExpertiseResponse?> GetExpertiseByListingIdAsync(Guid listingId, CancellationToken cancellationToken = default);
    Task<ExpertiseResponse> ApproveListingAsync(Guid expertiseId, string expertId, CancellationToken cancellationToken = default);
    Task<ExpertiseResponse> RejectListingAsync(Guid expertiseId, string expertId, string? reason = null, string? feedback = null, CancellationToken cancellationToken = default);
    Task<ExpertiseResponse> UploadDocumentAsync(Guid expertiseId, string expertId, string documentUrl, CancellationToken cancellationToken = default);
    Task<ExpertiseResponse> UpdateDocumentAsync(Guid expertiseId, string expertId, string newDocumentUrl, CancellationToken cancellationToken = default);
    Task<ExpertiseResponse> DeleteDocumentAsync(Guid expertiseId, string expertId, CancellationToken cancellationToken = default);
    Task<ExpertiseResponse> UpdateExpertiseReportAsync(Guid expertiseId, UpdateExpertiseRequest request, string expertId, CancellationToken cancellationToken = default);
}
