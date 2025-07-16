/* eslint-disable @typescript-eslint/no-unused-vars */
import { tool } from "ai";
import { z } from "zod";
import { COURSES, findCourseByName, CourseLevel } from "./courses";
import { createClient } from "@/utils/supabase/server";

export const findRelevantCourseTool = tool({
  description:
    "MANDATORY tool to find and validate the most relevant course for the user question. Must be used before every response to ensure the correct course is selected. Returns the appropriate course for the question or validates the current selection.",
  parameters: z.object({
    query: z.string().describe("The user question or topic"),
    level: z
      .enum(["L1", "L2", "L3", "CRFPA"])
      .optional()
      .describe("The academic level if specified"),
  }),
  execute: async ({ query, level }) => {
    console.log("🔍 findRelevantCourseTool called with:", { query, level });

    const keywords = query.toLowerCase().split(" ");

    let bestMatch = null;
    let bestScore = 0;

    const coursesToSearch = level
      ? COURSES.filter((course) => course.level === level)
      : COURSES;

    for (const course of coursesToSearch) {
      const courseName = course.name.toLowerCase();
      let score = 0;

      // Check for exact phrase matches
      if (courseName.includes(query.toLowerCase())) {
        score += 10;
      }

      // Check for keyword matches
      for (const keyword of keywords) {
        if (keyword.length > 2 && courseName.includes(keyword)) {
          score += 1;
        }
      }

      // Boost score for specific subject matches
      const subjectKeywords = {
        obligations: ["obligation", "contrat", "responsabilité"],
        pénal: ["pénal", "pénale", "crime", "délit", "procédure pénale"],
        civil: ["civil", "civile", "famille", "personne"],
        administratif: ["administratif", "administrative", "administration"],
        affaires: ["affaires", "commercial", "société", "entreprise"],
        travail: ["travail", "emploi", "salarié", "employeur"],
        fiscal: ["fiscal", "fiscale", "impôt", "taxe", "finances"],
        européen: ["européen", "européenne", "union", "ue"],
        international: ["international", "internationale", "traité"],
        procédure: ["procédure", "procès", "juridictionnel"],
        constitutionnel: ["constitutionnel", "constitution", "public"],
        biens: ["biens", "propriété", "immobilier"],
      };

      for (const [subject, relatedTerms] of Object.entries(subjectKeywords)) {
        if (courseName.includes(subject)) {
          for (const term of relatedTerms) {
            if (query.toLowerCase().includes(term)) {
              score += 3;
            }
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = course;
      }
    }

    const result = {
      course: bestMatch,
      confidence: bestScore > 5 ? "high" : bestScore > 2 ? "medium" : "low",
    };

    console.log("🔍 findRelevantCourseTool result:", result);
    return result;
  },
});

export const loadCoursePDFTool = tool({
  description:
    "MANDATORY tool to load the PDF content for a specific course. Must be used after findRelevantCourse to access the actual course content before providing any answer.",
  parameters: z.object({
    courseId: z.string().describe("The ID of the course to load"),
  }),
  execute: async ({ courseId }) => {
    console.log("📄 loadCoursePDFTool called with courseId:", courseId);

    try {
      // Create Supabase client
      const supabase = await createClient();

      // First, find the course in our COURSES list
      const course = COURSES.find(c => c.id === courseId);
      if (!course) {
        return {
          courseId,
          content: null,
          status: "error",
          error: `Cours ${courseId} non trouvé dans la liste des cours.`,
          hasContent: false,
          source: "JurisPerform Course PDF",
        };
      }

      // First, try to load from course_contents table (full content)
      const { data: fullContent, error: fullContentError } = await supabase
        .from("course_contents")
        .select("content")
        .eq("course_id", courseId)
        .single();

      if (fullContent && fullContent.content) {
        console.log("📄 Found full content in course_contents table");
        return {
          courseId,
          content: `[CONTENU DU COURS ${courseId} - ${course.name}]

${fullContent.content}

--- FIN DU CONTENU DU COURS ---

IMPORTANT: Ce contenu provient exclusivement du PDF du cours ${courseId} de JurisPerform. Seules les informations présentes ci-dessus doivent être utilisées pour répondre. Si l'information recherchée n'est pas dans ce contenu, indiquez-le clairement à l'étudiant.`,
          status: "success",
          hasContent: true,
          source: "JurisPerform Course PDF",
        };
      }

      // If not found in course_contents, try content_summaries table
      console.log("📄 No full content found, trying content_summaries table");
      
      // Build search query based on course name and level
      const level = course.level;
      const courseName = course.name;
      
      // Search for summaries that match the level and course topic
      const { data: summaries, error: summariesError } = await supabase
        .from("content_summaries")
        .select("file_name, summary, category, level")
        .eq("level", level)
        .or(`category.ilike.%${courseName}%,file_name.ilike.%${courseName.split(' ').slice(-1)[0]}%`);

      if (summariesError) {
        console.error("❌ Error loading course summaries:", summariesError);
        return {
          courseId,
          content: null,
          status: "error",
          error: `Impossible de charger le contenu du cours ${courseId}. Erreur: ${summariesError.message}`,
          hasContent: false,
          source: "JurisPerform Course PDF",
        };
      }

      if (!summaries || summaries.length === 0) {
        // Try a more general search by level only
        const { data: levelSummaries, error: levelError } = await supabase
          .from("content_summaries")
          .select("file_name, summary, category, level")
          .eq("level", level);

        if (levelSummaries && levelSummaries.length > 0) {
          // Filter by keywords from the course name
          const keywords = courseName.toLowerCase().split(' ').filter(w => w.length > 3);
          const relevantSummaries = levelSummaries.filter(s => 
            keywords.some(keyword => 
              s.category.toLowerCase().includes(keyword) || 
              s.file_name.toLowerCase().includes(keyword) ||
              s.summary.toLowerCase().includes(keyword)
            )
          );

          if (relevantSummaries.length > 0) {
            // Log which documents are being sent (fallback search)
            console.log(`📚 Found ${relevantSummaries.length} relevant documents for course ${courseId} (fallback search):`);
            relevantSummaries.forEach((doc, index) => {
              console.log(`  📄 ${index + 1}. ${doc.file_name}`);
              console.log(`     📁 Category: ${doc.category}`);
              console.log(`     📊 Summary length: ${doc.summary.length} characters`);
            });

            const compiledContent = relevantSummaries.map((item, index) => 
              `[Document ${index + 1}: ${item.file_name}]\nCatégorie: ${item.category}\n\n${item.summary}\n`
            ).join('\n---\n\n');

            console.log(
              "✅ loadCoursePDFTool result (fallback): Successfully loaded content for",
              courseId,
              `- Total content size: ${compiledContent.length} characters`
            );

            return {
              courseId,
              content: `[CONTENU DU COURS ${courseId} - ${course.name}]

${compiledContent}

--- FIN DU CONTENU DU COURS ---

IMPORTANT: Ce contenu provient des résumés des PDFs liés au cours ${course.name} (${level}). Ces résumés ont été extraits de ${relevantSummaries.length} document(s). Seules les informations présentes ci-dessus doivent être utilisées pour répondre.`,
              status: "success",
              hasContent: true,
              source: "JurisPerform Course PDF Summaries",
            };
          }
        }

        console.warn("⚠️  No content found for course:", courseId);
        return {
          courseId,
          content: null,
          status: "not_found",
          error: `Le contenu du cours ${courseId} n'est pas disponible dans la base de données. Veuillez vérifier que les PDFs ont été correctement importés.`,
          hasContent: false,
          source: "JurisPerform Course PDF",
        };
      }

      // Log which documents are being sent
      console.log(`📚 Found ${summaries.length} documents for course ${courseId}:`);
      summaries.forEach((doc, index) => {
        console.log(`  📄 ${index + 1}. ${doc.file_name}`);
        console.log(`     📁 Category: ${doc.category}`);
        console.log(`     📊 Summary length: ${doc.summary.length} characters`);
      });

      // Compile all summaries into a single content
      const compiledContent = summaries.map((item, index) => 
        `[Document ${index + 1}: ${item.file_name}]\nCatégorie: ${item.category}\n\n${item.summary}\n`
      ).join('\n---\n\n');

      const result = {
        courseId,
        content: `[CONTENU DU COURS ${courseId} - ${course.name}]

${compiledContent}

--- FIN DU CONTENU DU COURS ---

IMPORTANT: Ce contenu provient des résumés des PDFs du cours ${course.name} (${level}). Ces résumés ont été extraits de ${summaries.length} document(s). Seules les informations présentes ci-dessus doivent être utilisées pour répondre.`,
        status: "success",
        hasContent: true,
        source: "JurisPerform Course PDF Summaries",
      };

      console.log(
        "✅ loadCoursePDFTool result: Successfully loaded content for",
        courseId,
        `- Total content size: ${compiledContent.length} characters`
      );
      return result;
    } catch (error) {
      console.error("❌ Unexpected error in loadCoursePDFTool:", error);
      return {
        courseId,
        content: null,
        status: "error",
        error: `Erreur technique lors du chargement du cours ${courseId}. Veuillez réessayer.`,
        hasContent: false,
        source: "JurisPerform Course PDF",
      };
    }
  },
});

export const updateCourseSelectionTool = tool({
  description: "Updates the course selection in the UI based on the content that was loaded. Should be called after loadCoursePDF to ensure the correct course is selected.",
  parameters: z.object({
    courseId: z.string().describe("The course ID that should be selected"),
    courseName: z.string().describe("The full name of the course"),
    level: z.enum(['L1', 'L2', 'L3', 'CRFPA']).describe("The academic level"),
    confidence: z.enum(['high', 'medium', 'low']).describe("Confidence level of the course selection"),
    reason: z.string().describe("Brief explanation of why this course was selected")
  }),
  execute: async ({ courseId, courseName, level, confidence, reason }) => {
    console.log("🎯 updateCourseSelectionTool called:", { courseId, courseName, level, confidence, reason });
    
    return {
      action: "UPDATE_COURSE_SELECTION",
      courseId,
      courseName,
      level,
      confidence,
      reason,
      timestamp: new Date().toISOString()
    };
  },
});
