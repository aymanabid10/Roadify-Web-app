import Link from "next/link";
import { RiCarLine } from "@remixicon/react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <RiCarLine className="size-6 text-primary" />
            <span>Roadify</span>
          </Link>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Roadify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
