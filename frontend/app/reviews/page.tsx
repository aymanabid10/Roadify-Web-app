"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { reviewsApi, ReviewDto } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RiStarLine, RiStarFill, RiDeleteBin6Line, RiEditLine, RiRefreshLine, RiUserLine } from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ReviewsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<ReviewDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRating, setEditRating] = useState(10);
  const [editComment, setEditComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchReviews = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const data = await reviewsApi.getMyReviews();
      setReviews(data);
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [isAuthenticated]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await reviewsApi.deleteReview(reviewId);
      toast.success("Review deleted successfully");
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete review");
    }
  };

  const handleEditReview = (review: ReviewDto) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;

    setIsSaving(true);
    try {
      await reviewsApi.updateReview(editingReview.id, {
        rating: editRating,
        comment: editComment || undefined,
      });
      toast.success("Review updated successfully");
      setEditDialogOpen(false);
      fetchReviews();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to update review");
    } finally {
      setIsSaving(false);
    }
  };

  const renderStars = (rating: number) => {
    // Convert 1-10 to 1-5 stars for display (2 points = 1 star)
    const starRating = Math.ceil(rating / 2);
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= starRating ? (
            <RiStarFill key={star} className="h-5 w-5 text-yellow-500" />
          ) : (
            <RiStarLine key={star} className="h-5 w-5 text-gray-300" />
          )
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    if (rating <= 2) return "Poor";
    if (rating <= 4) return "Fair";
    if (rating <= 6) return "Good";
    if (rating <= 8) return "Very Good";
    return "Excellent";
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reviews</h1>
          <p className="text-muted-foreground">
            Reviews you&apos;ve written for other users
          </p>
        </div>
        <Button onClick={fetchReviews} variant="outline" size="sm">
          <RiRefreshLine className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>
            {reviews.length} review{reviews.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RiStarLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven&apos;t written any reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <RiUserLine className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Review for {review.targetUsername}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-13">
                          {renderStars(review.rating)}
                          <span className="text-sm font-medium text-muted-foreground">({review.rating}/10)</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditReview(review)}
                          title="Edit review"
                        >
                          <RiEditLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReview(review.id)}
                          title="Delete review"
                        >
                          <RiDeleteBin6Line className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {review.comment && (
                      <div className="ml-13 mt-3 p-4 bg-muted rounded-lg">
                        <p className="text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Review Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
              Update your review for {editingReview?.targetUsername}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Rating</Label>
                <div className="flex items-center gap-2">
                  {renderStars(editRating)}
                  <span className="text-sm font-semibold text-primary">{editRating}/10</span>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={editRating}
                  onChange={(e) => setEditRating(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span className="font-medium text-foreground">{getRatingLabel(editRating)}</span>
                  <span>10</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Share your experience..."
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
