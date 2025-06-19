/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Check,
  X,
  CalendarIcon,
  Key,
} from "lucide-react";
import { createAdminClient } from "@/utils/supabase/admin";
import type { CourseType } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ParsedUser {
  email: string;
  prenom: string;
  nom: string;
  expiresAt: string;
  tempPassword: string;
  courses: {
    L1: { enabled: boolean };
    L2: { enabled: boolean };
    L3: { enabled: boolean };
    CRFPA: { enabled: boolean };
  };
}

const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g;

// Improved email parsing function inspired by the provided code
const parseEmailsFromText = (text: string): string[] => {
  // First handle common email separators
  const normalizedText = text.replace(/[\r\n,;]+/g, " ");

  // Clean up quoted sections
  const cleanText = normalizedText.replace(/"[^"]*"/g, "");

  // Split by any whitespace
  const parts = cleanText.split(/\s+/);

  // Filter for valid emails
  const validEmails = parts.filter((part) => {
    // Basic email validation
    return /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(part);
  });

  // Deduplicate and convert to lowercase
  return [...new Set(validEmails)].map((email) => email.toLowerCase());
};

// Enhanced email extraction from file content
const extractEmailsFromContent = (content: string): string[] => {
  const allEmails: string[] = [];

  // Try multiple parsing strategies

  // Strategy 1: Direct regex match
  const directMatches = content.match(EMAIL_REGEX) || [];
  allEmails.push(...directMatches);

  // Strategy 2: Parse as potential CSV-like content
  const lines = content.split(/[\r\n]+/);
  lines.forEach((line) => {
    const emails = parseEmailsFromText(line);
    allEmails.push(...emails);
  });

  // Strategy 3: Look for email patterns in comma/semicolon separated values
  const csvPattern = content.split(/[,;]/);
  csvPattern.forEach((part) => {
    const trimmed = part.trim();
    if (/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
      allEmails.push(trimmed);
    }
  });

  // Deduplicate and return
  return [...new Set(allEmails)].map((email) => email.toLowerCase());
};

function parseEmailToName(email: string): { prenom: string; nom: string } {
  const localPart = email.split("@")[0];
  const parts = localPart.split(".");

  if (parts.length === 2) {
    // One dot: first part = prenom, second part = nom
    return {
      prenom:
        parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
      nom: parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase(),
    };
  } else {
    // No dots or multiple dots: everything before @ goes to prenom
    return {
      prenom:
        localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase(),
      nom: "",
    };
  }
}

function getDefaultExpiryDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().split("T")[0];
}

function formatFrenchDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function BulkImportDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"upload" | "review" | "success">("upload");
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    // Check file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setErrors([
        "Type de fichier non supporté. Utilisez un fichier CSV ou Excel.",
      ]);
      return;
    }

    try {
      const text = await selectedFile.text();

      if (!text.trim()) {
        setErrors(["Le fichier est vide."]);
        return;
      }

      // Use improved email extraction
      const emails = extractEmailsFromContent(text);

      if (emails.length === 0) {
        setErrors(["Aucun email valide trouvé dans le fichier."]);
        return;
      }

      // Parse users
      const defaultExpiryDate = getDefaultExpiryDate();
      const users: ParsedUser[] = emails.map((email) => {
        const { prenom, nom } = parseEmailToName(email);
        return {
          email,
          prenom,
          nom,
          expiresAt: defaultExpiryDate,
          tempPassword: Math.random().toString(36).slice(-8),
          courses: {
            L1: { enabled: true },
            L2: { enabled: false },
            L3: { enabled: false },
            CRFPA: { enabled: false },
          },
        };
      });

      setParsedUsers(users);
      setStep("review");
    } catch (error) {
      setErrors(["Erreur lors de la lecture du fichier."]);
    }
  };

  const updateUser = (index: number, field: string, value: any) => {
    setParsedUsers((prev) => {
      const updated = [...prev];
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        (updated[index] as any)[parent][child] = value;
      } else {
        (updated[index] as any)[field] = value;
      }
      return updated;
    });
  };

  const toggleCourse = (userIndex: number, course: CourseType) => {
    updateUser(
      userIndex,
      `courses.${course}.enabled`,
      !parsedUsers[userIndex].courses[course].enabled
    );
  };

  const generateTempPassword = (): string => {
    return Math.random().toString(36).slice(-8);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    const adminSupabase = createAdminClient();

    try {
      // Create users and their course access
      for (const user of parsedUsers) {
        // Create user in auth
        const { data: authUser, error: authError } =
          await adminSupabase.auth.admin.createUser({
            email: user.email,
            password: user.tempPassword,
            email_confirm: true,
          });

        if (authError) {
          console.error("Error creating auth user:", authError);
          continue;
        }

        // Create user profile
        const { error: profileError } = await adminSupabase
          .from("users")
          .insert({
            id: authUser.user.id,
            email: user.email,
            prenom: user.prenom,
            nom: user.nom,
            role: "user",
            status: "active",
          });

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          continue;
        }

        // Create course access
        const courseAccess = Object.entries(user.courses)
          .filter(([_, courseData]) => courseData.enabled)
          .map(([course, courseData]) => ({
            user_id: authUser.user.id,
            course: course as CourseType,
            expires_at: new Date(user.expiresAt).toISOString(),
            granted_by: "bulk_import",
          }));

        if (courseAccess.length > 0) {
          await adminSupabase.from("user_course_access").insert(courseAccess);
        }

        // Store temporary password
        await adminSupabase.from("temporary_passwords").insert({
          user_id: authUser.user.id,
          temp_password_hash: user.tempPassword,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 days
        });
      }

      setStep("success");
    } catch (error) {
      setErrors(["Erreur lors de l'importation des utilisateurs."]);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setStep("upload");
    setFile(null);
    setParsedUsers([]);
    setErrors([]);
    setIsProcessing(false);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setTimeout(resetDialog, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={`${
          step === "review" ? "max-w-6xl" : "max-w-lg"
        } max-h-[90vh] overflow-hidden gradient-juris-ultra-subtle data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-orange-600" />
            <span>Importation en masse d'étudiants</span>
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Télécharger un fichier Excel ou CSV
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Le fichier doit contenir une ligne avec les adresses email des
                étudiants
              </p>

              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg w-80 h-32 mx-auto flex items-center justify-center hover:border-orange-400 transition-colors shadow-soft">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-orange-600 hover:text-orange-700 text-sm">
                    Cliquez pour sélectionner un fichier
                  </span>
                </div>
              </Label>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700 font-medium">Erreurs :</span>
                </div>
                <ul className="mt-2 text-sm text-red-600">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {parsedUsers.length} utilisateur(s) trouvé(s). Configurez leurs
                accès aux cours :
              </p>
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                size="sm"
                className="bg-foreground/5 hover:bg-foreground/10 border-foreground/20 text-foreground rounded-xl cursor-pointer"
              >
                Retour
              </Button>
            </div>

            <div className="overflow-auto max-h-[60vh]">
              <div className="border rounded-lg overflow-hidden shadow-soft">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="gradient-prep-ultra-subtle">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Prénom
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          L1
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          L2
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          L3
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          CRFPA
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Date d'expiration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Mot de passe
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedUsers.map((user, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={user.prenom}
                              onChange={(e) =>
                                updateUser(index, "prenom", e.target.value)
                              }
                              className="w-full text-sm bg-foreground/5 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={user.nom}
                              onChange={(e) =>
                                updateUser(index, "nom", e.target.value)
                              }
                              className="w-full text-sm bg-foreground/5 cursor-pointer"
                            />
                          </td>
                          {(["L1", "L2", "L3", "CRFPA"] as CourseType[]).map(
                            (course) => (
                              <td
                                key={course}
                                className="px-4 py-3 text-center"
                              >
                                <div className="flex justify-center">
                                  <div
                                    className="flex items-center justify-center w-8 h-8 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => toggleCourse(index, course)}
                                  >
                                    <Checkbox
                                      checked={user.courses[course].enabled}
                                      onCheckedChange={() =>
                                        toggleCourse(index, course)
                                      }
                                      className="cursor-pointer h-5 w-5"
                                    />
                                  </div>
                                </div>
                              </td>
                            )
                          )}
                          <td className="px-4 py-3">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-40 justify-start text-left font-normal text-xs bg-foreground/5 cursor-pointer",
                                    !user.expiresAt && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                  {user.expiresAt ? (
                                    format(
                                      new Date(user.expiresAt),
                                      "dd MMMM yyyy",
                                      { locale: fr }
                                    )
                                  ) : (
                                    <span>Choisir une date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    user.expiresAt
                                      ? new Date(user.expiresAt)
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    if (date) {
                                      updateUser(
                                        index,
                                        "expiresAt",
                                        date.toISOString().split("T")[0]
                                      );
                                    }
                                  }}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                  locale={fr}
                                />
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Key className="h-3 w-3 text-orange-500" />
                              <span className="text-xs font-mono bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200">
                                {user.tempPassword}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateUser(
                                    index,
                                    "tempPassword",
                                    generateTempPassword()
                                  )
                                }
                                className="h-6 w-6 p-0 cursor-pointer hover:bg-gray-100"
                                title="Régénérer le mot de passe"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={closeDialog}
                className="bg-foreground/5 hover:bg-foreground/10 border-foreground/20 text-foreground rounded-xl cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  isProcessing ||
                  parsedUsers.every(
                    (user) =>
                      !Object.values(user.courses).some(
                        (course) => course.enabled
                      )
                  )
                }
                className="bg-foreground text-background hover:bg-foreground/90 rounded-xl cursor-pointer"
              >
                {isProcessing ? (
                  <span className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Importation...</span>
                  </span>
                ) : (
                  "Importer les utilisateurs"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Check className="h-8 w-8 text-green-600" />
            </motion.div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Importation réussie !
            </h3>
            <p className="text-gray-600 mb-6">
              {parsedUsers.length} utilisateur(s) ont été créé(s) avec succès.
            </p>
            <Button
              onClick={closeDialog}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-xl cursor-pointer"
            >
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
