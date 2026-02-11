"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RiFileTextLine } from "@remixicon/react";

export default function ExpertReportsPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, hasRole } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasRole("EXPERT")) {
        router.push("/unauthorized");
      }
    }
  }, [authLoading, isAuthenticated, hasRole, router]);

  if (authLoading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-12 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("EXPERT")) {
    return null;
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <RiFileTextLine className="h-8 w-8" />
          My Expertise Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          All expertise reports you&apos;ve created
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expertise Reports</CardTitle>
          <CardDescription>
            View and manage your expertise reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <RiFileTextLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">This feature is coming soon</p>
            <p className="text-sm">
              You&apos;ll be able to view all your expertise reports here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
