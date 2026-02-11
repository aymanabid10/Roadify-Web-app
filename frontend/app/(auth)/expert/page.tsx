"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { expertApi, vehicleApi, ListingResponse, ExpertiseResponse, ListingFilterRequest } from "@/lib/api";
import { CreateExpertiseDialog } from "@/components/expert/create-expertise-dialog";
import { RejectListingDialog } from "@/components/expert/reject-listing-dialog";
import { UploadDocumentDialog } from "@/components/expert/upload-document-dialog";
import { EditExpertiseDialog } from "@/components/expert/edit-expertise-dialog";
import { ListingCard } from "@/components/listing-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RiRefreshLine, RiEyeLine, RiCheckLine, RiCloseLine, RiFileList3Line, RiUploadLine, RiEditLine } from "@remixicon/react";

export default function ExpertDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(1); // Default to PENDING_REVIEW
  const [listingTypeFilter, setListingTypeFilter] = useState<string | undefined>(undefined);

  // Dialog states
  const [selectedListing, setSelectedListing] = useState<ListingResponse | null>(null);
  const [selectedExpertise, setSelectedExpertise] = useState<ExpertiseResponse | null>(null);
  const [createExpertiseOpen, setCreateExpertiseOpen] = useState(false);
  const [editExpertiseOpen, setEditExpertiseOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);

  // Check authorization
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!user?.roles.includes("EXPERT")) {
        router.push("/unauthorized");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Debounce search term
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
        status: statusFilter,
        listingTypeString: listingTypeFilter,
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
      toast.error("Failed to fetch listings");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearchTerm, statusFilter, listingTypeFilter]);

  useEffect(() => {
    if (!authLoading && user?.roles.includes("EXPERT")) {
      fetchListings();
    }
  }, [authLoading, user, fetchListings]);

  const handleReview = (listing: ListingResponse) => {
    if (listing.expertise) {
      // Expertise already exists - show options to upload document, approve, or reject
      setSelectedListing(listing);
      setSelectedExpertise(listing.expertise);
    } else {
      // No expertise yet - navigate to create expertise page
      router.push(`/expert/review/${listing.id}`);
    }
  };

  const handleApprove = async (expertise: ExpertiseResponse) => {
    try {
      await expertApi.approveListing(expertise.id);
      toast.success("Listing approved successfully");
      fetchListings();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to approve listing");
    }
  };

  const handleReject = (expertise: ExpertiseResponse) => {
    setSelectedExpertise(expertise);
    setRejectDialogOpen(true);
  };

  const handleUploadDocument = (expertise: ExpertiseResponse) => {
    setSelectedExpertise(expertise);
    setUploadDocumentOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-12 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Expert Dashboard</h1>
          <p className="text-muted-foreground mt-1">Review and approve listings</p>
        </div>
        <Button onClick={fetchListings} variant="outline" size="sm">
          <RiRefreshLine className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter listings awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter?.toString()}
                onValueChange={(value) => setStatusFilter(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="1">Pending Review</SelectItem>
                  <SelectItem value="2">Published</SelectItem>
                  <SelectItem value="3">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Listing Type</label>
              <Select
                value={listingTypeFilter || "all"}
                onValueChange={(value) => setListingTypeFilter(value === "all" ? undefined : value)}
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
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Listings</CardTitle>
              <CardDescription>
                Showing {listings.length} of {totalCount} total listings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RiFileList3Line className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No listings found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  showOwner={true}
                  showExpertise={true}
                  actions={
                    <>
                      {!listing.expertise ? (
                        <Button size="sm" onClick={() => handleReview(listing)}>
                          <RiEyeLine className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      ) : (
                        <>
                          {listing.status === 1 && ( // PENDING_REVIEW
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedExpertise(listing.expertise!);
                                  setEditExpertiseOpen(true);
                                }}
                              >
                                <RiEditLine className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUploadDocument(listing.expertise!)}
                              >
                                <RiUploadLine className="h-4 w-4 mr-1" />
                                {listing.expertise.documentUrl ? "Update Doc" : "Upload Doc"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleApprove(listing.expertise!)}
                              >
                                <RiCheckLine className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleReject(listing.expertise!)}
                              >
                                <RiCloseLine className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {listing.status !== 1 && (
                            <Badge variant="secondary">
                              {listing.expertise.isApproved ? "Approved" : "Rejected"}
                            </Badge>
                          )}
                        </>
                      )}
                    </>
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

      {/* Dialogs */}
      <CreateExpertiseDialog
        listing={selectedListing}
        open={createExpertiseOpen}
        onOpenChange={setCreateExpertiseOpen}
        onSuccess={fetchListings}
      />
      {selectedExpertise && (
        <EditExpertiseDialog
          expertise={selectedExpertise}
          open={editExpertiseOpen}
          onOpenChange={setEditExpertiseOpen}
          onSuccess={fetchListings}
        />
      )}
      <RejectListingDialog
        expertise={selectedExpertise}
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onSuccess={fetchListings}
      />
      <UploadDocumentDialog
        expertise={selectedExpertise}
        open={uploadDocumentOpen}
        onOpenChange={setUploadDocumentOpen}
        onSuccess={fetchListings}
      />
    </div>
  );
}
