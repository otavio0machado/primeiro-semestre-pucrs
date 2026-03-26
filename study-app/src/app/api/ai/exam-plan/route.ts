import { handleAIRoute } from "@/lib/ai/api-helpers";
import { generateExamPlan } from "@/lib/ai/services/generate-exam-plan";
import type { GenerateExamPlanInput } from "@/lib/ai/types";

function validate(body: unknown): GenerateExamPlanInput | null {
  const b = body as Record<string, unknown>;
  if (!b.examName || !b.courseName || !b.examDate || !Array.isArray(b.topics) || !b.hoursPerDay) return null;
  return {
    examName: String(b.examName),
    courseName: String(b.courseName),
    examDate: String(b.examDate),
    topics: (b.topics as Array<Record<string, unknown>>).map((t) => ({
      name: String(t.name),
      mastery: t.mastery as GenerateExamPlanInput["topics"][0]["mastery"],
      score: Number(t.score),
    })),
    hoursPerDay: Number(b.hoursPerDay),
    errorPatterns: Array.isArray(b.errorPatterns)
      ? (b.errorPatterns as Array<Record<string, unknown>>).map((e) => ({
          class: e.class as GenerateExamPlanInput["errorPatterns"] extends (infer U)[] | undefined ? U extends { class: infer C } ? C : never : never,
          count: Number(e.count),
        }))
      : undefined,
  } as GenerateExamPlanInput;
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, (input) => generateExamPlan(input));
}
