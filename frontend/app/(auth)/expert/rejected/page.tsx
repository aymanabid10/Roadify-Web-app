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
import { RiEyeLine, RiFileList3Line, RiCloseCircleLine } from "@remixicon/react";
import Link from "next/link";

export default function ExpertRejectedListingsPage() {
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
        status: 3, // REJECTED only
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
            <RiCloseCircleLine className="h-8 w-8 text-red-500" />
            Rejected Listings
          </h1>
          <p className="text-muted-foreground mt-1">
            Listings you&apos;ve rejected with feedback
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
          <CardTitle>Rejected Listings</CardTitle>
          <CardDescription>
            Showing {listings.length} of {totalCount} listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RiFileList3Line className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rejected listings found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {listings.map((listing) => (
                <div key={listing.id} className="space-y-3">
                  <ListingCard
                    listing={listing}
                    showOwner={true}
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
                  {listing.expertise?.rejectionReason && (
                    <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <RiCloseCircleLine className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                              Rejection Reason:
                            </p>
                            <p className="text-sm text-red-800 dark:text-red-200">
                              {listing.expertise.rejectionReason}
                            </p>
                            {listing.expertise.rejectionFeedback && (
                              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                                <strong>Feedback:</strong> {listing.expertise.rejectionFeedback}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
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
