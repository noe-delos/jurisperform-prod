"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function connexion(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/erreur");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function inscription(formData: FormData) {
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
    redirect("/erreur");
  }

  // Create user profile in public.users table
  if (authData.user) {
    const { error: profileError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email: data.email,
        prenom: data.prenom,
        nom: data.nom,
        created_at: new Date().toISOString(),
      },
    ]);

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      // Continue anyway, the auth user was created
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}
