"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  RiHomeLine,
  RiCarLine,
  RiFileListLine,
  RiAddCircleLine,
  RiHeartLine,
  RiShieldStarLine,
  RiDashboardLine,
  RiSearchLine,
  RiMenuLine,
} from "@remixicon/react";

const navigation = [
  {
    name: "Browse Listings",
    href: "/listings",
    icon: RiSearchLine,
    requireAuth: false,
  },
  {
    name: "My Vehicles",
    href: "/vehicles",
    icon: RiCarLine,
    requireAuth: true,
  },
  {
    name: "My Listings",
    href: "/my-listings",
    icon: RiFileListLine,
    requireAuth: true,
  },
  {
    name: "Create Listing",
    href: "/listings/create",
    icon: RiAddCircleLine,
    requireAuth: true,
  },
  {
    name: "Favorites",
    href: "/favorites",
    icon: RiHeartLine,
    requireAuth: true,
  },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  // Don't show on auth pages or special dashboards
  if (pathname?.startsWith("/login") || 
      pathname?.startsWith("/register") || 
      pathname?.startsWith("/expert") || 
      pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <RiMenuLine className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-auto py-6">
            <nav className="grid gap-1 px-4">
              {navigation.map((item) => {
                // Skip auth-required items if not authenticated
                if (item.requireAuth && !isAuthenticated) {
                  return null;
                }

                const isActive = pathname === item.href || 
                                (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="size-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Section */}
          {isAuthenticated && (
            <div className="border-t p-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role?.toLowerCase() || "User"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
