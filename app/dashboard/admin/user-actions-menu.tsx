"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import type { User } from "@/lib/types";

interface UserActionsMenuProps {
  user: User & {
    courses: {
      L1?: any;
      L2?: any;
      L3?: any;
      CRFPA?: any;
    };
    tempPassword?: string | null;
  };
  currentUserRole: string;
}

export function UserActionsMenu({
  user,
  currentUserRole,
}: UserActionsMenuProps) {
  const canDelete =
    currentUserRole === "owner" ||
    (currentUserRole === "admin" && user.role === "user");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        <div className="space-y-1">
          <EditUserDialog user={user}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </EditUserDialog>

          {canDelete && (
            <DeleteUserDialog user={user}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </DeleteUserDialog>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
