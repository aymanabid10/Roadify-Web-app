"use client";

import { ColumnDef } from "@tanstack/react-table";
import { UserResponseDto } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RiMoreLine, RiEyeLine, RiEditLine, RiDeleteBinLine, RiRefreshLine } from "@remixicon/react";

interface UsersTableColumnsProps {
  onView: (user: UserResponseDto) => void;
  onEdit: (user: UserResponseDto) => void;
  onDelete: (user: UserResponseDto) => void;
  onRestore: (user: UserResponseDto) => void;
}

export const createUsersTableColumns = ({
  onView,
  onEdit,
  onDelete,
  onRestore,
}: UsersTableColumnsProps): ColumnDef<UserResponseDto>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "userName",
    header: "Username",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("userName") || "—"}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="lowercase">{row.getValue("email") || "—"}</div>
    ),
  },
  {
    accessorKey: "roles",
    header: "Roles",
    cell: ({ row }) => {
      const roles = row.getValue("roles") as string[];
      return (
        <div className="flex gap-1 flex-wrap">
          {roles.map((role) => (
            <Badge key={role} variant="outline">
              {role}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "emailConfirmed",
    header: "Email Status",
    cell: ({ row }) => {
      const confirmed = row.getValue("emailConfirmed") as boolean;
      return (
        <Badge variant={confirmed ? "default" : "outline"}>
          {confirmed ? "Confirmed" : "Unconfirmed"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isDeleted",
    header: "Status",
    cell: ({ row }) => {
      const isDeleted = row.getValue("isDeleted") as boolean;
      return (
        <Badge variant={isDeleted ? "destructive" : "outline"}>
          {isDeleted ? "Deleted" : "Active"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <RiMoreLine className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(user)}>
              <RiEyeLine className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            {!user.isDeleted && (
              <>
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <RiEditLine className="mr-2 h-4 w-4" />
                  Edit user
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="text-destructive"
                >
                  <RiDeleteBinLine className="mr-2 h-4 w-4" />
                  Delete user
                </DropdownMenuItem>
              </>
            )}
            {user.isDeleted && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onRestore(user)}>
                  <RiRefreshLine className="mr-2 h-4 w-4" />
                  Restore user
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
