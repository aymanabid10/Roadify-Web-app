"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { adminApi, UserResponseDto, UserDetailsDto, UpdateUserDto, UserFilterRequest } from "@/lib/api";
import { UsersDataTable } from "@/components/admin/users-data-table";
import { createUsersTableColumns } from "@/components/admin/users-table-columns";
import { UserDetailsDialog } from "@/components/admin/user-details-dialog";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RiRefreshLine, RiUserLine, RiDeleteBin6Line } from "@remixicon/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResponseDto | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [showDeletedFilter, setShowDeletedFilter] = useState<boolean | undefined>(false);

  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  // Check authorization
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!isAdmin) {
        router.push("/unauthorized");
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: UserFilterRequest = {
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
        role: roleFilter,
        isDeleted: showDeletedFilter,
      };

      const response = await adminApi.getUsers(filters);
      setUsers(response.data);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, roleFilter, showDeletedFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleView = async (user: UserResponseDto) => {
    try {
      const details = await adminApi.getUserById(user.id);
      setUserDetails(details);
      setDetailsDialogOpen(true);
    } catch (error) {
      toast.error("Failed to fetch user details");
      console.error(error);
    }
  };

  const handleEdit = (user: UserResponseDto) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user: UserResponseDto) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleRestore = (user: UserResponseDto) => {
    setSelectedUser(user);
    setRestoreDialogOpen(true);
  };

  const handleSaveEdit = async (userId: string, data: UpdateUserDto) => {
    try {
      await adminApi.updateUser(userId, data);
      toast.success("User updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user");
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await adminApi.deleteUser(selectedUser.id);
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
      console.error(error);
    }
  };

  const confirmRestore = async () => {
    if (!selectedUser) return;

    try {
      await adminApi.restoreUser(selectedUser.id);
      toast.success("User restored successfully");
      setRestoreDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to restore user");
      console.error(error);
    }
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page on search
  }, []);

  const columns = createUsersTableColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onRestore: handleRestore,
  });

  // Show loading state while checking authorization
  if (authLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  // Don't render anything if not authorized (redirect will happen)
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RiRefreshLine className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <RiUserLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all pages
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Badge variant="default">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => !u.isDeleted).length}
            </div>
            <p className="text-xs text-muted-foreground">
              On current page
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deleted Users</CardTitle>
            <RiDeleteBin6Line className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.isDeleted).length}
            </div>
            <p className="text-xs text-muted-foreground">
              On current page
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter users by role and status</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Select
              value={roleFilter || "all"}
              onValueChange={(value) => {
                setRoleFilter(value === "all" ? undefined : value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="EXPERT">EXPERT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select
              value={
                showDeletedFilter === undefined
                  ? "all"
                  : showDeletedFilter
                  ? "deleted"
                  : "active"
              }
              onValueChange={(value) => {
                setShowDeletedFilter(
                  value === "all" ? undefined : value === "deleted"
                );
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="deleted">Deleted Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            View and manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : (
            <UsersDataTable
              columns={columns}
              data={users}
              searchPlaceholder="Search by username or email..."
              onSearchChange={handleSearchChange}
              pagination={{
                pageIndex: page - 1,
                pageSize,
                totalPages,
                onPageChange: (newPage) => setPage(newPage + 1),
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserDetailsDialog
        user={userDetails}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <EditUserDialog
        user={selectedUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.userName}? This will soft delete the user and all their related data (vehicles, listings, expertises, media, and reviews). This action can be reversed.`}
        confirmText="Delete User"
        variant="destructive"
      />

      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        onConfirm={confirmRestore}
        title="Restore User"
        description={`Are you sure you want to restore ${selectedUser?.userName}? This will restore the user and all their related data.`}
        confirmText="Restore User"
      />
    </div>
  );
}
