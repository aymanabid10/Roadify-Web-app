"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authApi, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RiMailLine, RiArrowLeftLine } from "@remixicon/react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
      toast.success("Email sent!", {
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.data.errors) {
          const fieldErrors: typeof errors = {};
          Object.entries(error.data.errors).forEach(([key, messages]) => {
            const fieldKey = key.toLowerCase() as keyof typeof errors;
            fieldErrors[fieldKey] = messages[0];
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: error.data.message });
        }
      } else {
        setErrors({ general: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <RiMailLine className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent password reset instructions to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <RiMailLine className="size-4" />
            <AlertTitle>Reset your password</AlertTitle>
            <AlertDescription>
              Click the link in your email to reset your password. The link will expire in 24 hours.
            </AlertDescription>
          </Alert>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Didn&apos;t receive the email?</p>
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() => setSuccess(false)}
            >
              Try again with a different email
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button variant="outline">
              <RiArrowLeftLine className="size-4" />
              Back to login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Forgot password?</CardTitle>
        <CardDescription>
          No worries, we&apos;ll send you reset instructions
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {errors.general}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="size-4" />
                Sending...
              </>
            ) : (
              "Send reset instructions"
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="justify-center">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            <RiArrowLeftLine className="size-4" />
            Back to login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
