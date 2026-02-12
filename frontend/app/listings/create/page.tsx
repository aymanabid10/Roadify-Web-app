"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { vehicleApi, listingApi, VehicleResponseDto, CreateSaleListingRequest, CreateRentListingRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RiCarLine, RiArrowLeftLine, RiArrowRightLine, RiCheckLine } from "@remixicon/react";
import Link from "next/link";

type ListingType = "SALE" | "RENT";

export default function CreateListingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState<VehicleResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [listingType, setListingType] = useState<ListingType>("SALE");
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
  const [minRentalPeriod, setMinRentalPeriod] = useState("1 day");
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
    const fetchVehicles = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await vehicleApi.getMyVehicles({ page: 1, pageSize: 100 });
        setVehicles(response.data);
      } catch (error) {
        const err = error as { data?: { message?: string } };
        toast.error(err?.data?.message || "Failed to fetch vehicles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, [isAuthenticated]);

  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      toast.error("Please select a vehicle");
      return;
    }

    if (!title || !price || !location) {
      toast.error("Please fill in all required fields (Title, Price, Location)");
      return;
    }

    // Additional validation for RENT listings
    if (listingType === "RENT" && !securityDeposit) {
      toast.error("Security Deposit is required for rental listings");
      return;
    }

    setIsSubmitting(true);

    try {
      if (listingType === "SALE") {
        const data: CreateSaleListingRequest = {
          vehicleId: selectedVehicleId,
          title,
          description,
          price: parseFloat(price),
          location,
          isPriceNegotiable,
          contactPhone: contactPhone || undefined,
          hasClearTitle,
          financingAvailable,
          tradeInAccepted,
          warrantyInfo: warrantyInfo || undefined,
        };
        await listingApi.createSaleListing(data);
      } else {
        const data: CreateRentListingRequest = {
          vehicleId: selectedVehicleId,
          title,
          description,
          location,
          price: parseFloat(price), // Daily rate
          weeklyRate: weeklyRate ? parseFloat(weeklyRate) : undefined,
          monthlyRate: monthlyRate ? parseFloat(monthlyRate) : undefined,
          securityDeposit: parseFloat(securityDeposit),
          minimumRentalPeriod: minRentalPeriod,
          maximumRentalPeriod: maxRentalPeriod || undefined,
          isPriceNegotiable,
          contactPhone: contactPhone || undefined,
          mileageLimitPerDay: mileageLimitPerDay ? parseInt(mileageLimitPerDay) : undefined,
          insuranceIncluded,
          fuelPolicy: fuelPolicy || undefined,
          deliveryAvailable,
          deliveryFee: deliveryFee ? parseFloat(deliveryFee) : undefined,
        };
        await listingApi.createRentListing(data);
      }

      toast.success("Listing created successfully!");
      router.push("/my-listings");
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 md:p-10">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (vehicles.length === 0) {
    return (
      <div className="p-6 md:p-10">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <RiCarLine className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
              <p className="text-muted-foreground mb-4">
                You need to add a vehicle before creating a listing
              </p>
              <Link href="/vehicles/create">
                <Button>Add Your First Vehicle</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Listing</h1>
        <p className="text-muted-foreground">
          List your vehicle for sale or rent
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <RiCheckLine className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className="w-12 h-0.5 bg-muted" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Vehicle */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Vehicle</CardTitle>
            <CardDescription>Choose which vehicle you want to list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={vehicle.id} id={vehicle.id} />
                  <Label htmlFor={vehicle.id} className="flex-1 cursor-pointer">
                    <div className="font-semibold">
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.vehicleType} • {vehicle.color} • {vehicle.mileage ? vehicle.mileage.toLocaleString() : "N/A"} km
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Listing Type & Basic Info */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Listing Details</CardTitle>
            <CardDescription>Provide information about your listing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Listing Type */}
            <div className="space-y-2">
              <Label>Listing Type</Label>
              <RadioGroup value={listingType} onValueChange={(value: string) => setListingType(value as ListingType)}>
                <div className="flex items-center space-x-3 border rounded-lg p-4">
                  <RadioGroupItem value="SALE" id="sale" />
                  <Label htmlFor="sale" className="flex-1 cursor-pointer">
                    <div className="font-semibold">For Sale</div>
                    <div className="text-sm text-muted-foreground">Sell your vehicle</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-4">
                  <RadioGroupItem value="RENT" id="rent" />
                  <Label htmlFor="rent" className="flex-1 cursor-pointer">
                    <div className="font-semibold">For Rent</div>
                    <div className="text-sm text-muted-foreground">Rent out your vehicle</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., 2020 Toyota Camry - Low Mileage"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your vehicle's condition, features, and any important details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., New York, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Pricing</CardTitle>
            <CardDescription>Set your pricing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {listingType === "SALE" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="price">Sale Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="25000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
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
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="price">Daily Rate ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weeklyRate">Weekly Rate ($)</Label>
                  <Input
                    id="weeklyRate"
                    type="number"
                    placeholder="300"
                    value={weeklyRate}
                    onChange={(e) => setWeeklyRate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyRate">Monthly Rate ($)</Label>
                  <Input
                    id="monthlyRate"
                    type="number"
                    placeholder="1000"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="securityDeposit">Security Deposit ($) *</Label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    placeholder="500"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minRentalPeriod">Min Rental Period *</Label>
                    <Input
                      id="minRentalPeriod"
                      type="text"
                      placeholder="1 day"
                      value={minRentalPeriod}
                      onChange={(e) => setMinRentalPeriod(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxRentalPeriod">Max Rental Period</Label>
                    <Input
                      id="maxRentalPeriod"
                      type="text"
                      placeholder="30 days"
                      value={maxRentalPeriod}
                      onChange={(e) => setMaxRentalPeriod(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <RiArrowLeftLine className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && !selectedVehicleId}
          >
            Next
            <RiArrowRightLine className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Listing"}
          </Button>
        )}
      </div>
    </div>
  );
}
