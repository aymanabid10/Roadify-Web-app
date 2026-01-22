import Link from "next/link";
import { RiMapPinLine } from "@remixicon/react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Simple header with logo */}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <RiMapPinLine className="size-6 text-primary" />
            <span>Roadify</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Roadify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
