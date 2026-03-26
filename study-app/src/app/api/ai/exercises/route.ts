import { handleAIRoute } from "@/lib/ai/api-helpers";
import { generateExercises } from "@/lib/ai/services/generate-exercises";
import type { GenerateExercisesInput } from "@/lib/ai/types";

function validate(body: unknown): GenerateExercisesInput | null {
  const b = body as Record<string, unknown>;
  if (!b.topicName || !b.courseName || !b.masteryLevel) return null;
  return {
    topicName: String(b.topicName),
    courseName: String(b.courseName),
    masteryLevel: b.masteryLevel as GenerateExercisesInput["masteryLevel"],
    count: typeof b.count === "number" ? b.count : undefined,
    difficulty: typeof b.difficulty === "number" ? b.difficulty : undefined,
    types: Array.isArray(b.types) ? b.types as GenerateExercisesInput["types"] : undefined,
    targetErrors: Array.isArray(b.targetErrors) ? b.targetErrors as GenerateExercisesInput["targetErrors"] : undefined,
  };
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, (input) => generateExercises(input));
}
