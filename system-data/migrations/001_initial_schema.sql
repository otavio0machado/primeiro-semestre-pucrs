-- ============================================================
-- 001_initial_schema.sql
-- Sistema Cognitivo de Estudo Pessoal — Supabase/PostgreSQL
-- Gerado em 2026-03-26
-- ============================================================

-- ---------- ENUMS ----------

CREATE TYPE mastery_level AS ENUM ('none', 'exposed', 'developing', 'proficient', 'mastered');
CREATE TYPE assessment_type AS ENUM ('prova', 'trabalho', 'ps', 'g2');
CREATE TYPE document_type AS ENUM ('plano_ensino', 'material_aula', 'lista_exercicios', 'exemplos_resolvidos', 'livro_texto');
CREATE TYPE edge_relation AS ENUM ('prerequisite', 'corequisite', 'applies_to', 'generalizes', 'analogous_to');
CREATE TYPE error_type AS ENUM ('conceptual', 'procedural', 'algebraic', 'reading', 'prerequisite');
CREATE TYPE session_type AS ENUM ('theory', 'exercises', 'review', 'exam_prep', 'diagnostic');
CREATE TYPE relevance_level AS ENUM ('critical', 'high', 'medium', 'supplementary');

-- ---------- DISCIPLINES ----------

CREATE TABLE disciplines (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  semester TEXT NOT NULL,
  schedule TEXT NOT NULL,
  professor TEXT NOT NULL,
  professor_email TEXT,
  total_hours INTEGER NOT NULL,
  ementa TEXT,
  grading_formula TEXT NOT NULL,
  approval_criteria TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- MODULES ----------

CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  discipline_id TEXT NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'not_started',
  UNIQUE(discipline_id, "order")
);

-- ---------- TOPICS ----------

CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  class_numbers INTEGER[],
  document_refs TEXT[],
  UNIQUE(module_id, "order")
);

-- ---------- SUBTOPICS ----------

CREATE TABLE subtopics (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  description TEXT
);

-- ---------- MICROCOMPETENCIES ----------

CREATE TABLE microcompetencies (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  bloom_level INTEGER NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),
  mastery_level mastery_level DEFAULT 'none',
  mastery_score FLOAT DEFAULT 0.0 CHECK (mastery_score >= 0.0 AND mastery_score <= 1.0),
  last_assessed_at TIMESTAMPTZ,
  assessment_count INTEGER DEFAULT 0
);

-- ---------- ASSESSMENTS ----------

CREATE TABLE assessments (
  id TEXT PRIMARY KEY,
  discipline_id TEXT NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  type assessment_type NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  class_number INTEGER,
  weight FLOAT DEFAULT 1.0,
  content_module_ids TEXT[],
  content_topic_ids TEXT[],
  is_cumulative BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'upcoming',
  score FLOAT CHECK (score IS NULL OR (score >= 0.0 AND score <= 10.0))
);

-- ---------- CLASS SESSIONS ----------

CREATE TABLE class_sessions (
  id SERIAL PRIMARY KEY,
  discipline_id TEXT NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  class_number INTEGER,
  date DATE NOT NULL,
  day_time TEXT NOT NULL,
  content TEXT,
  is_holiday BOOLEAN DEFAULT FALSE,
  is_assessment BOOLEAN DEFAULT FALSE,
  assessment_id TEXT REFERENCES assessments(id),
  topic_ids TEXT[]
);

-- ---------- KNOWLEDGE GRAPH ----------

CREATE TABLE concept_nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  discipline_id TEXT NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  description TEXT,
  mastery mastery_level DEFAULT 'none'
);

CREATE TABLE concept_edges (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL REFERENCES concept_nodes(id) ON DELETE CASCADE,
  target TEXT NOT NULL REFERENCES concept_nodes(id) ON DELETE CASCADE,
  relation edge_relation NOT NULL,
  weight FLOAT DEFAULT 0.5 CHECK (weight >= 0.0 AND weight <= 1.0),
  description TEXT,
  UNIQUE(source, target, relation)
);

-- ---------- DOCUMENT INDEX ----------

CREATE TABLE indexed_documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  type document_type NOT NULL,
  discipline_id TEXT NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  topic_ids TEXT[],
  description TEXT,
  relevance relevance_level DEFAULT 'medium',
  usage TEXT,
  has_exercises BOOLEAN DEFAULT FALSE,
  has_solutions BOOLEAN DEFAULT FALSE,
  page_count INTEGER
);

-- ---------- STUDY SESSIONS ----------

CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  type session_type NOT NULL,
  topic_ids TEXT[],
  exercises_attempted INTEGER DEFAULT 0,
  exercises_correct INTEGER DEFAULT 0,
  confidence_rating INTEGER CHECK (confidence_rating IS NULL OR (confidence_rating BETWEEN 1 AND 5)),
  notes TEXT
);

-- ---------- EXERCISES ----------

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  microcompetency_ids TEXT[],
  statement TEXT NOT NULL,
  expected_answer TEXT,
  hints TEXT[],
  solution_steps TEXT[],
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  source TEXT DEFAULT 'ai_generated',
  source_document_id TEXT REFERENCES indexed_documents(id),
  source_question_number TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- EXERCISE ATTEMPTS ----------

CREATE TABLE exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
  student_answer TEXT,
  is_correct BOOLEAN,
  used_hint BOOLEAN DEFAULT FALSE,
  hint_count INTEGER DEFAULT 0,
  error_type error_type,
  error_explanation TEXT,
  ai_feedback TEXT,
  time_spent_seconds INTEGER,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- REVIEW QUEUE ----------

CREATE TABLE review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microcompetency_id TEXT NOT NULL REFERENCES microcompetencies(id) ON DELETE CASCADE,
  next_review_date DATE NOT NULL,
  interval_days INTEGER DEFAULT 1,
  ease_factor FLOAT DEFAULT 2.5,
  consecutive_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(microcompetency_id)
);

-- ---------- MASTERY HISTORY ----------

CREATE TABLE mastery_history (
  id SERIAL PRIMARY KEY,
  microcompetency_id TEXT NOT NULL REFERENCES microcompetencies(id) ON DELETE CASCADE,
  mastery_level mastery_level NOT NULL,
  mastery_score FLOAT NOT NULL,
  trigger_type TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- INDEXES ----------

CREATE INDEX idx_modules_discipline ON modules(discipline_id);
CREATE INDEX idx_topics_module ON topics(module_id);
CREATE INDEX idx_subtopics_topic ON subtopics(topic_id);
CREATE INDEX idx_microcompetencies_topic ON microcompetencies(topic_id);
CREATE INDEX idx_microcompetencies_mastery ON microcompetencies(mastery_level);
CREATE INDEX idx_assessments_discipline ON assessments(discipline_id);
CREATE INDEX idx_assessments_date ON assessments(date);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_class_sessions_date ON class_sessions(date);
CREATE INDEX idx_class_sessions_discipline ON class_sessions(discipline_id);
CREATE INDEX idx_concept_edges_source ON concept_edges(source);
CREATE INDEX idx_concept_edges_target ON concept_edges(target);
CREATE INDEX idx_exercises_topic ON exercises(topic_id);
CREATE INDEX idx_attempts_exercise ON exercise_attempts(exercise_id);
CREATE INDEX idx_attempts_session ON exercise_attempts(session_id);
CREATE INDEX idx_attempts_date ON exercise_attempts(attempted_at);
CREATE INDEX idx_review_queue_date ON review_queue(next_review_date);
CREATE INDEX idx_mastery_history_mc ON mastery_history(microcompetency_id);
CREATE INDEX idx_mastery_history_date ON mastery_history(recorded_at);
CREATE INDEX idx_study_sessions_type ON study_sessions(type);

-- ---------- ROW LEVEL SECURITY ----------

ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE microcompetencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexed_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_history ENABLE ROW LEVEL SECURITY;

-- Single-user: authenticated user has full access to all tables
CREATE POLICY "Authenticated full access" ON disciplines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON modules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON topics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON subtopics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON microcompetencies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON assessments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON class_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON concept_nodes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON concept_edges FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON indexed_documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON study_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON exercises FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON exercise_attempts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON review_queue FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON mastery_history FOR ALL USING (auth.role() = 'authenticated');
