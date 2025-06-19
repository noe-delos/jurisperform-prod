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
} from "@/components/ui/dialog";
import { Copy, Eye, EyeOff } from "lucide-react";

interface PasswordDisplayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userInfo: {
    prenom: string;
    nom: string;
    email: string;
    tempPassword: string;
  };
}

export function PasswordDisplayDialog({
  open,
  onOpenChange,
  userInfo,
}: PasswordDisplayDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(userInfo.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-green-700">
            ✅ Utilisateur créé avec succès !
          </DialogTitle>
          <DialogDescription>
            L'utilisateur {userInfo.prenom} {userInfo.nom} a été créé. Voici son
            mot de passe temporaire :
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4 border border-green-200">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-green-800">
                  Email :
                </label>
                <p className="text-sm text-green-700">{userInfo.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-green-800">
                  Mot de passe temporaire :
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex-1 bg-white border border-green-300 rounded px-3 py-2 font-mono text-lg">
                    {showPassword ? userInfo.tempPassword : "••••••••"}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Copié dans le presse-papiers
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              ⚠️ Important :
            </h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>
                • L'utilisateur devra changer ce mot de passe lors de sa
                première connexion
              </li>
              <li>• Communiquez ce mot de passe de manière sécurisée</li>
              <li>• Ce mot de passe expire dans 7 jours</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-green-600 hover:bg-green-700 transition-colors cursor-pointer"
          >
            J'ai noté le mot de passe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
