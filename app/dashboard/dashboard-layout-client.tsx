"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import type { User, UserCourseAccess } from "@/lib/types";

interface DashboardLayoutClientProps {
  user: User;
  courseAccess: UserCourseAccess[];
  onLogout: () => void;
  children: React.ReactNode;
}

export function DashboardLayoutClient({
  user,
  courseAccess,
  onLogout,
  children,
}: DashboardLayoutClientProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar
        user={user}
        courseAccess={courseAccess}
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={setIsSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col relative">
        <DashboardHeader user={user} onLogout={onLogout} />
        <main className="flex-1">
          <div className="py-6 pt-0">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardHeader({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  return (
    <header className="lg:absolute lg:top-0 lg:right-0 z-30 flex h-16 items-center justify-between bg-white lg:bg-transparent px-4 lg:px-6">
      <div className="flex items-center lg:hidden">
        {/* Space for mobile menu button */}
      </div>

      <div className="flex items-center space-x-4 ml-auto">
        <UserAvatar user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
