"use client";

import { useState, useEffect } from "react";
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
import { updateUser } from "./actions";
import type { User } from "@/lib/types";

interface EditUserDialogProps {
  children: React.ReactNode;
  user: User & {
    courses: {
      L1?: any;
      L2?: any;
      L3?: any;
      CRFPA?: any;
    };
  };
}

export function EditUserDialog({ children, user }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>(
    user.role === "admin" ? "admin" : "student"
  );
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [status, setStatus] = useState<string>(user.status);

  useEffect(() => {
    // Initialize selected courses based on user's current access
    const courses = [];
    if (user.courses.L1) courses.push("L1");
    if (user.courses.L2) courses.push("L2");
    if (user.courses.L3) courses.push("L3");
    if (user.courses.CRFPA) courses.push("CRFPA");
    setSelectedCourses(courses);
  }, [user]);

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
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    formData.append("userId", user.id);

    // Add selected courses to form data
    selectedCourses.forEach((course) => {
      formData.append("courses", course);
    });

    try {
      const result = await updateUser(formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.message || "Utilisateur modifié avec succès");
        // Close dialog after 2 seconds
        setTimeout(() => {
          setOpen(false);
          setSuccess(null);
        }, 2000);
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Modifiez les informations et accès de {user.prenom} {user.nom}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4 border border-green-200">
              <div className="text-sm text-green-700">{success}</div>
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
                defaultValue={user.prenom}
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
                defaultValue={user.nom}
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
              defaultValue={user.email}
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="student">Élève</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              name="status"
              required
              disabled={isLoading}
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
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
                        id={`edit-${course}`}
                        checked={selectedCourses.includes(course)}
                        onCheckedChange={(checked) =>
                          handleCourseChange(course, checked as boolean)
                        }
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor={`edit-${course}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {course}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Date d'expiration (optionnel)</Label>
                <Input
                  id="expiresAt"
                  name="expiresAt"
                  type="date"
                  disabled={isLoading}
                  min={new Date().toISOString().split("T")[0]}
                  defaultValue={
                    user.offer_expires_at
                      ? new Date(user.offer_expires_at)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
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
              onClick={() => {
                setOpen(false);
                setError(null);
                setSuccess(null);
              }}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Modifier l'utilisateur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
