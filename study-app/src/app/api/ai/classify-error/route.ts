import { handleAIRoute } from "@/lib/ai/api-helpers";
import { classifyError } from "@/lib/ai/services/classify-error";
import type { ClassifyErrorInput } from "@/lib/ai/types";

function validate(body: unknown): ClassifyErrorInput | null {
  const b = body as Record<string, unknown>;
  if (!b.exerciseStatement || !b.correctAnswer || !b.studentAnswer || !b.topicName || !b.courseName) return null;
  return {
    exerciseStatement: String(b.exerciseStatement),
    correctAnswer: String(b.correctAnswer),
    studentAnswer: String(b.studentAnswer),
    topicName: String(b.topicName),
    courseName: String(b.courseName),
  };
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, (input) => classifyError(input));
}
