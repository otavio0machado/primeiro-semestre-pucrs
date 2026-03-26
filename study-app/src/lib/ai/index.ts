// ============================================================
// AI MODULE — Barrel export
// Server-side only — nunca importar no client
// ============================================================

// Client + helpers
export { callAnthropic, parseJSON, buildStudentContext, estimateCost, PRICING, DEFAULT_MODEL, FALLBACK_MODEL } from "./anthropic";

// Types
export type * from "./types";

// Services
export { explainTopic } from "./services/explain-topic";
export { tutor } from "./services/tutor";
export { classifyError } from "./services/classify-error";
export { generateFlashcards } from "./services/generate-flashcards";
export { generateNotes } from "./services/generate-notes";
export { generateExamPlan } from "./services/generate-exam-plan";
export { summarizeDocument } from "./services/summarize-document";
export { generateExercises } from "./services/generate-exercises";
