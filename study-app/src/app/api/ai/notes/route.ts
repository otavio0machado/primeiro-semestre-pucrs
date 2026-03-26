import { handleAIRoute } from "@/lib/ai/api-helpers";
import { generateNotes } from "@/lib/ai/services/generate-notes";
import type { GenerateNotesInput } from "@/lib/ai/types";

function validate(body: unknown): GenerateNotesInput | null {
  const b = body as Record<string, unknown>;
  if (!b.topicName || !b.courseName || !b.sourceContent || !b.format) return null;
  return {
    topicName: String(b.topicName),
    courseName: String(b.courseName),
    sourceContent: String(b.sourceContent),
    format: b.format as GenerateNotesInput["format"],
  };
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, (input) => generateNotes(input));
}
