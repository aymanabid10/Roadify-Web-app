"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { listingApi, vehicleApi, reviewsApi, ListingResponse, VehicleResponseDto } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RiArrowLeftLine, RiCarLine, RiMapPinLine, RiMoneyDollarCircleLine, RiPhoneLine, RiCheckLine, RiCloseLine, RiStarLine, RiStarFill } from "@remixicon/react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const listingId = params.id as string;
  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [vehicle, setVehicle] = useState<VehicleResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(10);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const fetchListing = async () => {
    try {
      setIsLoading(true);
      const data = await listingApi.getListingById(listingId);
      setListing(data);

      // Fetch vehicle details
      const vehicleData = await vehicleApi.getVehicleById(data.vehicleId);
      setVehicle(vehicleData);
    } catch (error) {
      toast.error("Failed to load listing");
      router.push("/listings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!listing?.ownerId || !isAuthenticated) return;

    // Double-check: prevent self-review
    if (user?.id === listing.ownerId) {
      toast.error("You cannot review your own listing");
      setReviewDialogOpen(false);
      return;
    }

    setIsSubmittingReview(true);
    try {
      await reviewsApi.createReview({
        targetUserId: listing.ownerId,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      toast.success("Review submitted successfully!");
      setReviewDialogOpen(false);
      setReviewRating(10);
      setReviewComment("");
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStars = (rating: number) => {
    // Convert 1-10 to 1-5 stars for display (2 points = 1 star)
    const starRating = Math.ceil(rating / 2);
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= starRating ? (
            <RiStarFill key={star} className="h-5 w-5 text-yellow-500" />
          ) : (
            <RiStarLine key={star} className="h-5 w-5 text-gray-300" />
          )
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    if (rating <= 2) return "Poor";
    if (rating <= 4) return "Fair";
    if (rating <= 6) return "Good";
    if (rating <= 8) return "Very Good";
    return "Excellent";
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!listing || !vehicle) {
    return null;
  }

  const isSale = listing.listingType === 0 || listing.listingType === "SALE" || listing.listingType === "Sale";
  const photos = vehicle.photoUrls && vehicle.photoUrls.length > 0 ? vehicle.photoUrls : [];

  // Status mapping
  const STATUS_MAP = {
    0: { label: "Draft", color: "bg-gray-500" },
    1: { label: "Pending Review", color: "bg-yellow-500" },
    2: { label: "Published", color: "bg-green-500" },
    3: { label: "Rejected", color: "bg-red-500" },
    4: { label: "Archived", color: "bg-gray-400" },
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/listings">
          <Button variant="outline" size="icon">
            <RiArrowLeftLine className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{listing.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={STATUS_MAP[listing.status as keyof typeof STATUS_MAP].color}>
              {STATUS_MAP[listing.status as keyof typeof STATUS_MAP].label}
            </Badge>
            <Badge className={isSale ? "bg-green-600" : "bg-blue-600"}>
              {isSale ? "FOR SALE" : "FOR RENT"}
            </Badge>
            {listing.expertise && (
              <Badge variant="secondary">✓ Expert Verified</Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">
            ${listing.price.toLocaleString()}
            {!isSale && <span className="text-lg font-normal text-muted-foreground">/day</span>}
          </div>
          {listing.isPriceNegotiable && (
            <Badge variant="outline" className="mt-1">Negotiable</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photos and Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery */}
          <Card>
            <CardContent className="p-0">
              <div className="relative h-96 bg-muted">
                {photos.length > 0 ? (
                  <>
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${photos[currentPhotoIndex]}`}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
                        >
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
                        >
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {photos.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentPhotoIndex(index)}
                              className={`h-2 rounded-full transition-all ${
                                index === currentPhotoIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <RiCarLine className="h-24 w-24 text-muted-foreground opacity-50" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Make & Model</p>
                  <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{vehicle.vehicleType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <p className="font-medium">{vehicle.color || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mileage</p>
                  <p className="font-medium">{vehicle.mileage?.toLocaleString() || 0} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration</p>
                  <p className="font-medium font-mono text-xs">{vehicle.registrationNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          {listing.features && listing.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {listing.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Pricing and Contact */}
        <div className="space-y-6">
          {/* Pricing Details */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSale ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sale Price</span>
                    <span className="text-2xl font-bold">${listing.price.toLocaleString()}</span>
                  </div>
                  {listing.hasClearTitle !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Clear Title</span>
                      <span>{listing.hasClearTitle ? <RiCheckLine className="h-5 w-5 text-green-600" /> : <RiCloseLine className="h-5 w-5 text-red-600" />}</span>
                    </div>
                  )}
                  {listing.financingAvailable !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Financing Available</span>
                      <span>{listing.financingAvailable ? <RiCheckLine className="h-5 w-5 text-green-600" /> : <RiCloseLine className="h-5 w-5 text-red-600" />}</span>
                    </div>
                  )}
                  {listing.tradeInAccepted !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Trade-In Accepted</span>
                      <span>{listing.tradeInAccepted ? <RiCheckLine className="h-5 w-5 text-green-600" /> : <RiCloseLine className="h-5 w-5 text-red-600" />}</span>
                    </div>
                  )}
                  {listing.warrantyInfo && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Warranty</p>
                      <p className="text-sm">{listing.warrantyInfo}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Daily Rate</span>
                    <span className="text-2xl font-bold">${listing.price.toLocaleString()}</span>
                  </div>
                  {listing.weeklyRate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Weekly Rate</span>
                      <span className="font-semibold">${listing.weeklyRate.toLocaleString()}</span>
                    </div>
                  )}
                  {listing.monthlyRate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Monthly Rate</span>
                      <span className="font-semibold">${listing.monthlyRate.toLocaleString()}</span>
                    </div>
                  )}
                  {listing.securityDeposit && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-muted-foreground">Security Deposit</span>
                      <span className="font-semibold">${listing.securityDeposit.toLocaleString()}</span>
                    </div>
                  )}
                  {listing.minimumRentalPeriod && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Min Rental</span>
                      <span>{listing.minimumRentalPeriod}</span>
                    </div>
                  )}
                  {listing.maximumRentalPeriod && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Max Rental</span>
                      <span>{listing.maximumRentalPeriod}</span>
                    </div>
                  )}
                  {listing.mileageLimitPerDay && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Mileage Limit</span>
                      <span>{listing.mileageLimitPerDay} km/day</span>
                    </div>
                  )}
                  {listing.insuranceIncluded !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Insurance Included</span>
                      <span>{listing.insuranceIncluded ? <RiCheckLine className="h-5 w-5 text-green-600" /> : <RiCloseLine className="h-5 w-5 text-red-600" />}</span>
                    </div>
                  )}
                  {listing.fuelPolicy && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Fuel Policy</p>
                      <p className="text-sm">{listing.fuelPolicy}</p>
                    </div>
                  )}
                  {listing.deliveryAvailable !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Delivery Available</span>
                      <span>{listing.deliveryAvailable ? <RiCheckLine className="h-5 w-5 text-green-600" /> : <RiCloseLine className="h-5 w-5 text-red-600" />}</span>
                    </div>
                  )}
                  {listing.deliveryFee && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>${listing.deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <RiMapPinLine className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span>{listing.location}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Seller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Seller</p>
                <p className="font-medium">{listing.ownerUsername || "Anonymous"}</p>
              </div>
              {listing.contactPhone && (
                <div className="flex items-center gap-2">
                  <RiPhoneLine className="h-5 w-5 text-muted-foreground" />
                  <a href={`tel:${listing.contactPhone}`} className="text-primary hover:underline">
                    {listing.contactPhone}
                  </a>
                </div>
              )}
              <div className="space-y-2">
                <Button className="w-full" size="lg">
                  <RiPhoneLine className="h-5 w-5 mr-2" />
                  Contact Seller
                </Button>
                {isAuthenticated && user?.id !== listing.ownerId && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    size="lg"
                    onClick={() => setReviewDialogOpen(true)}
                  >
                    <RiStarLine className="h-5 w-5 mr-2" />
                    Write a Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expert Review */}
          {listing.expertise && (
            <Card>
              <CardHeader>
                <CardTitle>Expert Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Condition Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${listing.expertise.conditionScore}%` }}
                      />
                    </div>
                    <span className="font-bold">{listing.expertise.conditionScore}/100</span>
                  </div>
                </div>
                {listing.expertise.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Expert Notes</p>
                    <p className="text-sm">{listing.expertise.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Write Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {listing?.ownerUsername}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Rating *</Label>
                <div className="flex items-center gap-2">
                  {renderStars(reviewRating)}
                  <span className="text-sm font-semibold text-primary">{reviewRating}/10</span>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span className="font-medium text-foreground">{getRatingLabel(reviewRating)}</span>
                  <span>10</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-comment">Comment (Optional)</Label>
              <Textarea
                id="review-comment"
                placeholder="Share your experience with this seller..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reviewComment.length}/500
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReviewDialogOpen(false)} 
              disabled={isSubmittingReview}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
