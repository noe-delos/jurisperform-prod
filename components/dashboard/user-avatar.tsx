"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Shield, LogOut } from "lucide-react";
import Link from "next/link";
import type { User } from "@/lib/types";

interface UserAvatarProps {
  user: User;
  onLogout: () => void;
}

export function UserAvatar({ user, onLogout }: UserAvatarProps) {
  const isAdmin = user.role === "admin" || user.role === "owner";

  // Créer les initiales pour l'avatar fallback
  const initials = `${user.prenom.charAt(0)}${user.nom.charAt(
    0
  )}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage
              src={user.profile_image_url || user.picture_url}
              alt={`${user.prenom} ${user.nom}`}
              className="cursor-pointer"
            />
            <AvatarFallback className="bg-blue-100 cursor-pointer text-blue-700 text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-xl p-3"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.prenom} {user.nom}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {isAdmin && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 mt-1">
                {user.role === "owner" ? "Propriétaire" : "Administrateur"}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/parametres" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/admin" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>Administration</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onSelect={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
