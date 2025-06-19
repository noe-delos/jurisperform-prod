/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User, UserCourseAccess } from "@/lib/types";

interface SidebarProps {
  user: User;
  courseAccess?: UserCourseAccess[];
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

interface NavItem {
  href: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Général",
    items: [
      {
        href: "/dashboard",
        icon: "material-symbols:home-rounded",
        label: "Tableau de bord",
      },
      {
        href: "/dashboard/parametres",
        icon: "fluent:settings-32-filled",
        label: "Paramètres",
      },
      {
        href: "/dashboard/admin",
        icon: "mdi:administrator",
        label: "Administration",
        adminOnly: true,
      },
    ],
  },
  {
    title: "Mes conversations",
    items: [
      // Empty for now as requested
    ],
  },
];

export function Sidebar({
  user,
  courseAccess = [],
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false); // Mobile menu
  const pathname = usePathname();

  const isAdmin = user.role === "admin" || user.role === "owner";

  // Determine theme based on courses
  const hasCRFPAOnly =
    courseAccess.length === 1 && courseAccess[0]?.course === "CRFPA";
  const hasOtherCourses = courseAccess.some(
    (access) => access.course !== "CRFPA"
  );
  const isPrep = hasCRFPAOnly;
  const isJuris = !hasCRFPAOnly || hasOtherCourses;

  const closeSidebar = () => setIsOpen(false);
  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse(!isCollapsed);
    }
  };

  // Créer les initiales pour l'avatar fallback
  const initials = `${user.prenom.charAt(0)}${user.nom.charAt(
    0
  )}`.toUpperCase();

  // Logo URLs
  const prepFullLogo =
    "https://www.precapa-toulouse.fr/wp-content/uploads/2023/09/prepavocat-precapa-ecole-droit-toulouse.jpg";
  const jurisFullLogo = "/juris-logo.png";
  const prepMiniLogo = "/prep-mini.png";
  const jurisMiniLogo = "/jur-mini.png";

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <Icon icon="mdi-light:close" className="h-6 w-6" />
        ) : (
          <Icon icon="mdi-light:menu" className="h-6 w-6" />
        )}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r transition-all duration-300 ease-in-out group",
          // Mobile behavior
          "fixed left-0 top-0 z-40 h-screen lg:relative lg:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop collapse behavior
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 flex-shrink-0">
            {!isCollapsed ? (
              // Full logo when expanded
              <div className="flex-1">
                <img
                  src={isPrep ? prepFullLogo : jurisFullLogo}
                  alt={isPrep ? "PrepaVocat" : "Jurisperform"}
                  className={cn("h-10 w-auto object-contain", !isPrep && "h-7")}
                />
              </div>
            ) : (
              // Mini logo when collapsed (always show, hide on hover)
              <div className="flex-1 flex justify-center group-hover:opacity-0 transition-opacity duration-200">
                <img
                  src={isPrep ? prepMiniLogo : jurisMiniLogo}
                  alt={isPrep ? "PrepaVocat" : "Jurisperform"}
                  className="h-8 w-8 object-contain"
                />
              </div>
            )}

            {/* Collapse button */}
            {!isCollapsed ? (
              // Always show when expanded
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="hidden lg:flex h-8 w-8 hover:bg-gray-100 transition-opacity duration-200"
              >
                <Icon icon="mdi-light:chevron-left" className="h-4 w-4" />
              </Button>
            ) : (
              // Show on hover when collapsed
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="hidden lg:flex h-8 w-8 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-2"
              >
                <Icon icon="mdi-light:chevron-right" className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 pt-10 overflow-y-auto">
            {navSections.map((section) => {
              const filteredItems = section.items.filter(
                (item) => !item.adminOnly || isAdmin
              );

              if (filteredItems.length === 0) return null;

              return (
                <div key={section.title} className="mb-6">
                  {/* Section title */}
                  {!isCollapsed && (
                    <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-all duration-300">
                      {section.title}
                    </h3>
                  )}

                  {/* Section items */}
                  <div className="space-y-1">
                    {filteredItems.map((item) => {
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeSidebar}
                          className={cn(
                            "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative",
                            isActive
                              ? isPrep
                                ? "gradient-prep-active"
                                : "gradient-juris-active"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                            isCollapsed && "justify-center",
                            "bg-opacity-5"
                          )}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <Icon
                            icon={item.icon}
                            className={cn("h-5 w-5", !isCollapsed && "mr-3")}
                          />
                          {!isCollapsed && (
                            <span className="transition-all duration-300">
                              {item.label}
                            </span>
                          )}
                          {/* Tooltip for collapsed state */}
                          {isCollapsed && (
                            <div className="absolute left-16 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              {item.label}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Brunch CTA */}
          {!isCollapsed && (
            <div className="px-4 pb-4">
              <div
                className="relative rounded-lg overflow-hidden bg-cover bg-center p-4 min-h-[120px] flex flex-col justify-end"
                style={{
                  backgroundImage:
                    "url('https://jurisperform-toulouse.fr/wp-content/uploads/2021/10/juriste-formation-toulouse-occitanie-1-1024x552.jpg')",
                }}
              >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/50"></div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-white font-semibold text-sm mb-1">
                    Brunch de présentation
                  </h3>
                  <p className="text-white/60 text-[10px] mb-3 leading-relaxed">
                    Rejoignez-nous pour découvrir nos formations dans une
                    ambiance conviviale !
                  </p>
                  <Button
                    size="sm"
                    className="bg-white text-gray-900 hover:bg-gray-100 text-xs font-medium px-3 py-1.5 h-auto rounded-md cursor-pointer"
                  >
                    En savoir plus
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* User info & logout */}
          <div className="p-4 flex-shrink-0">
            {!isCollapsed ? (
              // Expanded view
              <div className="mb-3 flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.profile_image_url || user.picture_url}
                    alt={`${user.prenom} ${user.nom}`}
                  />
                  <AvatarFallback
                    className={cn(
                      "text-sm font-medium",
                      isPrep
                        ? "bg-purple-100 text-purple-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate transition-all duration-300">
                    {user.prenom} {user.nom}
                  </p>
                  <p className="text-gray-500 text-sm truncate transition-all duration-300">
                    {user.email}
                  </p>
                  {isAdmin && (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 transition-all duration-300",
                        isPrep
                          ? "bg-purple-100 text-purple-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {user.role === "owner"
                        ? "Propriétaire"
                        : "Administrateur"}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              // Collapsed view - just avatar
              <div className="mb-3 flex justify-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.profile_image_url || user.picture_url}
                    alt={`${user.prenom} ${user.nom}`}
                  />
                  <AvatarFallback
                    className={cn(
                      "text-sm font-medium",
                      isPrep
                        ? "bg-purple-100 text-purple-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className={cn(
                "w-full text-gray-600 hover:text-gray-900 group relative hover:bg-gray-100",
                isCollapsed ? "justify-center px-2" : "justify-start"
              )}
              title={isCollapsed ? "Se déconnecter" : undefined}
            >
              <Icon
                icon="ri:logout-box-r-fill"
                className={cn("h-4 w-4", !isCollapsed && "mr-2")}
              />
              {!isCollapsed && (
                <span className="transition-all duration-300">
                  Se déconnecter
                </span>
              )}
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-12 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Se déconnecter
                </div>
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
