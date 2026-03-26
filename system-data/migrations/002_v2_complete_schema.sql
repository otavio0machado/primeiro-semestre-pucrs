-- ============================================================
-- 002_v2_complete_schema.sql
-- Sistema Cognitivo de Estudo Pessoal — Schema v2
-- 24 tabelas · Supabase/PostgreSQL
-- ============================================================
--
-- MAPA DE TABELAS
-- ───────────────────────────────────────────────────────────
-- CURRÍCULO        courses, modules, topics, subtopics, microcompetencies
-- GRAFO            concepts, concept_edges
-- AVALIAÇÕES       exams, exam_campaigns, simulations
-- CRONOGRAMA       class_sessions
-- ESTUDO           study_sessions, exercises, attempts, errors
-- MASTERY          mastery, mastery_snapshots
-- REVISÃO          reviews, spaced_repetition, flashcards
-- CONTEÚDO         documents, document_chunks
-- PESSOAL          notes
-- ───────────────────────────────────────────────────────────

-- Limpar schema anterior se existir (idempotente para dev)
DROP SCHEMA IF EXISTS study CASCADE;
CREATE SCHEMA study;
SET search_path TO study, public;

-- ════════════════════════════════════════════════════════════
-- ENUMS
-- ════════════════════════════════════════════════════════════

CREATE TYPE study.mastery_level AS ENUM (
  'none',         -- nunca estudou
  'exposed',      -- viu o conteúdo
  'developing',   -- resolve com ajuda / acerta ≤ 50%
  'proficient',   -- resolve sozinho / acerta > 70%
  'mastered'      -- ensina / aplica em contextos novos / > 90%
);

CREATE TYPE study.assessment_type AS ENUM (
  'prova',        -- P1, P2, P3
  'trabalho',     -- T1, T2, T3, T4
  'ps',           -- prova substitutiva
  'g2'            -- exame de grau 2
);

CREATE TYPE study.edge_relation AS ENUM (
  'prerequisite',    -- A é pré-requisito de B
  'corequisite',     -- A e B se apoiam mutuamente
  'applies_to',      -- conceito A se aplica em B
  'generalizes',     -- A generaliza B
  'analogous_to'     -- A é análogo a B (cross-disciplina)
);

CREATE TYPE study.error_class AS ENUM (
  'conceptual',      -- entendeu errado o conceito
  'procedural',      -- sabe o conceito mas erra o procedimento
  'algebraic',       -- erro de conta / manipulação algébrica
  'reading',         -- não interpretou o enunciado
  'prerequisite'     -- falta base de tópico anterior
);

CREATE TYPE study.session_kind AS ENUM (
  'theory',          -- leitura / estudo teórico
  'exercises',       -- prática de exercícios
  'review',          -- revisão espaçada
  'exam_prep',       -- preparação direcionada para prova
  'diagnostic',      -- quiz diagnóstico
  'simulation'       -- simulado cronometrado
);

CREATE TYPE study.doc_type AS ENUM (
  'plano_ensino',
  'material_aula',
  'lista_exercicios',
  'exemplos_resolvidos',
  'livro_texto'
);

CREATE TYPE study.relevance AS ENUM (
  'critical',        -- fonte primária obrigatória
  'high',            -- referência importante
  'medium',          -- complementar útil
  'supplementary'    -- consulta quando necessário
);

CREATE TYPE study.campaign_phase AS ENUM (
  'mapping',         -- D-14: mapeamento de gaps
  'intensification', -- D-7: estudo intensivo nos gaps
  'simulation',      -- D-3: simulado cronometrado
  'polish'           -- D-1: revisão final / consolidação
);

CREATE TYPE study.flashcard_status AS ENUM (
  'new',             -- nunca revisado
  'learning',        -- em aprendizado (intervalo curto)
  'review',          -- em revisão regular
  'graduated',       -- dominou (intervalo longo)
  'suspended'        -- pausado pelo usuário
);

CREATE TYPE study.note_kind AS ENUM (
  'concept',         -- anotação sobre um conceito
  'doubt',           -- dúvida registrada
  'insight',         -- insight / "aha moment"
  'summary',         -- resumo pessoal
  'formula',         -- fórmula / regra importante
  'mistake'          -- erro frequente para lembrar
);


-- ════════════════════════════════════════════════════════════
-- 1. COURSES  (ex: disciplines)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.courses (
  id              TEXT        PRIMARY KEY,
  code            TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  credits         SMALLINT    NOT NULL,
  semester        TEXT        NOT NULL,                -- '2026/1'
  schedule        TEXT        NOT NULL,                -- '3LM | 5LM'
  professor       TEXT        NOT NULL,
  professor_email TEXT,
  total_hours     SMALLINT    NOT NULL,
  ementa          TEXT,
  grading_formula TEXT        NOT NULL,                -- '(P1+P2+P3+MT)/4'
  approval_criteria TEXT      NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.courses IS 'Disciplinas do semestre. Fonte: planos de ensino.';


-- ════════════════════════════════════════════════════════════
-- 2. MODULES
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.modules (
  id              TEXT        PRIMARY KEY,
  course_id       TEXT        NOT NULL REFERENCES study.courses(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  "order"         SMALLINT    NOT NULL,
  description     TEXT,
  start_date      DATE,
  end_date        DATE,
  status          TEXT        NOT NULL DEFAULT 'not_started'
                              CHECK (status IN ('not_started','in_progress','completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, "order")
);

COMMENT ON TABLE study.modules IS 'Módulos de cada disciplina. Ex: Funções, Limites, Derivadas.';


-- ════════════════════════════════════════════════════════════
-- 3. TOPICS
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.topics (
  id              TEXT        PRIMARY KEY,
  module_id       TEXT        NOT NULL REFERENCES study.modules(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  "order"         SMALLINT    NOT NULL,
  class_numbers   SMALLINT[],                          -- aulas do cronograma
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, "order")
);

COMMENT ON TABLE study.topics IS 'Tópicos dentro de cada módulo. 28 tópicos no total.';


-- ════════════════════════════════════════════════════════════
-- 4. SUBTOPICS
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.subtopics (
  id              TEXT        PRIMARY KEY,
  topic_id        TEXT        NOT NULL REFERENCES study.topics(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  "order"         SMALLINT    NOT NULL,
  description     TEXT,
  UNIQUE(topic_id, "order")
);

COMMENT ON TABLE study.subtopics IS 'Divisões granulares de cada tópico. ~82 subtópicos.';


-- ════════════════════════════════════════════════════════════
-- 5. MICROCOMPETENCIES  (tabela de referência — mastery fica separada)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.microcompetencies (
  id              TEXT        PRIMARY KEY,
  topic_id        TEXT        NOT NULL REFERENCES study.topics(id) ON DELETE CASCADE,
  description     TEXT        NOT NULL,
  bloom_level     SMALLINT    NOT NULL CHECK (bloom_level BETWEEN 1 AND 6)
  -- 1=Lembrar 2=Entender 3=Aplicar 4=Analisar 5=Avaliar 6=Criar
);

COMMENT ON TABLE study.microcompetencies IS 'Competências atômicas rastreáveis. 61 no total. Mastery fica na tabela mastery.';


-- ════════════════════════════════════════════════════════════
-- 6. CONCEPTS  (nós do knowledge graph)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.concepts (
  id              TEXT        PRIMARY KEY,
  label           TEXT        NOT NULL,
  course_id       TEXT        NOT NULL REFERENCES study.courses(id) ON DELETE CASCADE,
  topic_id        TEXT        NOT NULL REFERENCES study.topics(id) ON DELETE CASCADE,
  description     TEXT,
  x_position      FLOAT,                               -- para layout persistente do grafo
  y_position      FLOAT
);

COMMENT ON TABLE study.concepts IS 'Nós do grafo de conhecimento. 1:1 com topics, mas pode ter extras.';


-- ════════════════════════════════════════════════════════════
-- 7. CONCEPT_EDGES  (arestas do knowledge graph)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.concept_edges (
  id              SERIAL      PRIMARY KEY,
  source_id       TEXT        NOT NULL REFERENCES study.concepts(id) ON DELETE CASCADE,
  target_id       TEXT        NOT NULL REFERENCES study.concepts(id) ON DELETE CASCADE,
  relation        study.edge_relation NOT NULL,
  weight          FLOAT       NOT NULL DEFAULT 0.5 CHECK (weight >= 0.0 AND weight <= 1.0),
  description     TEXT,
  UNIQUE(source_id, target_id, relation),
  CHECK (source_id <> target_id)
);

COMMENT ON TABLE study.concept_edges IS 'Relações entre conceitos. ~42 arestas incluindo cross-disciplina.';


-- ════════════════════════════════════════════════════════════
-- 8. EXAMS  (provas, trabalhos, PS, G2)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.exams (
  id              TEXT        PRIMARY KEY,
  course_id       TEXT        NOT NULL REFERENCES study.courses(id) ON DELETE CASCADE,
  type            study.assessment_type NOT NULL,
  name            TEXT        NOT NULL,
  date            DATE        NOT NULL,
  class_number    SMALLINT,
  weight          FLOAT       NOT NULL DEFAULT 1.0,
  topic_ids       TEXT[]      NOT NULL DEFAULT '{}',   -- tópicos cobertos
  is_cumulative   BOOLEAN     NOT NULL DEFAULT FALSE,
  score           FLOAT       CHECK (score IS NULL OR (score >= 0.0 AND score <= 10.0)),
  status          TEXT        NOT NULL DEFAULT 'upcoming'
                              CHECK (status IN ('upcoming','done')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.exams IS 'Avaliações reais: 6 provas, 7 trabalhos, 2 PS, 2 G2.';


-- ════════════════════════════════════════════════════════════
-- 9. EXAM_CAMPAIGNS  (campanhas de preparação para provas)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.exam_campaigns (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         TEXT        NOT NULL REFERENCES study.exams(id) ON DELETE CASCADE,
  phase           study.campaign_phase NOT NULL DEFAULT 'mapping',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  target_date     DATE        NOT NULL,                -- data da prova
  plan            JSONB,                                -- plano de estudo gerado pela IA
  -- plan schema: { days: [{ date, topics: [{id, focus, minutes}], goals }] }
  progress_pct    FLOAT       NOT NULL DEFAULT 0.0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  simulation_ids  UUID[]      DEFAULT '{}',
  completed_at    TIMESTAMPTZ,
  UNIQUE(exam_id)                                      -- 1 campanha ativa por prova
);

COMMENT ON TABLE study.exam_campaigns IS 'Campanha de preparação para cada prova. Pipeline de 4 fases (D-14 a D-1).';


-- ════════════════════════════════════════════════════════════
-- 10. SIMULATIONS  (simulados cronometrados)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.simulations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID        REFERENCES study.exam_campaigns(id) ON DELETE SET NULL,
  exam_id         TEXT        REFERENCES study.exams(id) ON DELETE SET NULL,
  title           TEXT        NOT NULL,
  topic_ids       TEXT[]      NOT NULL DEFAULT '{}',
  time_limit_min  SMALLINT,                             -- tempo limite em minutos
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  total_questions SMALLINT    NOT NULL DEFAULT 0,
  correct_count   SMALLINT    NOT NULL DEFAULT 0,
  score           FLOAT,                                -- 0–10
  analysis        JSONB,                                -- análise por tópico gerada pela IA
  -- analysis schema: { topics: [{ id, correct, total, weaknesses }], overall }
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.simulations IS 'Simulados: provas geradas pela IA no formato real da avaliação.';


-- ════════════════════════════════════════════════════════════
-- 11. CLASS_SESSIONS  (cronograma de aulas)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.class_sessions (
  id              SERIAL      PRIMARY KEY,
  course_id       TEXT        NOT NULL REFERENCES study.courses(id) ON DELETE CASCADE,
  class_number    SMALLINT,
  date            DATE        NOT NULL,
  day_time        TEXT        NOT NULL,                 -- '3LM', '2LM' etc.
  content         TEXT,
  is_holiday      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_assessment   BOOLEAN     NOT NULL DEFAULT FALSE,
  exam_id         TEXT        REFERENCES study.exams(id) ON DELETE SET NULL,
  topic_ids       TEXT[]      NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE study.class_sessions IS 'Cronograma completo: ~75 aulas + feriados.';


-- ════════════════════════════════════════════════════════════
-- 12. STUDY_SESSIONS  (sessões de estudo do aluno)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.study_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            study.session_kind NOT NULL,
  topic_ids       TEXT[]      NOT NULL DEFAULT '{}',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  duration_min    SMALLINT    GENERATED ALWAYS AS (
                    CASE WHEN ended_at IS NOT NULL
                         THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INT / 60
                         ELSE NULL END
                  ) STORED,
  exercises_attempted SMALLINT NOT NULL DEFAULT 0,
  exercises_correct   SMALLINT NOT NULL DEFAULT 0,
  confidence      SMALLINT    CHECK (confidence IS NULL OR (confidence BETWEEN 1 AND 5)),
  summary         TEXT,                                 -- resumo gerado pela IA ao final
  simulation_id   UUID        REFERENCES study.simulations(id) ON DELETE SET NULL
);

COMMENT ON TABLE study.study_sessions IS 'Cada sessão de estudo. Tipo, duração, performance.';


-- ════════════════════════════════════════════════════════════
-- 13. EXERCISES
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.exercises (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        TEXT        NOT NULL REFERENCES study.topics(id) ON DELETE CASCADE,
  microcompetency_ids TEXT[]  NOT NULL DEFAULT '{}',
  statement       TEXT        NOT NULL,
  expected_answer TEXT,
  hints           TEXT[]      DEFAULT '{}',
  solution_steps  TEXT[]      DEFAULT '{}',
  difficulty      SMALLINT    NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  source          TEXT        NOT NULL DEFAULT 'ai_generated'
                              CHECK (source IN ('material','list','book','ai_generated')),
  source_doc_id   TEXT        REFERENCES study.documents(id) ON DELETE SET NULL,
  source_ref      TEXT,                                 -- ex: "Q7a", "Cap.2 Ex.15"
  tags            TEXT[]      DEFAULT '{}',
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.exercises IS 'Banco de exercícios: extraídos dos materiais + gerados pela IA.';


-- ════════════════════════════════════════════════════════════
-- 14. ATTEMPTS  (tentativas de resolução)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.attempts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id     UUID        NOT NULL REFERENCES study.exercises(id) ON DELETE CASCADE,
  session_id      UUID        REFERENCES study.study_sessions(id) ON DELETE SET NULL,
  simulation_id   UUID        REFERENCES study.simulations(id) ON DELETE SET NULL,
  student_answer  TEXT,
  is_correct      BOOLEAN,
  used_hint       BOOLEAN     NOT NULL DEFAULT FALSE,
  hint_count      SMALLINT    NOT NULL DEFAULT 0,
  time_spent_sec  SMALLINT,
  ai_feedback     TEXT,                                 -- feedback detalhado do Claude
  attempted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.attempts IS 'Cada tentativa de resolver um exercício. Erros ficam na tabela errors.';


-- ════════════════════════════════════════════════════════════
-- 15. ERRORS  (análise de erros — separada para analytics)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.errors (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID        NOT NULL REFERENCES study.attempts(id) ON DELETE CASCADE,
  class           study.error_class NOT NULL,
  description     TEXT        NOT NULL,                 -- o que o aluno errou
  root_cause      TEXT,                                 -- causa raiz identificada pela IA
  prerequisite_topic_id TEXT  REFERENCES study.topics(id) ON DELETE SET NULL,
  -- se error_class = 'prerequisite', qual tópico falta
  remediation     TEXT,                                 -- ação sugerida pela IA
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.errors IS 'Classificação e análise de cada erro. Permite padrões e analytics.';


-- ════════════════════════════════════════════════════════════
-- 16. MASTERY  (nível de domínio por microcompetência)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.mastery (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  microcompetency_id TEXT     NOT NULL REFERENCES study.microcompetencies(id) ON DELETE CASCADE,
  level           study.mastery_level NOT NULL DEFAULT 'none',
  score           FLOAT       NOT NULL DEFAULT 0.0 CHECK (score >= 0.0 AND score <= 1.0),
  assessment_count SMALLINT   NOT NULL DEFAULT 0,
  last_assessed_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(microcompetency_id)
);

COMMENT ON TABLE study.mastery IS 'Estado atual de domínio de cada microcompetência. 61 registros.';


-- ════════════════════════════════════════════════════════════
-- 17. MASTERY_SNAPSHOTS  (histórico para gráficos de evolução)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.mastery_snapshots (
  id              BIGSERIAL   PRIMARY KEY,
  microcompetency_id TEXT     NOT NULL REFERENCES study.microcompetencies(id) ON DELETE CASCADE,
  level           study.mastery_level NOT NULL,
  score           FLOAT       NOT NULL,
  trigger_event   TEXT,                                 -- 'exercise', 'diagnostic', 'review', 'manual'
  session_id      UUID        REFERENCES study.study_sessions(id) ON DELETE SET NULL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.mastery_snapshots IS 'Log temporal de mastery para visualizar evolução.';


-- ════════════════════════════════════════════════════════════
-- 18. REVIEWS  (fila de revisão — o que precisa ser revisado)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.reviews (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        TEXT        NOT NULL REFERENCES study.topics(id) ON DELETE CASCADE,
  microcompetency_id TEXT     REFERENCES study.microcompetencies(id) ON DELETE SET NULL,
  reason          TEXT        NOT NULL,                 -- 'spaced_rep', 'error_pattern', 'pre_exam', 'manual'
  priority        SMALLINT    NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  scheduled_date  DATE        NOT NULL,
  completed_at    TIMESTAMPTZ,
  session_id      UUID        REFERENCES study.study_sessions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.reviews IS 'Fila de revisões pendentes. Inclui revisão espaçada, pré-prova e manual.';


-- ════════════════════════════════════════════════════════════
-- 19. SPACED_REPETITION  (estado do algoritmo SM-2 por microcompetência)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.spaced_repetition (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  microcompetency_id TEXT     NOT NULL REFERENCES study.microcompetencies(id) ON DELETE CASCADE,
  next_review     DATE        NOT NULL,
  interval_days   SMALLINT    NOT NULL DEFAULT 1,
  ease_factor     FLOAT       NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  consecutive_ok  SMALLINT    NOT NULL DEFAULT 0,
  total_reviews   SMALLINT    NOT NULL DEFAULT 0,
  last_quality    SMALLINT    CHECK (last_quality IS NULL OR (last_quality BETWEEN 0 AND 5)),
  -- SM-2 quality: 0=total blackout .. 5=perfect
  last_reviewed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(microcompetency_id)
);

COMMENT ON TABLE study.spaced_repetition IS 'Estado do algoritmo SM-2 adaptativo por microcompetência.';


-- ════════════════════════════════════════════════════════════
-- 20. FLASHCARDS
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.flashcards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        TEXT        NOT NULL REFERENCES study.topics(id) ON DELETE CASCADE,
  microcompetency_id TEXT     REFERENCES study.microcompetencies(id) ON DELETE SET NULL,
  front           TEXT        NOT NULL,                 -- pergunta / prompt
  back            TEXT        NOT NULL,                 -- resposta
  front_latex     BOOLEAN     NOT NULL DEFAULT FALSE,   -- front contém LaTeX?
  back_latex      BOOLEAN     NOT NULL DEFAULT FALSE,
  status          study.flashcard_status NOT NULL DEFAULT 'new',
  next_review     DATE,
  interval_days   SMALLINT    NOT NULL DEFAULT 0,
  ease_factor     FLOAT       NOT NULL DEFAULT 2.5,
  review_count    SMALLINT    NOT NULL DEFAULT 0,
  source          TEXT        DEFAULT 'manual'
                              CHECK (source IN ('manual','ai_generated','from_error','from_note')),
  tags            TEXT[]      DEFAULT '{}',
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.flashcards IS 'Cards de revisão rápida. Gerados manualmente, pela IA, ou a partir de erros.';


-- ════════════════════════════════════════════════════════════
-- 21. DOCUMENTS  (índice de materiais)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.documents (
  id              TEXT        PRIMARY KEY,
  course_id       TEXT        NOT NULL REFERENCES study.courses(id) ON DELETE CASCADE,
  filename        TEXT        NOT NULL,
  type            study.doc_type NOT NULL,
  topic_ids       TEXT[]      NOT NULL DEFAULT '{}',
  description     TEXT,
  relevance       study.relevance NOT NULL DEFAULT 'medium',
  usage_notes     TEXT,                                 -- como a IA deve usar este doc
  has_exercises   BOOLEAN     NOT NULL DEFAULT FALSE,
  has_solutions   BOOLEAN     NOT NULL DEFAULT FALSE,
  page_count      SMALLINT,
  storage_path    TEXT,                                  -- path no Supabase Storage
  total_chunks    SMALLINT    NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.documents IS 'Índice dos 12 materiais-fonte. Metadados + ponteiro para storage.';


-- ════════════════════════════════════════════════════════════
-- 22. DOCUMENT_CHUNKS  (pedaços para contexto da IA / RAG)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.document_chunks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     TEXT        NOT NULL REFERENCES study.documents(id) ON DELETE CASCADE,
  chunk_index     SMALLINT    NOT NULL,                 -- ordem no documento
  content         TEXT        NOT NULL,
  page_start      SMALLINT,
  page_end        SMALLINT,
  topic_ids       TEXT[]      DEFAULT '{}',             -- tópicos cobertos neste chunk
  token_count     SMALLINT,                             -- tokens estimados (para context window)
  embedding       VECTOR(1536),                         -- para busca semântica (pgvector)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_id, chunk_index)
);

COMMENT ON TABLE study.document_chunks IS 'Chunks dos documentos para RAG. Cada chunk é um pedaço contextualizável para a IA.';


-- ════════════════════════════════════════════════════════════
-- 23. NOTES  (anotações pessoais do aluno)
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.notes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        TEXT        REFERENCES study.topics(id) ON DELETE SET NULL,
  session_id      UUID        REFERENCES study.study_sessions(id) ON DELETE SET NULL,
  kind            study.note_kind NOT NULL DEFAULT 'concept',
  title           TEXT,
  content         TEXT        NOT NULL,
  has_latex       BOOLEAN     NOT NULL DEFAULT FALSE,
  tags            TEXT[]      DEFAULT '{}',
  is_pinned       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE study.notes IS 'Anotações pessoais: conceitos, dúvidas, insights, fórmulas, erros frequentes.';


-- ════════════════════════════════════════════════════════════
-- JUNCTION TABLE: quais exercícios compõem um simulado
-- ════════════════════════════════════════════════════════════

CREATE TABLE study.simulation_exercises (
  simulation_id   UUID        NOT NULL REFERENCES study.simulations(id) ON DELETE CASCADE,
  exercise_id     UUID        NOT NULL REFERENCES study.exercises(id) ON DELETE CASCADE,
  "order"         SMALLINT    NOT NULL,
  PRIMARY KEY (simulation_id, exercise_id)
);


-- ════════════════════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════════════════════

-- Currículo
CREATE INDEX idx_modules_course           ON study.modules(course_id);
CREATE INDEX idx_topics_module            ON study.topics(module_id);
CREATE INDEX idx_subtopics_topic          ON study.subtopics(topic_id);
CREATE INDEX idx_microcomp_topic          ON study.microcompetencies(topic_id);

-- Grafo
CREATE INDEX idx_concepts_course          ON study.concepts(course_id);
CREATE INDEX idx_concepts_topic           ON study.concepts(topic_id);
CREATE INDEX idx_edges_source             ON study.concept_edges(source_id);
CREATE INDEX idx_edges_target             ON study.concept_edges(target_id);
CREATE INDEX idx_edges_relation           ON study.concept_edges(relation);

-- Avaliações
CREATE INDEX idx_exams_course             ON study.exams(course_id);
CREATE INDEX idx_exams_date               ON study.exams(date);
CREATE INDEX idx_exams_status             ON study.exams(status);
CREATE INDEX idx_campaigns_exam           ON study.exam_campaigns(exam_id);
CREATE INDEX idx_simulations_campaign     ON study.simulations(campaign_id);
CREATE INDEX idx_simulations_exam         ON study.simulations(exam_id);

-- Cronograma
CREATE INDEX idx_class_sessions_course    ON study.class_sessions(course_id);
CREATE INDEX idx_class_sessions_date      ON study.class_sessions(date);

-- Estudo
CREATE INDEX idx_study_sessions_kind      ON study.study_sessions(kind);
CREATE INDEX idx_study_sessions_started   ON study.study_sessions(started_at);
CREATE INDEX idx_exercises_topic          ON study.exercises(topic_id);
CREATE INDEX idx_exercises_source         ON study.exercises(source);
CREATE INDEX idx_exercises_difficulty     ON study.exercises(difficulty);
CREATE INDEX idx_attempts_exercise        ON study.attempts(exercise_id);
CREATE INDEX idx_attempts_session         ON study.attempts(session_id);
CREATE INDEX idx_attempts_date            ON study.attempts(attempted_at);
CREATE INDEX idx_errors_attempt           ON study.errors(attempt_id);
CREATE INDEX idx_errors_class             ON study.errors(class);
CREATE INDEX idx_errors_prereq            ON study.errors(prerequisite_topic_id);

-- Mastery
CREATE INDEX idx_mastery_mc               ON study.mastery(microcompetency_id);
CREATE INDEX idx_mastery_level            ON study.mastery(level);
CREATE INDEX idx_snapshots_mc             ON study.mastery_snapshots(microcompetency_id);
CREATE INDEX idx_snapshots_date           ON study.mastery_snapshots(recorded_at);

-- Revisão
CREATE INDEX idx_reviews_topic            ON study.reviews(topic_id);
CREATE INDEX idx_reviews_date             ON study.reviews(scheduled_date);
CREATE INDEX idx_reviews_pending          ON study.reviews(scheduled_date) WHERE completed_at IS NULL;
CREATE INDEX idx_sr_next                  ON study.spaced_repetition(next_review);
CREATE INDEX idx_flashcards_topic         ON study.flashcards(topic_id);
CREATE INDEX idx_flashcards_status        ON study.flashcards(status);
CREATE INDEX idx_flashcards_next          ON study.flashcards(next_review);

-- Conteúdo
CREATE INDEX idx_documents_course         ON study.documents(course_id);
CREATE INDEX idx_documents_type           ON study.documents(type);
CREATE INDEX idx_chunks_doc               ON study.document_chunks(document_id);
CREATE INDEX idx_chunks_topics            ON study.document_chunks USING GIN(topic_ids);

-- Notas
CREATE INDEX idx_notes_topic              ON study.notes(topic_id);
CREATE INDEX idx_notes_kind               ON study.notes(kind);
CREATE INDEX idx_notes_pinned             ON study.notes(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_notes_tags               ON study.notes USING GIN(tags);


-- ════════════════════════════════════════════════════════════
-- TRIGGERS  (updated_at automático)
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION study.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_courses_updated
  BEFORE UPDATE ON study.courses
  FOR EACH ROW EXECUTE FUNCTION study.set_updated_at();

CREATE TRIGGER trg_mastery_updated
  BEFORE UPDATE ON study.mastery
  FOR EACH ROW EXECUTE FUNCTION study.set_updated_at();

CREATE TRIGGER trg_notes_updated
  BEFORE UPDATE ON study.notes
  FOR EACH ROW EXECUTE FUNCTION study.set_updated_at();


-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════
-- Sistema single-user: usuário autenticado tem acesso total.
-- Se escalar para multi-user, adicionar user_id em cada tabela.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'study'
  LOOP
    EXECUTE format('ALTER TABLE study.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "auth_full_%s" ON study.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- VIEWS  (atalhos úteis)
-- ════════════════════════════════════════════════════════════

-- Visão consolidada: mastery por tópico (média das microcompetências)
CREATE VIEW study.v_topic_mastery AS
SELECT
  t.id            AS topic_id,
  t.name          AS topic_name,
  t.module_id,
  m.course_id,
  COUNT(mc.id)    AS total_microcompetencies,
  ROUND(AVG(ma.score)::NUMERIC, 3) AS avg_score,
  MODE() WITHIN GROUP (ORDER BY ma.level) AS dominant_level
FROM study.topics t
JOIN study.modules m ON m.id = t.module_id
JOIN study.microcompetencies mc ON mc.topic_id = t.id
LEFT JOIN study.mastery ma ON ma.microcompetency_id = mc.id
GROUP BY t.id, t.name, t.module_id, m.course_id;

-- Próximas avaliações com countdown
CREATE VIEW study.v_upcoming_exams AS
SELECT
  e.*,
  c.name AS course_name,
  (e.date - CURRENT_DATE) AS days_until
FROM study.exams e
JOIN study.courses c ON c.id = e.course_id
WHERE e.status = 'upcoming' AND e.date >= CURRENT_DATE
ORDER BY e.date;

-- Revisões pendentes (hoje ou atrasadas)
CREATE VIEW study.v_pending_reviews AS
SELECT
  r.*,
  t.name AS topic_name,
  mc.description AS microcompetency_description
FROM study.reviews r
JOIN study.topics t ON t.id = r.topic_id
LEFT JOIN study.microcompetencies mc ON mc.id = r.microcompetency_id
WHERE r.completed_at IS NULL AND r.scheduled_date <= CURRENT_DATE
ORDER BY r.priority DESC, r.scheduled_date;

-- Padrões de erro (top erros por tipo)
CREATE VIEW study.v_error_patterns AS
SELECT
  er.class,
  t.id AS topic_id,
  t.name AS topic_name,
  COUNT(*) AS error_count,
  MAX(er.created_at) AS last_occurrence
FROM study.errors er
JOIN study.attempts a ON a.id = er.attempt_id
JOIN study.exercises ex ON ex.id = a.exercise_id
JOIN study.topics t ON t.id = ex.topic_id
GROUP BY er.class, t.id, t.name
ORDER BY error_count DESC;

-- Histórico de estudo diário
CREATE VIEW study.v_daily_study AS
SELECT
  DATE(started_at) AS study_date,
  COUNT(*)         AS sessions,
  SUM(duration_min) AS total_minutes,
  SUM(exercises_attempted) AS total_exercises,
  SUM(exercises_correct) AS total_correct,
  ROUND(
    CASE WHEN SUM(exercises_attempted) > 0
         THEN SUM(exercises_correct)::NUMERIC / SUM(exercises_attempted) * 100
         ELSE 0 END, 1
  ) AS accuracy_pct
FROM study.study_sessions
WHERE ended_at IS NOT NULL
GROUP BY DATE(started_at)
ORDER BY study_date DESC;
