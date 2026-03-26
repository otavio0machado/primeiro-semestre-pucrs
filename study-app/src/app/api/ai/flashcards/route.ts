import { handleAIRoute } from "@/lib/ai/api-helpers";
import { generateFlashcards } from "@/lib/ai/services/generate-flashcards";
import type { GenerateFlashcardsInput } from "@/lib/ai/types";

function validate(body: unknown): GenerateFlashcardsInput | null {
  const b = body as Record<string, unknown>;
  if (!b.topicName || !b.courseName || !b.masteryLevel) return null;
  return {
    topicName: String(b.topicName),
    courseName: String(b.courseName),
    masteryLevel: b.masteryLevel as GenerateFlashcardsInput["masteryLevel"],
    count: typeof b.count === "number" ? b.count : undefined,
    cardTypes: Array.isArray(b.cardTypes) ? b.cardTypes as GenerateFlashcardsInput["cardTypes"] : undefined,
    sourceContent: b.sourceContent ? String(b.sourceContent) : undefined,
  };
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, (input) => generateFlashcards(input));
}
