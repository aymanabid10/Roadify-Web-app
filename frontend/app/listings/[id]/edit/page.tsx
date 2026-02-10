"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { listingApi, ListingResponse, UpdateSaleListingRequest, UpdateRentListingRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RiArrowLeftLine } from "@remixicon/react";
import Link from "next/link";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listing, setListing] = useState<ListingResponse | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [contactPhone, setContactPhone] = useState("");

  // Sale-specific fields
  const [hasClearTitle, setHasClearTitle] = useState(true);
  const [financingAvailable, setFinancingAvailable] = useState(false);
  const [tradeInAccepted, setTradeInAccepted] = useState(false);
  const [warrantyInfo, setWarrantyInfo] = useState("");

  // Rent-specific fields
  const [weeklyRate, setWeeklyRate] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [minRentalPeriod, setMinRentalPeriod] = useState("");
  const [maxRentalPeriod, setMaxRentalPeriod] = useState("");
  const [mileageLimitPerDay, setMileageLimitPerDay] = useState("");
  const [insuranceIncluded, setInsuranceIncluded] = useState(false);
  const [fuelPolicy, setFuelPolicy] = useState("");
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && listingId) {
      fetchListing();
    }
  }, [isAuthenticated, listingId]);

  const fetchListing = async () => {
    try {
      setIsLoading(true);
      const data = await listingApi.getListingById(listingId);
      setListing(data);
      
      // Populate form
      setTitle(data.title);
      setDescription(data.description || "");
      setPrice(String(data.price));
      setLocation(data.location);
      setIsPriceNegotiable(data.isPriceNegotiable);
      setContactPhone(data.contactPhone || "");

      // Sale-specific
      if (data.hasClearTitle !== undefined) setHasClearTitle(data.hasClearTitle);
      if (data.financingAvailable !== undefined) setFinancingAvailable(data.financingAvailable);
      if (data.tradeInAccepted !== undefined) setTradeInAccepted(data.tradeInAccepted);
      if (data.warrantyInfo) setWarrantyInfo(data.warrantyInfo);

      // Rent-specific
      if (data.weeklyRate) setWeeklyRate(String(data.weeklyRate));
      if (data.monthlyRate) setMonthlyRate(String(data.monthlyRate));
      if (data.securityDeposit) setSecurityDeposit(String(data.securityDeposit));
      if (data.minimumRentalPeriod) setMinRentalPeriod(data.minimumRentalPeriod);
      if (data.maximumRentalPeriod) setMaxRentalPeriod(data.maximumRentalPeriod || "");
      if (data.mileageLimitPerDay) setMileageLimitPerDay(String(data.mileageLimitPerDay));
      if (data.insuranceIncluded !== undefined) setInsuranceIncluded(data.insuranceIncluded);
      if (data.fuelPolicy) setFuelPolicy(data.fuelPolicy);
      if (data.deliveryAvailable !== undefined) setDeliveryAvailable(data.deliveryAvailable);
      if (data.deliveryFee) setDeliveryFee(String(data.deliveryFee));
    } catch (error) {
      toast.error("Failed to load listing");
      router.push("/my-listings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!listing) return;

    if (!title || !price || !location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      if (listing.listingType === "SALE" || listing.listingType === "Sale") {
        const data: UpdateSaleListingRequest = {
          title,
          description: description || undefined,
          price: parseFloat(price),
          isPriceNegotiable,
          location,
          contactPhone: contactPhone || undefined,
          hasClearTitle,
          financingAvailable,
          tradeInAccepted,
          warrantyInfo: warrantyInfo || undefined,
        };
        await listingApi.updateSaleListing(listingId, data);
      } else {
        const data: UpdateRentListingRequest = {
          title,
          description: description || undefined,
          price: parseFloat(price),
          weeklyRate: weeklyRate ? parseFloat(weeklyRate) : undefined,
          monthlyRate: monthlyRate ? parseFloat(monthlyRate) : undefined,
          securityDeposit: securityDeposit ? parseFloat(securityDeposit) : undefined,
          minimumRentalPeriod: minRentalPeriod || undefined,
          maximumRentalPeriod: maxRentalPeriod || undefined,
          isPriceNegotiable,
          location,
          contactPhone: contactPhone || undefined,
          mileageLimitPerDay: mileageLimitPerDay ? parseInt(mileageLimitPerDay) : undefined,
          insuranceIncluded,
          fuelPolicy: fuelPolicy || undefined,
          deliveryAvailable,
          deliveryFee: deliveryFee ? parseFloat(deliveryFee) : undefined,
        };
        await listingApi.updateRentListing(listingId, data);
      }

      toast.success("Listing updated successfully!");
      router.push("/my-listings");
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to update listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !listing) {
    return null;
  }

  const isSale = listing.listingType === "SALE" || listing.listingType === "Sale";
  const isRent = listing.listingType === "RENT" || listing.listingType === "Rent";

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/my-listings">
          <Button variant="outline" size="icon">
            <RiArrowLeftLine className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit {isSale ? "Sale" : "Rent"} Listing
          </h1>
          <p className="text-muted-foreground">
            Update your vehicle {isSale ? "sale" : "rental"} listing
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Listing Details
              <Badge variant={isSale ? "default" : "secondary"}>
                {isSale ? "SALE" : "RENT"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Update the information for your {isSale ? "sale" : "rental"} listing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 2020 Toyota Camry - Excellent Condition"
                maxLength={200}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your vehicle..."
                rows={4}
                maxLength={2000}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">{isSale ? "Price" : "Daily Rate"} ($) *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Rent-specific fields */}
            {!isSale && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weeklyRate">Weekly Rate ($)</Label>
                    <Input
                      id="weeklyRate"
                      type="number"
                      value={weeklyRate}
                      onChange={(e) => setWeeklyRate(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRate">Monthly Rate ($)</Label>
                    <Input
                      id="monthlyRate"
                      type="number"
                      value={monthlyRate}
                      onChange={(e) => setMonthlyRate(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="securityDeposit">Security Deposit ($)</Label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minRentalPeriod">Minimum Rental Period</Label>
                    <Input
                      id="minRentalPeriod"
                      value={minRentalPeriod}
                      onChange={(e) => setMinRentalPeriod(e.target.value)}
                      placeholder="e.g., 1 day"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxRentalPeriod">Maximum Rental Period</Label>
                    <Input
                      id="maxRentalPeriod"
                      value={maxRentalPeriod}
                      onChange={(e) => setMaxRentalPeriod(e.target.value)}
                      placeholder="e.g., 30 days"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
                maxLength={100}
                required
              />
            </div>

            {/* Price Negotiable */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="negotiable"
                checked={isPriceNegotiable}
                onCheckedChange={(checked) => setIsPriceNegotiable(checked as boolean)}
              />
              <Label htmlFor="negotiable" className="cursor-pointer">
                Price is negotiable
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/my-listings">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
