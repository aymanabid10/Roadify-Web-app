using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using apiroot.Data;
using apiroot.DTOs;
using apiroot.Enums;
using apiroot.Interfaces;
using apiroot.Models;

namespace apiroot.Services;

public class ListingService : IListingService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public ListingService(ApplicationDbContext context, UserManager<IdentityUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // New type-specific create methods
    public async Task<SaleListingResponse> CreateSaleListingAsync(CreateSaleListingRequest request, string userId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == request.VehicleId && v.UserId == userId, cancellationToken);

        if (vehicle == null)
        {
            throw new InvalidOperationException("Vehicle not found or does not belong to user");
        }

        var listing = new SaleListing
        {
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            Currency = request.Currency,
            IsPriceNegotiable = request.IsPriceNegotiable,
            ContactPhone = request.ContactPhone,
            Location = request.Location,
            Features = request.Features,
            VehicleId = request.VehicleId,
            OwnerId = userId,
            HasClearTitle = request.HasClearTitle,
            FinancingAvailable = request.FinancingAvailable,
            TradeInAccepted = request.TradeInAccepted,
            WarrantyInfo = request.WarrantyInfo
        };

        _context.Listings.Add(listing);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToSaleListingResponse(listing);
    }

    public async Task<RentListingResponse> CreateRentListingAsync(CreateRentListingRequest request, string userId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == request.VehicleId && v.UserId == userId, cancellationToken);

        if (vehicle == null)
        {
            throw new InvalidOperationException("Vehicle not found or does not belong to user");
        }

        var listing = new RentListing
        {
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            Currency = request.Currency,
            IsPriceNegotiable = request.IsPriceNegotiable,
            ContactPhone = request.ContactPhone,
            Location = request.Location,
            Features = request.Features,
            VehicleId = request.VehicleId,
            OwnerId = userId,
            WeeklyRate = request.WeeklyRate,
            MonthlyRate = request.MonthlyRate,
            SecurityDeposit = request.SecurityDeposit,
            MinimumRentalPeriod = request.MinimumRentalPeriod,
            MaximumRentalPeriod = request.MaximumRentalPeriod,
            MileageLimitPerDay = request.MileageLimitPerDay,
            InsuranceIncluded = request.InsuranceIncluded,
            FuelPolicy = request.FuelPolicy,
            DeliveryAvailable = request.DeliveryAvailable,
            DeliveryFee = request.DeliveryFee
        };

        _context.Listings.Add(listing);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToRentListingResponse(listing);
    }

    // Legacy method for backward compatibility
    [Obsolete("Use CreateSaleListingAsync or CreateRentListingAsync instead")]
    public async Task<ListingResponse> CreateListingAsync(CreateListingRequest request, string userId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == request.VehicleId && v.UserId == userId, cancellationToken);

        if (vehicle == null)
        {
            throw new InvalidOperationException("Vehicle not found or does not belong to user");
        }

        Listing listing;
        if (request.ListingType == ListingType.SALE)
        {
            listing = new SaleListing
            {
                Title = request.Title,
                Description = request.Description,
                Price = request.Price,
                Currency = request.Currency,
                IsPriceNegotiable = request.IsPriceNegotiable,
                ContactPhone = request.ContactPhone,
                Location = request.Location,
                Features = request.Features,
                VehicleId = request.VehicleId,
                OwnerId = userId
            };
        }
        else
        {
            listing = new RentListing
            {
                Title = request.Title,
                Description = request.Description,
                Price = request.Price,
                Currency = request.Currency,
                IsPriceNegotiable = request.IsPriceNegotiable,
                ContactPhone = request.ContactPhone,
                Location = request.Location,
                Features = request.Features,
                VehicleId = request.VehicleId,
                OwnerId = userId,
                SecurityDeposit = 0
            };
        }

        _context.Listings.Add(listing);
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(listing, cancellationToken);
    }

    public async Task<ListingResponse?> GetListingByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var listing = await _context.Listings
            .Include(l => l.Owner)
            .Include(l => l.Vehicle)
            .Include(l => l.Expertise)
                .ThenInclude(e => e!.Expert)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (listing == null)
        {
            return null;
        }

        // Increment view count
        listing.ViewCount++;
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(listing, cancellationToken);
    }

    public async Task<PaginatedResponse<ListingResponse>> GetPublicListingsAsync(ListingFilterRequest filter, CancellationToken cancellationToken = default)
    {
        var query = _context.Listings
            .Include(l => l.Owner)
            .Include(l => l.Vehicle)
            .Include(l => l.Expertise)
            .AsQueryable();

        // Public endpoint: Only show PUBLISHED listings
        if (filter.Status.HasValue)
        {
            query = query.Where(l => l.Status == filter.Status.Value);
        }
        else
        {
            query = query.Where(l => l.Status == ListingStatus.PUBLISHED);
        }

        return await ApplyFiltersAndPaginationAsync(query, filter, cancellationToken);
    }

    public async Task<PaginatedResponse<ListingResponse>> GetAllListingsAsync(ListingFilterRequest filter, CancellationToken cancellationToken = default)
    {
        var query = _context.Listings
            .Include(l => l.Owner)
            .Include(l => l.Vehicle)
            .Include(l => l.Expertise)
            .AsQueryable();

        // Admin/Expert endpoint: Show all listings except archived
        if (filter.Status.HasValue)
        {
            query = query.Where(l => l.Status == filter.Status.Value);
        }
        else
        {
            query = query.Where(l => l.Status != ListingStatus.ARCHIVED);
        }

        return await ApplyFiltersAndPaginationAsync(query, filter, cancellationToken);
    }

    private async Task<PaginatedResponse<ListingResponse>> ApplyFiltersAndPaginationAsync(
        IQueryable<Listing> query, 
        ListingFilterRequest filter, 
        CancellationToken cancellationToken)
    {

        if (filter.ListingType.HasValue)
        {
            if (filter.ListingType.Value == ListingType.SALE)
            {
                query = query.OfType<SaleListing>();
            }
            else if (filter.ListingType.Value == ListingType.RENT)
            {
                query = query.OfType<RentListing>();
            }
        }

        if (!string.IsNullOrEmpty(filter.OwnerId))
        {
            query = query.Where(l => l.OwnerId == filter.OwnerId);
        }

        if (filter.VehicleId.HasValue)
        {
            query = query.Where(l => l.VehicleId == filter.VehicleId.Value);
        }

        if (filter.MinPrice.HasValue)
        {
            query = query.Where(l => l.Price >= filter.MinPrice.Value);
        }

        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(l => l.Price <= filter.MaxPrice.Value);
        }

        if (!string.IsNullOrEmpty(filter.Location))
        {
            query = query.Where(l => l.Location.Contains(filter.Location));
        }

        if (!string.IsNullOrEmpty(filter.Search))
        {
            query = query.Where(l => l.Title.Contains(filter.Search) || 
                                    (l.Description != null && l.Description.Contains(filter.Search)));
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = filter.SortBy.ToLower() switch
        {
            "title" => filter.SortOrder.ToLower() == "asc" 
                ? query.OrderBy(l => l.Title) 
                : query.OrderByDescending(l => l.Title),
            "price" => filter.SortOrder.ToLower() == "asc" 
                ? query.OrderBy(l => l.Price) 
                : query.OrderByDescending(l => l.Price),
            "status" => filter.SortOrder.ToLower() == "asc" 
                ? query.OrderBy(l => l.Status) 
                : query.OrderByDescending(l => l.Status),
            "viewcount" => filter.SortOrder.ToLower() == "asc" 
                ? query.OrderBy(l => l.ViewCount) 
                : query.OrderByDescending(l => l.ViewCount),
            _ => filter.SortOrder.ToLower() == "asc" 
                ? query.OrderBy(l => l.CreatedAt) 
                : query.OrderByDescending(l => l.CreatedAt)
        };

        // Apply pagination
        var listings = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var items = new List<ListingResponse>();
        foreach (var listing in listings)
        {
            items.Add(await MapToResponseAsync(listing, cancellationToken));
        }

        return new PaginatedResponse<ListingResponse>
        {
            Data = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize),
            HasPrevious = filter.Page > 1,
            HasNext = filter.Page < (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<ListingResponse> UpdateSaleListingAsync(Guid id, UpdateSaleListingRequest request, string userId, CancellationToken cancellationToken = default)
    {
        var listing = await _context.Listings.OfType<SaleListing>().FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (listing == null)
        {
            throw new InvalidOperationException("Sale listing not found");
        }

        if (listing.OwnerId != userId)
        {
            throw new UnauthorizedAccessException("You can only update your own listings");
        }

        if (listing.Status != ListingStatus.DRAFT)
        {
            throw new InvalidOperationException("Can only update listings in DRAFT status");
        }

        // Update common properties
        UpdateCommonListingProperties(listing, request);

        // Update sale-specific properties
        if (request.HasClearTitle.HasValue)
            listing.HasClearTitle = request.HasClearTitle.Value;
        if (request.FinancingAvailable.HasValue)
            listing.FinancingAvailable = request.FinancingAvailable.Value;
        if (request.TradeInAccepted.HasValue)
            listing.TradeInAccepted = request.TradeInAccepted.Value;
        if (request.WarrantyInfo != null)
            listing.WarrantyInfo = request.WarrantyInfo;

        listing.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(listing, cancellationToken);
    }

    public async Task<ListingResponse> UpdateRentListingAsync(Guid id, UpdateRentListingRequest request, string userId, CancellationToken cancellationToken = default)
    {
        var listing = await _context.Listings.OfType<RentListing>().FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (listing == null)
        {
            throw new InvalidOperationException("Rent listing not found");
        }

        if (listing.OwnerId != userId)
        {
            throw new UnauthorizedAccessException("You can only update your own listings");
        }

        if (listing.Status != ListingStatus.DRAFT)
        {
            throw new InvalidOperationException("Can only update listings in DRAFT status");
        }

        // Update common properties
        UpdateCommonListingProperties(listing, request);

        // Update rent-specific properties
        if (request.WeeklyRate.HasValue)
            listing.WeeklyRate = request.WeeklyRate;
        if (request.MonthlyRate.HasValue)
            listing.MonthlyRate = request.MonthlyRate;
        if (request.SecurityDeposit.HasValue)
            listing.SecurityDeposit = request.SecurityDeposit.Value;
        if (request.MinimumRentalPeriod != null)
            listing.MinimumRentalPeriod = request.MinimumRentalPeriod;
        if (request.MaximumRentalPeriod != null)
            listing.MaximumRentalPeriod = request.MaximumRentalPeriod;
        if (request.MileageLimitPerDay.HasValue)
            listing.MileageLimitPerDay = request.MileageLimitPerDay;
        if (request.InsuranceIncluded.HasValue)
            listing.InsuranceIncluded = request.InsuranceIncluded.Value;
        if (request.FuelPolicy != null)
            listing.FuelPolicy = request.FuelPolicy;
        if (request.DeliveryAvailable.HasValue)
            listing.DeliveryAvailable = request.DeliveryAvailable.Value;
        if (request.DeliveryFee.HasValue)
            listing.DeliveryFee = request.DeliveryFee;

        listing.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(listing, cancellationToken);
    }

    private void UpdateCommonListingProperties(Listing listing, UpdateListingRequestBase request)
    {
        if (!string.IsNullOrEmpty(request.Title))
            listing.Title = request.Title;
        if (request.Description != null)
            listing.Description = request.Description;
        if (request.Price.HasValue)
            listing.Price = request.Price.Value;
        if (request.Currency.HasValue)
            listing.Currency = request.Currency.Value;
        if (request.IsPriceNegotiable.HasValue)
            listing.IsPriceNegotiable = request.IsPriceNegotiable.Value;
        if (request.ContactPhone != null)
            listing.ContactPhone = request.ContactPhone;
        if (!string.IsNullOrEmpty(request.Location))
            listing.Location = request.Location;
        if (request.Features != null)
            listing.Features = request.Features;
    }

    [Obsolete("Use UpdateSaleListingAsync or UpdateRentListingAsync instead")]
    public async Task<ListingResponse> UpdateListingAsync(Guid id, UpdateListingRequest request, string userId, CancellationToken cancellationToken = default)
    {
        var listing = await _context.Listings.FindAsync(new object[] { id }, cancellationToken);

        if (listing == null)
        {
            throw new InvalidOperationException("Listing not found");
        }

        if (listing.OwnerId != userId)
        {
            throw new UnauthorizedAccessException("You can only update your own listings");
        }

        if (listing.Status != ListingStatus.DRAFT)
        {
            throw new InvalidOperationException("Can only update listings in DRAFT status");
        }

        if (!string.IsNullOrEmpty(request.Title))
        {
            listing.Title = request.Title;
        }

        if (request.Description != null)
        {
            listing.Description = request.Description;
        }

        if (request.Price.HasValue)
        {
            listing.Price = request.Price.Value;
        }

        if (request.Currency.HasValue)
        {
            listing.Currency = request.Currency.Value;
        }

        if (request.IsPriceNegotiable.HasValue)
        {
            listing.IsPriceNegotiable = request.IsPriceNegotiable.Value;
        }

        if (request.ContactPhone != null)
        {
            listing.ContactPhone = request.ContactPhone;
        }

        if (!string.IsNullOrEmpty(request.Location))
        {
            listing.Location = request.Location;
        }

        if (request.Features != null)
        {
            listing.Features = request.Features;
        }

        listing.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(listing, cancellationToken);
    }

    public async Task DeleteListingAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        var listing = await _context.Listings.FindAsync(new object[] { id }, cancellationToken);

        if (listing == null)
        {
            throw new InvalidOperationException("Listing not found");
        }

        if (listing.OwnerId != userId)
        {
            throw new UnauthorizedAccessException("You can only delete your own listings");
        }

        _context.Listings.Remove(listing);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<ListingResponse> SubmitForReviewAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        var listing = await _context.Listings.FindAsync(new object[] { id }, cancellationToken);

        if (listing == null)
        {
            throw new InvalidOperationException("Listing not found");
        }

        if (listing.OwnerId != userId)
        {
            throw new UnauthorizedAccessException("You can only submit your own listings");
        }

        listing.SubmitForReview();
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(listing, cancellationToken);
    }

    public async Task<ListingResponse> PublishListingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var listing = await _context.Listings.FindAsync(new object[] { id }, cancellationToken);

        if (listing == null)
        {
            throw new InvalidOperationException("Listing not found");
        }

        listing.Publish();
        // Set expiration to 90 days from now
        listing.ExpirationDate = DateTime.UtcNow.AddDays(90);
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(listing, cancellationToken);
    }

    public async Task<ListingResponse> ArchiveListingAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        var listing = await _context.Listings.FindAsync(new object[] { id }, cancellationToken);

        if (listing == null)
        {
            throw new InvalidOperationException("Listing not found");
        }

        if (listing.OwnerId != userId)
        {
            throw new UnauthorizedAccessException("You can only archive your own listings");
        }

        listing.Archive();
        await _context.SaveChangesAsync(cancellationToken);

        return await MapToResponseAsync(listing, cancellationToken);
    }

    private async Task<ListingResponse> MapToResponseAsync(Listing listing, CancellationToken cancellationToken)
    {
        // Ensure navigation properties are loaded
        if (listing.Owner == null)
        {
            await _context.Entry(listing).Reference(l => l.Owner).LoadAsync(cancellationToken);
        }

        if (listing.Expertise == null)
        {
            await _context.Entry(listing).Reference(l => l.Expertise).LoadAsync(cancellationToken);
        }

        ExpertiseResponse? expertiseResponse = null;
        if (listing.Expertise != null)
        {
            if (listing.Expertise.Expert == null)
            {
                await _context.Entry(listing.Expertise).Reference(e => e.Expert).LoadAsync(cancellationToken);
            }

            expertiseResponse = new ExpertiseResponse
            {
                Id = listing.Expertise.Id,
                ListingId = listing.Expertise.ListingId,
                ExpertId = listing.Expertise.ExpertId,
                ExpertUsername = listing.Expertise.Expert?.UserName,
                TechnicalReport = listing.Expertise.TechnicalReport,
                DocumentUrl = listing.Expertise.DocumentUrl,
                IsApproved = listing.Expertise.IsApproved,
                CreatedAt = listing.Expertise.CreatedAt
            };
        }

        var response = new ListingResponse
        {
            Id = listing.Id,
            Title = listing.Title,
            Description = listing.Description,
            Price = listing.Price,
            Currency = listing.Currency,
            IsPriceNegotiable = listing.IsPriceNegotiable,
            ContactPhone = listing.ContactPhone,
            ListingType = listing.GetListingType(),
            Status = listing.Status,
            Location = listing.Location,
            Features = listing.Features,
            ExpirationDate = listing.ExpirationDate,
            VehicleId = listing.VehicleId,
            OwnerId = listing.OwnerId,
            OwnerUsername = listing.Owner?.UserName,
            ViewCount = listing.ViewCount,
            TrustScore = listing.TrustScore,
            CreatedAt = listing.CreatedAt,
            UpdatedAt = listing.UpdatedAt,
            Expertise = expertiseResponse
        };

        // Map type-specific properties
        if (listing is SaleListing saleListing)
        {
            response.HasClearTitle = saleListing.HasClearTitle;
            response.FinancingAvailable = saleListing.FinancingAvailable;
            response.TradeInAccepted = saleListing.TradeInAccepted;
            response.WarrantyInfo = saleListing.WarrantyInfo;
        }
        else if (listing is RentListing rentListing)
        {
            response.WeeklyRate = rentListing.WeeklyRate;
            response.MonthlyRate = rentListing.MonthlyRate;
            response.SecurityDeposit = rentListing.SecurityDeposit;
            response.MinimumRentalPeriod = rentListing.MinimumRentalPeriod;
            response.MaximumRentalPeriod = rentListing.MaximumRentalPeriod;
            response.MileageLimitPerDay = rentListing.MileageLimitPerDay;
            response.InsuranceIncluded = rentListing.InsuranceIncluded;
            response.FuelPolicy = rentListing.FuelPolicy;
            response.DeliveryAvailable = rentListing.DeliveryAvailable;
            response.DeliveryFee = rentListing.DeliveryFee;
        }

        return response;
    }

    private SaleListingResponse MapToSaleListingResponse(SaleListing listing)
    {
        return new SaleListingResponse
        {
            Id = listing.Id,
            Title = listing.Title,
            Description = listing.Description,
            Price = listing.Price,
            Currency = listing.Currency,
            IsPriceNegotiable = listing.IsPriceNegotiable,
            ContactPhone = listing.ContactPhone,
            ListingType = ListingType.SALE,
            Status = listing.Status,
            Location = listing.Location,
            Features = listing.Features,
            ExpirationDate = listing.ExpirationDate,
            VehicleId = listing.VehicleId,
            OwnerId = listing.OwnerId,
            OwnerUsername = listing.Owner?.UserName,
            ViewCount = listing.ViewCount,
            TrustScore = listing.TrustScore,
            CreatedAt = listing.CreatedAt,
            UpdatedAt = listing.UpdatedAt,
            HasClearTitle = listing.HasClearTitle,
            FinancingAvailable = listing.FinancingAvailable,
            TradeInAccepted = listing.TradeInAccepted,
            WarrantyInfo = listing.WarrantyInfo
        };
    }

    private RentListingResponse MapToRentListingResponse(RentListing listing)
    {
        return new RentListingResponse
        {
            Id = listing.Id,
            Title = listing.Title,
            Description = listing.Description,
            Price = listing.Price,
            Currency = listing.Currency,
            IsPriceNegotiable = listing.IsPriceNegotiable,
            ContactPhone = listing.ContactPhone,
            ListingType = ListingType.RENT,
            Status = listing.Status,
            Location = listing.Location,
            Features = listing.Features,
            ExpirationDate = listing.ExpirationDate,
            VehicleId = listing.VehicleId,
            OwnerId = listing.OwnerId,
            OwnerUsername = listing.Owner?.UserName,
            ViewCount = listing.ViewCount,
            TrustScore = listing.TrustScore,
            CreatedAt = listing.CreatedAt,
            UpdatedAt = listing.UpdatedAt,
            WeeklyRate = listing.WeeklyRate,
            MonthlyRate = listing.MonthlyRate,
            SecurityDeposit = listing.SecurityDeposit,
            MinimumRentalPeriod = listing.MinimumRentalPeriod,
            MaximumRentalPeriod = listing.MaximumRentalPeriod,
            MileageLimitPerDay = listing.MileageLimitPerDay,
            InsuranceIncluded = listing.InsuranceIncluded,
            FuelPolicy = listing.FuelPolicy,
            DeliveryAvailable = listing.DeliveryAvailable,
            DeliveryFee = listing.DeliveryFee
        };
    }
}
