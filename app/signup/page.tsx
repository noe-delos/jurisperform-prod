"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { signup } from "../login/actions";

const errorMessages: Record<string, string> = {
  "User already registered": "Un compte existe déjà avec cet email",
  "Password should be at least 6 characters":
    "Le mot de passe doit contenir au moins 6 caractères",
  "Unable to validate email address: invalid format": "Format d'email invalide",
  "Signup is disabled": "L'inscription est désactivée",
  "Email rate limit exceeded":
    "Limite d'envoi d'email dépassée, veuillez réessayer plus tard",
  "Invalid email": "Email invalide",
};

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validatePasswords = (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setPasswordError(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!validatePasswords(password, confirmPassword)) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await signup(formData);
      if (result?.error) {
        setError(errorMessages[result.error] || result.error);
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Section - Images with diagonal split */}
      <motion.div
        className="hidden lg:flex lg:w-1/3 items-center ml-24 mr-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="relative overflow-hidden rounded-3xl border shadow-soft w-full aspect-[3/4]">
          {/* Top diagonal section */}
          <div
            className="absolute inset-0 bg-cover bg-center rounded-3xl"
            style={{
              backgroundImage:
                "url(https://jurisperform-toulouse.fr/wp-content/uploads/2021/10/juriste-formation-toulouse-occitanie-1-1024x552.jpg)",
              clipPath: "polygon(0 0, 100% 0, 0 98.5%)",
              backgroundSize: "cover",
            }}
          >
            {/* Darken overlay */}
            <div
              className="absolute inset-0 bg-black/30 rounded-3xl"
              style={{ clipPath: "polygon(0 0, 100% 0, 0 98.5%)" }}
            ></div>

            {/* Top left logo */}
            <div className="absolute top-8 left-8 z-10">
              <img
                src="https://jurisperform-toulouse.fr/wp-content/uploads/2022/11/toulouse-fac-droit-occitanie-800x213.png"
                alt="Jurisperform Logo"
                className="h-12 w-auto object-contain bg-white/90 rounded-lg p-2"
              />
              <p className="text-white text-xs mt-2 font-medium drop-shadow-lg">
                Préparation pendant la Licence de Droit
              </p>
            </div>
          </div>

          {/* Bottom diagonal section */}
          <div
            className="absolute inset-0 bg-cover rounded-3xl"
            style={{
              backgroundImage:
                "url(https://www.precapa-toulouse.fr/wp-content/uploads/2023/10/devenir-avocat-precapa-droit-toulouse.webp)",
              clipPath: "polygon(100% 1.5%, 100% 100%, 0 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          >
            {/* Darken overlay */}
            <div
              className="absolute inset-0 bg-black/30 rounded-3xl"
              style={{ clipPath: "polygon(100% 1.5%, 100% 100%, 0 100%)" }}
            ></div>

            {/* Bottom right logo */}
            <div className="absolute bottom-8 right-8 text-right z-10">
              <img
                src="https://www.precapa-toulouse.fr/wp-content/uploads/2023/09/prepavocat-precapa-ecole-droit-toulouse.jpg"
                alt="Precapa Logo"
                className="h-12 w-auto object-contain bg-white/90 rounded-lg p-2 ml-auto"
              />
              <p className="text-white text-xs mt-2 font-medium drop-shadow-lg max-w-48">
                Réussissez votre entrée au CRFPA, préparez le PréCAPA à Toulouse
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Section - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <motion.div
          className="w-full max-w-md space-y-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Créer un compte
            </h1>
            <p className="text-gray-400 text-sm">
              Rejoignez JURISPERFORM pour accéder à vos formations juridiques
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                className="rounded-md bg-red-50 p-4 border border-red-200"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="text-sm text-red-700">{error}</div>
              </motion.div>
            )}

            {passwordError && (
              <motion.div
                className="rounded-md bg-red-50 p-4 border border-red-200"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="text-sm text-red-700">{passwordError}</div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prenom" className="text-gray-700 font-medium">
                  Prénom
                </Label>
                <Input
                  id="prenom"
                  name="prenom"
                  type="text"
                  autoComplete="given-name"
                  required
                  disabled={isLoading}
                  placeholder="Jean"
                  className="border-0 bg-foreground/5 focus:ring-0 focus:outline-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-sm rounded-lg placeholder:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom" className="text-gray-700 font-medium">
                  Nom
                </Label>
                <Input
                  id="nom"
                  name="nom"
                  type="text"
                  autoComplete="family-name"
                  required
                  disabled={isLoading}
                  placeholder="Dupont"
                  className="border-0 bg-foreground/5 focus:ring-0 focus:outline-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-sm rounded-lg placeholder:text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Adresse email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                placeholder="jean.dupont@email.com"
                className="border-0 bg-foreground/5 focus:ring-0 focus:outline-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-sm rounded-lg placeholder:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="border-0 bg-foreground/5 focus:ring-0 focus:outline-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-sm pr-12 rounded-lg placeholder:text-sm"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Au moins 6 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-gray-700 font-medium"
              >
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="border-0 bg-foreground/5 focus:ring-0 focus:outline-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-sm pr-12 rounded-lg placeholder:text-sm"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 hover:text-gray-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-medium text-white border-0"
                disabled={isLoading}
                style={{
                  backgroundImage: "url(/popover.svg)",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Créer mon compte
              </Button>
            </div>
          </form>

          {/* Bottom link */}
          <div className="text-center pt-6">
            <p className="text-gray-600">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
