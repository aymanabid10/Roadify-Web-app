import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  RiArrowRightLine,
} from "@remixicon/react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-24 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Get your perfect{" "}
                <span className="text-primary">Car</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground lg:text-xl">
                The smart way to guarantee quality and reliability.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                    <RiArrowRightLine className="size-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative gradient */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </section>
      </main>

      <Footer />
    </div>
  );
}