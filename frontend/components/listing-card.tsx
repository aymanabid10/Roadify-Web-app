import { ListingResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiCarLine } from "@remixicon/react";
import { ReactNode } from "react";

const STATUS_MAP = {
  0: { label: "Draft", color: "bg-gray-500" },
  1: { label: "Pending Review", color: "bg-yellow-500" },
  2: { label: "Published", color: "bg-green-500" },
  3: { label: "Rejected", color: "bg-red-500" },
  4: { label: "Archived", color: "bg-gray-400" },
};

interface ListingCardProps {
  listing: ListingResponse;
  actions?: ReactNode;
  showOwner?: boolean;
  showExpertise?: boolean;
  onClick?: () => void;
}

export function ListingCard({ 
  listing, 
  actions, 
  showOwner = false,
  showExpertise = false,
  onClick 
}: ListingCardProps) {
  // Handle both numeric (0, 1) and string ("0", "1", "SALE", "RENT") values
  const isSale = listing.listingType === 0 || 
                 listing.listingType === "0" || 
                 listing.listingType === "SALE" || 
                 listing.listingType === "Sale";
  const photos = listing.vehicle?.photoUrls && listing.vehicle.photoUrls.length > 0 
    ? listing.vehicle.photoUrls 
    : [];

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Image */}
          <div className="w-32 h-32 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
            {photos.length > 0 ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${photos[0]}`}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <RiCarLine className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
            )}
          </div>

          {/* Middle - Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-lg font-semibold truncate">{listing.title}</h3>
              <Badge className={STATUS_MAP[listing.status as keyof typeof STATUS_MAP].color}>
                {STATUS_MAP[listing.status as keyof typeof STATUS_MAP].label}
              </Badge>
              <Badge className={isSale ? "bg-green-600" : "bg-blue-600"}>
                {isSale ? "FOR SALE" : "FOR RENT"}
              </Badge>
              {showExpertise && listing.expertise && (
                <Badge variant="secondary">
                  ✓ Score: {listing.expertise.conditionScore}/100
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {listing.description || "No description"}
            </p>
            
            <div className="flex gap-4 text-sm flex-wrap">
              <span>
                <strong>Price:</strong> ${listing.price.toLocaleString()}
                {!isSale && <span className="text-muted-foreground">/day</span>}
              </span>
              <span>
                <strong>Location:</strong> {listing.location}
              </span>
              {showOwner && (
                <span>
                  <strong>Owner:</strong> {listing.ownerUsername || "Unknown"}
                </span>
              )}
              {listing.vehicle && (
                <span>
                  <strong>Vehicle:</strong> {listing.vehicle.brand} {listing.vehicle.model} ({listing.vehicle.year})
                </span>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          {actions && (
            <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
