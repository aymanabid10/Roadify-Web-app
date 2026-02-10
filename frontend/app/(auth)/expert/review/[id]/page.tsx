"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { expertApi, listingApi, vehicleApi, ListingResponse, CreateExpertiseRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  RiArrowLeftLine, 
  RiCheckLine, 
  RiLoader4Line, 
  RiFileTextLine, 
  RiStarLine, 
  RiMoneyDollarCircleLine, 
  RiCalendarLine,
  RiCarLine 
} from "@remixicon/react";
import Link from "next/link";

export default function CreateExpertiseReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const listingId = params.id as string;

  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [formData, setFormData] = useState<CreateExpertiseRequest>({
    listingId: "",
    technicalReport: "",
    isApproved: false,
    conditionScore: 50,
    estimatedValue: undefined,
    inspectionDate: new Date().toISOString().split('T')[0],
  });

  // Check authorization
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user && !user.roles?.includes("EXPERT")) {
        router.push("/expert");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch listing details
  useEffect(() => {
    if (listingId && isAuthenticated) {
      fetchListing();
    }
  }, [listingId, isAuthenticated]);

  const fetchListing = async () => {
    try {
      setIsLoading(true);
      const data = await listingApi.getListingById(listingId);
      
      // Fetch vehicle details if not included in listing
      if (data.vehicleId && !data.vehicle) {
        try {
          const vehicleData = await vehicleApi.getVehicleById(data.vehicleId);
          data.vehicle = vehicleData;
        } catch (vehicleError) {
          console.error("Failed to fetch vehicle:", vehicleError);
          // Continue even if vehicle fetch fails
        }
      }
      
      setListing(data);
      setFormData((prev) => ({ ...prev, listingId: data.id }));
    } catch (error) {
      console.error("Failed to load listing:", error);
      toast.error("Failed to load listing");
      router.push("/expert");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!listing) return;

    // Validation
    if (!formData.technicalReport.trim()) {
      toast.error("Technical report is required");
      return;
    }

    if (formData.conditionScore < 0 || formData.conditionScore > 100) {
      toast.error("Condition score must be between 0 and 100");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateExpertiseRequest = {
        ...formData,
        listingId: listing.id,
      };

      await expertApi.createExpertise(payload);
      toast.success("Expertise created successfully");
      router.push("/expert");
    } catch (error: any) {
      const errorMessage = error?.data?.message || "Failed to create expertise";
      toast.error(errorMessage);
      console.error("Create expertise error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!listing) return null;

  const photos = listing.vehicle?.photoUrls && listing.vehicle.photoUrls.length > 0 
    ? listing.vehicle.photoUrls 
    : [];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/expert">
          <Button variant="outline" size="icon">
            <RiArrowLeftLine className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Expertise Review</h1>
          <p className="text-muted-foreground mt-1">
            Provide a professional assessment for: <strong className="text-foreground">{listing.title}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Listing Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Vehicle Photo Carousel */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div 
                className="relative h-64 bg-muted"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {photos.length > 0 ? (
                  <>
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${photos[currentPhotoIndex]}`}
                      alt={listing.vehicle ? `${listing.vehicle.year} ${listing.vehicle.brand} ${listing.vehicle.model}` : listing.title}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                    
                    {/* Navigation Arrows - Show on hover if multiple photos */}
                    {photos.length > 1 && isHovered && (
                      <>
                        <button
                          onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}

                    {/* Photo Indicators */}
                    {photos.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {photos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
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
                    <RiCarLine className="h-16 w-16 text-muted-foreground opacity-50" />
                  </div>
                )}
              </div>
              
              {/* Vehicle Info */}
              {listing.vehicle && (
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-xl">
                      {listing.vehicle.year} {listing.vehicle.brand} {listing.vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {listing.vehicle.vehicleType} • {listing.vehicle.color || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mileage:</span>
                      <span className="font-medium">{listing.vehicle.mileage?.toLocaleString() || 0} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Registration:</span>
                      <span className="font-mono text-xs">{listing.vehicle.registrationNumber}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Badge className={listing.listingType === 0 || listing.listingType === "SALE" ? "bg-green-600" : "bg-blue-600"}>
                      {listing.listingType === 0 || listing.listingType === "SALE" ? "FOR SALE" : "FOR RENT"}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listing Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Listing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <RiMoneyDollarCircleLine className="h-4 w-4 text-primary" />
                <span><strong>Price:</strong> ${listing.price.toLocaleString()}</span>
              </div>
              <div>
                <strong>Location:</strong> {listing.location}
              </div>
              <div>
                <strong>Owner:</strong> {listing.ownerUsername || "Unknown"}
              </div>
              {listing.vehicle && (
                <>
                  <div>
                    <strong>Vehicle:</strong> {listing.vehicle.brand} {listing.vehicle.model}
                  </div>
                  <div>
                    <strong>Year:</strong> {listing.vehicle.year}
                  </div>
                  <div>
                    <strong>Mileage:</strong> {listing.vehicle.mileage?.toLocaleString() || 0} km
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Technical Report */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RiFileTextLine className="h-5 w-5 text-primary" />
                  <CardTitle>Technical Report</CardTitle>
                </div>
                <CardDescription>
                  Provide a comprehensive technical assessment of the vehicle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="technicalReport"
                  value={formData.technicalReport}
                  onChange={(e) => setFormData({ ...formData, technicalReport: e.target.value })}
                  placeholder="Provide detailed findings including:&#10;• Engine condition&#10;• Body and paint condition&#10;• Interior condition&#10;• Mechanical systems&#10;• Safety features&#10;• Any defects or issues found"
                  rows={10}
                  required
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                  <span className="text-primary">💡</span>
                  Include comprehensive details about the vehicle&apos;s condition, any repairs needed, and overall assessment
                </p>
              </CardContent>
            </Card>

            {/* Condition Score */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RiStarLine className="h-5 w-5 text-primary" />
                  <CardTitle>Condition Score</CardTitle>
                </div>
                <CardDescription>
                  Rate the overall condition of the vehicle (0 = Poor, 100 = Excellent)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 bg-muted/50 p-8 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Poor</span>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary">{formData.conditionScore}</div>
                      <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                    </div>
                    <span className="text-sm text-muted-foreground">Excellent</span>
                  </div>
                  <Slider
                    value={[formData.conditionScore]}
                    onValueChange={(value: number[]) => setFormData({ ...formData, conditionScore: value[0] })}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                  <div className="flex justify-center mt-4">
                    <Badge 
                      className="text-base px-4 py-2"
                      variant={formData.conditionScore >= 80 ? "default" : formData.conditionScore >= 60 ? "secondary" : "destructive"}
                    >
                      {formData.conditionScore >= 80 ? "Excellent Condition" : formData.conditionScore >= 60 ? "Good Condition" : formData.conditionScore >= 40 ? "Fair Condition" : "Poor Condition"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Estimated Value */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RiMoneyDollarCircleLine className="h-5 w-5 text-primary" />
                    <Label htmlFor="estimatedValue" className="text-base font-semibold">
                      Estimated Market Value ($)
                    </Label>
                  </div>
                  <Input
                    id="estimatedValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimatedValue || ""}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="e.g., 25000"
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-primary">💡</span>
                    Your professional estimate based on current market conditions and vehicle condition
                  </p>
                </div>

                {/* Inspection Date */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RiCalendarLine className="h-5 w-5 text-primary" />
                    <Label htmlFor="inspectionDate" className="text-base font-semibold">
                      Inspection Date
                    </Label>
                  </div>
                  <Input
                    id="inspectionDate"
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                    className="text-base"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-blue-500 text-xl">ℹ️</span>
                <span>
                  <strong className="text-foreground">Next Steps:</strong> After creating the expertise, you can upload supporting documents (photos, inspection reports) and then approve or reject the listing based on your assessment.
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/expert">
                <Button type="button" variant="outline" size="lg" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RiLoader4Line className="mr-2 h-5 w-5 animate-spin" />
                    Creating Review...
                  </>
                ) : (
                  <>
                    <RiCheckLine className="mr-2 h-5 w-5" />
                    Create Expertise Review
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
