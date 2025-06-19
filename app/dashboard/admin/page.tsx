/* eslint-disable @typescript-eslint/no-unused-vars */
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Check, X, Key, FileSpreadsheet } from "lucide-react";
import { CreateUserDialog } from "./create-user-dialog";
import { UserActionsMenu } from "./user-actions-menu";
import { AdminSearch, AdminPagination } from "./admin-client";
import { BulkImportDialog } from "./bulk-import-dialog";
import type { User, UserCourseAccess } from "@/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

async function getAdminStats() {
  const adminSupabase = createAdminClient();

  // Get total users count
  const { count: totalUsers } = await adminSupabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // Get active users count
  const { count: activeUsers } = await adminSupabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get prospect users count
  const { count: prospectUsers } = await adminSupabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("status", "prospect");

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    prospectUsers: prospectUsers || 0,
  };
}

async function getAllUsersWithCourses(
  searchTerm?: string,
  page: number = 1,
  pageSize: number = 10
) {
  const adminSupabase = createAdminClient();

  // Build query with search
  let query = adminSupabase.from("users").select("*", { count: "exact" });

  if (searchTerm) {
    query = query.or(
      `prenom.ilike.%${searchTerm}%,nom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
    );
  }

  // Get total count for pagination
  const { count: totalCount } = await query;

  // Get paginated users
  const { data: users } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  // Get all course access for all users
  const { data: courseAccess } = await adminSupabase
    .from("user_course_access")
    .select("*");

  // Get temporary passwords for all users
  const { data: tempPasswords } = await adminSupabase
    .from("temporary_passwords")
    .select("user_id, temp_password_hash, created_at, used_at")
    .is("used_at", null) // Only get unused passwords
    .gt("expires_at", new Date().toISOString()); // Only get non-expired passwords

  // Combine users with their course access and temp passwords
  const usersWithCourses =
    (users as User[])?.map((user) => {
      const userCourses =
        courseAccess?.filter((access) => access.user_id === user.id) || [];
      const userTempPassword = tempPasswords?.find(
        (tp) => tp.user_id === user.id
      );

      return {
        ...user,
        courses: {
          L1: userCourses.find((c) => c.course === "L1"),
          L2: userCourses.find((c) => c.course === "L2"),
          L3: userCourses.find((c) => c.course === "L3"),
          CRFPA: userCourses.find((c) => c.course === "CRFPA"),
        },
        tempPassword: userTempPassword?.temp_password_hash || null,
      };
    }) || [];

  return {
    users: usersWithCourses,
    totalCount: totalCount || 0,
    totalPages: Math.ceil((totalCount || 0) / pageSize),
  };
}

function MiniStatsDisplay({
  stats,
}: {
  stats: { totalUsers: number; activeUsers: number; prospectUsers: number };
}) {
  return (
    <div className="flex items-center space-x-6 text-sm text-gray-600">
      <div className="flex items-center space-x-1">
        <Users className="h-4 w-4" />
        <span className="font-medium">{stats.totalUsers}</span>
        <span>Total</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="font-medium">{stats.activeUsers}</span>
        <span>Actifs</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
        <span className="font-medium">{stats.prospectUsers}</span>
        <span>Prospects</span>
      </div>
    </div>
  );
}

function UserStatusBadge({ status, role }: { status: string; role: string }) {
  // Si c'est un admin ou owner, afficher "-"
  if (role === "admin" || role === "owner") {
    return <span className="text-gray-400">-</span>;
  }

  const statusStyles = {
    prospect: "bg-gray-100 text-gray-800",
    active: "bg-green-100 text-green-800",
    suspended: "bg-yellow-100 text-yellow-800",
    expired: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    prospect: "Prospect",
    active: "Actif",
    suspended: "Suspendu",
    expired: "Expiré",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        statusStyles[status as keyof typeof statusStyles]
      }`}
    >
      {statusLabels[status as keyof typeof statusLabels]}
    </span>
  );
}

function RoleBadge({ role, status }: { role: string; status: string }) {
  // Si c'est un user avec le statut prospect, on affiche "Prospect"
  if (role === "user" && status === "prospect") {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
        Prospect
      </span>
    );
  }

  const roleStyles = {
    user: "bg-blue-100 text-blue-800",
    admin: "bg-purple-100 text-purple-800",
    owner: "bg-yellow-100 text-yellow-800",
  };

  const roleLabels = {
    user: "Élève",
    admin: "Admin",
    owner: "Propriétaire",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        roleStyles[role as keyof typeof roleStyles]
      }`}
    >
      {roleLabels[role as keyof typeof roleLabels]}
    </span>
  );
}

function CourseAccessIcon({ hasAccess }: { hasAccess: boolean }) {
  return hasAccess ? (
    <Check className="h-4 w-4 text-green-600" />
  ) : (
    <X className="h-4 w-4 text-gray-300" />
  );
}

function TempPasswordDisplay({
  tempPassword,
}: {
  tempPassword: string | null;
}) {
  if (!tempPassword) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  return (
    <div className="flex items-center space-x-1">
      <Key className="h-3 w-3 text-orange-500" />
      <span className="text-xs font-mono bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200">
        {tempPassword}
      </span>
    </div>
  );
}

function formatFrenchDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface AdminPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Check if user is admin using regular client (for auth)
  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", data?.user?.id)
    .single();

  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "owner")
  ) {
    redirect("/dashboard");
  }

  // Await the searchParams promise
  const params = await searchParams;
  const searchTerm = params.search || "";
  const currentPage = parseInt(params.page || "1");
  const pageSize = 10;

  // Use admin client for data fetching
  const stats = await getAdminStats();
  const {
    users: allUsers,
    totalCount,
    totalPages,
  } = await getAllUsersWithCourses(searchTerm, currentPage, pageSize);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className=" rounded-lg p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="mt-2 text-gray-600">
            Gérez les utilisateurs et leurs accès
          </p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className=" rounded-lg p-4 pb-0">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <AdminSearch defaultValue={searchTerm} />
          </div>
          <div className="flex items-center space-x-3">
            <BulkImportDialog>
              <Button
                variant="outline"
                className="bg-foreground/5 hover:bg-foreground/10 border-foreground/20 text-foreground rounded-xl cursor-pointer"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
            </BulkImportDialog>
            <CreateUserDialog>
              <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-xl cursor-pointer">
                <UserPlus className="mr-2 h-4 w-4" />
                Créer un utilisateur
              </Button>
            </CreateUserDialog>
          </div>
        </div>
      </div>

      {/* All Users */}
      <div className="rounded-lg bg-white border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gradient-juris-ultra-subtle">
          <h2 className="text-xl font-semibold text-gray-900">
            Tous les utilisateurs ({totalCount})
          </h2>
          <MiniStatsDisplay stats={stats} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="gradient-prep-ultra-subtle">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L1
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L2
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L3
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CRFPA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mdp temp.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={user.profile_image_url || user.picture_url}
                            alt={`${user.prenom} ${user.nom}`}
                          />
                          <AvatarFallback className="bg-foreground uppercase text-white text-sm font-medium border">
                            {user.prenom.charAt(0)}
                            {user.nom.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.prenom} {user.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleBadge role={user.role} status={user.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserStatusBadge status={user.status} role={user.role} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CourseAccessIcon hasAccess={!!user.courses.L1} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CourseAccessIcon hasAccess={!!user.courses.L2} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CourseAccessIcon hasAccess={!!user.courses.L3} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CourseAccessIcon hasAccess={!!user.courses.CRFPA} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TempPasswordDisplay tempPassword={user.tempPassword} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFrenchDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <UserActionsMenu
                      user={user}
                      currentUserRole={currentUser.role}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
