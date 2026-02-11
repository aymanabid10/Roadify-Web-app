import Link from "next/link";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RiArrowRightLine,
  RiCarLine,
  RiShieldCheckLine,
  RiSearchLine,
  RiStarLine,
  RiMoneyDollarCircleLine,
  RiTeamLine,
} from "@remixicon/react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-24 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Buy, Sell & Rent Your{" "}
                <span className="text-primary">Perfect Vehicle</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground lg:text-xl">
                The smart way to guarantee quality and reliability. Expert-verified listings, secure transactions, and a trusted community.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                    <RiArrowRightLine className="size-4 ml-2" />
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

        {/* Features Section */}
        <section className="py-24 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Why Choose Roadify?
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to buy, sell, or rent vehicles with confidence
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <RiShieldCheckLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Expert Verification</CardTitle>
                  <CardDescription>
                    All listings are reviewed and verified by automotive experts
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <RiSearchLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Easy Discovery</CardTitle>
                  <CardDescription>
                    Advanced search and filters to find exactly what you need
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <RiMoneyDollarCircleLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Fair Pricing</CardTitle>
                  <CardDescription>
                    Transparent pricing with market value estimates from experts
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <RiCarLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Flexible Options</CardTitle>
                  <CardDescription>
                    Buy, sell, or rent vehicles based on your needs
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <RiStarLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Review System</CardTitle>
                  <CardDescription>
                    Build trust with our comprehensive user review system
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <RiTeamLine className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Trusted Community</CardTitle>
                  <CardDescription>
                    Join thousands of satisfied buyers, sellers, and renters
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/50 py-24 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join Roadify today and experience the future of vehicle marketplace
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Account
                    <RiArrowRightLine className="size-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/listings">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse Listings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}