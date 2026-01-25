using System.ComponentModel.DataAnnotations;

namespace apiroot.DTOs;

public class CreateReviewRequest
{
    [Required]
    public string TargetUserId { get; set; } = string.Empty;

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
}

public class ReviewResponse
{
    public Guid Id { get; set; }
    public string ReviewerId { get; set; } = string.Empty;
    public string? ReviewerUsername { get; set; }
    public string TargetUserId { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsVisible { get; set; }
    public DateTime CreatedAt { get; set; }
}
