using System.ComponentModel.DataAnnotations;
using apiroot.Models;

namespace apiroot.DTOs;

public class CreateListingRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public ListingType ListingType { get; set; }

    [Required]
    public int VehicleId { get; set; }
}

public class UpdateListingRequest
{
    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public ListingType? ListingType { get; set; }
}

public class ListingResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ListingType ListingType { get; set; }
    public ListingStatus Status { get; set; }
    public int VehicleId { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string? OwnerUsername { get; set; }
    public int ViewCount { get; set; }
    public float TrustScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public ExpertiseResponse? Expertise { get; set; }
}
