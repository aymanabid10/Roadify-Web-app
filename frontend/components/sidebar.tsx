"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  RiHomeLine,
  RiCarLine,
  RiFileListLine,
  RiAddCircleLine,
  RiSearchLine,
  RiStarLine,
  RiUserLine,
  RiDashboardLine,
  RiCheckDoubleLine,
  RiCloseCircleLine,
  RiFileTextLine,
  RiGroupLine,
  RiBarChartLine,
  RiSettings3Line,
  RiInboxLine,
} from "@remixicon/react";
import type { RemixiconComponentType } from "@remixicon/react";

interface NavItem {
  name: string;
  href: string;
  icon: RemixiconComponentType;
  roles?: string[]; // If undefined, available to all authenticated users
}

// User navigation (default for authenticated users)
const userNavigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: RiHomeLine,
  },
  {
    name: "Browse Listings",
    href: "/listings",
    icon: RiSearchLine,
  },
  {
    name: "My Vehicles",
    href: "/vehicles",
    icon: RiCarLine,
  },
  {
    name: "My Listings",
    href: "/my-listings",
    icon: RiFileListLine,
  },
  {
    name: "Create Listing",
    href: "/listings/create",
    icon: RiAddCircleLine,
  },
  {
    name: "My Reviews",
    href: "/reviews",
    icon: RiStarLine,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: RiUserLine,
  },
];

// Expert navigation
const expertNavigation: NavItem[] = [
  {
    name: "Expert Dashboard",
    href: "/expert",
    icon: RiDashboardLine,
    roles: ["EXPERT"],
  },
  {
    name: "Review Queue",
    href: "/expert/reviews",
    icon: RiInboxLine,
    roles: ["EXPERT"],
  },
  {
    name: "Approved Listings",
    href: "/expert/approved",
    icon: RiCheckDoubleLine,
    roles: ["EXPERT"],
  },
  {
    name: "Rejected Listings",
    href: "/expert/rejected",
    icon: RiCloseCircleLine,
    roles: ["EXPERT"],
  },
  {
    name: "My Reports",
    href: "/expert/reports",
    icon: RiFileTextLine,
    roles: ["EXPERT"],
  },
  {
    name: "Profile",
    href: "/profile",
    icon: RiUserLine,
    roles: ["EXPERT"],
  },
];

// Admin navigation
const adminNavigation: NavItem[] = [
  {
    name: "User Management",
    href: "/admin",
    icon: RiGroupLine,
    roles: ["ADMIN"],
  },
  {
    name: "Listings",
    href: "/admin/listings",
    icon: RiFileListLine,
    roles: ["ADMIN"],
  },
  {
    name: "Vehicles",
    href: "/admin/vehicles",
    icon: RiCarLine,
    roles: ["ADMIN"],
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: RiStarLine,
    roles: ["ADMIN"],
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: RiBarChartLine,
    roles: ["ADMIN"],
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: RiSettings3Line,
    roles: ["ADMIN"],
  },
];

// Public navigation (for non-authenticated users)
const publicNavigation: NavItem[] = [
  {
    name: "Browse Listings",
    href: "/listings",
    icon: RiSearchLine,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated, user, hasRole } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This is intentional for client-side mount detection to avoid hydration mismatch
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  // Don't show sidebar on landing page and auth pages
  if (pathname === "/" ||
      pathname?.startsWith("/login") || 
      pathname?.startsWith("/register") ||
      pathname?.startsWith("/forgot-password") ||
      pathname?.startsWith("/reset-password") ||
      pathname?.startsWith("/confirm-email")) {
    return null;
  }

  // Determine which navigation to show based on user role
  let navigation: NavItem[] = publicNavigation;

  if (isAuthenticated && user) {
    // Priority: ADMIN > EXPERT > USER
    if (hasRole("ADMIN")) {
      navigation = adminNavigation;
    } else if (hasRole("EXPERT")) {
      navigation = expertNavigation;
    } else {
      navigation = userNavigation;
    }
  }

  return (
    <aside className={cn("w-64 border-r bg-background/95 backdrop-blur", className)}>
      <div className="flex h-full flex-col gap-2">
        <div className="flex-1 overflow-auto py-6">
          <nav className="grid gap-1 px-4">
            {navigation.map((item) => {
              // Check if user has required role for this item
              if (item.roles && !item.roles.some(role => hasRole(role))) {
                return null;
              }

              // Use mounted state to avoid hydration mismatch
              // For /admin, only match exact path to avoid matching all admin subroutes
              const isActive = mounted && (
                pathname === item.href || 
                (item.href !== "/" && item.href !== "/admin" && pathname?.startsWith(item.href))
              );

              return (
                <Link
                  key={item.name}
                  href={item.href}
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

        {/* Bottom Section - User info */}
        {isAuthenticated && user && (
          <div className="border-t p-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role?.toLowerCase() || "User"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
