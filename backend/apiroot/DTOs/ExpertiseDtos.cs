using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public class CreateExpertiseRequest
{
    [Required]
    public Guid ListingId { get; set; }

    [Required]
    [MaxLength(5000)]
    public string TechnicalReport { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? DocumentUrl { get; set; }

    [Required]
    public bool IsApproved { get; set; }

    [Range(0, 100)]
    public int ConditionScore { get; set; }

    public decimal? EstimatedValue { get; set; }

    public DateTime? InspectionDate { get; set; }
}

public class ExpertiseResponse
{
    public Guid Id { get; set; }
    public Guid ListingId { get; set; }
    public string ExpertId { get; set; } = string.Empty;
    public string? ExpertUsername { get; set; }
    public string TechnicalReport { get; set; } = string.Empty;
    public string? DocumentUrl { get; set; }
    public bool IsApproved { get; set; }
    public int ConditionScore { get; set; }
    public decimal? EstimatedValue { get; set; }
    public DateTime InspectionDate { get; set; }
    public string? RejectionReason { get; set; }
    public string? RejectionFeedback { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RejectExpertiseRequest
{
    [Required]
    [MaxLength(200)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Feedback { get; set; }
}

public class UpdateExpertiseRequest
{
    [MaxLength(5000)]
    public string? TechnicalReport { get; set; }

    [Range(0, 100)]
    public int? ConditionScore { get; set; }

    public decimal? EstimatedValue { get; set; }

    public DateTime? InspectionDate { get; set; }
}
