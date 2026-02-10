"use client";

import { useState, useRef } from "react";
import { ExpertiseResponse, expertApi } from "@/lib/api";
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
import { toast } from "sonner";
import { RiUploadLine, RiLoader4Line, RiFileTextLine, RiDeleteBinLine } from "@remixicon/react";

interface UploadDocumentDialogProps {
  expertise: ExpertiseResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UploadDocumentDialog({
  expertise,
  open,
  onOpenChange,
  onSuccess,
}: UploadDocumentDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload PDF, JPG, or PNG files only.");
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error("File size exceeds 10MB limit");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expertise || !selectedFile) return;

    setIsUploading(true);
    try {
      // Use update if document exists, otherwise upload
      if (expertise.documentUrl) {
        await expertApi.updateDocument(expertise.id, selectedFile);
        toast.success("Document updated successfully");
      } else {
        await expertApi.uploadDocument(expertise.id, selectedFile);
        toast.success("Document uploaded successfully");
      }
      onSuccess();
      onOpenChange(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || "Failed to upload document";
      toast.error(errorMessage);
      console.error("Upload document error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!expertise || !expertise.documentUrl) return;

    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await expertApi.deleteDocument(expertise.id);
      toast.success("Document deleted successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.data?.message || "Failed to delete document";
      toast.error(errorMessage);
      console.error("Delete document error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!expertise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Technical Report</DialogTitle>
          <DialogDescription>
            Upload supporting documentation for the expertise review
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Document Info */}
          {expertise.documentUrl && (
            <div className="bg-muted p-3 rounded-lg text-sm">
              <strong>Current Document:</strong>
              <a 
                href={expertise.documentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline block mt-1"
              >
                {expertise.documentUrl}
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Uploading a new file will replace the existing document
              </p>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">
              Select File <span className="text-destructive">*</span>
            </Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mb-2"
              >
                <RiUploadLine className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <RiFileTextLine className="h-4 w-4 text-primary" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-muted-foreground">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  PDF, JPG, or PNG (max 10MB)
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            {expertise.documentUrl && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isUploading || isDeleting}
                className="mr-auto"
              >
                {isDeleting && <RiLoader4Line className="mr-2 size-4 animate-spin" />}
                <RiDeleteBinLine className="mr-2 h-4 w-4" />
                Delete Document
              </Button>
            )}
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }} 
              disabled={isUploading || isDeleting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || isDeleting || !selectedFile}>
              {isUploading ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  {expertise.documentUrl ? "Updating..." : "Uploading..."}
                </>
              ) : (
                <>
                  <RiUploadLine className="mr-2 h-4 w-4" />
                  {expertise.documentUrl ? "Update" : "Upload"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
