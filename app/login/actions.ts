"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    prenom: formData.get("prenom") as string,
    nom: formData.get("nom") as string,
  };

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: undefined, // Disable email confirmation
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Create user profile in public.users table as prospect
  if (authData.user) {
    const { error: profileError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email: data.email,
        prenom: data.prenom,
        nom: data.nom,
        role: "user",
        status: "prospect",
        must_change_password: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      return { error: "Erreur lors de la création du profil utilisateur" };
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
