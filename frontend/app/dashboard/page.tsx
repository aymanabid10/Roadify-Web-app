"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  RiAddLine,
  RiMapPinLine,
  RiRouteLine,
  RiTimeLine,
  RiCalendarLine,
  RiStarLine,
  RiArrowRightLine,
} from "@remixicon/react";

// Placeholder data for demo
const recentTrips = [
  {
    id: 1,
    name: "Pacific Coast Highway",
    startLocation: "San Francisco, CA",
    endLocation: "Los Angeles, CA",
    distance: "380 miles",
    duration: "6 hours",
    date: "Jan 15, 2026",
    status: "planned",
  },
  {
    id: 2,
    name: "Route 66 Adventure",
    startLocation: "Chicago, IL",
    endLocation: "Santa Monica, CA",
    distance: "2,448 miles",
    duration: "4 days",
    date: "Feb 20, 2026",
    status: "draft",
  },
];

const quickStats = [
  { label: "Total Trips", value: "12", icon: RiRouteLine },
  { label: "Miles Traveled", value: "4,280", icon: RiMapPinLine },
  { label: "Hours on Road", value: "86", icon: RiTimeLine },
  { label: "Saved Places", value: "24", icon: RiStarLine },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-8 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Welcome back, {user?.username}!
                </h1>
                <p className="text-muted-foreground">
                  Here&apos;s an overview of your trips and activities.
                </p>
              </div>
              <Button>
                <RiAddLine className="size-4" />
                Plan New Trip
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="border-b">
          <div className="container mx-auto px-4 py-8 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickStats.map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Trips */}
        <section className="py-8">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Trips</h2>
              <Button variant="ghost" size="sm">
                View all
                <RiArrowRightLine className="size-4" />
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentTrips.map((trip) => (
                <Card key={trip.id} className="cursor-pointer transition-shadow hover:ring-2 hover:ring-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{trip.name}</CardTitle>
                      <Badge variant={trip.status === "planned" ? "default" : "secondary"}>
                        {trip.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {trip.startLocation} → {trip.endLocation}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <RiRouteLine className="size-4" />
                        {trip.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <RiTimeLine className="size-4" />
                        {trip.duration}
                      </span>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <RiCalendarLine className="size-4" />
                      {trip.date}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add New Trip Card */}
              <Card className="flex cursor-pointer items-center justify-center border-dashed transition-colors hover:border-primary hover:bg-primary/5">
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <RiAddLine className="size-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Plan New Trip</h3>
                  <p className="text-sm text-muted-foreground">
                    Start planning your next adventure
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="border-t bg-muted/30 py-8">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="mb-6 text-xl font-semibold">Quick Actions</h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col gap-2 py-6">
                <RiMapPinLine className="size-6" />
                <span>Find Places</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-6">
                <RiRouteLine className="size-6" />
                <span>Browse Routes</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-6">
                <RiStarLine className="size-6" />
                <span>View Favorites</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-6">
                <RiCalendarLine className="size-6" />
                <span>Trip Calendar</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
