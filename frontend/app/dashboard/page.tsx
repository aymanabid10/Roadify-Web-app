"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { vehicleApi, listingApi, reviewsApi, VehicleResponseDto, ListingResponse, ReviewDto } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import {
  RiCarLine,
  RiFileListLine,
  RiStarLine,
  RiHeartLine,
  RiEyeLine,
  RiAddCircleLine,
} from "@remixicon/react";

const STATUS_MAP = {
  0: { label: "Draft", color: "bg-gray-500" },
  1: { label: "Pending Review", color: "bg-yellow-500" },
  2: { label: "Published", color: "bg-green-500" },
  3: { label: "Rejected", color: "bg-red-500" },
  4: { label: "Archived", color: "bg-gray-400" },
};

export default function UserDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleResponseDto[]>([]);
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalListings: 0,
    publishedListings: 0,
    totalReviews: 0,
    averageRating: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      try {
        const [vehiclesRes, listingsRes, reviewsRes] = await Promise.all([
          vehicleApi.getMyVehicles({ page: 1, pageSize: 5 }),
          listingApi.getMyListings({ page: 1, pageSize: 5 }),
          reviewsApi.getMyReviews(),
        ]);

        setVehicles(vehiclesRes.data);
        setListings(listingsRes.data);
        setReviews(reviewsRes);

        // Calculate stats
        const publishedCount = listingsRes.data.filter((l) => l.status === 2).length;
        const avgRating = reviewsRes.length > 0
          ? reviewsRes.reduce((sum, r) => sum + r.rating, 0) / reviewsRes.length
          : 0;

        setStats({
          totalVehicles: vehiclesRes.totalCount,
          totalListings: listingsRes.totalCount,
          publishedListings: publishedCount,
          totalReviews: reviewsRes.length,
          averageRating: avgRating,
        });
      } catch (error) {
        const err = error as { data?: { message?: string } };
        toast.error(err?.data?.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.username}! Here&apos;s an overview of your activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Vehicles</CardTitle>
            <RiCarLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              Total vehicles registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Listings</CardTitle>
            <RiFileListLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedListings} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <RiStarLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.averageRating.toFixed(1)} avg rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <RiHeartLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Saved listings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Vehicles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Vehicles</CardTitle>
              <CardDescription>Your latest registered vehicles</CardDescription>
            </div>
            <Link href="/vehicles">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RiCarLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No vehicles registered yet</p>
              <Link href="/vehicles">
                <Button>
                  <RiAddCircleLine className="mr-2 h-4 w-4" />
                  Add Your First Vehicle
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.vehicleType} • {vehicle.color} • {vehicle.mileage.toLocaleString()} km
                    </p>
                  </div>
                  <Link href={`/vehicles/${vehicle.id}`}>
                    <Button variant="outline" size="sm">
                      <RiEyeLine className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Listings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Listings</CardTitle>
              <CardDescription>Your latest listings</CardDescription>
            </div>
            <Link href="/my-listings">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RiFileListLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No listings created yet</p>
              <Link href="/listings/create">
                <Button>
                  <RiAddCircleLine className="mr-2 h-4 w-4" />
                  Create Your First Listing
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{listing.title}</h3>
                      <Badge className={STATUS_MAP[listing.status as keyof typeof STATUS_MAP].color}>
                        {STATUS_MAP[listing.status as keyof typeof STATUS_MAP].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ${listing.price.toLocaleString()} • {listing.location} • {listing.viewCount} views
                    </p>
                  </div>
                  <Link href={`/listings/${listing.id}`}>
                    <Button variant="outline" size="sm">
                      <RiEyeLine className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
