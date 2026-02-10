"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiStarLine } from "@remixicon/react";

export default function AdminReviewsPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!isAdmin) {
        router.push("/unauthorized");
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  if (authLoading) {
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">All Reviews</h1>
        <p className="text-muted-foreground mt-1">
          Manage all reviews in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            View and manage all user reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <RiStarLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">This feature is coming soon</p>
            <p className="text-sm">
              You&apos;ll be able to view and moderate all reviews here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
