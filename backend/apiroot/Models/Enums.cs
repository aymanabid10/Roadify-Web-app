namespace apiroot.Models;

public enum ListingStatus
{
    DRAFT,
    PENDING_REVIEW,
    PUBLISHED,
    REJECTED,
    ARCHIVED
}

public enum ListingType
{
    SALE,
    RENT
}

public enum FuelType
{
    GASOLINE,
    DIESEL,
    ELECTRIC,
    HYBRID,
    LPG
}

public enum TransmissionType
{
    MANUAL,
    AUTOMATIC,
    SEMI_AUTOMATIC
}

public enum Currency
{
    TND,
    EUR,
    USD
}
