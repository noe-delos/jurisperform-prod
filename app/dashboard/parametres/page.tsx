import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { UserSettingsForm } from "./user-settings-form";

export default async function ParametresPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    redirect("/login");
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!userProfile) {
    redirect("/dashboard");
  }

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-6 pb-0">
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-2 text-gray-600">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl p-6 pt-4">
          <UserSettingsForm user={userProfile} />
        </div>
      </div>
    </div>
  );
}
