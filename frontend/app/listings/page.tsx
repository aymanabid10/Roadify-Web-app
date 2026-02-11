"use client";

import { useEffect, useState, useCallback } from "react";
import { listingApi, vehicleApi, ListingResponse, ListingFilterRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RiSearchLine, RiFilterLine, RiCarLine } from "@remixicon/react";
import Link from "next/link";

export default function BrowseListingsPage() {
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [listingType, setListingType] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: ListingFilterRequest = {
        page,
        pageSize,
        search: debouncedSearchTerm || undefined,
        listingTypeString: listingType,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        status: 2, // Only published listings
        sortBy: "CreatedAt",
        sortOrder: "desc",
      };

      const response = await listingApi.getPublicListings(filters);
      console.log("Listings response:", response.data);
      if (response.data.length > 0) {
        console.log("First listing type:", response.data[0].listingType, typeof response.data[0].listingType);
      }
      setListings(response.data);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to fetch listings");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearchTerm, listingType, minPrice, maxPrice]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-10">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Listings</h1>
        <p className="text-muted-foreground">
          Explore vehicles available for sale and rent
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RiFilterLine className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={listingType || "all"}
                onValueChange={(value) => {
                  setListingType(value === "all" ? undefined : value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="SALE">For Sale</SelectItem>
                  <SelectItem value="RENT">For Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Price Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {listings.length} of {totalCount} listings
        </p>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <RiCarLine className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No listings found</h3>
              <p className="text-muted-foreground">
                {searchTerm || listingType || minPrice || maxPrice
                  ? "Try adjusting your filters"
                  : "No vehicles are currently available"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Listing Card Component with Carousel
function ListingCard({ listing }: { listing: ListingResponse }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  // Fetch vehicle photos
  useEffect(() => {
    const fetchVehiclePhotos = async () => {
      try {
        const vehicle = await vehicleApi.getVehicleById(listing.vehicleId);
        setPhotos(vehicle.photoUrls || []);
      } catch (error) {
        // If fetch fails, just show no photos
        setPhotos([]);
      }
    };

    fetchVehiclePhotos();
  }, [listing.vehicleId]);

  const hasMultiplePhotos = photos.length > 1;

  // Auto-slide when hovered
  useEffect(() => {
    if (!isHovered || !hasMultiplePhotos) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovered, hasMultiplePhotos, photos.length]);

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full">
        {/* Image Carousel */}
        <div 
          className="h-48 bg-muted relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {photos.length > 0 ? (
            <>
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${photos[currentPhotoIndex]}`}
                alt={listing.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              
              {/* Navigation Arrows */}
              {hasMultiplePhotos && isHovered && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Photo Indicators */}
              {hasMultiplePhotos && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentPhotoIndex(index);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentPhotoIndex 
                          ? 'w-6 bg-white' 
                          : 'w-1.5 bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <RiCarLine className="h-12 w-12 text-muted-foreground opacity-50" />
            </div>
          )}
          <Badge 
            className={`absolute top-2 right-2 ${
              listing.listingType === 0 || listing.listingType === "SALE" || listing.listingType === "Sale"
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {listing.listingType === 0 || listing.listingType === "SALE" || listing.listingType === "Sale" ? "FOR SALE" : "FOR RENT"}
          </Badge>
        </div>

        <CardHeader>
          <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {listing.description || "No description available"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                ${listing.price.toLocaleString()}
              </span>
              {listing.isPriceNegotiable && (
                <Badge variant="outline" className="text-xs">
                  Negotiable
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{listing.location}</span>
              <span>•</span>
              <span>{listing.viewCount} views</span>
            </div>
            {listing.expertise && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  ✓ Expert Verified
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Score: {listing.expertise.conditionScore}/100
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
