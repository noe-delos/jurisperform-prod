/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createUser } from "./actions";
import { PasswordDisplayDialog } from "./password-display-dialog";

interface CreateUserDialogProps {
  children: React.ReactNode;
}

export function CreateUserDialog({ children }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // Password dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    prenom: string;
    nom: string;
    email: string;
    tempPassword: string;
  } | null>(null);

  const handleCourseChange = (course: string, checked: boolean) => {
    if (checked) {
      setSelectedCourses((prev) => [...prev, course]);
    } else {
      setSelectedCourses((prev) => prev.filter((c) => c !== course));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    // Add selected courses to form data
    selectedCourses.forEach((course) => {
      formData.append("courses", course);
    });

    try {
      const result = await createUser(formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success && result.showPasswordDialog) {
        // Close creation dialog
        setOpen(false);

        // Reset form
        (event.target as HTMLFormElement).reset();
        setUserType("");
        setSelectedCourses([]);

        // Show password dialog
        setUserInfo({
          prenom: formData.get("prenom") as string,
          nom: formData.get("nom") as string,
          email: formData.get("email") as string,
          tempPassword: result.tempPassword,
        });
        setShowPasswordDialog(true);
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOpen(false);
    setUserType("");
    setSelectedCourses([]);
    setError(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Créez un nouveau compte utilisateur. Un mot de passe temporaire
              sera généré automatiquement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  name="prenom"
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  name="nom"
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                disabled={isLoading}
                placeholder="jean.dupont@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userType">Type d'utilisateur</Label>
              <Select
                name="userType"
                required
                disabled={isLoading}
                value={userType}
                onValueChange={setUserType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="student">Élève</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userType === "student" && (
              <>
                <div className="space-y-3">
                  <Label>Accès aux cours</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["L1", "L2", "L3", "CRFPA"].map((course) => (
                      <div key={course} className="flex items-center space-x-2">
                        <Checkbox
                          id={course}
                          checked={selectedCourses.includes(course)}
                          onCheckedChange={(checked) =>
                            handleCourseChange(course, checked as boolean)
                          }
                          disabled={isLoading}
                        />
                        <Label
                          htmlFor={course}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {course}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiresAt">
                    Date d'expiration (optionnel)
                  </Label>
                  <Input
                    id="expiresAt"
                    name="expiresAt"
                    type="date"
                    disabled={isLoading}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Si non spécifiée, l'accès sera permanent
                  </p>
                </div>
              </>
            )}

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
                type="submit"
                disabled={
                  isLoading ||
                  (userType === "student" && selectedCourses.length === 0)
                }
                className="bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l'utilisateur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Display Dialog */}
      {userInfo && (
        <PasswordDisplayDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          userInfo={userInfo}
        />
      )}
    </>
  );
}
