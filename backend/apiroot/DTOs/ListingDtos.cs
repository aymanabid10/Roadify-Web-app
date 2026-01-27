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
    [Range(0, 100000000)]
    public decimal Price { get; set; }

    public Currency Currency { get; set; }
    public bool IsPriceNegotiable { get; set; }
    
    [MaxLength(20)]
    public string? ContactPhone { get; set; }

    [Required]
    public ListingType ListingType { get; set; }

    [Required]
    public int VehicleId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Location { get; set; } = string.Empty;

    public List<string> Features { get; set; } = new();
}

public class UpdateListingRequest
{
    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(0, 100000000)]
    public decimal? Price { get; set; }

    public Currency? Currency { get; set; }
    public bool? IsPriceNegotiable { get; set; }

    [MaxLength(20)]
    public string? ContactPhone { get; set; }

    public ListingType? ListingType { get; set; }

    [MaxLength(100)]
    public string? Location { get; set; }
    
    public List<string>? Features { get; set; }
}

public class ListingResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public Currency Currency { get; set; }
    public bool IsPriceNegotiable { get; set; }
    public string? ContactPhone { get; set; }
    public ListingType ListingType { get; set; }
    public ListingStatus Status { get; set; }
    public string Location { get; set; } = string.Empty;
    public List<string> Features { get; set; } = new();
    public DateTime? ExpirationDate { get; set; }
    public int VehicleId { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string? OwnerUsername { get; set; }
    public int ViewCount { get; set; }
    public float TrustScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public ExpertiseResponse? Expertise { get; set; }
}
