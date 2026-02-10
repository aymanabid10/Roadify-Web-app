"use client";

import { useState } from "react";
import { ExpertiseResponse, expertApi, RejectExpertiseRequest } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RiCloseLine, RiLoader4Line } from "@remixicon/react";

interface RejectListingDialogProps {
  expertise: ExpertiseResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const REJECTION_REASONS = [
  { value: "SAFETY_CONCERNS", label: "Safety Concerns" },
  { value: "INCOMPLETE_DOCUMENTATION", label: "Incomplete Documentation" },
  { value: "INACCURATE_INFORMATION", label: "Inaccurate Information" },
  { value: "POOR_CONDITION", label: "Poor Condition" },
  { value: "LEGAL_ISSUES", label: "Legal Issues" },
  { value: "OTHER", label: "Other" },
];

export function RejectListingDialog({
  expertise,
  open,
  onOpenChange,
  onSuccess,
}: RejectListingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RejectExpertiseRequest>({
    reason: "",
    feedback: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expertise) return;

    // Validation
    if (!formData.reason) {
      toast.error("Please select a rejection reason");
      return;
    }

    if (!formData.feedback?.trim()) {
      toast.error("Please provide detailed feedback");
      return;
    }

    setIsSubmitting(true);
    try {
      await expertApi.rejectListing(expertise.id, formData);
      toast.success("Listing rejected successfully");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({ reason: "", feedback: "" });
    } catch (error: any) {
      const errorMessage = error?.data?.message || "Failed to reject listing";
      toast.error(errorMessage);
      console.error("Reject listing error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!expertise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reject Listing</DialogTitle>
          <DialogDescription>
            Provide a reason and detailed feedback for rejecting this listing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Expertise Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <div><strong>Condition Score:</strong> {expertise.conditionScore}/100</div>
            {expertise.estimatedValue && (
              <div><strong>Estimated Value:</strong> ${expertise.estimatedValue.toLocaleString()}</div>
            )}
            <div className="pt-2 border-t">
              <strong>Technical Report:</strong>
              <p className="mt-1 text-muted-foreground">{expertise.technicalReport.substring(0, 200)}...</p>
            </div>
          </div>

          {/* Rejection Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData({ ...formData, reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Detailed Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">
              Detailed Feedback <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feedback"
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              placeholder="Provide specific details about why the listing is being rejected and what needs to be addressed..."
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              Be specific and constructive. The owner will see this feedback.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <RiCloseLine className="mr-2 h-4 w-4" />
                  Reject Listing
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-destructive">
            <strong>Warning:</strong> This action will notify the listing owner and change the listing status to REJECTED.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
