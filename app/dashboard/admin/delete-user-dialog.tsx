/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { deleteUser } from "./actions";
import type { User } from "@/lib/types";

interface DeleteUserDialogProps {
  user: User & {
    courses: {
      L1?: any;
      L2?: any;
      L3?: any;
      CRFPA?: any;
    };
    tempPassword?: string | null;
  };
  children: React.ReactNode;
}

export function DeleteUserDialog({ user, children }: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteUser(user.id);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setOpen(false);
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOpen(false);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Supprimer l'utilisateur</span>
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Toutes les données de l'utilisateur
            seront définitivement supprimées.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Nom :</span>
                <span className="ml-2 text-sm text-gray-900">
                  {user.prenom} {user.nom}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Email :
                </span>
                <span className="ml-2 text-sm text-gray-900">{user.email}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Rôle :
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {user.role === "admin"
                    ? "Administrateur"
                    : user.role === "owner"
                    ? "Propriétaire"
                    : "Élève"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              ⚠️ Attention :
            </h4>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• Le compte utilisateur sera définitivement supprimé</li>
              <li>• Tous les accès aux cours seront révoqués</li>
              <li>• Les mots de passe temporaires seront supprimés</li>
              <li>• Cette action ne peut pas être annulée</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
