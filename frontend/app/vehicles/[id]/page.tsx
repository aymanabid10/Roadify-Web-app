"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { vehicleApi, VehicleResponseDto } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  RiArrowLeftLine, 
  RiEditLine, 
  RiCarLine,
  RiCalendarLine,
  RiSpeedLine,
  RiPaletteLine,
  RiFileTextLine
} from "@remixicon/react";
import Link from "next/link";

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<VehicleResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (!authLoading && vehicleId) {
      fetchVehicle();
    }
  }, [authLoading, vehicleId]);

  const fetchVehicle = async () => {
    try {
      setIsLoading(true);
      const data = await vehicleApi.getVehicleById(vehicleId);
      setVehicle(data);
    } catch (error) {
      toast.error("Failed to load vehicle");
      console.error(error);
      router.push("/vehicles");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available": return "bg-green-500";
      case "sold": return "bg-gray-500";
      case "reserved": return "bg-yellow-500";
      default: return "bg-blue-500";
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-12 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  const photos = vehicle.photoUrls || [];
  const isOwner = false; // TODO: Add userId to VehicleResponseDto if needed

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <RiArrowLeftLine className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {vehicle.year} {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-muted-foreground mt-1">
              {vehicle.vehicleType} • Registration: {vehicle.registrationNumber}
            </p>
          </div>
        </div>
        {isOwner && (
          <Link href={`/vehicles/${vehicle.id}/edit`}>
            <Button>
              <RiEditLine className="h-4 w-4 mr-2" />
              Edit Vehicle
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Photo */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative h-96 bg-muted">
                {photos.length > 0 ? (
                  <>
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${photos[currentPhotoIndex]}`}
                      alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Navigation Arrows */}
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
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <RiCarLine className="h-24 w-24 text-muted-foreground opacity-50" />
                  </div>
                )}
                <Badge className={`absolute top-4 right-4 ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status}
                </Badge>
              </div>

              {/* Photo Thumbnails */}
              {photos.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentPhotoIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${photo}`}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {vehicle.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RiFileTextLine className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{vehicle.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Vehicle Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>Vehicle details and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <RiCalendarLine className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <RiSpeedLine className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Mileage</p>
                  <p className="font-medium">{vehicle.mileage?.toLocaleString() || 0} km</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <RiCarLine className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Vehicle Type</p>
                  <p className="font-medium">{vehicle.vehicleType}</p>
                </div>
              </div>

              {vehicle.color && (
                <div className="flex items-center gap-3">
                  <RiPaletteLine className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium">{vehicle.color}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <RiFileTextLine className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-medium font-mono">{vehicle.registrationNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={getStatusColor(vehicle.status)}>{vehicle.status}</Badge>
              </div>
              {vehicle.createdAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(vehicle.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {vehicle.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{new Date(vehicle.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
