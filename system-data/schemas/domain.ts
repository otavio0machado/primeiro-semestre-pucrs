// ============================================================
// DOMAIN SCHEMAS v2 — Sistema Cognitivo de Estudo Pessoal
// Alinhado 1:1 com 002_v2_complete_schema.sql (schema study.*)
// 24 tabelas · 11 enums · 5 views
// ============================================================

// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

/** study.mastery_level */
export type MasteryLevel =
  | "none"        // nunca estudou
  | "exposed"     // viu o conteúdo
  | "developing"  // resolve com ajuda / acerta ≤ 50%
  | "proficient"  // resolve sozinho / acerta > 70%
  | "mastered";   // ensina / aplica em contextos novos / > 90%

/** study.assessment_type */
export type AssessmentType =
  | "prova"       // P1, P2, P3
  | "trabalho"    // T1, T2, T3, T4
  | "ps"          // prova substitutiva
  | "g2";         // exame de grau 2

/** study.edge_relation */
export type EdgeRelation =
  | "prerequisite"    // A é pré-requisito de B
  | "corequisite"     // A e B se apoiam mutuamente
  | "applies_to"      // conceito A se aplica em B
  | "generalizes"     // A generaliza B
  | "analogous_to";   // A é análogo a B (cross-disciplina)

/** study.error_class */
export type ErrorClass =
  | "conceptual"      // entendeu errado o conceito
  | "procedural"      // sabe o conceito mas erra o procedimento
  | "algebraic"       // erro de conta / manipulação algébrica
  | "reading"         // não interpretou o enunciado
  | "prerequisite";   // falta base de tópico anterior

/** study.session_kind */
export type SessionKind =
  | "theory"          // leitura / estudo teórico
  | "exercises"       // prática de exercícios
  | "review"          // revisão espaçada
  | "exam_prep"       // preparação direcionada para prova
  | "diagnostic"      // quiz diagnóstico
  | "simulation";     // simulado cronometrado

/** study.doc_type */
export type DocType =
  | "plano_ensino"
  | "material_aula"
  | "lista_exercicios"
  | "exemplos_resolvidos"
  | "livro_texto";

/** study.relevance */
export type Relevance =
  | "critical"        // fonte primária obrigatória
  | "high"            // referência importante
  | "medium"          // complementar útil
  | "supplementary";  // consulta quando necessário

/** study.campaign_phase */
export type CampaignPhase =
  | "mapping"         // D-14: mapeamento de gaps
  | "intensification" // D-7: estudo intensivo nos gaps
  | "simulation"      // D-3: simulado cronometrado
  | "polish";         // D-1: revisão final / consolidação

/** study.flashcard_status */
export type FlashcardStatus =
  | "new"             // nunca revisado
  | "learning"        // em aprendizado (intervalo curto)
  | "review"          // em revisão regular
  | "graduated"       // dominou (intervalo longo)
  | "suspended";      // pausado pelo usuário

/** study.note_kind */
export type NoteKind =
  | "concept"         // anotação sobre um conceito
  | "doubt"           // dúvida registrada
  | "insight"         // insight / "aha moment"
  | "summary"         // resumo pessoal
  | "formula"         // fórmula / regra importante
  | "mistake";        // erro frequente para lembrar

// Tipos auxiliares reutilizados
export type ModuleStatus = "not_started" | "in_progress" | "completed";
export type ExamStatus = "upcoming" | "done";
export type ExerciseSource = "material" | "list" | "book" | "ai_generated";
export type FlashcardSource = "manual" | "ai_generated" | "from_error" | "from_note";

// ═══════════════════════════════════════════════════════════════
// 1. COURSES  (study.courses)
// ═══════════════════════════════════════════════════════════════

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;             // '2026/1'
  schedule: string;             // '3LM | 5LM'
  professor: string;
  professor_email: string | null;
  total_hours: number;
  ementa: string | null;
  grading_formula: string;      // '(P1+P2+P3+MT)/4'
  approval_criteria: string;
  created_at: string;           // ISO timestamptz
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 2. MODULES  (study.modules)
// ═══════════════════════════════════════════════════════════════

export interface Module {
  id: string;
  course_id: string;
  name: string;
  order: number;
  description: string | null;
  start_date: string | null;    // ISO date
  end_date: string | null;
  status: ModuleStatus;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 3. TOPICS  (study.topics)
// ═══════════════════════════════════════════════════════════════

export interface Topic {
  id: string;
  module_id: string;
  name: string;
  order: number;
  class_numbers: number[] | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 4. SUBTOPICS  (study.subtopics)
// ═══════════════════════════════════════════════════════════════

export interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  order: number;
  description: string | null;
}

// ═══════════════════════════════════════════════════════════════
// 5. MICROCOMPETENCIES  (study.microcompetencies)
// ═══════════════════════════════════════════════════════════════

export interface Microcompetency {
  id: string;
  topic_id: string;
  description: string;
  bloom_level: 1 | 2 | 3 | 4 | 5 | 6;
  // 1=Lembrar 2=Entender 3=Aplicar 4=Analisar 5=Avaliar 6=Criar
}

// ═══════════════════════════════════════════════════════════════
// 6. CONCEPTS  (study.concepts — nós do knowledge graph)
// ═══════════════════════════════════════════════════════════════

export interface Concept {
  id: string;
  label: string;
  course_id: string;
  topic_id: string;
  description: string | null;
  x_position: number | null;
  y_position: number | null;
}

// ═══════════════════════════════════════════════════════════════
// 7. CONCEPT_EDGES  (study.concept_edges — arestas do graph)
// ═══════════════════════════════════════════════════════════════

export interface ConceptEdge {
  id: number;                   // SERIAL
  source_id: string;
  target_id: string;
  relation: EdgeRelation;
  weight: number;               // 0.0–1.0
  description: string | null;
}

// ═══════════════════════════════════════════════════════════════
// 8. EXAMS  (study.exams — provas, trabalhos, PS, G2)
// ═══════════════════════════════════════════════════════════════

export interface Exam {
  id: string;
  course_id: string;
  type: AssessmentType;
  name: string;
  date: string;                 // ISO date
  class_number: number | null;
  weight: number;
  topic_ids: string[];
  is_cumulative: boolean;
  score: number | null;         // 0–10
  status: ExamStatus;
  notes: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 9. EXAM_CAMPAIGNS  (study.exam_campaigns — prep pipeline)
// ═══════════════════════════════════════════════════════════════

/** Schema do campo JSONB `plan` */
export interface CampaignPlan {
  days: Array<{
    date: string;
    topics: Array<{
      id: string;
      focus: string;
      minutes: number;
    }>;
    goals: string;
  }>;
}

export interface ExamCampaign {
  id: string;                   // UUID
  exam_id: string;
  phase: CampaignPhase;
  started_at: string;
  target_date: string;          // ISO date
  plan: CampaignPlan | null;    // JSONB
  progress_pct: number;         // 0–100
  simulation_ids: string[];     // UUID[]
  completed_at: string | null;
}

// ═══════════════════════════════════════════════════════════════
// 10. SIMULATIONS  (study.simulations — simulados cronometrados)
// ═══════════════════════════════════════════════════════════════

/** Schema do campo JSONB `analysis` */
export interface SimulationAnalysis {
  topics: Array<{
    id: string;
    correct: number;
    total: number;
    weaknesses: string[];
  }>;
  overall: string;
}

export interface Simulation {
  id: string;                   // UUID
  campaign_id: string | null;
  exam_id: string | null;
  title: string;
  topic_ids: string[];
  time_limit_min: number | null;
  started_at: string | null;
  finished_at: string | null;
  total_questions: number;
  correct_count: number;
  score: number | null;         // 0–10
  analysis: SimulationAnalysis | null;  // JSONB
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 11. CLASS_SESSIONS  (study.class_sessions — cronograma)
// ═══════════════════════════════════════════════════════════════

export interface ClassSession {
  id: number;                   // SERIAL
  course_id: string;
  class_number: number | null;
  date: string;
  day_time: string;             // '3LM', '5LM', etc.
  content: string | null;
  is_holiday: boolean;
  is_assessment: boolean;
  exam_id: string | null;
  topic_ids: string[];
}

// ═══════════════════════════════════════════════════════════════
// 12. STUDY_SESSIONS  (study.study_sessions)
// ═══════════════════════════════════════════════════════════════

export interface StudySession {
  id: string;                   // UUID
  kind: SessionKind;
  topic_ids: string[];
  started_at: string;
  ended_at: string | null;
  duration_min: number | null;  // GENERATED column
  exercises_attempted: number;
  exercises_correct: number;
  confidence: 1 | 2 | 3 | 4 | 5 | null;
  summary: string | null;
  simulation_id: string | null;
}

// ═══════════════════════════════════════════════════════════════
// 13. EXERCISES  (study.exercises)
// ═══════════════════════════════════════════════════════════════

export interface Exercise {
  id: string;                   // UUID
  topic_id: string;
  microcompetency_ids: string[];
  statement: string;
  expected_answer: string | null;
  hints: string[];
  solution_steps: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  source: ExerciseSource;
  source_doc_id: string | null;
  source_ref: string | null;   // "Q7a", "Cap.2 Ex.15"
  tags: string[];
  is_active: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 14. ATTEMPTS  (study.attempts)
// ═══════════════════════════════════════════════════════════════

export interface Attempt {
  id: string;                   // UUID
  exercise_id: string;
  session_id: string | null;
  simulation_id: string | null;
  student_answer: string | null;
  is_correct: boolean | null;
  used_hint: boolean;
  hint_count: number;
  time_spent_sec: number | null;
  ai_feedback: string | null;
  attempted_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 15. ERRORS  (study.errors — análise separada para analytics)
// ═══════════════════════════════════════════════════════════════

export interface StudyError {
  id: string;                   // UUID
  attempt_id: string;
  class: ErrorClass;
  description: string;
  root_cause: string | null;
  prerequisite_topic_id: string | null;
  remediation: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 16. MASTERY  (study.mastery — estado atual por microcompetência)
// ═══════════════════════════════════════════════════════════════

export interface Mastery {
  id: string;                   // UUID
  microcompetency_id: string;   // UNIQUE
  level: MasteryLevel;
  score: number;                // 0.0–1.0
  assessment_count: number;
  last_assessed_at: string | null;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 17. MASTERY_SNAPSHOTS  (study.mastery_snapshots — histórico)
// ═══════════════════════════════════════════════════════════════

export interface MasterySnapshot {
  id: number;                   // BIGSERIAL
  microcompetency_id: string;
  level: MasteryLevel;
  score: number;
  trigger_event: string | null; // 'exercise', 'diagnostic', 'review', 'manual'
  session_id: string | null;
  recorded_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 18. REVIEWS  (study.reviews — fila de revisão)
// ═══════════════════════════════════════════════════════════════

export interface Review {
  id: string;                   // UUID
  topic_id: string;
  microcompetency_id: string | null;
  reason: string;               // 'spaced_rep', 'error_pattern', 'pre_exam', 'manual'
  priority: number;             // 1–10
  scheduled_date: string;       // ISO date
  completed_at: string | null;
  session_id: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 19. SPACED_REPETITION  (study.spaced_repetition — SM-2)
// ═══════════════════════════════════════════════════════════════

export interface SpacedRepetition {
  id: string;                   // UUID
  microcompetency_id: string;   // UNIQUE
  next_review: string;          // ISO date
  interval_days: number;
  ease_factor: number;          // ≥ 1.3
  consecutive_ok: number;
  total_reviews: number;
  last_quality: 0 | 1 | 2 | 3 | 4 | 5 | null;  // SM-2 quality
  last_reviewed_at: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 20. FLASHCARDS  (study.flashcards)
// ═══════════════════════════════════════════════════════════════

export interface Flashcard {
  id: string;                   // UUID
  topic_id: string;
  microcompetency_id: string | null;
  front: string;
  back: string;
  front_latex: boolean;
  back_latex: boolean;
  status: FlashcardStatus;
  next_review: string | null;   // ISO date
  interval_days: number;
  ease_factor: number;
  review_count: number;
  source: FlashcardSource;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 21. DOCUMENTS  (study.documents — índice de materiais)
// ═══════════════════════════════════════════════════════════════

export interface Document {
  id: string;
  course_id: string;
  filename: string;
  type: DocType;
  topic_ids: string[];
  description: string | null;
  relevance: Relevance;
  usage_notes: string | null;
  has_exercises: boolean;
  has_solutions: boolean;
  page_count: number | null;
  storage_path: string | null;
  total_chunks: number;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 22. DOCUMENT_CHUNKS  (study.document_chunks — RAG)
// ═══════════════════════════════════════════════════════════════

export interface DocumentChunk {
  id: string;                   // UUID
  document_id: string;
  chunk_index: number;
  content: string;
  page_start: number | null;
  page_end: number | null;
  topic_ids: string[];
  token_count: number | null;
  embedding: number[] | null;   // VECTOR(1536) → float[] no client
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// 23. NOTES  (study.notes — anotações pessoais)
// ═══════════════════════════════════════════════════════════════

export interface Note {
  id: string;                   // UUID
  topic_id: string | null;
  session_id: string | null;
  kind: NoteKind;
  title: string | null;
  content: string;
  has_latex: boolean;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// JUNCTION: SIMULATION_EXERCISES  (study.simulation_exercises)
// ═══════════════════════════════════════════════════════════════

export interface SimulationExercise {
  simulation_id: string;
  exercise_id: string;
  order: number;
}

// ═══════════════════════════════════════════════════════════════
// VIEWS  (tipos de retorno das 5 views)
// ═══════════════════════════════════════════════════════════════

/** study.v_topic_mastery */
export interface TopicMasteryView {
  topic_id: string;
  topic_name: string;
  module_id: string;
  course_id: string;
  total_microcompetencies: number;
  avg_score: number | null;
  dominant_level: MasteryLevel | null;
}

/** study.v_upcoming_exams */
export interface UpcomingExamView {
  id: string;
  course_id: string;
  type: AssessmentType;
  name: string;
  date: string;
  class_number: number | null;
  weight: number;
  topic_ids: string[];
  is_cumulative: boolean;
  score: number | null;
  status: ExamStatus;
  notes: string | null;
  created_at: string;
  course_name: string;
  days_until: number;
}

/** study.v_pending_reviews */
export interface PendingReviewView {
  id: string;
  topic_id: string;
  microcompetency_id: string | null;
  reason: string;
  priority: number;
  scheduled_date: string;
  completed_at: null;           // sempre null (filtrado pela view)
  session_id: string | null;
  created_at: string;
  topic_name: string;
  microcompetency_description: string | null;
}

/** study.v_error_patterns */
export interface ErrorPatternView {
  class: ErrorClass;
  topic_id: string;
  topic_name: string;
  error_count: number;
  last_occurrence: string;
}

/** study.v_daily_study */
export interface DailyStudyView {
  study_date: string;
  sessions: number;
  total_minutes: number | null;
  total_exercises: number;
  total_correct: number;
  accuracy_pct: number;
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE DATABASE TYPE MAP  (para uso com supabase-js)
// ═══════════════════════════════════════════════════════════════

export interface Database {
  study: {
    Tables: {
      courses:              { Row: Course;              Insert: Omit<Course, "created_at" | "updated_at">                & Partial<Pick<Course, "created_at" | "updated_at">>; Update: Partial<Omit<Course, "id">>; };
      modules:              { Row: Module;              Insert: Omit<Module, "created_at" | "status">                   & Partial<Pick<Module, "created_at" | "status">>; Update: Partial<Omit<Module, "id">>; };
      topics:               { Row: Topic;               Insert: Omit<Topic, "created_at" | "class_numbers">            & Partial<Pick<Topic, "created_at" | "class_numbers">>; Update: Partial<Omit<Topic, "id">>; };
      subtopics:            { Row: Subtopic;            Insert: Subtopic;                                                                                                           Update: Partial<Omit<Subtopic, "id">>; };
      microcompetencies:    { Row: Microcompetency;     Insert: Microcompetency;                                                                                                    Update: Partial<Omit<Microcompetency, "id">>; };
      concepts:             { Row: Concept;             Insert: Omit<Concept, "x_position" | "y_position">             & Partial<Pick<Concept, "x_position" | "y_position">>; Update: Partial<Omit<Concept, "id">>; };
      concept_edges:        { Row: ConceptEdge;         Insert: Omit<ConceptEdge, "id" | "weight">                     & Partial<Pick<ConceptEdge, "weight">>; Update: Partial<Omit<ConceptEdge, "id">>; };
      exams:                { Row: Exam;                Insert: Omit<Exam, "created_at" | "weight" | "topic_ids" | "is_cumulative" | "status"> & Partial<Pick<Exam, "created_at" | "weight" | "topic_ids" | "is_cumulative" | "status">>; Update: Partial<Omit<Exam, "id">>; };
      exam_campaigns:       { Row: ExamCampaign;        Insert: Omit<ExamCampaign, "id" | "phase" | "started_at" | "progress_pct" | "simulation_ids"> & Partial<Pick<ExamCampaign, "id" | "phase" | "started_at" | "progress_pct" | "simulation_ids">>; Update: Partial<Omit<ExamCampaign, "id">>; };
      simulations:          { Row: Simulation;          Insert: Omit<Simulation, "id" | "created_at" | "topic_ids" | "total_questions" | "correct_count"> & Partial<Pick<Simulation, "id" | "created_at" | "topic_ids" | "total_questions" | "correct_count">>; Update: Partial<Omit<Simulation, "id">>; };
      class_sessions:       { Row: ClassSession;        Insert: Omit<ClassSession, "id" | "is_holiday" | "is_assessment" | "topic_ids"> & Partial<Pick<ClassSession, "is_holiday" | "is_assessment" | "topic_ids">>; Update: Partial<Omit<ClassSession, "id">>; };
      study_sessions:       { Row: StudySession;        Insert: Omit<StudySession, "id" | "started_at" | "duration_min" | "exercises_attempted" | "exercises_correct" | "topic_ids"> & Partial<Pick<StudySession, "id" | "started_at" | "exercises_attempted" | "exercises_correct" | "topic_ids">>; Update: Partial<Omit<StudySession, "id" | "duration_min">>; };
      exercises:            { Row: Exercise;            Insert: Omit<Exercise, "id" | "created_at" | "difficulty" | "source" | "microcompetency_ids" | "hints" | "solution_steps" | "tags" | "is_active"> & Partial<Pick<Exercise, "id" | "created_at" | "difficulty" | "source" | "microcompetency_ids" | "hints" | "solution_steps" | "tags" | "is_active">>; Update: Partial<Omit<Exercise, "id">>; };
      attempts:             { Row: Attempt;             Insert: Omit<Attempt, "id" | "attempted_at" | "used_hint" | "hint_count"> & Partial<Pick<Attempt, "id" | "attempted_at" | "used_hint" | "hint_count">>; Update: Partial<Omit<Attempt, "id">>; };
      errors:               { Row: StudyError;          Insert: Omit<StudyError, "id" | "created_at">                  & Partial<Pick<StudyError, "id" | "created_at">>; Update: Partial<Omit<StudyError, "id">>; };
      mastery:              { Row: Mastery;             Insert: Omit<Mastery, "id" | "level" | "score" | "assessment_count" | "updated_at"> & Partial<Pick<Mastery, "id" | "level" | "score" | "assessment_count" | "updated_at">>; Update: Partial<Omit<Mastery, "id">>; };
      mastery_snapshots:    { Row: MasterySnapshot;     Insert: Omit<MasterySnapshot, "id" | "recorded_at">            & Partial<Pick<MasterySnapshot, "id" | "recorded_at">>; Update: Partial<Omit<MasterySnapshot, "id">>; };
      reviews:              { Row: Review;              Insert: Omit<Review, "id" | "created_at">                      & Partial<Pick<Review, "id" | "created_at">>; Update: Partial<Omit<Review, "id">>; };
      spaced_repetition:    { Row: SpacedRepetition;    Insert: Omit<SpacedRepetition, "id" | "interval_days" | "ease_factor" | "consecutive_ok" | "total_reviews" | "created_at"> & Partial<Pick<SpacedRepetition, "id" | "interval_days" | "ease_factor" | "consecutive_ok" | "total_reviews" | "created_at">>; Update: Partial<Omit<SpacedRepetition, "id">>; };
      flashcards:           { Row: Flashcard;           Insert: Omit<Flashcard, "id" | "created_at" | "front_latex" | "back_latex" | "status" | "interval_days" | "ease_factor" | "review_count" | "source" | "tags" | "is_active"> & Partial<Pick<Flashcard, "id" | "created_at" | "front_latex" | "back_latex" | "status" | "interval_days" | "ease_factor" | "review_count" | "source" | "tags" | "is_active">>; Update: Partial<Omit<Flashcard, "id">>; };
      documents:            { Row: Document;            Insert: Omit<Document, "created_at" | "topic_ids" | "relevance" | "has_exercises" | "has_solutions" | "total_chunks"> & Partial<Pick<Document, "created_at" | "topic_ids" | "relevance" | "has_exercises" | "has_solutions" | "total_chunks">>; Update: Partial<Omit<Document, "id">>; };
      document_chunks:      { Row: DocumentChunk;       Insert: Omit<DocumentChunk, "id" | "created_at" | "topic_ids"> & Partial<Pick<DocumentChunk, "id" | "created_at" | "topic_ids">>; Update: Partial<Omit<DocumentChunk, "id">>; };
      notes:                { Row: Note;                Insert: Omit<Note, "id" | "created_at" | "updated_at" | "kind" | "has_latex" | "tags" | "is_pinned"> & Partial<Pick<Note, "id" | "created_at" | "updated_at" | "kind" | "has_latex" | "tags" | "is_pinned">>; Update: Partial<Omit<Note, "id">>; };
      simulation_exercises: { Row: SimulationExercise;  Insert: SimulationExercise;                                                                                                 Update: Partial<SimulationExercise>; };
    };
    Views: {
      v_topic_mastery:    { Row: TopicMasteryView };
      v_upcoming_exams:   { Row: UpcomingExamView };
      v_pending_reviews:  { Row: PendingReviewView };
      v_error_patterns:   { Row: ErrorPatternView };
      v_daily_study:      { Row: DailyStudyView };
    };
    Enums: {
      mastery_level:     MasteryLevel;
      assessment_type:   AssessmentType;
      edge_relation:     EdgeRelation;
      error_class:       ErrorClass;
      session_kind:      SessionKind;
      doc_type:          DocType;
      relevance:         Relevance;
      campaign_phase:    CampaignPhase;
      flashcard_status:  FlashcardStatus;
      note_kind:         NoteKind;
    };
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS (uso no app)
// ═══════════════════════════════════════════════════════════════

/** Atalho para tipagem do client Supabase */
export type Tables = Database["study"]["Tables"];
export type Views = Database["study"]["Views"];
export type Enums = Database["study"]["Enums"];

/** Extrair Row type de qualquer tabela */
export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type InsertRow<T extends keyof Tables> = Tables[T]["Insert"];
export type UpdateRow<T extends keyof Tables> = Tables[T]["Update"];

/** Extrair Row type de qualquer view */
export type ViewRow<V extends keyof Views> = Views[V]["Row"];

// ═══════════════════════════════════════════════════════════════
// GRADE SIMULATION  (tipo auxiliar — não é tabela do banco)
// ═══════════════════════════════════════════════════════════════

export interface GradeSimulation {
  course_id: string;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  mt: number | null;            // média trabalhos
  g1: number | null;            // calculado: (P1+P2+P3+MT)/4
  needs_g2: boolean;
  g2_target: number | null;     // nota mínima no G2 para aprovação
}
