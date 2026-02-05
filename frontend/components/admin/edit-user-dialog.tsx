"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  useEffect(() => {
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
  }, [open, user]);

  const handleOpenChange = (open: boolean) => {
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
        roles: roles,
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
                <Badge
                  key={role}
                  variant={role === "ADMIN" ? "default" : "outline"}
                  className="gap-1.5 py-1 px-2 text-xs font-medium"
                >
                  {role}
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(role)}
                    className="ml-0.5 rounded-full outline-none ring-offset-background transition-colors hover:text-destructive focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <RiCloseLine className="h-3.5 w-3.5" />
                    <span className="sr-only">Remove {role} role</span>
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select
                value={newRole}
                onValueChange={(value) => {
                  if (value && !roles.includes(value)) {
                    setRoles([...roles, value]);
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add a role..." />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
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
