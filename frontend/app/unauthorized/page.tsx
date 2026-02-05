"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiShieldCrossLine, RiHomeLine, RiArrowLeftLine } from "@remixicon/react";

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <RiShieldCrossLine className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don&apos;t have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            This page is restricted to authorized users only. If you believe you should have access, please contact an administrator.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="default" className="w-full">
              <Link href="/">
                <RiHomeLine className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full" onClick={() => window.history.back()}>
              <span className="cursor-pointer">
                <RiArrowLeftLine className="mr-2 h-4 w-4" />
                Go Back
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
