import { handleAIRoute } from "@/lib/ai/api-helpers";
import { generateNoteGraph } from "@/lib/ai/services/generate-note-graph";
import type { GenerateNoteGraphInput } from "@/lib/ai/types";
import { normalizeMermaidChart } from "@/lib/notes/mermaid";

function validate(body: unknown): GenerateNoteGraphInput | null {
  const b = body as Record<string, unknown>;
  if (!b.request || typeof b.noteContent !== "string" || !b.graphType) return null;

  return {
    graphType: b.graphType as GenerateNoteGraphInput["graphType"],
    request: String(b.request),
    noteContent: String(b.noteContent),
    courseName: b.courseName ? String(b.courseName) : undefined,
    topicName: b.topicName ? String(b.topicName) : undefined,
  };
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, async (input) => {
    const result = await generateNoteGraph(input);
    return {
      ...result,
      data: {
        ...result.data,
        mermaid: normalizeMermaidChart(result.data.mermaid),
      },
    };
  });
}
