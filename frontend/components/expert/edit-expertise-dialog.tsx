"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { expertApi, ExpertiseResponse, UpdateExpertiseRequest } from "@/lib/api";
import { toast } from "sonner";
import { RiLoader4Line } from "@remixicon/react";

interface EditExpertiseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expertise: ExpertiseResponse;
  onSuccess?: () => void;
}

export function EditExpertiseDialog({
  open,
  onOpenChange,
  expertise,
  onSuccess,
}: EditExpertiseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateExpertiseRequest>({
    technicalReport: expertise.technicalReport,
    conditionScore: expertise.conditionScore,
    estimatedValue: expertise.estimatedValue ?? undefined,
    inspectionDate: expertise.inspectionDate ? new Date(expertise.inspectionDate).toISOString().split('T')[0] : undefined,
  });

  // Reset form when expertise changes
  useEffect(() => {
    setFormData({
      technicalReport: expertise.technicalReport,
      conditionScore: expertise.conditionScore,
      estimatedValue: expertise.estimatedValue ?? undefined,
      inspectionDate: expertise.inspectionDate ? new Date(expertise.inspectionDate).toISOString().split('T')[0] : undefined,
    });
  }, [expertise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.technicalReport?.trim()) {
      toast.error("Technical report is required");
      return;
    }

    if (formData.conditionScore === undefined || formData.conditionScore < 0 || formData.conditionScore > 100) {
      toast.error("Condition score must be between 0 and 100");
      return;
    }

    setIsSubmitting(true);
    try {
      await expertApi.updateExpertise(expertise.id, formData);
      toast.success("Expertise updated successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update expertise");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expertise Review</DialogTitle>
          <DialogDescription>
            Update the expertise review details. You can still approve or reject after editing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="technicalReport">
              Technical Report <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="technicalReport"
              value={formData.technicalReport}
              onChange={(e) => setFormData({ ...formData, technicalReport: e.target.value })}
              placeholder="Detailed technical assessment..."
              rows={8}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conditionScore">
                Condition Score (0-100) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="conditionScore"
                type="number"
                min="0"
                max="100"
                value={formData.conditionScore ?? ''}
                onChange={(e) => setFormData({ ...formData, conditionScore: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
              <Input
                id="estimatedValue"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimatedValue ?? ''}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspectionDate">Inspection Date</Label>
            <Input
              id="inspectionDate"
              type="date"
              value={formData.inspectionDate ?? ''}
              onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <RiLoader4Line className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
