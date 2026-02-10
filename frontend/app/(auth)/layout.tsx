"use client";

import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Check if this is an actual auth page (login, register, etc.) vs admin/expert pages
  const isAuthPage = pathname?.startsWith("/login") || 
                     pathname?.startsWith("/register") ||
                     pathname?.startsWith("/forgot-password") ||
                     pathname?.startsWith("/reset-password") ||
                     pathname?.startsWith("/confirm-email");
  
  // For actual auth pages, provide centered layout
  if (isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        {children}
      </div>
    );
  }
  
  // For admin/expert pages, just pass through
  return <>{children}</>;
}
