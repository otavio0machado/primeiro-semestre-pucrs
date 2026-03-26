import { handleAIRoute } from "@/lib/ai/api-helpers";
import { explainTopic } from "@/lib/ai/services/explain-topic";
import type { ExplainTopicInput } from "@/lib/ai/types";

function validate(body: unknown): ExplainTopicInput | null {
  const b = body as Record<string, unknown>;
  if (!b.topicName || !b.courseName || !b.masteryLevel) return null;
  return {
    topicName: String(b.topicName),
    courseName: String(b.courseName),
    masteryLevel: b.masteryLevel as ExplainTopicInput["masteryLevel"],
    prerequisites: Array.isArray(b.prerequisites) ? b.prerequisites.map(String) : undefined,
    focus: b.focus ? String(b.focus) : undefined,
  };
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, (input) => explainTopic(input));
}
