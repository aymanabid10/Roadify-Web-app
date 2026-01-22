import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RiMapPinLine,
  RiRouteLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiTeamLine,
  RiStarLine,
  RiArrowRightLine,
  RiCheckLine,
} from "@remixicon/react";

const features = [
  {
    icon: RiRouteLine,
    title: "Smart Route Planning",
    description:
      "Plan your routes with intelligent suggestions based on traffic, weather, and points of interest.",
  },
  {
    icon: RiMapPinLine,
    title: "Discover Places",
    description:
      "Find hidden gems, rest stops, scenic viewpoints, and local favorites along your journey.",
  },
  {
    icon: RiTimeLine,
    title: "Real-time Updates",
    description:
      "Get live traffic updates and alternate route suggestions to save time on the road.",
  },
  {
    icon: RiShieldCheckLine,
    title: "Safe & Secure",
    description:
      "Your data is encrypted and secure. Access your trips from any device, anywhere.",
  },
  {
    icon: RiTeamLine,
    title: "Share with Friends",
    description:
      "Collaborate on trip planning with friends and family. Share itineraries with a single link.",
  },
  {
    icon: RiStarLine,
    title: "Save Favorites",
    description:
      "Bookmark your favorite routes and places for quick access on future trips.",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Road Trip Enthusiast",
    content:
      "Roadify made our cross-country trip so much easier to plan. We discovered amazing places we would have never found otherwise!",
  },
  {
    name: "Mike T.",
    role: "Travel Blogger",
    content:
      "I use Roadify for all my travel content. The route planning features are unmatched. Highly recommend!",
  },
  {
    name: "Emily R.",
    role: "Weekend Explorer",
    content:
      "Perfect for spontaneous road trips. I love how easy it is to find cool stops along the way.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-24 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="mb-4">
                🚗 Now in Beta
              </Badge>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Plan Your Perfect{" "}
                <span className="text-primary">Road Trip</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground lg:text-xl">
                Discover the smartest way to plan your adventures. Create routes,
                find hidden gems, and make every journey unforgettable.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Planning Free
                    <RiArrowRightLine className="size-4" />
                  </Button>
                </Link>
                <Link href="/#features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Decorative gradient */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need for the Perfect Trip
              </h2>
              <p className="text-lg text-muted-foreground">
                Powerful features designed to make your road trip planning effortless
                and enjoyable.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="size-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About / How It Works Section */}
        <section id="about" className="border-t bg-muted/30 py-24 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Get started in just a few simple steps
              </p>
            </div>
            
            <div className="mx-auto max-w-3xl">
              <div className="space-y-8">
                {[
                  {
                    step: "1",
                    title: "Create Your Account",
                    description:
                      "Sign up for free and set up your profile in seconds.",
                  },
                  {
                    step: "2",
                    title: "Plan Your Route",
                    description:
                      "Enter your starting point and destination. Add stops, set preferences, and customize your trip.",
                  },
                  {
                    step: "3",
                    title: "Hit the Road",
                    description:
                      "Access your trip from any device. Get real-time updates and enjoy the journey!",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-6">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-lg">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Loved by Travelers
              </h2>
              <p className="text-lg text-muted-foreground">
                See what our users are saying about their Roadify experience
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="mb-4 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <RiStarLine
                          key={i}
                          className="size-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                    <p className="mb-4 text-muted-foreground">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary/5 py-24 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Start Your Adventure?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of travelers who plan their trips with Roadify.
                It&apos;s free to get started.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Free Account
                    <RiArrowRightLine className="size-4" />
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <RiCheckLine className="size-4 text-primary" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-1">
                  <RiCheckLine className="size-4 text-primary" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <RiCheckLine className="size-4 text-primary" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}