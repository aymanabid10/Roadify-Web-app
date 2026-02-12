"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingResponse } from "@/lib/api";
import {
  RiCarLine,
  RiMapPinLine,
  RiShieldCheckLine,
  RiArrowRightLine,
} from "@remixicon/react";

interface LandingListingCardProps {
  listing: ListingResponse;
  index?: number;
}

export function LandingListingCard({ listing }: LandingListingCardProps) {
  const [cardPhotoIndex, setCardPhotoIndex] = useState(0);

  const photos = listing.vehicle?.photoUrls || [];
  const isSale = listing.listingType === 0 || listing.listingType === "SALE";

  // Auto-rotate images in the card preview (not modal)
  useEffect(() => {
    if (photos.length <= 1) return;

    // Random initial delay (0-3 seconds) to stagger card animations
    const initialDelay = Math.random() * 3000;

    const initialTimeout = setTimeout(() => {
      // Rotate every 4 seconds after initial delay
      const interval = setInterval(() => {
        setCardPhotoIndex((prev) => (prev + 1) % photos.length);
      }, 4000);

      return () => clearInterval(interval);
    }, initialDelay);

    return () => clearTimeout(initialTimeout);
  }, [photos.length]);

  return (
    <Link href="/login" className="block h-full">
      <Card
        className="group overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border-2 hover:border-primary/30 h-full"
      >
        {/* Image */}
        <div className="relative h-56 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
          {photos.length > 0 ? (
            <>
              <img
                key={cardPhotoIndex}
                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${photos[cardPhotoIndex]}`}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 animate-fade-in"
              />
              {/* Photo indicator dots */}
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {photos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === cardPhotoIndex
                          ? "w-6 bg-white"
                          : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <RiCarLine className="h-20 w-20 text-muted-foreground opacity-30" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge className={isSale ? "bg-green-600 hover:bg-green-700 shadow-lg" : "bg-blue-600 hover:bg-blue-700 shadow-lg"}>
              {isSale ? "FOR SALE" : "FOR RENT"}
            </Badge>
          </div>

          {listing.expertise && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-white/95 backdrop-blur shadow-lg">
                <RiShieldCheckLine className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          )}

          {/* View Details overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/95 backdrop-blur-sm text-foreground px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
              View Details
              <RiArrowRightLine className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <h3 className="font-bold text-xl mb-3 line-clamp-1 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <RiMapPinLine className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{listing.location}</span>
          </div>

          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span className="text-3xl font-bold text-primary">
                ${listing.price.toLocaleString()}
              </span>
              {!isSale && <span className="text-sm text-muted-foreground ml-1">/day</span>}
            </div>
            {listing.isPriceNegotiable && (
              <Badge variant="outline" className="text-xs">
                Negotiable
              </Badge>
            )}
          </div>

          {listing.vehicle && (
            <div className="pt-4 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {listing.vehicle.year} • {listing.vehicle.brand}
              </span>
              <span className="font-medium text-primary group-hover:translate-x-1 transition-transform">
                Learn More →
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
