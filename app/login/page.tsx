"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { login } from "./actions";

const errorMessages: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect",
  "Email not confirmed": "Veuillez confirmer votre email",
  "Too many requests": "Trop de tentatives, veuillez réessayer plus tard",
  "User not found": "Utilisateur non trouvé",
  "Invalid email": "Email invalide",
  "Password should be at least 6 characters":
    "Le mot de passe doit contenir au moins 6 caractères",
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await login(formData);
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
        className="hidden lg:flex lg:w-1/3 items-center ml-[10rem] mr-6"
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Bienvenue</h1>
            <p className="text-gray-400 text-sm">
              Entrez votre email et mot de passe pour accéder à votre compte
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
                placeholder="votre@email.com"
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
                  autoComplete="current-password"
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
                Se connecter
              </Button>
            </div>
          </form>

          {/* Bottom link */}
          <div className="text-center pt-6">
            <p className="text-gray-600">
              Pas encore membre ?{" "}
              <Link
                href="/signup"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
