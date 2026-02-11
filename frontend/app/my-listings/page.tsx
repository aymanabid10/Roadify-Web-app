"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { listingApi, ListingResponse, ListingFilterRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  RiFileListLine,
  RiAddCircleLine,
  RiEditLine,
  RiDeleteBin6Line,
  RiSearchLine,
  RiEyeLine,
  RiSendPlane2Line,
  RiArchiveLine,
} from "@remixicon/react";
import Link from "next/link";

const STATUS_MAP = {
  0: { label: "Draft", color: "bg-gray-500", description: "Not submitted" },
  1: { label: "Pending Review", color: "bg-yellow-500", description: "Awaiting expert review" },
  2: { label: "Published", color: "bg-green-500", description: "Live on marketplace" },
  3: { label: "Rejected", color: "bg-red-500", description: "Needs revision" },
  4: { label: "Archived", color: "bg-gray-400", description: "No longer active" },
};

export default function MyListingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchListings = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const filters: ListingFilterRequest = {
        page,
        pageSize,
        search: debouncedSearchTerm || undefined,
        status: statusFilter,
        sortBy: "UpdatedAt",
        sortOrder: "desc",
      };

      const response = await listingApi.getMyListings(filters);
      console.log("My Listings response:", response.data);
      if (response.data.length > 0) {
        console.log("First listing type:", response.data[0].listingType, typeof response.data[0].listingType);
      }
      
      // Filter out archived listings unless explicitly viewing archived status
      let filteredListings = response.data;
      if (statusFilter !== 4) {
        // Exclude archived (status 4) unless user is specifically viewing archived listings
        filteredListings = response.data.filter(listing => listing.status !== 4);
      }
      
      setListings(filteredListings);
      setTotalPages(response.totalPages);
      setTotalCount(filteredListings.length); // Update count to reflect filtered results
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to fetch listings");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearchTerm, statusFilter, isAuthenticated]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleDelete = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      await listingApi.deleteListing(listingId);
      toast.success("Listing deleted successfully");
      fetchListings();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete listing");
    }
  };

  const handleSubmitForReview = async (listingId: string) => {
    setSubmittingId(listingId);
    try {
      await listingApi.submitForReview(listingId);
      toast.success("Listing submitted for expert review");
      await fetchListings(); // Await to ensure UI updates
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to submit listing");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleArchive = async (listingId: string) => {
    try {
      await listingApi.archiveListing(listingId);
      toast.success("Listing archived successfully");
      await fetchListings(); // Await to ensure UI updates
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to archive listing");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 md:p-10">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground">
            Manage your vehicle listings
          </p>
        </div>
        <Link href="/listings/create">
          <Button>
            <RiAddCircleLine className="mr-2 h-4 w-4" />
            Create Listing
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(STATUS_MAP).map(([status, info]) => {
          const count = listings.filter((l) => l.status === parseInt(status)).length;
          return (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">{info.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter?.toString() || "all"}
                onValueChange={(value) => {
                  setStatusFilter(value === "all" ? undefined : parseInt(value));
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="0">Draft</SelectItem>
                  <SelectItem value="1">Pending Review</SelectItem>
                  <SelectItem value="2">Published</SelectItem>
                  <SelectItem value="3">Rejected</SelectItem>
                  <SelectItem value="4">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <RiFileListLine className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No listings found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== undefined
                  ? "Try adjusting your filters"
                  : "Get started by creating your first listing"}
              </p>
              <Link href="/listings/create">
                <Button>
                  <RiAddCircleLine className="mr-2 h-4 w-4" />
                  Create Your First Listing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{listing.title}</h3>
                        <Badge className={STATUS_MAP[listing.status as keyof typeof STATUS_MAP].color}>
                          {STATUS_MAP[listing.status as keyof typeof STATUS_MAP].label}
                        </Badge>
                        <Badge 
                          className={
                            listing.listingType === 0 || listing.listingType === "SALE" || listing.listingType === "Sale"
                              ? "bg-green-600 hover:bg-green-700" 
                              : "bg-blue-600 hover:bg-blue-700"
                          }
                        >
                          {listing.listingType === 0 || listing.listingType === "SALE" || listing.listingType === "Sale" ? "FOR SALE" : "FOR RENT"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {listing.description || "No description"}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <span>
                          <strong>Price:</strong> ${listing.price.toLocaleString()}
                        </span>
                        <span>
                          <strong>Location:</strong> {listing.location}
                        </span>
                        <span>
                          <strong>Views:</strong> {listing.viewCount}
                        </span>
                        <span className="text-muted-foreground">
                          Updated: {new Date(listing.updatedAt || listing.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {listing.status === 3 && listing.expertise?.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900">
                          <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                            Rejection Reason: {listing.expertise.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link href={`/listings/${listing.id}`}>
                        <Button variant="outline" size="sm">
                          <RiEyeLine className="h-4 w-4" />
                        </Button>
                      </Link>
                      {listing.status === 0 && (
                        <>
                          <Link href={`/listings/${listing.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <RiEditLine className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSubmitForReview(listing.id)}
                            disabled={submittingId === listing.id}
                          >
                            <RiSendPlane2Line className="h-4 w-4 mr-1" />
                            {submittingId === listing.id ? "Submitting..." : "Submit"}
                          </Button>
                        </>
                      )}
                      {listing.status === 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchive(listing.id)}
                        >
                          <RiArchiveLine className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(listing.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <RiDeleteBin6Line className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                Page {page} of {totalPages} ({totalCount} total)
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
