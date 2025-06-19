/* eslint-disable @typescript-eslint/no-unused-vars */
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardLayoutClient } from "./dashboard-layout-client";
import { logout } from "@/app/actions";
import type { User, UserCourseAccess } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  // Get user profile with role and status
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError || !userProfile) {
    redirect("/login");
  }

  // Get user course access
  const { data: courseAccess } = await supabase
    .from("user_course_access")
    .select("*")
    .eq("user_id", data.user.id);

  const user = userProfile as User;

  // Handle password change requirement
  if (user.must_change_password) {
    redirect("/dashboard/change-password");
  }

  return (
    <DashboardLayoutClient
      user={user}
      courseAccess={courseAccess || []}
      onLogout={logout}
    >
      {children}
    </DashboardLayoutClient>
  );
}
