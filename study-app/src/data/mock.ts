// ============================================================
// MOCK DATA — Dashboard e telas iniciais
// Alimenta o sistema até Supabase estar conectado
// ============================================================

export type MasteryLevel = "none" | "exposed" | "developing" | "proficient" | "mastered";

export interface MockTopic {
  id: string;
  name: string;
  moduleId: string;
  moduleName: string;
  courseId: string;
  courseName: string;
  mastery: MasteryLevel;
  score: number;
  exercisesAttempted: number;
  exercisesAvailable: number;
}

export interface MockExam {
  id: string;
  courseId: string;
  courseName: string;
  name: string;
  type: string;
  date: string;
  topicIds: string[];
  coveragePct: number;
  gapCount: number;
}

export interface MockReview {
  id: string;
  topicName: string;
  topicId: string;
  score: number;
  reason: string;
  detail: string;
}

export interface MockSession {
  id: string;
  kind: string;
  topicName: string;
  date: string;
  time: string;
  durationMin: number;
  exercisesAttempted: number;
  exercisesCorrect: number;
  errorSummary: string;
  note: string;
}

// ── Exams ──

export const mockExams: MockExam[] = [
  {
    id: "md-p1",
    courseId: "mat-discreta",
    courseName: "Mat. Discreta",
    name: "P1 Mat. Discreta",
    type: "prova",
    date: "2026-04-08",
    topicIds: ["md-t01", "md-t02", "md-t03", "md-t04", "md-t05"],
    coveragePct: 48,
    gapCount: 3,
  },
  {
    id: "calc1-p1",
    courseId: "calculo-1",
    courseName: "Cálculo I",
    name: "P1 Cálculo I",
    type: "prova",
    date: "2026-04-16",
    topicIds: ["calc1-t01", "calc1-t02", "calc1-t03", "calc1-t04", "calc1-t05", "calc1-t06", "calc1-t07", "calc1-t08", "calc1-t09"],
    coveragePct: 62,
    gapCount: 2,
  },
];

// ── Topics (Cálculo I) ──

export const mockTopicsCalc: MockTopic[] = [
  {
    id: "calc1-t01", name: "Conceito de função", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    courseId: "calculo-1", courseName: "Cálculo I", mastery: "proficient", score: 0.68,
    exercisesAttempted: 14, exercisesAvailable: 18,
  },
  {
    id: "calc1-t02", name: "Funções essenciais", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    courseId: "calculo-1", courseName: "Cálculo I", mastery: "developing", score: 0.52,
    exercisesAttempted: 8, exercisesAvailable: 12,
  },
  {
    id: "calc1-t03", name: "Funções compostas", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    courseId: "calculo-1", courseName: "Cálculo I", mastery: "developing", score: 0.41,
    exercisesAttempted: 5, exercisesAvailable: 10,
  },
  {
    id: "calc1-t04", name: "Transformações", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    courseId: "calculo-1", courseName: "Cálculo I", mastery: "exposed", score: 0.22,
    exercisesAttempted: 2, exercisesAvailable: 6,
  },
  {
    id: "calc1-t05", name: "Tangente e velocidade", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    courseId: "calculo-1", courseName: "Cálculo I", mastery: "developing", score: 0.38,
    exercisesAttempted: 4, exercisesAvailable: 8,
  },
  {
    id: "calc1-t06", name: "Limite de uma função", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    courseId: "calculo-1", courseName: "Cálculo I", mastery: "developing", score: 0.35,
    exercisesAttempted: 3, exercisesAvailable: 8,
  },
  {
    id: "calc1-t07", name: "Limites — leis", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    courseId: "calculo-1", courseName: "Cálculo I", mastery: "exposed", score: 0.28,
    exercisesAttempted: 2, exercisesAvailable: 6,
  },
  {
    id: "calc1-t08", name: "Continuidade", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    courseId: "calculo-1", courseName: "Cálculo I", mastery: "exposed", score: 0.31,
    exercisesAttempted: 1, exercisesAvailable: 4,
  },
  {
    id: "calc1-t09", name: "Limites no infinito", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    courseId: "calculo-1", courseName: "Cálculo I", mastery: "none", score: 0.0,
    exercisesAttempted: 0, exercisesAvailable: 0,
  },
];

// ── Topics (Mat. Discreta) ──

export const mockTopicsMD: MockTopic[] = [
  {
    id: "md-t01", name: "Lógica proposicional", moduleId: "md-mod1", moduleName: "Lógica",
    courseId: "mat-discreta", courseName: "Mat. Discreta", mastery: "proficient", score: 0.72,
    exercisesAttempted: 15, exercisesAvailable: 18,
  },
  {
    id: "md-t02", name: "Tabelas-verdade", moduleId: "md-mod1", moduleName: "Lógica",
    courseId: "mat-discreta", courseName: "Mat. Discreta", mastery: "developing", score: 0.55,
    exercisesAttempted: 10, exercisesAvailable: 14,
  },
  {
    id: "md-t03", name: "Equivalências lógicas", moduleId: "md-mod1", moduleName: "Lógica",
    courseId: "mat-discreta", courseName: "Mat. Discreta", mastery: "developing", score: 0.48,
    exercisesAttempted: 6, exercisesAvailable: 10,
  },
  {
    id: "md-t04", name: "Conjuntos — definições", moduleId: "md-mod2", moduleName: "Conjuntos",
    courseId: "mat-discreta", courseName: "Mat. Discreta", mastery: "developing", score: 0.58,
    exercisesAttempted: 8, exercisesAvailable: 12,
  },
  {
    id: "md-t05", name: "Operações com conjuntos", moduleId: "md-mod2", moduleName: "Conjuntos",
    courseId: "mat-discreta", courseName: "Mat. Discreta", mastery: "developing", score: 0.44,
    exercisesAttempted: 5, exercisesAvailable: 10,
  },
  {
    id: "md-t06", name: "Relações", moduleId: "md-mod3", moduleName: "Relações e Funções",
    courseId: "mat-discreta", courseName: "Mat. Discreta", mastery: "developing", score: 0.44,
    exercisesAttempted: 4, exercisesAvailable: 8,
  },
  {
    id: "md-t07", name: "Funções (discreta)", moduleId: "md-mod3", moduleName: "Relações e Funções",
    courseId: "mat-discreta", courseName: "Mat. Discreta", mastery: "exposed", score: 0.18,
    exercisesAttempted: 2, exercisesAvailable: 6,
  },
];

// ── Reviews ──

export const mockReviews: MockReview[] = [
  { id: "r1", topicName: "Funções compostas", topicId: "calc1-t03", score: 0.41, reason: "spaced_rep", detail: "3ª revisão" },
  { id: "r2", topicName: "Limites laterais", topicId: "calc1-t06", score: 0.22, reason: "error_pattern", detail: "4 erros procedurais" },
  { id: "r3", topicName: "Tabelas-verdade", topicId: "md-t02", score: 0.55, reason: "pre_exam", detail: "P1 em 13d" },
];

// ── Sessions ──

export const mockSessions: MockSession[] = [
  {
    id: "s1", kind: "exercises", topicName: "Lógica proposicional",
    date: "2026-03-25", time: "14:20", durationMin: 35,
    exercisesAttempted: 15, exercisesCorrect: 12,
    errorSummary: "3 erros procedurais", note: "",
  },
  {
    id: "s2", kind: "theory", topicName: "Limites laterais",
    date: "2026-03-25", time: "09:45", durationMin: 22,
    exercisesAttempted: 0, exercisesCorrect: 0,
    errorSummary: "", note: "Regra para limites no infinito com racionalização...",
  },
];

// ── Error patterns ──

export const mockErrorPatterns = [
  { class: "procedural", count: 12 },
  { class: "conceptual", count: 6 },
  { class: "algebraic", count: 3 },
  { class: "prerequisite", count: 2 },
  { class: "reading", count: 1 },
];

// ── Gaps (for recommended actions) ──

export const mockGaps = [
  {
    topicName: "Limites no infinito",
    topicId: "calc1-t09",
    score: 0.0,
    exercisesAvailable: 8,
    action: "Praticar agora",
    actionType: "practice" as const,
  },
  {
    topicName: "Continuidade e TVI",
    topicId: "calc1-t08",
    score: 0.31,
    prerequisite: "Limites laterais",
    action: "Ver tópico",
    actionType: "view" as const,
  },
];
