'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  BookOpen,
  Zap,
  Target,
  Plus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { cn, formatCountdown, countdownColor, masteryColor, masteryTextColor } from '@/lib/utils'
import { getUpcomingAssessments } from '@/lib/services/assessments'
import { getAllTopics, getDisciplines } from '@/lib/services/disciplines'
import { getRecentSessions, getStudyStreak, getTotalStudyMinutes } from '@/lib/services/study-sessions'
import { getDueCount } from '@/lib/services/flashcards'
import { getNotes } from '@/lib/services/notes'
import { getErrorOccurrences } from '@/lib/services/exercises'
import type { Assessment, Discipline, Topic, StudySession } from '@/lib/supabase'

export default function DashboardPage() {
  // Data states
  const [upcomingExams, setUpcomingExams] = useState<Assessment[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([])
  const [dueFlashcards, setDueFlashcards] = useState(0)
  const [recentNotes, setRecentNotes] = useState(0)
  const [errorOccurrences, setErrorOccurrences] = useState(0)

  // Derived stats
  const [studyStreak, setStudyStreak] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)

  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch all data in parallel
        const [exams, disciplinesData, topicsData, sessions, dueCount, notesCount, errors] = await Promise.all([
          getUpcomingAssessments(),
          getDisciplines(),
          getAllTopics(),
          getRecentSessions(),
          getDueCount(),
          getNotes(),
          getErrorOccurrences(50),
        ])

        setUpcomingExams(exams)
        setDisciplines(disciplinesData)
        setTopics(topicsData)
        setRecentSessions(sessions.slice(0, 5))
        setDueFlashcards(dueCount)
        setRecentNotes(notesCount.length)
        setErrorOccurrences(errors.filter(e => !e.is_resolved).length)

        // Calculate streak and total minutes
        const streak = getStudyStreak(sessions)
        const minutes = getTotalStudyMinutes(sessions)
        setStudyStreak(streak)
        setTotalMinutes(minutes)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Format current date
  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  // Group topics by discipline
  const topicsByDiscipline = topics.reduce(
    (acc, topic) => {
      if (!acc[topic.discipline_id]) {
        acc[topic.discipline_id] = []
      }
      acc[topic.discipline_id].push(topic)
      return acc
    },
    {} as Record<string, Topic[]>
  )

  const disciplineNameMap = disciplines.reduce(
    (acc, discipline) => {
      acc[discipline.id] = discipline.name
      return acc
    },
    {} as Record<string, string>
  )

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg-primary">
            Painel de Estudos
          </h1>
          <p className="mt-1 text-sm text-fg-tertiary">
            {today} · {totalMinutes} min estudados · {notesCountLabel(recentNotes)}
          </p>
        </div>
      </div>

      {error && (
        <section className="rounded-lg border border-accent-warning/30 bg-accent-warning/5 p-4">
          <p className="text-sm text-accent-warning">
            Alguns dados não carregaram do banco e o dashboard entrou em modo curricular de fallback.
          </p>
        </section>
      )}

      {/* Quick Stats Row */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Sequência de Estudos"
          value={`${studyStreak} dias`}
          color="accent-primary"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Flashcards Vencidos"
          value={dueFlashcards}
          color="accent-warning"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Tópicos Dominados"
          value={topics.filter(t => t.mastery === 'mastered').length}
          color="accent-success"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Próvas Agendadas"
          value={upcomingExams.length}
          color="accent-danger"
        />
      </section>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-fg-primary">Próximas Provas</h2>
            <Link href="/provas" className="text-sm text-accent-primary hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcomingExams.slice(0, 4).map((exam) => (
              <Link
                key={exam.id}
                href="/provas"
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  'bg-bg-secondary border-border-default hover:bg-bg-tertiary',
                  'group'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-fg-primary mb-1">
                      {exam.name}
                    </h3>
                    <p className="text-sm text-fg-tertiary mb-2">
                      {exam.type === 'prova' && 'Prova'}
                      {exam.type === 'trabalho' && 'Trabalho'}
                      {exam.type === 'ps' && 'Prova Subjetiva'}
                      {exam.type === 'g2' && 'G2'}
                    </p>
                    {exam.is_cumulative && (
                      <span className="text-xs text-accent-warning">Cumulativa</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'text-sm font-semibold',
                      countdownColor(exam.date)
                    )}>
                      {formatCountdown(exam.date)}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {new Date(exam.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Study Sessions */}
      {recentSessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-fg-primary">Sessões Recentes</h2>
            <Link href="/materiais" className="text-sm text-accent-primary hover:underline">
              Abrir materiais →
            </Link>
          </div>
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-lg bg-bg-secondary border border-border-subtle hover:bg-bg-tertiary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-fg-primary">
                      {session.kind === 'study' && '📚 Estudo'}
                      {session.kind === 'exercise' && '✏️ Exercícios'}
                      {session.kind === 'review' && '🔍 Revisão'}
                      {session.kind === 'simulation' && '🎯 Simulado'}
                      {session.kind === 'flashcard' && '🃏 Flashcards'}
                    </p>
                    <p className="text-xs text-fg-tertiary">
                      {session.duration_min} minutos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-fg-muted">
                      {new Date(session.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Topic Mastery Overview */}
      {topics.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-fg-primary mb-4">Progresso por Disciplina</h2>
          <div className="space-y-6">
            {Object.entries(topicsByDiscipline).map(([disciplineId, disciplineTopics]) => {
              const masteredCount = disciplineTopics.filter(t => t.mastery === 'mastered').length
              const total = disciplineTopics.length
              const disciplineName = disciplineNameMap[disciplineId] ?? 'Disciplina'

              return (
                <div key={disciplineId}>
                  <div className="flex items-center justify-between mb-3">
                    <Link
                      href={`/disciplina/${disciplineId}`}
                      className="font-semibold text-fg-primary hover:text-accent-primary transition-colors"
                    >
                      {disciplineName}
                    </Link>
                    <span className="text-xs text-fg-muted">
                      {masteredCount}/{total} dominados
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {disciplineTopics.slice(0, 8).map((topic) => (
                      <Link
                        key={topic.id}
                        href={`/disciplina/${disciplineId}`}
                        className={cn(
                          'p-3 rounded-lg border transition-colors group',
                          masteryColor(topic.mastery),
                          'border-border-default hover:border-border-default'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full flex-shrink-0 mt-0.5',
                              masteryColor(topic.mastery)
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-fg-primary truncate">
                              {topic.name}
                            </p>
                            <p className={cn(
                              'text-xs mt-1',
                              masteryTextColor(topic.mastery)
                            )}>
                              {topic.mastery === 'mastered' && 'Dominado'}
                              {topic.mastery === 'proficient' && 'Proficiente'}
                              {topic.mastery === 'developing' && 'Desenvolvendo'}
                              {topic.mastery === 'exposed' && 'Exposto'}
                              {topic.mastery === 'none' && 'Não iniciado'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickAction
          label="Abrir Materiais"
          icon={<BookOpen className="w-4 h-4" />}
          href="/materiais"
        />
        <QuickAction
          label="Criar Notas"
          icon={<Plus className="w-4 h-4" />}
          href="/notas"
        />
        <QuickAction
          label="Praticar Exercícios"
          icon={<Target className="w-4 h-4" />}
          href="/exercicios"
        />
        <QuickAction
          label="Mapa de Conhecimento"
          icon={<ArrowRight className="w-4 h-4" />}
          href="/mapa"
        />
      </section>

      {/* Error Summary */}
      {errorOccurrences > 0 && (
        <section className="p-4 rounded-lg bg-bg-secondary border border-accent-warning/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-fg-primary">
                {errorOccurrences} erro{errorOccurrences !== 1 ? 's' : ''} para revisar
              </h3>
              <p className="text-sm text-fg-tertiary mt-1">
                Erros recentes detectados nos exercícios. Revise-os para melhorar seu desempenho.
              </p>
              <Link href="/diagnostico" className="mt-3 inline-flex text-sm text-accent-primary hover:underline">
                Abrir diagnóstico →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="p-4 rounded-lg bg-bg-secondary border border-border-default">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-fg-tertiary mb-2">{label}</p>
          <p className="text-2xl font-bold text-fg-primary">{value}</p>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <span className="text-fg-primary opacity-70">{icon}</span>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  label,
  icon,
  href,
}: {
  label: string
  icon: React.ReactNode
  href: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'p-4 rounded-lg border transition-colors',
        'bg-bg-secondary border-border-default',
        'hover:bg-bg-tertiary hover:border-accent-primary',
        'flex flex-col items-center justify-center gap-2 text-center',
        'group'
      )}
    >
      <div className="text-fg-primary group-hover:text-accent-primary transition-colors">
        {icon}
      </div>
      <span className="text-xs font-medium text-fg-primary">{label}</span>
    </Link>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 bg-bg-tertiary rounded w-48 mb-2" />
        <div className="h-4 bg-bg-tertiary rounded w-32" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-bg-secondary border border-border-default">
            <div className="h-4 bg-bg-tertiary rounded w-24 mb-3" />
            <div className="h-8 bg-bg-tertiary rounded w-32" />
          </div>
        ))}
      </div>

      {/* Section skeleton */}
      <div>
        <div className="h-6 bg-bg-tertiary rounded w-40 mb-4" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-bg-secondary border border-border-default space-y-3">
              <div className="h-4 bg-bg-tertiary rounded w-32" />
              <div className="h-4 bg-bg-tertiary rounded w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Topics skeleton */}
      <div>
        <div className="h-6 bg-bg-tertiary rounded w-40 mb-4" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-bg-tertiary rounded w-32 mb-3" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="p-3 rounded-lg bg-bg-secondary border border-border-default h-20" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function notesCountLabel(noteCount: number) {
  return `${noteCount} notas registradas`
}
