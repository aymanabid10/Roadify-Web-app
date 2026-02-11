"use client";

import { useState } from "react";
import { ListingResponse, expertApi, CreateExpertiseRequest } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RiCheckLine, RiCloseLine, RiLoader4Line, RiFileTextLine, RiStarLine, RiMoneyDollarCircleLine, RiCalendarLine } from "@remixicon/react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface CreateExpertiseDialogProps {
  listing: ListingResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateExpertiseDialog({
  listing,
  open,
  onOpenChange,
  onSuccess,
}: CreateExpertiseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateExpertiseRequest>({
    listingId: "",
    technicalReport: "",
    isApproved: false,
    conditionScore: 50,
    estimatedValue: undefined,
    inspectionDate: new Date().toISOString().split('T')[0],
  });

  // Update listingId when listing changes
  useState(() => {
    if (listing) {
      setFormData((prev) => ({ ...prev, listingId: listing.id }));
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!listing) return;

    // Validation
    if (!formData.technicalReport.trim()) {
      toast.error("Technical report is required");
      return;
    }

    if (formData.conditionScore < 0 || formData.conditionScore > 100) {
      toast.error("Condition score must be between 0 and 100");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateExpertiseRequest = {
        ...formData,
        listingId: listing.id,
      };

      await expertApi.createExpertise(payload);
      toast.success("Expertise created successfully");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        listingId: "",
        technicalReport: "",
        isApproved: false,
        conditionScore: 50,
        estimatedValue: undefined,
        inspectionDate: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      const errorMessage = error?.data?.message || "Failed to create expertise";
      toast.error(errorMessage);
      console.error("Create expertise error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Expertise Review</DialogTitle>
          <DialogDescription className="text-base">
            Provide a professional assessment for: <strong className="text-foreground">{listing.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Details */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Listing Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <RiMoneyDollarCircleLine className="h-4 w-4 text-primary" />
                <span className="text-sm"><strong>Price:</strong> ${listing.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{listing.listingType === 0 || listing.listingType === "SALE" ? "FOR SALE" : "FOR RENT"}</Badge>
              </div>
              <div className="text-sm"><strong>Location:</strong> {listing.location}</div>
              <div className="text-sm"><strong>Owner:</strong> {listing.ownerUsername || "Unknown"}</div>
            </div>
          </div>

          {/* Technical Report */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RiFileTextLine className="h-5 w-5 text-primary" />
              <Label htmlFor="technicalReport" className="text-base font-semibold">
                Technical Report <span className="text-destructive">*</span>
              </Label>
            </div>
            <Textarea
              id="technicalReport"
              value={formData.technicalReport}
              onChange={(e) => setFormData({ ...formData, technicalReport: e.target.value })}
              placeholder="Provide detailed findings including:\n• Engine condition\n• Body and paint condition\n• Interior condition\n• Mechanical systems\n• Safety features\n• Any defects or issues found"
              rows={8}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <span className="text-primary">💡</span>
              Include comprehensive details about the vehicle's condition, any repairs needed, and overall assessment
            </p>
          </div>

          {/* Condition Score */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RiStarLine className="h-5 w-5 text-primary" />
              <Label htmlFor="conditionScore" className="text-base font-semibold">
                Condition Score <span className="text-destructive">*</span>
              </Label>
            </div>
            <div className="space-y-4 bg-muted/50 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Poor</span>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{formData.conditionScore}</div>
                  <div className="text-xs text-muted-foreground">out of 100</div>
                </div>
                <span className="text-sm text-muted-foreground">Excellent</span>
              </div>
              <Slider
                value={[formData.conditionScore]}
                onValueChange={(value) => setFormData({ ...formData, conditionScore: value[0] })}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
              <div className="mt-2">
                <Badge variant={formData.conditionScore >= 80 ? "default" : formData.conditionScore >= 60 ? "secondary" : "destructive"}>
                  {formData.conditionScore >= 80 ? "Excellent Condition" : formData.conditionScore >= 60 ? "Good Condition" : formData.conditionScore >= 40 ? "Fair Condition" : "Poor Condition"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Estimated Value */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RiMoneyDollarCircleLine className="h-5 w-5 text-primary" />
              <Label htmlFor="estimatedValue" className="text-base font-semibold">Estimated Market Value ($)</Label>
            </div>
            <Input
              id="estimatedValue"
              type="number"
              min="0"
              step="0.01"
              value={formData.estimatedValue || ""}
              onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="e.g., 25000"
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <span className="text-primary">💡</span>
              Your professional estimate based on current market conditions and vehicle condition
            </p>
          </div>

          {/* Inspection Date */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RiCalendarLine className="h-5 w-5 text-primary" />
              <Label htmlFor="inspectionDate" className="text-base font-semibold">Inspection Date</Label>
            </div>
            <Input
              id="inspectionDate"
              type="date"
              value={formData.inspectionDate}
              onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
              className="text-base"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <RiCheckLine className="mr-2 h-4 w-4" />
                  Create Expertise
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        <div className="border-t pt-4 mt-4 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-blue-500 text-lg">ℹ️</span>
            <span>
              <strong className="text-foreground">Next Steps:</strong> After creating the expertise, you can upload supporting documents (photos, inspection reports) and then approve or reject the listing based on your assessment.
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
