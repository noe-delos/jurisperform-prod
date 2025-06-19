"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import type { UserRole, CourseType, UserStatus } from "@/lib/types";

export async function createUser(formData: FormData) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Check if current user is admin using regular client (for auth)
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    return { error: "Non authentifié" };
  }

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", currentUser.user.id)
    .single();

  if (
    !adminUser ||
    (adminUser.role !== "admin" && adminUser.role !== "owner")
  ) {
    return { error: "Permissions insuffisantes" };
  }

  const email = formData.get("email") as string;
  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const userType = formData.get("userType") as string;
  const expiresAt = formData.get("expiresAt") as string;
  const courses = formData.getAll("courses") as string[];

  const tempPassword = Math.random().toString(36).slice(-8); // Generate random password

  try {
    // Create user in auth.users using admin client
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Skip email confirmation
      });

    if (authError) {
      return { error: authError.message };
    }

    if (authData.user) {
      // Determine role and status
      const role: UserRole = userType === "admin" ? "admin" : "user";
      const status = userType === "admin" ? "active" : "prospect";

      // Create user profile using admin client
      const { error: profileError } = await adminSupabase.from("users").insert([
        {
          id: authData.user.id,
          email,
          prenom,
          nom,
          role,
          status,
          must_change_password: true,
          offer_expires_at: expiresAt || null,
          created_by: currentUser.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        return { error: "Erreur lors de la création du profil utilisateur" };
      }

      // Store temporary password
      const { error: tempPasswordError } = await adminSupabase
        .from("temporary_passwords")
        .insert([
          {
            user_id: authData.user.id,
            temp_password_hash: tempPassword, // Store plain text for display (in real app, hash this)
            created_by: currentUser.user.id,
            created_at: new Date().toISOString(),
          },
        ]);

      if (tempPasswordError) {
        console.error("Error storing temporary password:", tempPasswordError);
        // Don't return error as user creation succeeded
      }

      // If it's a student, create course access (prospects get all courses via trigger)
      if (userType === "student" && courses.length > 0) {
        // First, delete any existing course access (in case of conflicts)
        await adminSupabase
          .from("user_course_access")
          .delete()
          .eq("user_id", authData.user.id);

        const courseAccessData = courses.map((course) => ({
          user_id: authData.user.id,
          course: course as CourseType,
          granted_by: currentUser.user.id,
          expires_at: expiresAt || null,
          created_at: new Date().toISOString(),
        }));

        const { error: courseError } = await adminSupabase
          .from("user_course_access")
          .insert(courseAccessData);

        if (courseError) {
          console.error("Error creating course access:", courseError);
          return { error: "Erreur lors de la création des accès aux cours" };
        }

        // Update user status to active if they have course access
        const { error: statusError } = await adminSupabase
          .from("users")
          .update({ status: "active" })
          .eq("id", authData.user.id);

        if (statusError) {
          console.error("Error updating user status:", statusError);
        }
      }

      revalidatePath("/dashboard/admin");

      let message = `Utilisateur créé avec succès !\n\nMot de passe temporaire : ${tempPassword}`;

      if (userType === "student" && courses.length > 0) {
        message += `\n\nAccès aux cours : ${courses.join(", ")}`;
        if (expiresAt) {
          const expirationDate = new Date(expiresAt).toLocaleDateString(
            "fr-FR"
          );
          message += `\nExpire le : ${expirationDate}`;
        }
      }

      return {
        success: true,
        tempPassword,
        message,
        showPasswordDialog: true,
      };
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Erreur inattendue lors de la création de l'utilisateur" };
  }
}

export async function updateUser(formData: FormData) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Check if current user is admin using regular client (for auth)
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    return { error: "Non authentifié" };
  }

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", currentUser.user.id)
    .single();

  if (
    !adminUser ||
    (adminUser.role !== "admin" && adminUser.role !== "owner")
  ) {
    return { error: "Permissions insuffisantes" };
  }

  const userId = formData.get("userId") as string;
  const email = formData.get("email") as string;
  const prenom = formData.get("prenom") as string;
  const nom = formData.get("nom") as string;
  const userType = formData.get("userType") as string;
  const status = formData.get("status") as UserStatus;
  const expiresAt = formData.get("expiresAt") as string;
  const courses = formData.getAll("courses") as string[];

  try {
    // Determine role
    const role: UserRole = userType === "admin" ? "admin" : "user";

    // Update user profile using admin client
    const { error: profileError } = await adminSupabase
      .from("users")
      .update({
        email,
        prenom,
        nom,
        role,
        status,
        offer_expires_at: expiresAt || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating user profile:", profileError);
      return { error: "Erreur lors de la modification du profil utilisateur" };
    }

    // Update email in auth.users if changed
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      userId,
      {
        email,
      }
    );

    if (authError) {
      console.error("Error updating auth user:", authError);
      // Don't return error here as profile update succeeded
    }

    // Handle course access for students
    if (userType === "student") {
      // Delete existing course access
      const { error: deleteError } = await adminSupabase
        .from("user_course_access")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Error deleting course access:", deleteError);
        return { error: "Erreur lors de la suppression des anciens accès" };
      }

      // Insert new course access if any courses selected
      if (courses.length > 0) {
        const courseAccessData = courses.map((course) => ({
          user_id: userId,
          course: course as CourseType,
          granted_by: currentUser.user.id,
          expires_at: expiresAt || null,
          created_at: new Date().toISOString(),
        }));

        const { error: courseError } = await adminSupabase
          .from("user_course_access")
          .insert(courseAccessData);

        if (courseError) {
          console.error("Error creating course access:", courseError);
          return {
            error: "Erreur lors de la création des nouveaux accès aux cours",
          };
        }
      }
    } else {
      // If changing to admin, remove all course access
      const { error: deleteError } = await adminSupabase
        .from("user_course_access")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Error deleting course access for admin:", deleteError);
      }
    }

    revalidatePath("/dashboard/admin");

    let message = "Utilisateur modifié avec succès !";

    if (userType === "student" && courses.length > 0) {
      message += `\n\nAccès aux cours : ${courses.join(", ")}`;
      if (expiresAt) {
        const expirationDate = new Date(expiresAt).toLocaleDateString("fr-FR");
        message += `\nExpire le : ${expirationDate}`;
      }
    }

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      error: "Erreur inattendue lors de la modification de l'utilisateur",
    };
  }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Check if current user is admin using regular client (for auth)
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    return { error: "Non authentifié" };
  }

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", currentUser.user.id)
    .single();

  if (
    !adminUser ||
    (adminUser.role !== "admin" && adminUser.role !== "owner")
  ) {
    return { error: "Permissions insuffisantes" };
  }

  // Get the user to delete to check permissions
  const { data: userToDelete } = await adminSupabase
    .from("users")
    .select("role, prenom, nom")
    .eq("id", userId)
    .single();

  if (!userToDelete) {
    return { error: "Utilisateur non trouvé" };
  }

  // Only owners can delete admins
  if (userToDelete.role === "admin" && adminUser.role !== "owner") {
    return { error: "Seul un propriétaire peut supprimer un administrateur" };
  }

  // Cannot delete owners
  if (userToDelete.role === "owner") {
    return { error: "Impossible de supprimer un propriétaire" };
  }

  // Cannot delete yourself
  if (userId === currentUser.user.id) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte" };
  }

  try {
    // Delete in order: course access, temporary passwords, user profile, auth user

    // 1. Delete course access
    const { error: courseAccessError } = await adminSupabase
      .from("user_course_access")
      .delete()
      .eq("user_id", userId);

    if (courseAccessError) {
      console.error("Error deleting course access:", courseAccessError);
      return { error: "Erreur lors de la suppression des accès aux cours" };
    }

    // 2. Delete temporary passwords
    const { error: tempPasswordError } = await adminSupabase
      .from("temporary_passwords")
      .delete()
      .eq("user_id", userId);

    if (tempPasswordError) {
      console.error("Error deleting temporary passwords:", tempPasswordError);
      // Don't return error as this is not critical
    }

    // 3. Delete user profile
    const { error: profileError } = await adminSupabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting user profile:", profileError);
      return { error: "Erreur lors de la suppression du profil utilisateur" };
    }

    // 4. Delete auth user
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(
      userId
    );

    if (authError) {
      console.error("Error deleting auth user:", authError);
      // Don't return error as profile is already deleted
    }

    revalidatePath("/dashboard/admin");

    return {
      success: true,
      message: `Utilisateur ${userToDelete.prenom} ${userToDelete.nom} supprimé avec succès`,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      error: "Erreur inattendue lors de la suppression de l'utilisateur",
    };
  }
}
