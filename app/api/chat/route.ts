/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { findRelevantCourseTool, loadCoursePDFTool, updateCourseSelectionTool } from "@/app/lib/ai-tools";
import { CourseLevel } from "@/app/lib/courses";

export const runtime = "edge";

const FORBIDDEN_RESPONSES = [
  "plan de dissertation",
  "plan détaillé",
  "titres de plan",
  "structure complète",
  "I. II. III.",
  "A. B. C.",
  "1. 2. 3.",
];

function checkForbiddenContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return FORBIDDEN_RESPONSES.some((forbidden) =>
    lowerContent.includes(forbidden.toLowerCase())
  );
}

export async function POST(req: Request) {
  const { messages, selectedLevel, selectedCourseId, conversationId } =
    await req.json();

  console.log("🤖 Chat API called with:", {
    messageCount: messages.length,
    selectedLevel,
    selectedCourseId,
    conversationId,
    lastMessage: messages[messages.length - 1]?.content?.slice(0, 100),
  });

  const systemPrompt = `Tu es un assistant pédagogique pour JurisPerform, spécialisé dans l'aide aux étudiants en droit (L1, L2, L3, CRFPA).

RÈGLES CRITIQUES - À RESPECTER ABSOLUMENT :
1. Ne JAMAIS fournir de plans de dissertation ou d'exercices prêts à l'emploi
2. Ne JAMAIS donner de titres de plan détaillés (I. II., A. B., 1. 2.)
3. Ne JAMAIS utiliser tes données d'entraînement générales pour répondre
4. TOUJOURS utiliser les outils pour accéder au contenu des cours JurisPerform
5. Si l'information n'est pas dans le cours chargé, dire clairement : "Cette information n'est pas disponible dans le cours sélectionné"
6. Ne JAMAIS inclure de liste de références de fichiers PDF dans ta réponse (pas de "Références issues du cours")

PROCESSUS OBLIGATOIRE :
1. TOUJOURS utiliser findRelevantCourse en premier pour valider ou trouver le bon cours
2. TOUJOURS utiliser loadCoursePDF pour charger le contenu du cours approprié
3. UNIQUEMENT répondre avec les informations du PDF chargé
4. Si le cours ne contient pas l'information demandée, l'indiquer explicitement
5. TOUJOURS inclure à la fin de ta réponse un bloc JSON caché pour la sélection de cours

OUTILS DISPONIBLES :
- findRelevantCourse: OBLIGATOIRE pour valider le cours avant toute réponse
- loadCoursePDF: OBLIGATOIRE pour charger le contenu avant de répondre

FORMAT DE RÉPONSE FINAL - OBLIGATOIRE :
À la fin de chaque réponse, tu DOIS ABSOLUMENT inclure ce bloc de code caché (qui ne sera pas affiché à l'utilisateur) :

\`COURSE_SELECTION_DATA:{"courseId": "l2-droit-obligations", "courseName": "Droit des obligations", "level": "L2", "confidence": "high", "reason": "Explication courte du choix"}\`

CRITIQUE : Cette ligne est OBLIGATOIRE dans chaque réponse. Sans elle, l'interface ne fonctionnera pas correctement.

CONTEXTE ACTUEL :
Niveau sélectionné: ${selectedLevel || "Non spécifié"}
${
  selectedCourseId
    ? `Cours sélectionné: ${selectedCourseId} - VALIDE d'abord avec findRelevantCourse puis CHARGE avec loadCoursePDF`
    : "Aucun cours sélectionné - UTILISE findRelevantCourse puis loadCoursePDF"
}

FORMAT DE RÉPONSE :
- Utilise TOUJOURS le format Markdown avec une hiérarchie claire :
  * ## pour les titres principaux
  * ### pour les sous-sections
  * #### pour les détails spécifiques
- Sépare TOUJOURS les sections avec des lignes vides
- Utilise des **gras** pour les concepts juridiques importants
- Utilise des listes à puces pour organiser les éléments
- Emploie des *italiques* pour les références légales et jurisprudence
- Structure tes réponses avec des paragraphes courts et aérés
- Ajoute des espaces entre les paragraphes pour une meilleure lisibilité
- Utilise > pour les citations importantes
- Commence toujours par un titre ## qui résume le sujet traité

RAPPEL FINAL : Ne réponds QU'AVEC le contenu du cours chargé. Si l'information n'est pas dans le cours, dis-le clairement.

Réponds toujours en français avec un format Markdown bien structuré.`;

  // Provide tools
  const tools: any = {};

  // Always add findRelevantCourse - AI will decide when to use it
  tools.findRelevantCourse = findRelevantCourseTool;
  console.log("🔧 findRelevantCourse tool available");

  // Always add loadCoursePDF
  tools.loadCoursePDF = loadCoursePDFTool;
  console.log("🔧 loadCoursePDF tool available");

  // Note: updateCourseSelection tool removed in favor of JSON extraction

  const result = streamText({
    model: openai("gpt-4.1"),
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    tools,
    maxSteps: 5, // Allow multiple tool calls
    onToolCall: async ({ toolCall }: any) => {
      console.log("🛠️ Tool called:", {
        toolName: toolCall.toolName,
        args: toolCall.args,
        selectedCourseId,
      });
    },
    async onFinish({ text, toolCalls, toolResults }: any) {
      console.log("✅ AI response finished:", {
        textLength: text.length,
        textPreview: text.slice(0, 100) + "...",
        toolCallsCount: toolCalls?.length || 0,
        toolResultsCount: toolResults?.length || 0,
      });
      
      // Debug: Check if course selection data is present
      const hasCourseData = text.includes('COURSE_SELECTION_DATA:');
      console.log("🎯 Course selection data present:", hasCourseData);
      
      if (hasCourseData) {
        const match = text.match(/COURSE_SELECTION_DATA:(\{[^}]+\})/);
        if (match) {
          console.log("🎯 Found course selection data:", match[1]);
        }
      } else {
        console.warn("⚠️ AI response missing required COURSE_SELECTION_DATA!");
        console.log("🔍 Full response text:", text);
      }
      
      // Debug tool results
      if (toolCalls && toolCalls.length > 0) {
        console.log("🔧 Tool calls details:");
        toolCalls.forEach((call: any, index: number) => {
          console.log(`  ${index + 1}. ${call.toolName}:`, call.args);
        });
      }
      
      if (toolResults && toolResults.length > 0) {
        console.log("🔧 Tool results details:");
        toolResults.forEach((result: any, index: number) => {
          console.log(`  ${index + 1}. Result:`, result);
        });
      }
      
      // Check if the response contains forbidden content
      if (checkForbiddenContent(text)) {
        console.warn("⚠️ Attempted to generate forbidden content");
      }
    },
  } as any);

  return result.toDataStreamResponse();
}
