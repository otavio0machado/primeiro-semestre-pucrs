// ============================================================
// AI SERVICE TYPES — Contratos de entrada/saída para todos os serviços
// Server-side only — nunca importar no client
// ============================================================

// ── Mastery levels (espelha domain.ts) ──

export type MasteryLevel = "none" | "exposed" | "developing" | "proficient" | "mastered";

export type ErrorClass = "conceptual" | "procedural" | "algebraic" | "prerequisite" | "reading";

// ── Common ──

export interface AIServiceConfig {
  /** Override model per-call (default: claude-opus-4-6) */
  model?: string;
  /** Max tokens na resposta (default: 1024) */
  maxTokens?: number;
  /** Temperature 0–1 (default varia por serviço) */
  temperature?: number;
  /** Abort signal para cancelamento */
  signal?: AbortSignal;
}

export interface AIResponse<T> {
  data: T;
  usage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUSD: number;
  };
  model: string;
  durationMs: number;
}

export interface AIError {
  code: "RATE_LIMIT" | "AUTH_ERROR" | "CONTEXT_LENGTH" | "TIMEOUT" | "UNKNOWN";
  message: string;
  retryAfterMs?: number;
}

// ── 1. explainTopic ──

export interface ExplainTopicInput {
  topicName: string;
  courseName: string;
  /** Nível atual do aluno no tópico */
  masteryLevel: MasteryLevel;
  /** Tópicos pré-requisito já dominados */
  prerequisites?: string[];
  /** Foco específico (ex: "definição formal", "intuição geométrica") */
  focus?: string;
}

export interface ExplainTopicOutput {
  explanation: string;
  /** Analogias usadas */
  analogies: string[];
  /** Pré-requisitos mencionados */
  prerequisitesMentioned: string[];
  /** Próximos tópicos sugeridos */
  nextTopics: string[];
}

// ── 2. tutor ──

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorInput {
  topicName: string;
  courseName: string;
  masteryLevel: MasteryLevel;
  /** Histórico da conversa (últimas N mensagens) */
  history: TutorMessage[];
  /** Mensagem atual do aluno */
  message: string;
  /** Exercício em andamento, se houver */
  currentExercise?: string;
}

export interface TutorOutput {
  reply: string;
  /** Dica socrática (nunca resposta direta) */
  hint?: string;
  /** Se o tutor detectou um misconception */
  detectedMisconception?: string;
  /** Sugestão de exercício para reforçar */
  suggestedExercise?: string;
}

// ── 3. classifyError ──

export interface ClassifyErrorInput {
  /** Enunciado do exercício */
  exerciseStatement: string;
  /** Resposta esperada */
  correctAnswer: string;
  /** Resposta do aluno */
  studentAnswer: string;
  /** Tópico do exercício */
  topicName: string;
  courseName: string;
}

export interface ClassifyErrorOutput {
  errorClass: ErrorClass;
  /** Confiança 0–1 na classificação */
  confidence: number;
  /** Explicação do erro */
  explanation: string;
  /** O que o aluno provavelmente pensou */
  likelyReasoning: string;
  /** Pré-requisito faltante, se errorClass === "prerequisite" */
  missingPrerequisite?: string;
  /** Sugestão de remediação */
  remediation: string;
}

// ── 4. generateFlashcards ──

export interface GenerateFlashcardsInput {
  topicName: string;
  courseName: string;
  masteryLevel: MasteryLevel;
  /** Quantidade desejada (default: 5) */
  count?: number;
  /** Tipo de card: definition, theorem, procedure, example */
  cardTypes?: ("definition" | "theorem" | "procedure" | "example")[];
  /** Conteúdo-fonte opcional para basear os cards */
  sourceContent?: string;
}

export interface Flashcard {
  front: string;
  back: string;
  type: "definition" | "theorem" | "procedure" | "example";
  difficulty: 1 | 2 | 3;
}

export interface GenerateFlashcardsOutput {
  cards: Flashcard[];
}

// ── 5. generateNotes ──

export interface GenerateNotesInput {
  topicName: string;
  courseName: string;
  /** Conteúdo-fonte (transcrição de aula, texto, etc.) */
  sourceContent: string;
  /** Formato desejado */
  format: "cornell" | "outline" | "concept-map" | "summary";
}

export interface GenerateNotesOutput {
  title: string;
  content: string;
  /** Conceitos-chave extraídos */
  keyConcepts: string[];
  /** Relações entre conceitos */
  connections: { from: string; to: string; relation: string }[];
}

// ── 6. generateExamPlan ──

export interface GenerateExamPlanInput {
  examName: string;
  courseName: string;
  examDate: string;
  /** Tópicos cobertos com mastery atual */
  topics: { name: string; mastery: MasteryLevel; score: number }[];
  /** Horas disponíveis por dia */
  hoursPerDay: number;
  /** Padrões de erro recorrentes */
  errorPatterns?: { class: ErrorClass; count: number }[];
}

export interface StudyBlock {
  day: number;
  date: string;
  topic: string;
  activity: "theory" | "exercises" | "review" | "simulation";
  durationMin: number;
  priority: "critical" | "high" | "medium" | "low";
  rationale: string;
}

export interface GenerateExamPlanOutput {
  totalDays: number;
  blocks: StudyBlock[];
  /** Tópicos com risco maior */
  riskTopics: string[];
  /** Estratégia geral */
  strategy: string;
}

// ── 7. summarizeDocument ──

export interface SummarizeDocumentInput {
  /** Texto completo do documento */
  content: string;
  courseName: string;
  /** Nível de detalhe */
  depth: "brief" | "standard" | "detailed";
  /** Foco em tópicos específicos */
  focusTopics?: string[];
}

export interface SummarizeDocumentOutput {
  summary: string;
  /** Tópicos identificados no documento */
  topicsFound: string[];
  /** Definições extraídas */
  definitions: { term: string; definition: string }[];
  /** Teoremas/resultados-chave */
  keyResults: string[];
}

// ── 8. generateExercises ──

export interface GenerateExercisesInput {
  topicName: string;
  courseName: string;
  masteryLevel: MasteryLevel;
  /** Quantidade (default: 3) */
  count?: number;
  /** Dificuldade alvo 1–5 */
  difficulty?: number;
  /** Tipos de exercício desejados */
  types?: ("multiple-choice" | "open-ended" | "proof" | "computation")[];
  /** Erros que o aluno comete — gerar exercícios que forcem a confrontar */
  targetErrors?: ErrorClass[];
}

export interface Exercise {
  id: string;
  statement: string;
  type: "multiple-choice" | "open-ended" | "proof" | "computation";
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Para multiple-choice */
  options?: { label: string; text: string; isCorrect: boolean }[];
  /** Solução completa */
  solution: string;
  /** Dicas progressivas (reveal uma por vez) */
  hints: string[];
  /** Conceitos testados */
  conceptsTested: string[];
}

export interface GenerateExercisesOutput {
  exercises: Exercise[];
}
