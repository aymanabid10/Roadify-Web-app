"use client";

import { useState } from "react";
import { UserResponseDto, UpdateUserDto } from "@/lib/api";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RiCloseLine, RiAddLine } from "@remixicon/react";

interface EditUserDialogProps {
  user: UserResponseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, data: UpdateUserDto) => Promise<void>;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSave,
}: EditUserDialogProps) {
  const [formData, setFormData] = useState<UpdateUserDto>({});
  const [roles, setRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (open && user) {
      setFormData({
        userName: user.userName || undefined,
        email: user.email || undefined,
        phoneNumber: user.phoneNumber || undefined,
        emailConfirmed: user.emailConfirmed,
        phoneNumberConfirmed: user.phoneNumberConfirmed,
        twoFactorEnabled: user.twoFactorEnabled,
        lockoutEnabled: user.lockoutEnabled,
      });
      setRoles(user.roles || []);
    }
    onOpenChange(open);
  };

  const handleAddRole = () => {
    if (newRole && !roles.includes(newRole)) {
      setRoles([...roles, newRole]);
      setNewRole("");
    }
  };

  const handleRemoveRole = (role: string) => {
    setRoles(roles.filter((r) => r !== role));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await onSave(user.id, {
        ...formData,
        roles: roles.length > 0 ? roles : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Make changes to user information and permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Username</Label>
                <Input
                  id="userName"
                  value={formData.userName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
              />
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {roles.map((role) => (
                <Badge key={role} variant="outline" className="gap-1">
                  {role}
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(role)}
                    className="ml-1"
                  >
                    <RiCloseLine className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add role (USER, ADMIN, EXPERT)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRole();
                  }
                }}
              />
              <Button type="button" onClick={handleAddRole} variant="outline">
                <RiAddLine className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailConfirmed"
                checked={formData.emailConfirmed}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    emailConfirmed: checked as boolean,
                  })
                }
              />
              <Label htmlFor="emailConfirmed" className="cursor-pointer">
                Email Confirmed
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="phoneNumberConfirmed"
                checked={formData.phoneNumberConfirmed}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    phoneNumberConfirmed: checked as boolean,
                  })
                }
              />
              <Label htmlFor="phoneNumberConfirmed" className="cursor-pointer">
                Phone Number Confirmed
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="twoFactorEnabled"
                checked={formData.twoFactorEnabled}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    twoFactorEnabled: checked as boolean,
                  })
                }
              />
              <Label htmlFor="twoFactorEnabled" className="cursor-pointer">
                Two-Factor Authentication Enabled
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lockoutEnabled"
                checked={formData.lockoutEnabled}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    lockoutEnabled: checked as boolean,
                  })
                }
              />
              <Label htmlFor="lockoutEnabled" className="cursor-pointer">
                Lockout Enabled
              </Label>
            </div>
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
