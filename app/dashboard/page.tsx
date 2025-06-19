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
import { motion } from "framer-motion";
import type { User, UserCourseAccess, CourseType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  course: CourseType;
  title: string;
  description: string;
  isActive: boolean;
  isNext?: boolean;
  expiresAt?: string;
  index: number;
}

function CourseCard({
  course,
  title,
  description,
  isActive,
  isNext,
  expiresAt,
  index,
}: CourseCardProps) {
  // Determine background image based on course type
  const backgroundImage = course === "CRFPA" ? "/crfpa.png" : "/license.png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.1 + index * 0.05,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.15 },
      }}
      className="relative rounded-xl overflow-hidden h-full flex flex-col shadow-soft"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Darker overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Content */}
      <div className="relative z-10 p-4 h-full flex flex-col text-white">
        {/* Header with badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white dancing-script-bold mb-1">
              {course}
            </h3>
            <p
              className={cn(
                "text-xs text-white/90 font-medium",
                course === "CRFPA" ? "text-[0.6rem] " : ""
              )}
            >
              {title}
            </p>
          </div>
          <div className="ml-2">
            {isActive && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.2 }}
                className="inline-flex items-center rounded-full bg-blue-500/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-white"
              >
                Actif
              </motion.span>
            )}
            {isNext && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.2 }}
                className="inline-flex items-center rounded-full bg-green-500/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-white"
              >
                Suivant
              </motion.span>
            )}
          </div>
        </div>

        {/* Footer with expiration and button */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex-1">
            {expiresAt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className="flex items-center text-xs text-white/70"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Expire le{" "}
                {new Date(expiresAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="ml-2"
          >
            {isActive && (
              <Button
                asChild
                size="sm"
                className="rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 text-xs px-3 py-1"
              >
                <Link href={`/dashboard/courses/${course.toLowerCase()}`}>
                  Accéder
                </Link>
              </Button>
            )}

            {isNext && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 transition-all duration-200 text-xs px-3 py-1"
              >
                <Link href={`/dashboard/courses/${course.toLowerCase()}`}>
                  Découvrir
                </Link>
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
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
  const supabase = createClient();

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

  if (loading || !user) {
    return <></>;
  }

  const currentCourses = courseAccess.map(
    (access) => access.course as CourseType
  );
  const nextCourse = getNextCourse(currentCourses);
  const isProspect = user.status === "prospect";

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto space-y-8 py-5 pt-0">
        {/* Centered Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2 dancing-script-welcome text-5xl">
            Bienvenue {user.prenom} !
          </h1>
        </motion.div>

        {/* Age display for prospects */}
        {isProspect && user.date_of_birth && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
              <Clock className="h-4 w-4 mr-2" />
              Âge : {calculateAge(user.date_of_birth)} ans
            </div>
          </motion.div>
        )}

        {/* Centered Textarea */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-2xl mx-auto"
        >
          <motion.div
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "shadow-soft mx-auto h-fit min-h-24 max-h-48 w-full max-w-3xl overflow-hidden rounded-[1.5rem] border-2 border-muted bg-card p-1 transition-all"
            )}
          >
            <Textarea
              placeholder="Écrivez vos notes, objectifs ou questions ici..."
              className="h-full  w-full flex-1 resize-none border-none  min-h-32 bg-transparent p-4 text-lg shadow-none focus-within:outline-none focus-visible:ring-0"
            />{" "}
          </motion.div>
        </motion.div>

        {/* Course Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-6"
        >
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="text-xl font-semibold text-gray-900 text-center"
          >
            Vos cours
          </motion.h2>

          <div className="px-4">
            <div className="flex gap-4 justify-center flex-wrap max-w-6xl mx-auto">
              {/* Current Courses */}
              {currentCourses.map((course, index) => {
                const access = courseAccess.find((a) => a.course === course);
                return (
                  <div key={course} className="flex-shrink-0 w-56 h-32">
                    <CourseCard
                      course={course}
                      title={courseInfo[course].title}
                      description={courseInfo[course].description}
                      isActive={true}
                      expiresAt={access?.expires_at}
                      index={index}
                    />
                  </div>
                );
              })}

              {/* Next Course */}
              {nextCourse && (
                <div className="flex-shrink-0 w-56 h-32">
                  <CourseCard
                    course={nextCourse}
                    title={courseInfo[nextCourse].title}
                    description={courseInfo[nextCourse].description}
                    isActive={false}
                    isNext={true}
                    index={currentCourses.length}
                  />
                </div>
              )}
            </div>
          </div>

          {/* No courses message */}
          {currentCourses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.2 }}
                className="text-lg font-medium text-gray-900 mb-2"
              >
                Aucun cours actif
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.2 }}
                className="text-gray-600 mb-6"
              >
                Contactez un administrateur pour obtenir l'accès aux cours.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.2 }}
              >
                <Button asChild variant="outline">
                  <Link href="/dashboard/parametres">Voir mes paramètres</Link>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
