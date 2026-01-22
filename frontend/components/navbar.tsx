"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  RiMapPinLine,
  RiUserLine,
  RiLogoutBoxLine,
  RiDashboardLine,
  RiMenuLine,
} from "@remixicon/react";
import { useState } from "react";

export function Navbar() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <RiMapPinLine className="size-6 text-primary" />
          <span>Roadify</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/#features">
            <Button variant="ghost" size="sm">
              Features
            </Button>
          </Link>
          <Link href="/#about">
            <Button variant="ghost" size="sm">
              About
            </Button>
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {isLoading ? (
            <Spinner className="size-5" />
          ) : isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <RiDashboardLine className="size-4" />
                  Dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user?.username}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => logout()}
                  title="Logout"
                >
                  <RiLogoutBoxLine className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <RiMenuLine className="size-5" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <Link href="/#features" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                Features
              </Button>
            </Link>
            <Link href="/#about" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                About
              </Button>
            </Link>
            <Separator className="my-2" />
            {isLoading ? (
              <div className="flex justify-center py-2">
                <Spinner className="size-5" />
              </div>
            ) : isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-muted-foreground">
                  <RiUserLine className="size-4" />
                  {user?.username}
                </div>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <RiDashboardLine className="size-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <RiLogoutBoxLine className="size-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
