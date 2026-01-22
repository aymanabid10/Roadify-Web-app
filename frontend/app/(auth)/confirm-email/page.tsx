"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { authApi, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RiCheckLine, RiCloseLine, RiMailLine } from "@remixicon/react";

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthFromResponse } = useAuth();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  useEffect(() => {
    const confirmEmail = async () => {
      if (!userId || !token) {
        setStatus("error");
        setErrorMessage("Invalid confirmation link. Missing required parameters.");
        return;
      }

      try {
        const response = await authApi.confirmEmail({ userId, token });
        setAuthFromResponse(response);
        setStatus("success");
        toast.success("Email confirmed!", {
          description: "Your account is now verified.",
        });
      } catch (error) {
        setStatus("error");
        if (error instanceof ApiError) {
          if (error.status === 400) {
            setErrorMessage("This confirmation link is invalid or has already been used.");
          } else if (error.status === 404) {
            setErrorMessage("User not found. The link may be incorrect.");
          } else {
            setErrorMessage(error.data.message);
          }
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }
      }
    };

    confirmEmail();
  }, [userId, token, setAuthFromResponse]);

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Spinner className="size-6" />
          </div>
          <CardTitle className="text-2xl">Confirming your email...</CardTitle>
          <CardDescription>
            Please wait while we verify your email address.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <RiCloseLine className="size-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Confirmation failed</CardTitle>
          <CardDescription>
            We couldn&apos;t verify your email address.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Need a new confirmation email?</p>
            <Link href="/login" className="text-primary hover:underline">
              Log in and request a new one
            </Link>
          </div>
        </CardContent>
        
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button variant="outline">Go to login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <RiCheckLine className="size-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Email confirmed!</CardTitle>
        <CardDescription>
          Your email has been verified successfully.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <RiMailLine className="size-4" />
          <AlertTitle>You&apos;re all set</AlertTitle>
          <AlertDescription>
            Your account is now fully activated. You can start using all features.
          </AlertDescription>
        </Alert>
      </CardContent>
      
      <CardFooter className="justify-center">
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
