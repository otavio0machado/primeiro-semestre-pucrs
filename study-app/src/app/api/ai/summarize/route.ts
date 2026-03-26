import { handleAIRoute } from "@/lib/ai/api-helpers";
import { summarizeDocument } from "@/lib/ai/services/summarize-document";
import type { SummarizeDocumentInput } from "@/lib/ai/types";

function validate(body: unknown): SummarizeDocumentInput | null {
  const b = body as Record<string, unknown>;
  if (!b.content || !b.courseName || !b.depth) return null;
  return {
    content: String(b.content),
    courseName: String(b.courseName),
    depth: b.depth as SummarizeDocumentInput["depth"],
    focusTopics: Array.isArray(b.focusTopics) ? b.focusTopics.map(String) : undefined,
  };
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, (input) => summarizeDocument(input));
}
