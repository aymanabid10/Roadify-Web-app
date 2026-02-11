"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { expertApi, vehicleApi, ListingResponse, ListingFilterRequest } from "@/lib/api";
import { ListingCard } from "@/components/listing-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RiEyeLine, RiFileList3Line, RiCheckDoubleLine } from "@remixicon/react";
import Link from "next/link";

export default function ExpertApprovedListingsPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, hasRole } = useAuth();
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasRole("EXPERT")) {
        router.push("/unauthorized");
      }
    }
  }, [authLoading, isAuthenticated, hasRole, router]);

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
        status: 2, // PUBLISHED (approved) only
      };

      const response = await expertApi.getPendingListings(filters);
      
      // Fetch vehicle data for each listing to display photos
      const listingsWithVehicles = await Promise.all(
        response.data.map(async (listing) => {
          if (listing.vehicleId && !listing.vehicle) {
            try {
              const vehicleData = await vehicleApi.getVehicleById(listing.vehicleId);
              return { ...listing, vehicle: vehicleData };
            } catch (error) {
              console.error(`Failed to fetch vehicle for listing ${listing.id}:`, error);
              return listing;
            }
          }
          return listing;
        })
      );
      
      setListings(listingsWithVehicles);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to fetch listings");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    if (!authLoading && hasRole("EXPERT")) {
      fetchListings();
    }
  }, [authLoading, hasRole, fetchListings]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-12 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("EXPERT")) {
    return null;
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RiCheckDoubleLine className="h-8 w-8 text-green-500" />
            Approved Listings
          </h1>
          <p className="text-muted-foreground mt-1">
            Listings you&apos;ve approved and published
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Listings</CardTitle>
          <CardDescription>
            Showing {listings.length} of {totalCount} listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RiFileList3Line className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No approved listings found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  showExpertise={true}
                  onClick={() => router.push(`/listings/${listing.id}`)}
                  actions={
                    <Link href={`/listings/${listing.id}`}>
                      <Button size="sm" variant="outline">
                        <RiEyeLine className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  }
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
