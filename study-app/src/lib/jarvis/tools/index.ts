// ============================================================
// JARVIS — Tool Registry
// All tools that Jarvis can execute on the system
// ============================================================

import type { ToolDefinition, ToolResult, ProviderTool } from '../types'
import type { JarvisContext } from '../types'
import type { NoteFormat, MasteryLevel, ExerciseType, ErrorCategory, ErrorSeverity, SessionKind, Topic } from '@/lib/supabase'
import { createNote, updateNote, deleteNote, getNotes, getNotesByTopic, getNotesByDiscipline, getNote } from '@/lib/services/notes'
import { createFlashcard, deleteFlashcard, getFlashcards, getFlashcardsByTopic, getDueFlashcards, reviewFlashcard } from '@/lib/services/flashcards'
import { createStudySession, getStudySessions } from '@/lib/services/study-sessions'
import { createExercise, getExercises, getExercisesByTopic, createAttempt, createErrorOccurrence } from '@/lib/services/exercises'
import { getAssessments, getUpcomingAssessments } from '@/lib/services/assessments'
import { getAllTopics, getDisciplines, getTopic, getTopicsByDiscipline, updateTopicMastery } from '@/lib/services/disciplines'
import { explainTopic } from '@/lib/ai/services/explain-topic'
import { tutor } from '@/lib/ai/services/tutor'
import { generateFlashcards as aiGenerateFlashcards } from '@/lib/ai/services/generate-flashcards'
import { generateExercises as aiGenerateExercises } from '@/lib/ai/services/generate-exercises'
import { generateExamPlan } from '@/lib/ai/services/generate-exam-plan'
import { summarizeDocument } from '@/lib/ai/services/summarize-document'
import { generateNoteGraph } from '@/lib/ai/services/generate-note-graph'
import { generateNoteInteractive } from '@/lib/ai/services/generate-note-interactive'

// ── Helper ──────────────────────────────────────────────────

function makeResult(toolCallId: string, success: boolean, message: string, data?: unknown): ToolResult {
  return { toolCallId, success, message, data }
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function extractStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function findTopicMatch(topics: Topic[], fragments: string[]): Topic | null {
  const haystack = normalizeSearchText(
    fragments
      .filter((fragment): fragment is string => typeof fragment === 'string' && fragment.trim().length > 0)
      .join(' ')
  )

  if (!haystack) return null

  const ranked = topics
    .map((topic) => {
      const topicName = normalizeSearchText(topic.name)
      let score = 0

      if (haystack.includes(topicName)) {
        score += 100 + topicName.length
      }

      const keywords = topicName
        .split(/\s+/)
        .filter((keyword) => keyword.length >= 4)

      for (const keyword of keywords) {
        if (haystack.includes(keyword)) score += 5
      }

      return { topic, score }
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.topic.name.length - a.topic.name.length)

  return ranked[0]?.topic ?? null
}

async function resolveNoteTarget(
  params: Record<string, unknown>,
  context?: JarvisContext,
): Promise<{ topicId: string; disciplineId: string; topicName: string }> {
  const explicitTopicId = typeof params.topic_id === 'string' && params.topic_id.trim().length > 0
    ? params.topic_id.trim()
    : undefined
  const explicitDisciplineId = typeof params.discipline_id === 'string' && params.discipline_id.trim().length > 0
    ? params.discipline_id.trim()
    : undefined
  const contextTopicId = context?.currentTopicId?.trim() || undefined
  const contextDisciplineId = context?.currentDisciplineId?.trim() || undefined

  const preferredTopicId = explicitTopicId ?? contextTopicId
  if (preferredTopicId) {
    const topic = await getTopic(preferredTopicId)
    if (!topic) {
      throw new Error(`Tópico "${preferredTopicId}" não encontrado para salvar a nota.`)
    }

    return {
      topicId: topic.id,
      disciplineId: topic.discipline_id,
      topicName: topic.name,
    }
  }

  const preferredDisciplineId = explicitDisciplineId ?? contextDisciplineId
  const candidateTopics = preferredDisciplineId
    ? await getTopicsByDiscipline(preferredDisciplineId)
    : await getAllTopics()

  const matchedTopic = findTopicMatch(candidateTopics, [
    params.title as string,
    params.content as string,
    ...extractStringArray(params.key_concepts),
    ...extractStringArray(params.tags),
  ])

  if (matchedTopic) {
    return {
      topicId: matchedTopic.id,
      disciplineId: matchedTopic.discipline_id,
      topicName: matchedTopic.name,
    }
  }

  if (preferredDisciplineId) {
    const firstTopic = candidateTopics[0]
    if (!firstTopic) {
      throw new Error(`Não encontrei tópicos na disciplina "${preferredDisciplineId}" para salvar a nota.`)
    }

    return {
      topicId: firstTopic.id,
      disciplineId: firstTopic.discipline_id,
      topicName: firstTopic.name,
    }
  }

  const recentTopicId = context?.recentTopics[0]?.id
  if (recentTopicId) {
    const recentTopic = await getTopic(recentTopicId)
    if (recentTopic) {
      return {
        topicId: recentTopic.id,
        disciplineId: recentTopic.discipline_id,
        topicName: recentTopic.name,
      }
    }
  }

  throw new Error(
    'Preciso de um tópico para salvar a nota. Abra uma disciplina/tópico ou peça a nota informando o tema.'
  )
}

// ── Tool Definitions ────────────────────────────────────────

const tools: ToolDefinition[] = [
  // ── NOTES ─────────────────────────────────────────────────
  {
    name: 'createNote',
    description: 'Create a new study note for a topic. Returns the created note.',
    category: 'notes',
    parameters: {
      title: { type: 'string', description: 'Title of the note' },
      content: { type: 'string', description: 'Markdown content of the note' },
      topic_id: { type: 'string', description: 'ID of the topic this note belongs to (optional when current context already has a topic)' },
      discipline_id: { type: 'string', description: 'ID of the discipline (optional when it can be inferred from topic/context)' },
      format: { type: 'string', description: 'Note format', enum: ['cornell', 'outline', 'concept_map', 'summary', 'free'] },
      key_concepts: { type: 'array', description: 'Key concepts covered in this note', items: { type: 'string' } },
      tags: { type: 'array', description: 'Tags for this note', items: { type: 'string' } },
    },
    required: ['title', 'content'],
    execute: async (params, context) => {
      try {
        const target = await resolveNoteTarget(params, context)
        const note = await createNote({
          title: params.title as string,
          content: params.content as string,
          topic_id: target.topicId,
          discipline_id: target.disciplineId,
          format: ((params.format as string) || 'free') as NoteFormat,
          key_concepts: (params.key_concepts as string[]) || [],
          tags: (params.tags as string[]) || [],
          ai_generated: true,
        })
        return makeResult('', true, `Nota "${note.title}" criada com sucesso em "${target.topicName}".`, note)
      } catch (e) {
        return makeResult('', false, `Erro ao criar nota: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'updateNote',
    description: 'Update an existing note by ID.',
    category: 'notes',
    parameters: {
      id: { type: 'string', description: 'ID of the note to update' },
      title: { type: 'string', description: 'New title (optional)' },
      content: { type: 'string', description: 'New content (optional)' },
      status: { type: 'string', description: 'New status', enum: ['draft', 'review', 'done'] },
    },
    required: ['id'],
    execute: async (params) => {
      try {
        const updates: Record<string, unknown> = {}
        if (params.title) updates.title = params.title
        if (params.content) updates.content = params.content
        if (params.status) updates.status = params.status
        const note = await updateNote(params.id as string, updates)
        return makeResult('', true, `Nota "${note.title}" atualizada.`, note)
      } catch (e) {
        return makeResult('', false, `Erro ao atualizar nota: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'deleteNote',
    description: 'Delete a note by ID.',
    category: 'notes',
    parameters: {
      id: { type: 'string', description: 'ID of the note to delete' },
    },
    required: ['id'],
    execute: async (params) => {
      try {
        await deleteNote(params.id as string)
        return makeResult('', true, 'Nota excluída com sucesso.')
      } catch (e) {
        return makeResult('', false, `Erro ao excluir nota: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listNotes',
    description: 'List all study notes. Optionally filter by topic or discipline.',
    category: 'notes',
    parameters: {
      topic_id: { type: 'string', description: 'Filter by topic ID (optional)' },
      discipline_id: { type: 'string', description: 'Filter by discipline ID (optional)' },
    },
    required: [],
    execute: async (params) => {
      try {
        const notes = params.topic_id
          ? await getNotesByTopic(params.topic_id as string)
          : params.discipline_id
            ? await getNotesByDiscipline(params.discipline_id as string)
            : await getNotes()
        return makeResult('', true, `Encontradas ${notes.length} notas.`, notes.map(n => ({ id: n.id, title: n.title, format: n.format, status: n.status, topic_id: n.topic_id })))
      } catch (e) {
        return makeResult('', false, `Erro ao listar notas: ${(e as Error).message}`)
      }
    },
  },

  // ── FLASHCARDS ────────────────────────────────────────────
  {
    name: 'createFlashcards',
    description: 'Create one or more flashcards for a topic. Provide an array of cards with front and back.',
    category: 'flashcards',
    parameters: {
      topic_id: { type: 'string', description: 'Topic ID' },
      discipline_id: { type: 'string', description: 'Discipline ID' },
      cards: { type: 'array', description: 'Array of {front, back, type, difficulty} objects', items: { type: 'object', properties: { front: { type: 'string', description: 'Front of the card' }, back: { type: 'string', description: 'Back of the card' }, type: { type: 'string', description: 'Card type' }, difficulty: { type: 'number', description: 'Difficulty 1-5' } }, required: ['front', 'back'] } },
    },
    required: ['topic_id', 'discipline_id', 'cards'],
    execute: async (params) => {
      try {
        const cards = params.cards as Array<{ front: string; back: string; type?: string; difficulty?: number }>
        const results = []
        for (const card of cards) {
          const fc = await createFlashcard({
            topic_id: params.topic_id as string,
            discipline_id: params.discipline_id as string,
            front: card.front,
            back: card.back,
            type: (card.type as 'definition' | 'theorem' | 'procedure' | 'example') || 'definition',
            difficulty: card.difficulty ?? 3,
            ai_generated: true,
          })
          results.push(fc)
        }
        return makeResult('', true, `${results.length} flashcard(s) criado(s) com sucesso.`, results.map(f => ({ id: f.id, front: f.front })))
      } catch (e) {
        return makeResult('', false, `Erro ao criar flashcards: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'deleteFlashcard',
    description: 'Delete a flashcard by ID.',
    category: 'flashcards',
    parameters: {
      id: { type: 'string', description: 'ID of the flashcard to delete' },
    },
    required: ['id'],
    execute: async (params) => {
      try {
        await deleteFlashcard(params.id as string)
        return makeResult('', true, 'Flashcard excluído.')
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listFlashcards',
    description: 'List flashcards, optionally filtered by topic.',
    category: 'flashcards',
    parameters: {
      topic_id: { type: 'string', description: 'Filter by topic ID (optional)' },
    },
    required: [],
    execute: async (params) => {
      try {
        const fcs = params.topic_id
          ? await getFlashcardsByTopic(params.topic_id as string)
          : await getFlashcards()
        return makeResult('', true, `${fcs.length} flashcards encontrados.`, fcs.map(f => ({ id: f.id, front: f.front, back: f.back, sr_box: f.sr_box, next_review: f.next_review })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listDueFlashcards',
    description: 'List flashcards that are due for review today.',
    category: 'flashcards',
    parameters: {},
    required: [],
    execute: async () => {
      try {
        const fcs = await getDueFlashcards()
        return makeResult('', true, `${fcs.length} flashcards para revisar hoje.`, fcs.map(f => ({ id: f.id, front: f.front, back: f.back, sr_box: f.sr_box })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'reviewFlashcard',
    description: 'Mark a flashcard as reviewed (correct or incorrect). Updates spaced repetition.',
    category: 'flashcards',
    parameters: {
      id: { type: 'string', description: 'Flashcard ID' },
      correct: { type: 'boolean', description: 'Whether the answer was correct' },
    },
    required: ['id', 'correct'],
    execute: async (params) => {
      try {
        const fc = await reviewFlashcard(params.id as string, params.correct as boolean)
        return makeResult('', true, `Flashcard revisado. Box: ${fc.sr_box}, próxima revisão: ${fc.next_review}`, fc)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── STUDY SESSIONS ────────────────────────────────────────
  {
    name: 'createStudySession',
    description: 'Create a new study session with duration, kind, and optional notes.',
    category: 'sessions',
    parameters: {
      topic_id: { type: 'string', description: 'Topic studied (optional)' },
      discipline_id: { type: 'string', description: 'Discipline (optional)' },
      kind: { type: 'string', description: 'Session type', enum: ['study', 'exercise', 'review', 'simulation', 'flashcard'] },
      duration_min: { type: 'number', description: 'Duration in minutes' },
      notes: { type: 'string', description: 'Session notes (optional)' },
    },
    required: ['kind', 'duration_min'],
    execute: async (params) => {
      try {
        const session = await createStudySession({
          topic_id: params.topic_id as string | undefined,
          discipline_id: params.discipline_id as string | undefined,
          kind: params.kind as SessionKind,
          duration_min: params.duration_min as number,
          notes: params.notes as string | undefined,
        })
        return makeResult('', true, `Sessão de ${params.duration_min}min registrada.`, session)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listStudySessions',
    description: 'List recent study sessions.',
    category: 'sessions',
    parameters: {
      limit: { type: 'number', description: 'Max number of sessions to return (default 20)' },
    },
    required: [],
    execute: async (params) => {
      try {
        const sessions = await getStudySessions(params.limit as number ?? 20)
        return makeResult('', true, `${sessions.length} sessões encontradas.`, sessions.map(s => ({ id: s.id, kind: s.kind, duration_min: s.duration_min, created_at: s.created_at, notes: s.notes })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── EXERCISES ─────────────────────────────────────────────
  {
    name: 'createExercise',
    description: 'Create a new exercise for a topic.',
    category: 'exercises',
    parameters: {
      topic_id: { type: 'string', description: 'Topic ID' },
      discipline_id: { type: 'string', description: 'Discipline ID' },
      statement: { type: 'string', description: 'Exercise statement/question' },
      type: { type: 'string', description: 'Type', enum: ['multiple_choice', 'open_ended', 'proof', 'computation'] },
      difficulty: { type: 'number', description: 'Difficulty 1-5' },
      solution: { type: 'string', description: 'Full solution' },
      hints: { type: 'array', description: 'Progressive hints', items: { type: 'string' } },
      concepts_tested: { type: 'array', description: 'Concepts tested', items: { type: 'string' } },
    },
    required: ['topic_id', 'discipline_id', 'statement', 'type', 'difficulty', 'solution'],
    execute: async (params) => {
      try {
        const ex = await createExercise({
          topic_id: params.topic_id as string,
          discipline_id: params.discipline_id as string,
          statement: params.statement as string,
          type: params.type as ExerciseType,
          difficulty: params.difficulty as number,
          solution: params.solution as string,
          hints: (params.hints as string[]) || [],
          concepts_tested: (params.concepts_tested as string[]) || [],
          ai_generated: true,
        })
        return makeResult('', true, `Exercício criado com sucesso.`, ex)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listExercises',
    description: 'List exercises, optionally by topic.',
    category: 'exercises',
    parameters: {
      topic_id: { type: 'string', description: 'Filter by topic (optional)' },
    },
    required: [],
    execute: async (params) => {
      try {
        const exs = params.topic_id
          ? await getExercisesByTopic(params.topic_id as string)
          : await getExercises()
        return makeResult('', true, `${exs.length} exercícios encontrados.`, exs.map(e => ({ id: e.id, statement: e.statement.slice(0, 100), type: e.type, difficulty: e.difficulty })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'submitAttempt',
    description: 'Submit an answer to an exercise and record the attempt.',
    category: 'exercises',
    parameters: {
      exercise_id: { type: 'string', description: 'Exercise ID' },
      topic_id: { type: 'string', description: 'Topic ID' },
      student_answer: { type: 'string', description: 'Student answer' },
      is_correct: { type: 'boolean', description: 'Whether answer is correct' },
      time_spent_sec: { type: 'number', description: 'Time spent in seconds' },
    },
    required: ['exercise_id', 'topic_id', 'student_answer', 'is_correct'],
    execute: async (params) => {
      try {
        const attempt = await createAttempt({
          exercise_id: params.exercise_id as string,
          topic_id: params.topic_id as string,
          student_answer: params.student_answer as string,
          is_correct: params.is_correct as boolean,
          time_spent_sec: params.time_spent_sec as number | undefined,
        })
        return makeResult('', true, params.is_correct ? 'Resposta correta registrada!' : 'Resposta incorreta registrada.', attempt)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── ERROR CLASSIFICATION ──────────────────────────────────
  {
    name: 'classifyError',
    description: 'Classify and record a student error occurrence.',
    category: 'errors',
    parameters: {
      topic_id: { type: 'string', description: 'Topic ID' },
      discipline_id: { type: 'string', description: 'Discipline ID' },
      category: { type: 'string', description: 'Error category', enum: ['conceptual', 'algebraic', 'logical', 'interpretation', 'formalization'] },
      severity: { type: 'string', description: 'Severity', enum: ['critical', 'high', 'medium', 'low'] },
      exercise_statement: { type: 'string', description: 'The exercise that was attempted' },
      student_answer: { type: 'string', description: 'What the student answered' },
      correct_answer: { type: 'string', description: 'The correct answer' },
      ai_explanation: { type: 'string', description: 'AI explanation of the error' },
      root_cause: { type: 'string', description: 'Root cause analysis' },
      remediation: { type: 'string', description: 'Suggested remediation' },
    },
    required: ['topic_id', 'discipline_id', 'category', 'severity', 'exercise_statement', 'student_answer', 'correct_answer'],
    execute: async (params) => {
      try {
        const err = await createErrorOccurrence({
          topic_id: params.topic_id as string,
          discipline_id: params.discipline_id as string,
          category: params.category as ErrorCategory,
          severity: params.severity as ErrorSeverity,
          exercise_statement: params.exercise_statement as string,
          student_answer: params.student_answer as string,
          correct_answer: params.correct_answer as string,
          ai_explanation: params.ai_explanation as string | undefined,
          root_cause: params.root_cause as string | undefined,
          remediation: params.remediation as string | undefined,
        })
        return makeResult('', true, `Erro classificado como ${params.category} (${params.severity}).`, err)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── PROGRESS ──────────────────────────────────────────────
  {
    name: 'updateMastery',
    description: 'Update mastery level and score for a topic.',
    category: 'progress',
    parameters: {
      topic_id: { type: 'string', description: 'Topic ID' },
      mastery: { type: 'string', description: 'Mastery level', enum: ['none', 'exposed', 'developing', 'proficient', 'mastered'] },
      score: { type: 'number', description: 'Score 0-1' },
    },
    required: ['topic_id', 'mastery'],
    execute: async (params) => {
      try {
        await updateTopicMastery(
          params.topic_id as string,
          params.mastery as MasteryLevel,
          (params.score as number) ?? 0,
        )
        return makeResult('', true, `Mastery atualizado para ${params.mastery}.`)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── DATA QUERIES ──────────────────────────────────────────
  {
    name: 'listDisciplines',
    description: 'List all disciplines/courses.',
    category: 'progress',
    parameters: {},
    required: [],
    execute: async () => {
      try {
        const discs = await getDisciplines()
        return makeResult('', true, `${discs.length} disciplinas.`, discs.map(d => ({ id: d.id, name: d.name, code: d.code })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listTopics',
    description: 'List all topics, optionally filtered by discipline.',
    category: 'progress',
    parameters: {
      discipline_id: { type: 'string', description: 'Filter by discipline (optional)' },
    },
    required: [],
    execute: async (params) => {
      try {
        const topics = await getAllTopics()
        const filtered = params.discipline_id
          ? topics.filter(t => t.discipline_id === params.discipline_id)
          : topics
        return makeResult('', true, `${filtered.length} tópicos.`, filtered.map(t => ({ id: t.id, name: t.name, mastery: t.mastery, score: t.score, discipline_id: t.discipline_id })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listAssessments',
    description: 'List all assessments/exams.',
    category: 'exams',
    parameters: {},
    required: [],
    execute: async () => {
      try {
        const assessments = await getAssessments()
        return makeResult('', true, `${assessments.length} avaliações.`, assessments.map(a => ({ id: a.id, name: a.name, date: a.date, type: a.type, status: a.status, score: a.score })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── SVG GENERATION ────────────────────────────────────────
  {
    name: 'generateDiagram',
    description: 'Generate an SVG diagram, concept map, or mathematical graph. Returns SVG markup.',
    category: 'visual',
    parameters: {
      type: { type: 'string', description: 'Type of diagram', enum: ['concept_map', 'flowchart', 'graph', 'timeline', 'comparison'] },
      title: { type: 'string', description: 'Title of the diagram' },
      elements: { type: 'array', description: 'Array of {label, connections[]} for concept maps, or {x, y, label} for graphs', items: { type: 'object', properties: { label: { type: 'string', description: 'Element label' }, connections: { type: 'array', description: 'Connected elements', items: { type: 'string' } }, x: { type: 'number', description: 'X coordinate' }, y: { type: 'number', description: 'Y coordinate' } }, required: ['label'] } },
      description: { type: 'string', description: 'Description for the AI to generate from' },
    },
    required: ['type', 'title'],
    execute: async (params) => {
      // This returns a structured description — the AI will generate actual SVG in its response
      return makeResult('', true, `Diagrama "${params.title}" preparado. O SVG será gerado na resposta.`, {
        type: params.type,
        title: params.title,
        elements: params.elements,
        description: params.description,
        instruction: 'Generate SVG markup inline in your response for this diagram.',
      })
    },
  },

  // ── READ NOTE ──────────────────────────────────────────────
  {
    name: 'readNote',
    description: 'Read the full content of an existing note by ID. Use this to discuss, improve, or analyze a note.',
    category: 'notes',
    parameters: {
      id: { type: 'string', description: 'ID of the note to read' },
    },
    required: ['id'],
    execute: async (params) => {
      try {
        const note = await getNote(params.id as string)
        if (!note) return makeResult('', false, `Nota com ID "${params.id}" não encontrada.`)
        return makeResult('', true, `Nota "${note.title}" carregada.`, {
          id: note.id,
          title: note.title,
          content: note.content,
          format: note.format,
          status: note.status,
          key_concepts: note.key_concepts,
          tags: note.tags,
          topic_id: note.topic_id,
          discipline_id: note.discipline_id,
        })
      } catch (e) {
        return makeResult('', false, `Erro ao ler nota: ${(e as Error).message}`)
      }
    },
  },

  // ── AI-POWERED SERVICES ────────────────────────────────────

  {
    name: 'explainTopicAI',
    description: 'Generate an adaptive explanation of a topic, adjusted to the student mastery level. Includes analogies and prerequisite references.',
    category: 'ai-services',
    parameters: {
      topic_name: { type: 'string', description: 'Name of the topic to explain' },
      course_name: { type: 'string', description: 'Name of the course/discipline' },
      mastery_level: { type: 'string', description: 'Student mastery level', enum: ['none', 'exposed', 'developing', 'proficient', 'mastered'] },
      focus: { type: 'string', description: 'Specific focus (e.g., "definição formal", "intuição geométrica")' },
      prerequisites: { type: 'array', description: 'Already mastered prerequisite topics', items: { type: 'string' } },
    },
    required: ['topic_name', 'course_name'],
    execute: async (params, context) => {
      try {
        // Auto-detect mastery from context if not provided
        let mastery = params.mastery_level as string
        if (!mastery && context) {
          const match = context.topicMasteries.find(t =>
            t.name.toLowerCase().includes((params.topic_name as string).toLowerCase())
          )
          mastery = match?.mastery ?? 'exposed'
        }

        const result = await explainTopic({
          topicName: params.topic_name as string,
          courseName: params.course_name as string,
          masteryLevel: (mastery || 'exposed') as 'none' | 'exposed' | 'developing' | 'proficient' | 'mastered',
          focus: params.focus as string | undefined,
          prerequisites: params.prerequisites as string[] | undefined,
        })
        return makeResult('', true, result.data.explanation, {
          analogies: result.data.analogies,
          prerequisitesMentioned: result.data.prerequisitesMentioned,
          nextTopics: result.data.nextTopics,
        })
      } catch (e) {
        return makeResult('', false, `Erro ao explicar tópico: ${(e as Error).message}`)
      }
    },
  },

  {
    name: 'tutorAI',
    description: 'Socratic tutoring mode — guides the student with hints and questions instead of giving direct answers. Detects misconceptions.',
    category: 'tutoring',
    parameters: {
      topic_name: { type: 'string', description: 'Topic being studied' },
      course_name: { type: 'string', description: 'Course name' },
      message: { type: 'string', description: 'Student question or response' },
      mastery_level: { type: 'string', description: 'Student mastery level', enum: ['none', 'exposed', 'developing', 'proficient', 'mastered'] },
      current_exercise: { type: 'string', description: 'Exercise being worked on (if any)' },
      history: { type: 'array', description: 'Conversation history [{role, content}]', items: { type: 'object', properties: { role: { type: 'string' }, content: { type: 'string' } }, required: ['role', 'content'] } },
    },
    required: ['topic_name', 'course_name', 'message'],
    execute: async (params, context) => {
      try {
        let mastery = params.mastery_level as string
        if (!mastery && context) {
          const match = context.topicMasteries.find(t =>
            t.name.toLowerCase().includes((params.topic_name as string).toLowerCase())
          )
          mastery = match?.mastery ?? 'developing'
        }

        const result = await tutor({
          topicName: params.topic_name as string,
          courseName: params.course_name as string,
          masteryLevel: (mastery || 'developing') as 'none' | 'exposed' | 'developing' | 'proficient' | 'mastered',
          message: params.message as string,
          currentExercise: params.current_exercise as string | undefined,
          history: (params.history as Array<{ role: 'user' | 'assistant'; content: string }>) ?? [],
        })

        let response = result.data.reply
        if (result.data.hint) response += `\n\n💡 **Dica:** ${result.data.hint}`
        if (result.data.detectedMisconception) response += `\n\n⚠️ **Misconception detectada:** ${result.data.detectedMisconception}`

        return makeResult('', true, response, {
          hint: result.data.hint,
          detectedMisconception: result.data.detectedMisconception,
          suggestedExercise: result.data.suggestedExercise,
        })
      } catch (e) {
        return makeResult('', false, `Erro no modo tutor: ${(e as Error).message}`)
      }
    },
  },

  {
    name: 'generateSmartFlashcards',
    description: 'Generate flashcards adapted to the student mastery level. Automatically creates them in the system.',
    category: 'ai-services',
    parameters: {
      topic_name: { type: 'string', description: 'Topic name' },
      course_name: { type: 'string', description: 'Course name' },
      topic_id: { type: 'string', description: 'Topic ID to save flashcards to' },
      discipline_id: { type: 'string', description: 'Discipline ID' },
      count: { type: 'number', description: 'Number of flashcards to generate (default 5)' },
      source_content: { type: 'string', description: 'Source content to base cards on (optional)' },
      card_types: { type: 'array', description: 'Types of cards', items: { type: 'string' } },
    },
    required: ['topic_name', 'course_name'],
    execute: async (params, context) => {
      try {
        let mastery: string = 'developing'
        if (context) {
          const match = context.topicMasteries.find(t =>
            t.name.toLowerCase().includes((params.topic_name as string).toLowerCase())
          )
          if (match) mastery = match.mastery
        }

        const result = await aiGenerateFlashcards({
          topicName: params.topic_name as string,
          courseName: params.course_name as string,
          masteryLevel: mastery as 'none' | 'exposed' | 'developing' | 'proficient' | 'mastered',
          count: (params.count as number) ?? 5,
          sourceContent: params.source_content as string | undefined,
          cardTypes: params.card_types as ('definition' | 'theorem' | 'procedure' | 'example')[] | undefined,
        })

        // Auto-save to system if topic_id is available
        const topicId = (params.topic_id as string) || context?.currentTopicId
        const disciplineId = (params.discipline_id as string) || context?.currentDisciplineId

        if (topicId && disciplineId) {
          const saved = []
          for (const card of result.data.cards) {
            const fc = await createFlashcard({
              topic_id: topicId,
              discipline_id: disciplineId,
              front: card.front,
              back: card.back,
              type: card.type,
              difficulty: card.difficulty,
              ai_generated: true,
            })
            saved.push(fc)
          }
          return makeResult('', true, `${saved.length} flashcards inteligentes gerados e salvos com sucesso.`, {
            cards: result.data.cards,
            savedIds: saved.map(f => f.id),
          })
        }

        return makeResult('', true, `${result.data.cards.length} flashcards gerados (não salvos — falta topic_id).`, result.data)
      } catch (e) {
        return makeResult('', false, `Erro ao gerar flashcards: ${(e as Error).message}`)
      }
    },
  },

  {
    name: 'generateSmartExercises',
    description: 'Generate exercises targeting the student weak points and error patterns. Automatically adapts difficulty.',
    category: 'ai-services',
    parameters: {
      topic_name: { type: 'string', description: 'Topic name' },
      course_name: { type: 'string', description: 'Course name' },
      topic_id: { type: 'string', description: 'Topic ID to save exercises to' },
      discipline_id: { type: 'string', description: 'Discipline ID' },
      count: { type: 'number', description: 'Number of exercises (default 3)' },
      difficulty: { type: 'number', description: 'Target difficulty 1-5 (auto-detected if omitted)' },
      types: { type: 'array', description: 'Exercise types wanted', items: { type: 'string' } },
    },
    required: ['topic_name', 'course_name'],
    execute: async (params, context) => {
      try {
        let mastery: string = 'developing'
        let targetErrors: string[] = []

        if (context) {
          const match = context.topicMasteries.find(t =>
            t.name.toLowerCase().includes((params.topic_name as string).toLowerCase())
          )
          if (match) mastery = match.mastery
          targetErrors = context.errorBreakdown.map(e => e.category)
        }

        // Auto difficulty based on mastery
        const difficultyMap: Record<string, number> = { none: 1, exposed: 2, developing: 3, proficient: 4, mastered: 5 }
        const difficulty = (params.difficulty as number) ?? difficultyMap[mastery] ?? 3

        const result = await aiGenerateExercises({
          topicName: params.topic_name as string,
          courseName: params.course_name as string,
          masteryLevel: mastery as 'none' | 'exposed' | 'developing' | 'proficient' | 'mastered',
          count: (params.count as number) ?? 3,
          difficulty,
          types: params.types as ('multiple-choice' | 'open-ended' | 'proof' | 'computation')[] | undefined,
          targetErrors: targetErrors.length > 0 ? targetErrors as ('conceptual' | 'procedural' | 'algebraic' | 'prerequisite' | 'reading')[] : undefined,
        })

        // Auto-save exercises
        const topicId = (params.topic_id as string) || context?.currentTopicId
        const disciplineId = (params.discipline_id as string) || context?.currentDisciplineId

        if (topicId && disciplineId) {
          const typeMap: Record<string, ExerciseType> = {
            'multiple-choice': 'multiple_choice',
            'open-ended': 'open_ended',
            'proof': 'proof',
            'computation': 'computation',
          }
          const saved = []
          for (const ex of result.data.exercises) {
            const created = await createExercise({
              topic_id: topicId,
              discipline_id: disciplineId,
              statement: ex.statement,
              type: typeMap[ex.type] ?? 'open_ended',
              difficulty: ex.difficulty,
              solution: ex.solution,
              hints: ex.hints,
              concepts_tested: ex.conceptsTested,
              ai_generated: true,
            })
            saved.push(created)
          }
          return makeResult('', true, `${saved.length} exercícios direcionados gerados e salvos.`, {
            exercises: result.data.exercises.map(e => ({ statement: e.statement.slice(0, 200), difficulty: e.difficulty, type: e.type })),
          })
        }

        return makeResult('', true, `${result.data.exercises.length} exercícios gerados (não salvos — falta topic_id).`, {
          exercises: result.data.exercises.map(e => ({ statement: e.statement, difficulty: e.difficulty, type: e.type })),
        })
      } catch (e) {
        return makeResult('', false, `Erro ao gerar exercícios: ${(e as Error).message}`)
      }
    },
  },

  {
    name: 'generateExamPlanAI',
    description: 'Generate a complete study plan for an upcoming exam, considering mastery levels, error patterns, and available time.',
    category: 'ai-services',
    parameters: {
      exam_name: { type: 'string', description: 'Name of the exam' },
      course_name: { type: 'string', description: 'Course name' },
      exam_date: { type: 'string', description: 'Exam date (YYYY-MM-DD)' },
      hours_per_day: { type: 'number', description: 'Hours available per day for study' },
      topic_ids: { type: 'array', description: 'IDs of topics covered in the exam', items: { type: 'string' } },
    },
    required: ['exam_name', 'course_name', 'exam_date', 'hours_per_day'],
    execute: async (params, context) => {
      try {
        // Build topics with mastery from context
        const topicIds = params.topic_ids as string[] | undefined
        let topics: { name: string; mastery: string; score: number }[] = []

        if (context) {
          if (topicIds && topicIds.length > 0) {
            topics = context.topicMasteries
              .filter(t => topicIds.includes(t.id))
              .map(t => ({ name: t.name, mastery: t.mastery, score: t.score }))
          } else if (context.currentDisciplineId) {
            topics = context.topicMasteries
              .filter(t => t.disciplineId === context.currentDisciplineId)
              .map(t => ({ name: t.name, mastery: t.mastery, score: t.score }))
          }
        }

        if (topics.length === 0) {
          // Fallback: fetch all topics for the discipline
          const allTopics = await getAllTopics()
          topics = allTopics.slice(0, 20).map(t => ({ name: t.name, mastery: t.mastery, score: t.score ?? 0 }))
        }

        const errorPatterns = context?.errorBreakdown.map(e => ({
          class: e.category as 'conceptual' | 'procedural' | 'algebraic' | 'prerequisite' | 'reading',
          count: e.count,
        }))

        const result = await generateExamPlan({
          examName: params.exam_name as string,
          courseName: params.course_name as string,
          examDate: params.exam_date as string,
          topics: topics.map(t => ({
            name: t.name,
            mastery: t.mastery as 'none' | 'exposed' | 'developing' | 'proficient' | 'mastered',
            score: t.score,
          })),
          hoursPerDay: params.hours_per_day as number,
          errorPatterns,
        })

        const plan = result.data
        let summary = `## Plano de Estudo: ${params.exam_name}\n\n`
        summary += `**Estratégia:** ${plan.strategy}\n\n`
        summary += `**Duração:** ${plan.totalDays} dias\n\n`
        if (plan.riskTopics.length > 0) {
          summary += `**⚠️ Tópicos de risco:** ${plan.riskTopics.join(', ')}\n\n`
        }
        summary += `### Cronograma\n\n`
        for (const block of plan.blocks) {
          summary += `- **Dia ${block.day}** (${block.date}): ${block.topic} — ${block.activity} (${block.durationMin}min, prioridade: ${block.priority})\n`
        }

        return makeResult('', true, summary, plan)
      } catch (e) {
        return makeResult('', false, `Erro ao gerar plano: ${(e as Error).message}`)
      }
    },
  },

  {
    name: 'summarizeDocumentAI',
    description: 'Summarize a document or text, extracting key topics, definitions, and results.',
    category: 'ai-services',
    parameters: {
      content: { type: 'string', description: 'Full text of the document to summarize' },
      course_name: { type: 'string', description: 'Course name for context' },
      depth: { type: 'string', description: 'Summary depth', enum: ['brief', 'standard', 'detailed'] },
      focus_topics: { type: 'array', description: 'Specific topics to focus on', items: { type: 'string' } },
    },
    required: ['content', 'course_name'],
    execute: async (params) => {
      try {
        const result = await summarizeDocument({
          content: params.content as string,
          courseName: params.course_name as string,
          depth: (params.depth as 'brief' | 'standard' | 'detailed') ?? 'standard',
          focusTopics: params.focus_topics as string[] | undefined,
        })

        const data = result.data
        let summary = `## Resumo\n\n${data.summary}\n\n`
        if (data.definitions.length > 0) {
          summary += `### Definições\n`
          for (const def of data.definitions) {
            summary += `- **${def.term}:** ${def.definition}\n`
          }
          summary += '\n'
        }
        if (data.keyResults.length > 0) {
          summary += `### Resultados-chave\n`
          for (const r of data.keyResults) {
            summary += `- ${r}\n`
          }
        }

        return makeResult('', true, summary, data)
      } catch (e) {
        return makeResult('', false, `Erro ao resumir: ${(e as Error).message}`)
      }
    },
  },

  {
    name: 'generateMermaidGraph',
    description: 'Generate a Mermaid diagram (flowchart, mindmap, sequence, etc.) from note content or a description.',
    category: 'visual',
    parameters: {
      request: { type: 'string', description: 'What to visualize (e.g., "relações entre tipos de limites")' },
      note_content: { type: 'string', description: 'Note content to base the graph on (optional — uses current note if omitted)' },
      graph_type: { type: 'string', description: 'Type of diagram', enum: ['auto', 'flowchart', 'mindmap', 'sequence', 'journey', 'quadrant', 'xychart'] },
      course_name: { type: 'string', description: 'Course name' },
      topic_name: { type: 'string', description: 'Topic name' },
    },
    required: ['request'],
    execute: async (params, context) => {
      try {
        const noteContent = (params.note_content as string) || context?.currentNoteContent || ''
        const result = await generateNoteGraph({
          graphType: (params.graph_type as 'auto' | 'flowchart' | 'mindmap' | 'sequence' | 'journey' | 'quadrant' | 'xychart') ?? 'auto',
          request: params.request as string,
          noteContent,
          courseName: (params.course_name as string) || context?.currentDisciplineName,
          topicName: (params.topic_name as string) || context?.currentTopicName,
        })

        return makeResult('', true, `Grafo "${result.data.title}" gerado.\n\n${result.data.explanation}\n\n\`\`\`mermaid\n${result.data.mermaid}\n\`\`\``, {
          title: result.data.title,
          mermaid: result.data.mermaid,
        })
      } catch (e) {
        return makeResult('', false, `Erro ao gerar grafo: ${(e as Error).message}`)
      }
    },
  },

  {
    name: 'generateInteractiveBlock',
    description: 'Generate an interactive HTML/CSS/JS experience to help visualize or practice a concept.',
    category: 'visual',
    parameters: {
      request: { type: 'string', description: 'What interactive experience to create (e.g., "simulador de limites com slider")' },
      note_content: { type: 'string', description: 'Note content for context (optional)' },
      course_name: { type: 'string', description: 'Course name' },
      topic_name: { type: 'string', description: 'Topic name' },
      frame_hint: { type: 'string', description: 'Display frame', enum: ['auto', 'phone', 'canvas'] },
    },
    required: ['request'],
    execute: async (params, context) => {
      try {
        const noteContent = (params.note_content as string) || context?.currentNoteContent || ''
        const result = await generateNoteInteractive({
          request: params.request as string,
          noteContent,
          courseName: (params.course_name as string) || context?.currentDisciplineName,
          topicName: (params.topic_name as string) || context?.currentTopicName,
          frameHint: (params.frame_hint as 'auto' | 'phone' | 'canvas') ?? 'auto',
        })

        return makeResult('', true, `Bloco interativo "${result.data.title}" gerado.\n\n${result.data.explanation}`, {
          title: result.data.title,
          html: result.data.html,
          frame: result.data.frame,
          height: result.data.height,
        })
      } catch (e) {
        return makeResult('', false, `Erro ao gerar interativo: ${(e as Error).message}`)
      }
    },
  },
]

// ── Registry ────────────────────────────────────────────────

const toolMap = new Map<string, ToolDefinition>()
for (const tool of tools) {
  toolMap.set(tool.name, tool)
}

export function getTool(name: string): ToolDefinition | undefined {
  return toolMap.get(name)
}

export function getAllTools(): ToolDefinition[] {
  return tools
}

export function getToolsByCategory(category: string): ToolDefinition[] {
  return tools.filter(t => t.category === category)
}

/** Convert tool definitions to provider format */
export function toProviderTools(): ProviderTool[] {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: 'object' as const,
      properties: Object.fromEntries(
        Object.entries(t.parameters).map(([key, param]) => [
          key,
          {
            type: param.type,
            description: param.description,
            ...(param.enum ? { enum: param.enum } : {}),
            ...(param.items ? { items: param.items } : {}),
          },
        ])
      ),
      required: t.required,
    },
  }))
}

/** Execute a tool call */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  toolCallId: string,
  context?: JarvisContext,
): Promise<ToolResult> {
  const tool = toolMap.get(name)
  if (!tool) {
    return { toolCallId, success: false, message: `Tool "${name}" não encontrada.`, error: 'unknown_tool' }
  }
  const result = await tool.execute(args, context)
  result.toolCallId = toolCallId
  return result
}
