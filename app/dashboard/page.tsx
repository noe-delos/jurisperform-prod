/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GraduationCap, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { DashboardChatImproved } from "@/app/components/chat/dashboard-chat-improved";
import type { User, UserCourseAccess, CourseType } from "@/lib/types";
import { CourseLevel } from "@/app/lib/courses";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CourseCardProps {
  course: CourseType;
  title: string;
  description: string;
  isActive: boolean;
  isNext?: boolean;
  expiresAt?: string;
  index: number;
  onSelect?: (course: CourseType) => void;
  isSelected?: boolean;
}

function CourseCard({
  course,
  title,
  description,
  isActive,
  isNext,
  expiresAt,
  index,
  onSelect,
  isSelected,
}: CourseCardProps) {
  // Determine background image based on course type
  const backgroundImage = course === "CRFPA" ? "/crfpa.png" : "/license.png";

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden h-full flex flex-col shadow-soft cursor-pointer transition-all duration-200 hover:scale-105",
        isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      onClick={() => onSelect?.(course)}
    >
      {/* Darker overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Content */}
      <div className="relative z-10 p-3 h-full flex flex-col text-white">
        {/* Header with badge */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white dancing-script-bold">
              {course}
            </h3>
            <p
              className={cn(
                "text-xs text-white/80 font-medium",
                course === "CRFPA" ? "text-[0.55rem] leading-tight" : ""
              )}
            >
              {title}
            </p>
          </div>
          <div className="ml-1">
            {isActive && (
              <span className="inline-flex items-center rounded-full bg-blue-500/80 backdrop-blur-sm px-1.5 py-0.5 text-[0.65rem] font-medium text-white">
                Actif
              </span>
            )}
            {isNext && (
              <span className="inline-flex items-center rounded-full bg-green-500/80 backdrop-blur-sm px-1.5 py-0.5 text-[0.65rem] font-medium text-white">
                Suivant
              </span>
            )}
          </div>
        </div>

        {/* Footer with expiration */}
        <div className="mt-auto">
          {expiresAt && (
            <div className="flex items-center text-[0.65rem] text-white/60">
              <Calendar className="h-2.5 w-2.5 mr-0.5" />
              {new Date(expiresAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function getNextCourse(currentCourses: CourseType[]): CourseType | null {
  const progression: CourseType[] = ["L1", "L2", "L3", "CRFPA"];

  // Find the highest level the user has
  let highestLevel = -1;
  for (let i = 0; i < progression.length; i++) {
    if (currentCourses.includes(progression[i])) {
      highestLevel = i;
    }
  }

  // Return the next course in progression
  if (highestLevel < progression.length - 1) {
    return progression[highestLevel + 1];
  }

  return null; // User has completed all courses
}

const courseInfo = {
  L1: {
    title: "Licence 1ère année",
    description:
      "Fondamentaux du droit, introduction aux matières juridiques essentielles.",
  },
  L2: {
    title: "Licence 2ème année",
    description:
      "Approfondissement des connaissances juridiques et spécialisations.",
  },
  L3: {
    title: "Licence 3ème année",
    description:
      "Préparation aux études supérieures et spécialisations avancées.",
  },
  CRFPA: {
    title: "Centre Régional de Formation Professionnelle d'Avocats",
    description:
      "Formation professionnelle pour devenir avocat, préparation à l'examen d'entrée.",
  },
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [courseAccess, setCourseAccess] = useState<UserCourseAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const supabase = createClient();

  // All useEffect hooks MUST be called before any conditional returns
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get current user
        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) {
          setLoading(false);
          return;
        }

        // Get user details
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        // Get course access
        const { data: courseData } = await supabase
          .from("user_course_access")
          .select("*")
          .eq("user_id", authData.user.id);

        setUser(userData);
        setCourseAccess(courseData || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // Listen for conversation selection from sidebar
  useEffect(() => {
    const handleConversationSelect = (event: CustomEvent) => {
      setSelectedConversationId(event.detail);
      setShowChat(true);
    };

    window.addEventListener('selectConversation', handleConversationSelect as EventListener);
    
    return () => {
      window.removeEventListener('selectConversation', handleConversationSelect as EventListener);
    };
  }, []);

  // Early return AFTER all hooks
  if (loading || !user) {
    return <></>;
  }

  const currentCourses = courseAccess.map(
    (access) => access.course as CourseType
  );
  const nextCourse = getNextCourse(currentCourses);
  const isProspect = user.status === "prospect";

  // Get user's primary course level for chat
  const getUserLevel = (): CourseLevel => {
    if (currentCourses.includes('CRFPA')) return 'CRFPA';
    if (currentCourses.includes('L3')) return 'L3';
    if (currentCourses.includes('L2')) return 'L2';
    return 'L1';
  };

  const handleConversationStarted = () => {
    setShowChat(true);
  };

  const handleCourseSelect = (course: CourseType) => {
    setSelectedCourse(course);
    // Update the chat component's selected course
    const event = new CustomEvent('courseSelected', { detail: course });
    window.dispatchEvent(event);
  };

  return (
    <div className={cn(
      showChat ? "h-[calc(100vh-2rem)] p-4" : "min-h-screen flex items-center justify-center"
    )}>
      <div className={cn(
        "mx-auto",
        showChat ? "w-full h-full max-w-6xl" : "max-w-7xl space-y-8 py-5 pt-0"
      )}>
        {/* Header content - hidden when chat is active */}
        <AnimatePresence initial={false}>
          {!showChat && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.25,
                ease: "easeInOut"
              }}
            >
              {/* Centered Welcome */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-2 dancing-script-welcome text-5xl">
                  Bienvenue {user.prenom} !
                </h1>
              </div>

              {/* Age display for prospects */}
              {isProspect && user.date_of_birth && (
                <div className="text-center mt-4">
                  <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
                    <Clock className="h-4 w-4 mr-2" />
                    Âge : {calculateAge(user.date_of_birth)} ans
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Interface - always present */}
        <div className={cn(
          showChat ? "h-full" : "max-w-3xl mx-auto"
        )}>
          <DashboardChatImproved
            userId={user.id}
            userLevel={getUserLevel()}
            selectedConversationId={selectedConversationId}
            onConversationCreated={(conversationId) => {
              setSelectedConversationId(conversationId);
            }}
            onConversationStarted={handleConversationStarted}
          />
        </div>

        {/* Course Cards - hidden when chat is active */}
        <AnimatePresence initial={false}>
          {!showChat && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ 
                duration: 0.25,
                delay: 0.1,
                ease: "easeInOut"
              }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-gray-900 text-center">
                Vos cours
              </h2>

              <div className="px-2">
                <div className="flex gap-3 justify-center flex-wrap max-w-4xl mx-auto">
                  {/* Current Courses */}
                  {currentCourses.map((course, index) => {
                    const access = courseAccess.find((a) => a.course === course);
                    return (
                      <motion.div
                        key={course}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.15,
                          delay: index * 0.02,
                          ease: "easeOut"
                        }}
                        className="flex-shrink-0 w-48 h-28"
                      >
                        <CourseCard
                          course={course}
                          title={courseInfo[course].title}
                          description={courseInfo[course].description}
                          isActive={true}
                          expiresAt={access?.expires_at}
                          index={index}
                          onSelect={handleCourseSelect}
                          isSelected={selectedCourse === course}
                        />
                      </motion.div>
                    );
                  })}

                  {/* Next Course */}
                  {nextCourse && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.15,
                        delay: currentCourses.length * 0.02,
                        ease: "easeOut"
                      }}
                      className="flex-shrink-0 w-48 h-28"
                    >
                      <CourseCard
                        course={nextCourse}
                        title={courseInfo[nextCourse].title}
                        description={courseInfo[nextCourse].description}
                        isActive={false}
                        isNext={true}
                        index={currentCourses.length}
                        onSelect={handleCourseSelect}
                        isSelected={selectedCourse === nextCourse}
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* No courses message */}
              {currentCourses.length === 0 && (
                <div className="text-center py-12">
                  <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun cours actif
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Contactez un administrateur pour obtenir l'accès aux cours.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/parametres">Voir mes paramètres</Link>
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

