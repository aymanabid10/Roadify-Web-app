"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  RiCarLine,
  RiUserLine,
  RiLogoutBoxLine,
  RiShieldStarLine,
} from "@remixicon/react";

export function Navbar() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
        {/* Mobile Sidebar Trigger + Logo */}
        <div className="flex items-center gap-2">
          <MobileSidebar />
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg"
          >
            <RiCarLine className="size-6 text-primary" />
            <span>Roadify</span>
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {isLoading ? (
            <Spinner className="size-5" />
          ) : isAuthenticated ? (
            <>
              {/* Show Expert Dashboard link only if user is expert AND not on expert page */}
              {user?.role === "EXPERT" && pathname !== "/expert" && (
                <>
                  <Link href="/expert">
                    <Button variant="ghost" size="sm">
                      <RiShieldStarLine className="size-4 mr-2" />
                      Expert Dashboard
                    </Button>
                  </Link>
                  <Separator orientation="vertical" className="h-5" />
                </>
              )}
              
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <RiUserLine className="size-4 mr-2" />
                  {user?.username}
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-5" />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                title="Logout"
              >
                <RiLogoutBoxLine className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Separator orientation="vertical" className="h-5" />
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
