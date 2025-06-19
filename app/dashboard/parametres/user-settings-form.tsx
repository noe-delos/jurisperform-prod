"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import { updateUserProfile, uploadProfileImage } from "./actions";
import type { User } from "@/lib/types";

interface UserSettingsFormProps {
  user: User;
}

export function UserSettingsForm({ user }: UserSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState(
    user.profile_image_url || ""
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine theme based on user (you might want to pass course access here too)
  const isPrep = false; // This should be determined based on user's courses
  const isJuris = true; // This should be determined based on user's courses

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await updateUserProfile(formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess("Profil mis à jour avec succès !");
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner un fichier image valide");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const result = await uploadProfileImage(file);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success && result.imageUrl) {
        setProfileImageUrl(result.imageUrl);
        setSuccess("Photo de profil mise à jour avec succès !");
      }
    } catch (err) {
      setError("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Profile Image Section */}
      <Card className="shadow-soft rounded-xl border border-muted">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon icon="mdi:camera" className="h-5 w-5" />
            <span>Photo de profil</span>
          </CardTitle>
          <CardDescription>
            Changez votre photo de profil. Formats acceptés : JPG, PNG, GIF (max
            5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24 shadow-soft">
              <AvatarImage
                src={profileImageUrl}
                alt={`${user.prenom} ${user.nom}`}
              />
              <AvatarFallback className="text-lg bg-gradient-to-br from-gray-100 to-gray-200">
                {getInitials(user.prenom, user.nom)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
                disabled={isUploadingImage}
                className="cursor-pointer rounded-xl border-2 hover:shadow-soft transition-all duration-200"
              >
                {isUploadingImage && (
                  <Icon
                    icon="mdi:loading"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                )}
                {isUploadingImage ? "Upload en cours..." : "Changer la photo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-xs text-gray-500">
                JPG, PNG ou GIF. Maximum 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Section */}
      <Card className="shadow-soft rounded-xl border border-muted">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon icon="mdi:account" className="h-5 w-5" />
            <span>Informations personnelles</span>
          </CardTitle>
          <CardDescription>
            Modifiez vos informations personnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200 shadow-soft">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 p-4 border border-green-200 shadow-soft">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  name="prenom"
                  type="text"
                  required
                  disabled={isLoading}
                  defaultValue={user.prenom}
                  placeholder="Jean"
                  className="rounded-xl border-2 focus:ring-0 focus:border-gray-400 transition-all duration-200"
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
                  placeholder="Dupont"
                  className="rounded-xl border-2 focus:ring-0 focus:border-gray-400 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Icon
                  icon="mdi:email"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isLoading}
                  defaultValue={user.email}
                  className="pl-10 rounded-xl border-2 focus:ring-0 focus:border-gray-400 transition-all duration-200"
                  placeholder="jean.dupont@email.com"
                />
              </div>
              <p className="text-xs text-gray-500">
                La modification de l'email nécessitera une vérification
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer rounded-xl transition-all duration-200 hover:shadow-soft bg-foreground text-background hover:bg-foreground/90"
              >
                {isLoading && (
                  <Icon
                    icon="mdi:loading"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                )}
                <Icon icon="mdi:content-save" className="mr-2 h-4 w-4" />
                Sauvegarder les modifications
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information (Read-only) */}
      <Card className="shadow-soft rounded-xl border border-muted">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon icon="mdi:information" className="h-5 w-5" />
            <span>Informations du compte</span>
          </CardTitle>
          <CardDescription>
            Informations en lecture seule sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 shadow-soft">
              <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Icon icon="mdi:shield-account" className="h-4 w-4" />
                <span>Rôle</span>
              </Label>
              <p className="text-sm text-gray-900 mt-1 font-medium">
                {user.role === "admin"
                  ? "Administrateur"
                  : user.role === "owner"
                  ? "Propriétaire"
                  : "Élève"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 shadow-soft">
              <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Icon icon="mdi:account-check" className="h-4 w-4" />
                <span>Statut</span>
              </Label>
              <p className="text-sm text-gray-900 mt-1 font-medium">
                {user.status === "active"
                  ? "Actif"
                  : user.status === "prospect"
                  ? "Prospect"
                  : user.status === "suspended"
                  ? "Suspendu"
                  : "Expiré"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 shadow-soft">
              <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Icon icon="mdi:calendar-plus" className="h-4 w-4" />
                <span>Compte créé le</span>
              </Label>
              <p className="text-sm text-gray-900 mt-1 font-medium">
                {new Date(user.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {user.offer_expires_at && (
              <div className="p-4 rounded-xl bg-gray-50 shadow-soft">
                <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Icon icon="mdi:calendar-clock" className="h-4 w-4" />
                  <span>Expire le</span>
                </Label>
                <p className="text-sm text-gray-900 mt-1 font-medium">
                  {new Date(user.offer_expires_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
