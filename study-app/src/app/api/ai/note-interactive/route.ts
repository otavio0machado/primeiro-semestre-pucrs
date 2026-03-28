import { handleAIRoute } from "@/lib/ai/api-helpers";
import { generateNoteInteractive } from "@/lib/ai/services/generate-note-interactive";
import type { GenerateNoteInteractiveInput } from "@/lib/ai/types";

function clampHeight(value: number) {
  return Math.min(920, Math.max(560, Math.round(value)));
}

function validate(body: unknown): GenerateNoteInteractiveInput | null {
  const b = body as Record<string, unknown>;
  if (!b.request || typeof b.noteContent !== "string") return null;

  return {
    request: String(b.request),
    noteContent: String(b.noteContent),
    courseName: b.courseName ? String(b.courseName) : undefined,
    topicName: b.topicName ? String(b.topicName) : undefined,
    frameHint: b.frameHint
      ? (b.frameHint as GenerateNoteInteractiveInput["frameHint"])
      : undefined,
  };
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, async (input) => {
    const result = await generateNoteInteractive(input);

    return {
      ...result,
      data: {
        ...result.data,
        frame: result.data.frame === "phone" ? "phone" : "canvas",
        height: clampHeight(result.data.height),
      },
    };
  });
}
