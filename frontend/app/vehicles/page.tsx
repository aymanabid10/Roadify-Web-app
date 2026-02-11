"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { vehicleApi, VehicleResponseDto } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  RiCarLine, 
  RiAddLine, 
  RiEditLine, 
  RiDeleteBinLine,
  RiSearchLine,
  RiFilterLine,
  RiEyeLine
} from "@remixicon/react";
import Link from "next/link";

export default function MyVehiclesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVehicles();
    }
  }, [isAuthenticated, statusFilter, typeFilter, searchQuery]);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await vehicleApi.getMyVehicles({
        status: statusFilter !== "all" ? statusFilter : undefined,
        vehicleType: typeFilter !== "all" ? typeFilter : undefined,
        search: searchQuery || undefined,
        page: 1,
        pageSize: 50,
      });
      console.log("Vehicles response:", response.data);
      if (response.data.length > 0) {
        console.log("First vehicle photoUrls:", response.data[0].photoUrls);
      }
      setVehicles(response.data);
    } catch (error) {
      toast.error("Failed to load vehicles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) {
      return;
    }

    try {
      await vehicleApi.deleteVehicle(id);
      toast.success("Vehicle deleted successfully");
      fetchVehicles();
    } catch (error) {
      console.error("Delete error:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete vehicle");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "inuse":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "maintenance":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "retired":
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  if (authLoading || isLoading) {
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
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Vehicles</h1>
          <p className="text-muted-foreground">
            Manage your registered vehicles
          </p>
        </div>
        <Link href="/vehicles/create">
          <Button>
            <RiAddLine className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RiFilterLine className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="InUse">In Use</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Retired">Retired</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Sedan">Sedan</SelectItem>
                <SelectItem value="SUV">SUV</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Coupe">Coupe</SelectItem>
                <SelectItem value="Convertible">Convertible</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="Hatchback">Hatchback</SelectItem>
                <SelectItem value="Wagon">Wagon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <RiCarLine className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first vehicle"}
            </p>
            {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
              <Link href="/vehicles/create">
                <Button>
                  <RiAddLine className="h-4 w-4 mr-2" />
                  Add Your First Vehicle
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onDelete={handleDelete} getStatusColor={getStatusColor} />
          ))}
        </div>
      )}
    </div>
  );
}

// Vehicle Card Component with Carousel
function VehicleCard({ 
  vehicle, 
  onDelete, 
  getStatusColor 
}: { 
  vehicle: VehicleResponseDto; 
  onDelete: (id: string) => void;
  getStatusColor: (status: string) => string;
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const photos = vehicle.photoUrls && vehicle.photoUrls.length > 0 ? vehicle.photoUrls : [];
  const hasMultiplePhotos = photos.length > 1;

  // Auto-slide when hovered
  useEffect(() => {
    if (!isHovered || !hasMultiplePhotos) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 2000); // Change photo every 2 seconds

    return () => clearInterval(interval);
  }, [isHovered, hasMultiplePhotos, photos.length]);

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Vehicle Image Carousel */}
      <div 
        className="h-48 bg-muted relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {photos.length > 0 ? (
          <>
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${photos[currentPhotoIndex]}`}
              alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            
            {/* Navigation Arrows - Show on hover if multiple photos */}
            {hasMultiplePhotos && isHovered && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Photo Indicators */}
            {hasMultiplePhotos && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentPhotoIndex(index);
                    }}
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
            <RiCarLine className="h-12 w-12 text-muted-foreground opacity-50" />
          </div>
        )}
        <Badge className={`absolute top-2 right-2 ${getStatusColor(vehicle.status)}`}>
          {vehicle.status}
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="text-xl">
          {vehicle.year} {vehicle.brand} {vehicle.model}
        </CardTitle>
        <CardDescription>
          {vehicle.vehicleType} • {vehicle.color || 'N/A'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mileage:</span>
            <span className="font-medium">{vehicle.mileage?.toLocaleString() || 0} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Registration:</span>
            <span className="font-mono text-xs">{vehicle.registrationNumber}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Link href={`/vehicles/${vehicle.id}`} className="flex-1">
            <Button className="w-full">
              <RiEyeLine className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Link href={`/vehicles/${vehicle.id}/edit`}>
            <Button variant="outline" size="icon">
              <RiEditLine className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(vehicle.id)}
            className="text-destructive hover:text-destructive"
          >
            <RiDeleteBinLine className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
