"use client";

import { UserDetailsDto } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface UserDetailsDialogProps {
  user: UserDetailsDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Complete information about the user and their data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="text-sm font-medium">{user.userName || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="text-sm font-medium">{user.phoneNumber || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="text-sm font-mono text-xs">{user.id}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Roles */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Roles</h3>
            <div className="flex gap-2 flex-wrap">
              {user.roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Account Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email Confirmed</p>
                <Badge variant={user.emailConfirmed ? "default" : "outline"}>
                  {user.emailConfirmed ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone Confirmed</p>
                <Badge variant={user.phoneNumberConfirmed ? "default" : "outline"}>
                  {user.phoneNumberConfirmed ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">2FA Enabled</p>
                <Badge variant={user.twoFactorEnabled ? "default" : "outline"}>
                  {user.twoFactorEnabled ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lockout Enabled</p>
                <Badge variant={user.lockoutEnabled ? "destructive" : "outline"}>
                  {user.lockoutEnabled ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Access Failed Count</p>
                <p className="text-sm font-medium">{user.accessFailedCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <Badge variant={user.isDeleted ? "destructive" : "default"}>
                  {user.isDeleted ? "Deleted" : "Active"}
                </Badge>
              </div>
            </div>
            {user.lockoutEnd && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Locked out until</p>
                <p className="text-sm font-medium">
                  {new Date(user.lockoutEnd).toLocaleString()}
                </p>
              </div>
            )}
            {user.deletedAt && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Deleted at</p>
                <p className="text-sm font-medium">
                  {new Date(user.deletedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Related Data Counts */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Related Data</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vehicles</p>
                <p className="text-sm font-medium">{user.vehiclesCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Listings</p>
                <p className="text-sm font-medium">{user.listingsCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expertises</p>
                <p className="text-sm font-medium">{user.expertisesCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reviews</p>
                <p className="text-sm font-medium">{user.reviewsCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Media</p>
                <p className="text-sm font-medium">{user.mediaCount}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
