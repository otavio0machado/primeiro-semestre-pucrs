import { handleAIRoute } from "@/lib/ai/api-helpers";
import { tutor } from "@/lib/ai/services/tutor";
import type { TutorInput } from "@/lib/ai/types";

function validate(body: unknown): TutorInput | null {
  const b = body as Record<string, unknown>;
  if (!b.topicName || !b.courseName || !b.masteryLevel || !b.message) return null;
  return {
    topicName: String(b.topicName),
    courseName: String(b.courseName),
    masteryLevel: b.masteryLevel as TutorInput["masteryLevel"],
    history: Array.isArray(b.history) ? b.history as TutorInput["history"] : [],
    message: String(b.message),
    currentExercise: b.currentExercise ? String(b.currentExercise) : undefined,
  };
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, (input) => tutor(input));
}
