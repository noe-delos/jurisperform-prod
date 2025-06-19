"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(formData: FormData) {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    return { error: "Non authentifié" };
  }

  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const email = formData.get("email") as string;

  try {
    // Update user profile in database
    const { error: profileError } = await supabase
      .from("users")
      .update({
        prenom,
        nom,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentUser.user.id);

    if (profileError) {
      console.error("Error updating user profile:", profileError);
      return { error: "Erreur lors de la mise à jour du profil" };
    }

    // Update email in auth.users if it changed
    if (email !== currentUser.user.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email,
      });

      if (authError) {
        console.error("Error updating auth user email:", authError);
        return {
          error:
            "Profil mis à jour mais erreur lors de la modification de l'email. Veuillez vérifier votre boîte mail.",
        };
      }
    }

    revalidatePath("/dashboard/parametres");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Profil mis à jour avec succès",
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      error: "Erreur inattendue lors de la mise à jour du profil",
    };
  }
}

export async function uploadProfileImage(file: File) {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    return { error: "Non authentifié" };
  }

  try {
    // Create unique filename with user ID in the path (required for RLS)
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${currentUser.user.id}/${fileName}`;

    console.log("Uploading file to path:", filePath);

    // Delete old profile image if exists
    const { data: existingFiles } = await supabase.storage
      .from("avatars")
      .list(currentUser.user.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(
        (file) => `${currentUser.user.id}/${file.name}`
      );
      await supabase.storage.from("avatars").remove(filesToDelete);
    }

    // Upload new file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true, // Allow overwriting
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return {
        error: `Erreur lors de l'upload de l'image: ${uploadError.message}`,
      };
    }

    console.log("Upload successful:", uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return { error: "Erreur lors de la génération de l'URL de l'image" };
    }

    console.log("Public URL:", urlData.publicUrl);

    // Update user profile with new image URL
    const { error: updateError } = await supabase
      .from("users")
      .update({
        profile_image_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentUser.user.id);

    if (updateError) {
      console.error("Error updating user profile image:", updateError);
      return { error: "Erreur lors de la mise à jour du profil" };
    }

    revalidatePath("/dashboard/parametres");
    revalidatePath("/dashboard");

    return {
      success: true,
      imageUrl: urlData.publicUrl,
      message: "Photo de profil mise à jour avec succès",
    };
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return {
      error: "Erreur inattendue lors de l'upload de l'image",
    };
  }
}
