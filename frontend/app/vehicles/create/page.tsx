"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { vehicleApi, CreateVehicleDto } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RiCarLine, RiArrowLeftLine, RiCloseLine } from "@remixicon/react";
import Link from "next/link";

export default function CreateVehiclePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [color, setColor] = useState("");
  const [mileage, setMileage] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Available");
  
  // Photo upload
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedPhotos(files);
      
      // Create preview URLs
      const urls = files.map(file => URL.createObjectURL(file));
      setPhotoPreviewUrls(urls);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    const newUrls = photoPreviewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    setSelectedPhotos(newPhotos);
    setPhotoPreviewUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand || !model || !year || !vehicleType || !registrationNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateVehicleDto = {
        brand,
        model,
        year: parseInt(year),
        registrationNumber,
        vehicleType,
        description: description || undefined,
        status,
        mileage: mileage ? parseFloat(mileage) : undefined,
        color: color || undefined,
      };

      const createdVehicle = await vehicleApi.createVehicle(data);
      console.log("Created vehicle:", createdVehicle);
      console.log("Selected photos count:", selectedPhotos.length);
      
      // Upload photos if any were selected
      if (selectedPhotos.length > 0) {
        try {
          console.log("Uploading photos for vehicle:", createdVehicle.id);
          const uploadResult = await vehicleApi.uploadVehiclePhotos(createdVehicle.id, selectedPhotos);
          console.log("Photo upload result:", uploadResult);
          toast.success(`Vehicle added with ${selectedPhotos.length} photo(s)!`);
        } catch (photoError) {
          console.error("Photo upload error:", photoError);
          toast.warning("Vehicle created but photo upload failed. You can add photos later.");
        }
      } else {
        console.log("No photos selected");
        toast.success("Vehicle added successfully!");
      }
      
      // Clean up preview URLs
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      
      router.push("/vehicles");
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to create vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vehicles">
          <Button variant="outline" size="icon">
            <RiArrowLeftLine className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Vehicle</h1>
          <p className="text-muted-foreground">
            Register a new vehicle to your account
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>
              Enter the details of your vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Brand and Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Toyota"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="e.g., Camry"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Year and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <Select value={vehicleType} onValueChange={setVehicleType} required>
                  <SelectTrigger id="vehicleType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Color and Mileage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  placeholder="e.g., Black"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage (km) *</Label>
                <Input
                  id="mileage"
                  type="number"
                  placeholder="50000"
                  min="0"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Registration Number */}
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number *</Label>
              <Input
                id="registrationNumber"
                placeholder="e.g., ABC-1234 or VIN"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                License plate, VIN, or other registration identifier
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Additional details about the vehicle"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="photos">Vehicle Photos (Optional)</Label>
              <Input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
              />
              <p className="text-xs text-muted-foreground">
                You can upload multiple photos. Supported formats: JPG, PNG, WebP
              </p>
              
              {/* Photo Previews */}
              {photoPreviewUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">{photoPreviewUrls.length} photo(s) selected</p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <RiCloseLine className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="InUse">In Use</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info Box */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex gap-3">
                <RiCarLine className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Note:</p>
                  <p>You can add photos now or upload them later. After adding your vehicle, you can create listings for sale or rent.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/vehicles">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding Vehicle..." : "Add Vehicle"}
          </Button>
        </div>
      </form>
    </div>
  );
}
