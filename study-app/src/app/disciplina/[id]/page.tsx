'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getCurriculumDocuments } from '@/lib/materials/catalog'
import {
  getDiscipline,
  getModulesByDiscipline,
  getTopicsByModule,
} from '@/lib/services/disciplines'
import {
  getAssessmentsByDiscipline,
  updateAssessmentScore,
} from '@/lib/services/assessments'
import { getStudySessionsByDiscipline, getTotalStudyMinutes } from '@/lib/services/study-sessions'
import { getNotesByDiscipline } from '@/lib/services/notes'
import { getFlashcardsByDiscipline } from '@/lib/services/flashcards'
import type { Discipline, Module, Topic, Assessment, StudySession, Note, Flashcard } from '@/lib/supabase'
import { MasteryDot } from '@/components/ui/mastery-dot'
import { ScoreDisplay } from '@/components/ui/score-display'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Badge } from '@/components/ui/badge'
import {
  formatScore,
} from '@/lib/utils'
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Zap,
  FileText,
  Layers as FlashcardIcon,
  Play,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'

interface ModuleWithTopics extends Module {
  topics: Topic[]
}

export default function DisciplinePage() {
  const params = useParams()
  const id = params.id as string

  const [discipline, setDiscipline] = useState<Discipline | null>(null)
  const [modules, setModules] = useState<ModuleWithTopics[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({})
  const [editingAssessment, setEditingAssessment] = useState<string | null>(null)

  const firstMaterial = getCurriculumDocuments(id)[0] ?? null

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all data in parallel
        const [disc, mods, assms, sess, nts, fcs] = await Promise.all([
          getDiscipline(id),
          getModulesByDiscipline(id),
          getAssessmentsByDiscipline(id),
          getStudySessionsByDiscipline(id, 50),
          getNotesByDiscipline(id),
          getFlashcardsByDiscipline(id),
        ])

        if (!disc) {
          setError('Disciplina não encontrada')
          return
        }

        setDiscipline(disc)
        setAssessments(assms)
        setSessions(sess)
        setNotes(nts)
        setFlashcards(fcs)

        // Fetch topics for each module
        const modsWithTopics = await Promise.all(
          mods.map(async (mod) => ({
            ...mod,
            topics: await getTopicsByModule(mod.id),
          }))
        )

        setModules(modsWithTopics)

        // Pre-populate score inputs with current scores
        const inputs: Record<string, string> = {}
        assms.forEach((a) => {
          inputs[a.id] = a.score?.toString() ?? ''
        })
        setScoreInputs(inputs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const handleScoreChange = (assessmentId: string, value: string) => {
    setScoreInputs((prev) => ({
      ...prev,
      [assessmentId]: value,
    }))
  }

  const handleScoreSave = async (assessmentId: string) => {
    const scoreStr = scoreInputs[assessmentId]
    if (!scoreStr) return

    const score = parseFloat(scoreStr)
    if (isNaN(score)) {
      alert('Pontuação inválida')
      return
    }

    try {
      await updateAssessmentScore(assessmentId, score)
      setAssessments((prev) =>
        prev.map((a) =>
          a.id === assessmentId ? { ...a, score, status: 'completed' } : a
        )
      )
      setEditingAssessment(null)
    } catch (err) {
      alert('Erro ao salvar pontuação: ' + (err instanceof Error ? err.message : ''))
    }
  }

  // Calculate stats
  const totalStudyMinutes = getTotalStudyMinutes(sessions)
  const allTopics = modules.flatMap((m) => m.topics)
  const topicsMastered = allTopics.filter((t) => t.mastery === 'mastered').length
  const totalTopics = allTopics.length
  const exercisesAttempted = allTopics.reduce((sum, t) => sum + t.exercises_attempted, 0)
  const exercisesAvailable = allTopics.reduce((sum, t) => sum + t.exercises_available, 0)

  // Calculate G1 from assessments with weight
  const calculateG1 = () => {
    const g1Assessments = assessments.filter((a) =>
      ['P1', 'P2', 'P3', 'MT'].some((name) => a.name.includes(name))
    )
    const completed = g1Assessments.filter((a) => a.score !== null)
    if (completed.length === 0) return null

    const sum = completed.reduce((s, a) => s + (a.score ?? 0), 0)
    return sum / completed.length
  }

  const g1 = calculateG1()

  // Render states
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-md bg-bg-tertiary" />
        <div className="h-32 animate-pulse rounded-md bg-bg-tertiary" />
        <div className="h-96 animate-pulse rounded-md bg-bg-tertiary" />
      </div>
    )
  }

  if (error || !discipline) {
    return (
      <div className="rounded-md border border-accent-danger bg-bg-surface p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-accent-danger" size={20} />
          <div>
            <h3 className="font-semibold text-fg-primary">{error ?? 'Disciplina não encontrada'}</h3>
            <p className="text-sm text-fg-tertiary">Verifique o ID e tente novamente.</p>
          </div>
        </div>
        <Link href="/" className="mt-4 inline-flex items-center gap-1 text-sm text-accent-info hover:underline">
          <ArrowLeft size={14} />
          Voltar ao dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-fg-tertiary hover:text-fg-secondary transition-colors"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg-primary">
          {discipline.name}
        </h1>
        <p className="mt-1 text-sm text-fg-tertiary">
          {discipline.code} · Prof. {discipline.professor} · {discipline.schedule} · <span className='font-mono'>60h</span>
        </p>
      </div>

      {/* Grade Overview */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
          Avaliações
        </h3>
        <div className="flex items-end gap-4 flex-wrap">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="flex flex-col gap-0.5 relative"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                {assessment.name}
              </span>
              {editingAssessment === assessment.id ? (
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={scoreInputs[assessment.id] ?? ''}
                    onChange={(e) => handleScoreChange(assessment.id, e.target.value)}
                    className="w-12 rounded px-1 py-0.5 bg-bg-tertiary text-fg-primary text-sm font-mono border border-border-default"
                    autoFocus
                  />
                  <button
                    onClick={() => handleScoreSave(assessment.id)}
                    className="rounded px-1.5 py-0.5 bg-accent-info text-bg-primary text-xs font-medium hover:opacity-80"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingAssessment(assessment.id)}
                  className="font-mono text-sm text-fg-tertiary hover:text-accent-info transition-colors text-left"
                >
                  {assessment.score !== null ? formatScore(assessment.score) : '—'}
                </button>
              )}
            </div>
          ))}
          {g1 !== null && (
            <div className="flex flex-col gap-0.5 ml-4 pl-4 border-l border-border-default">
              <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">G1</span>
              <span className="font-mono text-sm font-semibold text-fg-primary">
                {formatScore(g1)}
              </span>
            </div>
          )}
        </div>

        {/* Approval threshold visual */}
        <div className="relative mt-4 h-1.5 w-full bg-bg-tertiary rounded-full">
          <div
            className="absolute top-0 h-full w-px bg-accent-warning"
            style={{ left: '60%' }}
          />
          <span
            className="absolute -bottom-4 font-mono text-[10px] text-accent-warning"
            style={{ left: '60%', transform: 'translateX(-50%)' }}
          >
            6.0
          </span>
        </div>

        {g1 !== null && (
          <p className="mt-6 text-xs text-fg-tertiary">
            Needed for approval: {Math.max(0, 6 - g1).toFixed(2)}
          </p>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules Section (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-md border border-border-default bg-bg-surface p-4">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Módulos
            </h3>

            {modules.length === 0 ? (
              <p className="text-sm text-fg-tertiary">Nenhum módulo cadastrado</p>
            ) : (
              <div className="space-y-4">
                {modules.map((module, idx) => (
                  <div key={module.id}>
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center justify-between hover:bg-bg-secondary rounded-md p-2 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-baseline gap-2 min-w-fit">
                          <span className="font-mono text-xs text-fg-muted">
                            {String(module.sort_order).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-semibold text-fg-primary">
                            {module.name}
                          </span>
                        </div>
                      </div>
                      {expandedModules.has(module.id) ? (
                        <ChevronUp size={16} className="text-fg-tertiary flex-shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-fg-tertiary flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded module content */}
                    {expandedModules.has(module.id) && (
                      <div className="mt-3 ml-4 space-y-3 border-l border-border-default pl-4">
                        {module.topics.length === 0 ? (
                          <p className="text-xs text-fg-tertiary">Nenhum tópico cadastrado</p>
                        ) : (
                          <>
                            <div className="grid grid-cols-[1fr_80px_60px_60px] gap-2 text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                              <span>Tópico</span>
                              <span>Mastery</span>
                              <span className="text-right">Score</span>
                              <span className="text-right">Exerc.</span>
                            </div>
                            <div className="space-y-1.5">
                              {module.topics.map((topic) => (
                                <div
                                  key={topic.id}
                                  className="grid grid-cols-[1fr_80px_60px_60px] gap-2 items-center rounded-md px-2 py-1.5 hover:bg-bg-tertiary transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <MasteryDot level={topic.mastery} size="sm" />
                                    <span className="text-sm text-fg-secondary truncate">
                                      {topic.name}
                                    </span>
                                  </div>
                                  <Badge variant="outline">{topic.mastery}</Badge>
                                  <ScoreDisplay
                                    score={topic.score}
                                    className="text-right text-xs"
                                  />
                                  <span className="text-right font-mono text-xs text-fg-tertiary">
                                    {topic.exercises_attempted}/{topic.exercises_available}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Module progress */}
                            <div className="mt-2 flex items-center gap-2">
                              <ProgressBar
                                value={
                                  module.topics.length === 0
                                    ? 0
                                    : Math.round(
                                        (module.topics.reduce((s, t) => s + t.score, 0) /
                                          module.topics.length) *
                                          100
                                      )
                                }
                                variant="normal"
                                className="flex-1"
                              />
                              <span className="font-mono text-xs text-fg-tertiary whitespace-nowrap">
                                {module.topics.length === 0
                                  ? '0%'
                                  : Math.round(
                                      (module.topics.reduce((s, t) => s + t.score, 0) /
                                        module.topics.length) *
                                        100
                                    ) + '%'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {idx < modules.length - 1 && (
                      <div className="mt-4 border-t border-border-subtle" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-4">
          {/* Study Stats */}
          <div className="rounded-md border border-border-default bg-bg-surface p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Estatísticas
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-fg-tertiary" />
                  <span className="text-sm text-fg-secondary">Tempo total</span>
                </div>
                <span className="font-mono text-sm font-semibold text-fg-primary">
                  {Math.floor(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-fg-tertiary" />
                  <span className="text-sm text-fg-secondary">Tópicos dominados</span>
                </div>
                <span className="font-mono text-sm font-semibold text-fg-primary">
                  {topicsMastered}/{totalTopics}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-fg-tertiary" />
                  <span className="text-sm text-fg-secondary">Exercícios</span>
                </div>
                <span className="font-mono text-sm font-semibold text-fg-primary">
                  {exercisesAttempted}/{exercisesAvailable}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-fg-tertiary" />
                  <span className="text-sm text-fg-secondary">Anotações</span>
                </div>
                <span className="font-mono text-sm font-semibold text-fg-primary">
                  {notes.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlashcardIcon size={14} className="text-fg-tertiary" />
                  <span className="text-sm text-fg-secondary">Flashcards</span>
                </div>
                <span className="font-mono text-sm font-semibold text-fg-primary">
                  {flashcards.length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-md border border-border-default bg-bg-surface p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Ações Rápidas
            </h3>
            <div className="space-y-2">
              <Link
                href={firstMaterial ? `/materiais/${firstMaterial.id}` : '/materiais'}
                className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 bg-accent-info text-bg-primary text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Play size={14} />
                Estudar pelos materiais
              </Link>
              <Link
                href={firstMaterial ? `/materiais/${firstMaterial.id}` : '/materiais'}
                className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 border border-border-default text-fg-secondary hover:bg-bg-secondary transition-colors text-sm font-medium"
              >
                <Plus size={14} />
                Gerar anotação com fonte
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Atividade Recente
          </h3>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-fg-primary capitalize">
                      {session.kind === 'exercise' && 'Exercícios'}
                      {session.kind === 'study' && 'Estudo'}
                      {session.kind === 'review' && 'Revisão'}
                      {session.kind === 'simulation' && 'Simulado'}
                      {session.kind === 'flashcard' && 'Flashcards'}
                    </p>
                    <p className="text-xs text-fg-tertiary">
                      {new Date(session.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-fg-tertiary font-mono">
                  {session.duration_min}min
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
