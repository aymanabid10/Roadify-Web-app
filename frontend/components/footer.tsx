import Link from "next/link";
import { RiMapPinLine } from "@remixicon/react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <RiMapPinLine className="size-6 text-primary" />
              <span>Roadify</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Plan your road trips with ease. Discover new routes, save your favorites, and hit the road.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-medium">Product</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/#features" className="hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/#about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-medium">Legal</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </nav>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="font-medium">Connect</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="https://github.com" className="hover:text-foreground transition-colors">
                GitHub
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Roadify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
