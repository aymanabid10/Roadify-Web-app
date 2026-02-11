"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { adminApi, VehicleResponseDto } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RiCarLine, RiEyeLine, RiRefreshLine } from "@remixicon/react";
import Link from "next/link";

export default function AdminVehiclesPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!isAdmin) {
        router.push("/unauthorized");
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getAllVehicles({
        page,
        pageSize,
        search: debouncedSearchTerm || undefined,
        status: statusFilter?.toString(),
        vehicleType: typeFilter,
      });
      setVehicles(response.data);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      toast.error("Failed to fetch vehicles");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchVehicles();
    }
  }, [authLoading, isAdmin, fetchVehicles]);

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
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">All Vehicles</h1>
          <p className="text-muted-foreground mt-1">
            Manage all vehicles in the system
          </p>
        </div>
        <Button onClick={fetchVehicles} variant="outline" size="sm">
          <RiRefreshLine className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search by brand, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                  <SelectItem value="0">Available</SelectItem>
                  <SelectItem value="1">Sold</SelectItem>
                  <SelectItem value="2">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={typeFilter || "all"}
                onValueChange={(value) => {
                  setTypeFilter(value === "all" ? undefined : value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Coupe">Coupe</SelectItem>
                  <SelectItem value="Hatchback">Hatchback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>
            Showing {vehicles.length} of {totalCount} vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RiCarLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vehicles found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => {
                const photos = vehicle.photoUrls || [];
                const currentIndex = currentPhotoIndex[vehicle.id] || 0;
                
                return (
                  <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Vehicle Image */}
                    <div className="h-48 bg-muted relative">
                      {photos.length > 0 ? (
                        <>
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${photos[currentIndex]}`}
                            alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                          {photos.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {photos.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentPhotoIndex({ ...currentPhotoIndex, [vehicle.id]: index })}
                                  className={`h-1.5 rounded-full transition-all ${
                                    index === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
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
                          <Button variant="outline" className="w-full" size="sm">
                            <RiEyeLine className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
