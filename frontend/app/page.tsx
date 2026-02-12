"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listingApi, vehicleApi, ListingResponse } from "@/lib/api";
import { LandingListingCard } from "@/components/landing-listing-card";
import {
  RiArrowRightLine,
  RiCarLine,
  RiShieldCheckLine,
  RiSearchLine,
  RiStarLine,
  RiMoneyDollarCircleLine,
  RiTeamLine,
  RiSparklingLine,
} from "@remixicon/react";

export default function LandingPage() {
  const [featuredListings, setFeaturedListings] = useState<ListingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        const response = await listingApi.getPublicListings({
          page: 1,
          pageSize: 6,
          status: 2, // Published only
          sortBy: "CreatedAt",
          sortOrder: "desc",
        });

        // Fetch vehicle data for each listing
        const listingsWithVehicles = await Promise.all(
          response.data.map(async (listing) => {
            if (listing.vehicleId && !listing.vehicle) {
              try {
                const vehicleData = await vehicleApi.getVehicleById(listing.vehicleId);
                return { ...listing, vehicle: vehicleData };
              } catch {
                return listing;
              }
            }
            return listing;
          })
        );

        setFeaturedListings(listingsWithVehicles);
      } catch (error) {
        console.error("Failed to fetch featured listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedListings();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Featured Carousel Section - Top of Page */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
          {/* Floating shapes animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float-delayed" />
          </div>

          <div className="container relative mx-auto px-4 py-8 lg:px-8 lg:py-12">
            {/* Compact Header */}
            <div className="mx-auto max-w-3xl text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <RiSparklingLine className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">Featured Vehicles</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-3">
                Discover Your{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Perfect Ride
                </span>
              </h1>
              <p className="text-sm text-muted-foreground lg:text-base max-w-2xl mx-auto">
                Expert-verified vehicles • Secure transactions • Trusted community
              </p>
            </div>

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-56 w-full" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-1/3" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : featuredListings.length > 0 ? (
              <div className="relative overflow-hidden py-4">
                {/* Gradient overlays for fade effect */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
                
                {/* Scrolling container */}
                <div className="flex gap-6 animate-scroll will-change-transform">
                  {/* First set of cards */}
                  {featuredListings.map((listing) => (
                    <div key={`first-${listing.id}`} className="shrink-0 w-[350px]">
                      <LandingListingCard
                        listing={listing}
                        index={0}
                      />
                    </div>
                  ))}
                  {/* Duplicate set for seamless loop */}
                  {featuredListings.map((listing) => (
                    <div key={`second-${listing.id}`} className="shrink-0 w-[350px]">
                      <LandingListingCard
                        listing={listing}
                        index={0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <RiCarLine className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No listings available at the moment</p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto group">
                  Get Started
                  <RiArrowRightLine className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/listings">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View All Listings
                </Button>
              </Link>
            </div>
          </div>
        </section>

      

        {/* Features Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
                Why Choose Roadify?
              </h2>
              <p className="text-sm lg:text-base text-muted-foreground">
                Everything you need to buy, sell, or rent vehicles with confidence
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <RiShieldCheckLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Expert Verification</CardTitle>
                  <CardDescription>
                    All listings are reviewed and verified by automotive experts
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <RiSearchLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Easy Discovery</CardTitle>
                  <CardDescription>
                    Advanced search and filters to find exactly what you need
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <RiMoneyDollarCircleLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Fair Pricing</CardTitle>
                  <CardDescription>
                    Transparent pricing with market value estimates from experts
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <RiCarLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Flexible Options</CardTitle>
                  <CardDescription>
                    Buy, sell, or rent vehicles based on your needs
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <RiStarLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Review System</CardTitle>
                  <CardDescription>
                    Build trust with our comprehensive user review system
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <RiTeamLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Trusted Community</CardTitle>
                  <CardDescription>
                    Join thousands of satisfied buyers, sellers, and renters
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/50 py-16 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
                Ready to Get Started?
              </h2>
              <p className="text-sm lg:text-base text-muted-foreground mb-6">
                Join Roadify today and experience the future of vehicle marketplace
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Account
                    <RiArrowRightLine className="size-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}