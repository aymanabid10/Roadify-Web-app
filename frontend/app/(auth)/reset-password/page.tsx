"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authApi, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RiEyeLine, RiEyeOffLine, RiCheckLine, RiCloseLine, RiLockLine, RiArrowLeftLine } from "@remixicon/react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!userId || !token) {
      setInvalidLink(true);
    }
  }, [userId, token]);

  // Password requirements
  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
  ];

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !userId || !token) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await authApi.resetPassword({
        userId,
        token,
        newPassword: password,
      });
      setSuccess(true);
      toast.success("Password reset!", {
        description: "Your password has been successfully reset.",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400 || error.status === 404) {
          setErrors({ general: "This password reset link is invalid or has expired." });
        } else if (error.data.errors) {
          const fieldErrors: typeof errors = {};
          Object.entries(error.data.errors).forEach(([key, messages]) => {
            if (key.toLowerCase().includes("password")) {
              fieldErrors.password = messages[0];
            } else {
              fieldErrors.general = messages[0];
            }
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

  if (invalidLink) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <RiCloseLine className="size-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Invalid Link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Link expired</AlertTitle>
            <AlertDescription>
              Password reset links expire after 24 hours for security reasons.
            </AlertDescription>
          </Alert>
        </CardContent>
        
        <CardFooter className="justify-center">
          <Link href="/forgot-password">
            <Button>Request new link</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <RiCheckLine className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Password reset!</CardTitle>
          <CardDescription>
            Your password has been successfully reset.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <RiLockLine className="size-4" />
            <AlertTitle>All set</AlertTitle>
            <AlertDescription>
              You can now log in with your new password.
            </AlertDescription>
          </Alert>
        </CardContent>
        
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button>Go to login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          Enter a new password for your account
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
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <RiEyeOffLine className="size-4" />
                ) : (
                  <RiEyeLine className="size-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
            
            {/* Password requirements */}
            {password && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-xs ${
                      req.met ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {req.met ? (
                      <RiCheckLine className="size-3" />
                    ) : (
                      <RiCloseLine className="size-3" />
                    )}
                    {req.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!errors.confirmPassword}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="size-4" />
                Resetting password...
              </>
            ) : (
              "Reset password"
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
