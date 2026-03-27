'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Brain,
  BookOpen,
  Search,
  ChevronDown,
  Check,
  X,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '@/lib/services/notes'
import {
  getFlashcards,
  getDueFlashcards,
  createFlashcard,
  deleteFlashcard,
  reviewFlashcard,
} from '@/lib/services/flashcards'
import { getOralQuestions } from '@/lib/services/oral-questions'
import {
  getDisciplines,
  getAllTopics,
} from '@/lib/services/disciplines'
import { NotesWorkspace } from '@/components/notes/notes-workspace'
import type {
  Note,
  Flashcard,
  OralQuestion,
  Discipline,
  Topic,
  FlashcardType,
} from '@/lib/supabase'

type TabView = 'notas' | 'flashcards' | 'oral'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

interface FlashcardReviewState {
  cardIndex: number
  isFlipped: boolean
  results: Map<string, boolean>
}

// ─────────────────────────────────────────────────────────────────
// FLASHCARD MODAL
// ─────────────────────────────────────────────────────────────────

function FlashcardModal({
  disciplines,
  topics,
  onSave,
  onClose,
}: {
  disciplines: Discipline[]
  topics: Topic[]
  onSave: (data: Partial<Flashcard>) => Promise<void>
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    type: 'definition' as FlashcardType,
    difficulty: 1,
    topic_id: '',
    discipline_id: '',
  })

  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (
      !formData.front.trim() ||
      !formData.back.trim() ||
      !formData.topic_id
    ) {
      return
    }

    setLoading(true)
    try {
      await onSave({
        front: formData.front,
        back: formData.back,
        type: formData.type,
        difficulty: formData.difficulty,
        topic_id: formData.topic_id,
        discipline_id: formData.discipline_id,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const selectedDiscipline = disciplines.find(
    d => d.id === formData.discipline_id
  )
  const filteredTopics = selectedDiscipline
    ? topics.filter(t => t.discipline_id === selectedDiscipline.id)
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-md border border-border-default bg-bg-primary p-6">
        <h2 className="text-lg font-semibold text-fg-primary mb-4">
          Novo Flashcard
        </h2>

        <div className="space-y-4">
          {/* Discipline + Topic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-fg-secondary block mb-1">
                Disciplina
              </label>
              <select
                value={formData.discipline_id}
                onChange={e =>
                  setFormData({
                    ...formData,
                    discipline_id: e.target.value,
                    topic_id: '',
                  })
                }
                className="w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-fg-primary focus:border-accent-primary outline-none"
              >
                <option value="">Selecionar...</option>
                {disciplines.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-fg-secondary block mb-1">
                Tópico
              </label>
              <select
                value={formData.topic_id}
                onChange={e =>
                  setFormData({ ...formData, topic_id: e.target.value })
                }
                className="w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-fg-primary focus:border-accent-primary outline-none"
              >
                <option value="">Selecionar...</option>
                {filteredTopics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Front */}
          <div>
            <label className="text-xs font-medium text-fg-secondary block mb-1">
              Frente
            </label>
            <textarea
              value={formData.front}
              onChange={e =>
                setFormData({ ...formData, front: e.target.value })
              }
              placeholder="Pergunta ou conceito..."
              rows={3}
              className="w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-primary outline-none resize-none"
            />
          </div>

          {/* Back */}
          <div>
            <label className="text-xs font-medium text-fg-secondary block mb-1">
              Verso
            </label>
            <textarea
              value={formData.back}
              onChange={e =>
                setFormData({ ...formData, back: e.target.value })
              }
              placeholder="Resposta ou explicação..."
              rows={3}
              className="w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-primary outline-none resize-none"
            />
          </div>

          {/* Type + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-fg-secondary block mb-1">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={e =>
                  setFormData({
                    ...formData,
                    type: e.target.value as FlashcardType,
                  })
                }
                className="w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-fg-primary focus:border-accent-primary outline-none"
              >
                <option value="definition">Definição</option>
                <option value="theorem">Teorema</option>
                <option value="procedure">Procedimento</option>
                <option value="example">Exemplo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-fg-secondary block mb-1">
                Dificuldade
              </label>
              <div className="flex gap-1">
                {[1, 2, 3].map(level => (
                  <button
                    key={level}
                    onClick={() =>
                      setFormData({ ...formData, difficulty: level })
                    }
                    className={cn(
                      'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                      formData.difficulty >= level
                        ? 'border-accent-warning bg-accent-warning/20 text-accent-warning'
                        : 'border-border-default bg-bg-surface text-fg-muted'
                    )}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border-default px-4 py-2 text-sm text-fg-secondary hover:bg-bg-tertiary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-md bg-accent-primary px-4 py-2 text-sm text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// FLASHCARD REVIEW MODE
// ─────────────────────────────────────────────────────────────────

function FlashcardReviewMode({
  cards,
  onComplete,
  onClose,
}: {
  cards: Flashcard[]
  onComplete: () => void
  onClose: () => void
}) {
  const [state, setState] = useState<FlashcardReviewState>({
    cardIndex: 0,
    isFlipped: false,
    results: new Map(),
  })

  const [loading, setLoading] = useState(false)

  if (cards.length === 0) return null

  const currentCard = cards[state.cardIndex]
  const isLastCard = state.cardIndex === cards.length - 1

  const handleReview = async (correct: boolean) => {
    setLoading(true)
    try {
      await reviewFlashcard(currentCard.id, correct)

      const newResults = new Map(state.results)
      newResults.set(currentCard.id, correct)

      if (isLastCard) {
        setState({
          ...state,
          results: newResults,
        })
        // Show summary after delay
        setTimeout(onComplete, 500)
      } else {
        setState({
          cardIndex: state.cardIndex + 1,
          isFlipped: false,
          results: newResults,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const progress = ((state.cardIndex) / cards.length) * 100

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Progress bar */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between text-xs text-fg-secondary mb-2">
          <span>
            Cartão {state.cardIndex + 1} de {cards.length}
          </span>
          <span>
            {state.results.size} respondidos
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full bg-accent-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-2xl h-64 rounded-md border-2 border-accent-primary/30 bg-bg-surface p-6 flex flex-col items-center justify-center cursor-pointer hover:border-accent-primary/50 transition-colors"
        onClick={() => setState({ ...state, isFlipped: !state.isFlipped })}
      >
        <div className="text-xs text-fg-muted mb-2 font-medium">
          {state.isFlipped ? 'VERSO' : 'FRENTE'}
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-fg-primary">
            {state.isFlipped ? currentCard.back : currentCard.front}
          </p>
        </div>
        <div className="text-xs text-fg-muted mt-4">
          Clique para {state.isFlipped ? 'voltar' : 'virar'}
        </div>
      </div>

      {/* Buttons */}
      {state.isFlipped && (
        <div className="flex gap-3">
          <button
            onClick={() => handleReview(false)}
            disabled={loading}
            className="rounded-md border border-accent-danger/30 bg-accent-danger/10 px-4 py-2 text-sm font-medium text-accent-danger hover:bg-accent-danger/20 transition-colors disabled:opacity-50"
          >
            ✕ Não sabia
          </button>
          <button
            onClick={() => handleReview(true)}
            disabled={loading}
            className="rounded-md border border-accent-success/30 bg-accent-success/10 px-4 py-2 text-sm font-medium text-accent-success hover:bg-accent-success/20 transition-colors disabled:opacity-50"
          >
            ✓ Sabia
          </button>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onClose}
        className="text-xs text-fg-muted hover:text-fg-secondary"
      >
        ← Voltar à lista
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function NotasPage() {
  const [tab, setTab] = useState<TabView>('notas')
  const [search, setSearch] = useState('')
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all')

  // Data
  const [notes, setNotes] = useState<Note[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([])
  const [oralQuestions, setOralQuestions] = useState<OralQuestion[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [topics, setTopics] = useState<Topic[]>([])

  // UI State
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false)

  // Flashcard review mode
  const [reviewMode, setReviewMode] = useState(false)

  // Oral questions state
  const [expandedOralId, setExpandedOralId] = useState<string | null>(null)

  const [flashcardFilters, setFlashcardFilters] = useState({
    type: 'all' as string,
  })

  // ─── Load Data ───────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const [notesData, flashcardsData, dueData, oralData, disciplinesData, topicsData] =
        await Promise.all([
          getNotes(),
          getFlashcards(),
          getDueFlashcards(),
          getOralQuestions(),
          getDisciplines(),
          getAllTopics(),
        ])

      setNotes(notesData)
      setFlashcards(flashcardsData)
      setDueFlashcards(dueData)
      setOralQuestions(oralData)
      setDisciplines(disciplinesData)
      setTopics(topicsData)
    } catch {
      showToast('Erro ao carregar dados', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ─── Toast ───────────────────────────────────────────────────

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  // ─── Notes CRUD ───────────────────────────────────────────────

  const handleSaveNote = async (
    data: Partial<Note> & { id?: string }
  ): Promise<Note> => {
    let saved: Note

    if (data.id) {
      saved = await updateNote(data.id, {
        title: data.title,
        content: data.content,
        format: data.format,
        status: data.status,
        key_concepts: data.key_concepts,
        linked_topics: data.linked_topics,
        tags: data.tags,
      })
      showToast('Nota atualizada com sucesso!')
    } else {
      saved = await createNote({
        topic_id: data.topic_id!,
        discipline_id: data.discipline_id!,
        title: data.title!,
        content: data.content!,
        format: data.format,
        status: data.status,
        tags: data.tags,
        key_concepts: data.key_concepts,
        ai_generated: data.ai_generated,
      })
      showToast('Nota criada com sucesso!')
    }

    await loadData()
    return saved
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta nota?')) return

    try {
      await deleteNote(noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
      showToast('Nota deletada com sucesso!')
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao deletar nota',
        'error'
      )
    }
  }

  // ─── Flashcard CRUD ───────────────────────────────────────────

  const handleCreateFlashcard = async (data: Partial<Flashcard>) => {
    try {
      const newCard = await createFlashcard({
        topic_id: data.topic_id!,
        discipline_id: data.discipline_id!,
        front: data.front!,
        back: data.back!,
        type: data.type as FlashcardType,
        difficulty: data.difficulty,
      })
      setFlashcards(prev => [newCard, ...prev])
      showToast('Flashcard criado com sucesso!')
      setFlashcardModalOpen(false)
      await loadData()
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao criar flashcard',
        'error'
      )
    }
  }

  const handleDeleteFlashcard = async (cardId: string) => {
    if (!confirm('Tem certeza que deseja deletar este flashcard?')) return

    try {
      await deleteFlashcard(cardId)
      setFlashcards(prev => prev.filter(c => c.id !== cardId))
      showToast('Flashcard deletado com sucesso!')
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao deletar flashcard',
        'error'
      )
    }
  }

  // ─── Filtering ───────────────────────────────────────────────

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const filteredFlashcards = useMemo(() => {
    let result = flashcards

    if (disciplineFilter !== 'all') {
      result = result.filter(c => c.discipline_id === disciplineFilter)
    }

    if (flashcardFilters.type !== 'all') {
      result = result.filter(c => c.type === flashcardFilters.type)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        c =>
          c.front.toLowerCase().includes(q) ||
          c.back.toLowerCase().includes(q)
      )
    }

    return result
  }, [flashcards, disciplineFilter, flashcardFilters, search])

  const filteredOralQuestions = useMemo(() => {
    let result = oralQuestions

    if (disciplineFilter !== 'all') {
      result = result.filter(q => q.discipline_id === disciplineFilter)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        oq => oq.question.toLowerCase().includes(q)
      )
    }

    return result
  }, [oralQuestions, disciplineFilter, search])

  // ─── Render ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-fg-secondary">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg-primary">
            Notas & Flashcards
          </h1>
          <p className="text-xs text-fg-tertiary">
            {notes.length} notas · {flashcards.length} flashcards
            {dueFlashcards.length > 0 && (
              <span className="ml-2 text-accent-warning font-medium">
                {dueFlashcards.length} pendente(s)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Global Filters */}
      <div className="flex items-center gap-3">
        {tab !== 'notas' && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 pl-9 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-primary outline-none"
            />
          </div>
        )}

        <div className="flex gap-2">
          {disciplines.map(d => (
            <button
              key={d.id}
              onClick={() =>
                setDisciplineFilter(
                  disciplineFilter === d.id ? 'all' : d.id
                )
              }
              className={cn(
                'text-xs px-3 py-2 rounded-md border transition-colors',
                disciplineFilter === d.id
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-border-default bg-bg-surface text-fg-secondary hover:border-accent-primary/30'
              )}
            >
              {d.name}
            </button>
          ))}
          {disciplines.length > 0 && (
            <button
              onClick={() => setDisciplineFilter('all')}
              className={cn(
                'text-xs px-3 py-2 rounded-md border transition-colors',
                disciplineFilter === 'all'
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-border-default bg-bg-surface text-fg-secondary hover:border-accent-primary/30'
              )}
            >
              Todas
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default">
        {(
          [
            { value: 'notas' as const, label: 'Notas', icon: BookOpen },
            {
              value: 'flashcards' as const,
              label: 'Flashcards',
              icon: Brain,
            },
            { value: 'oral' as const, label: 'Oral', icon: Plus },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setTab(value)
              setReviewMode(false)
            }}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === value
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-fg-secondary hover:text-fg-primary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* NOTAS TAB */}
        {tab === 'notas' && (
          <NotesWorkspace
            notes={notes}
            disciplines={disciplines}
            topics={topics}
            preferredDisciplineId={disciplineFilter}
            search={search}
            onSearchChange={setSearch}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            onToast={showToast}
            onRefreshData={loadData}
          />
        )}

        {/* FLASHCARDS TAB */}
        {tab === 'flashcards' && (
          <div className="flex flex-col h-full gap-3">
            {reviewMode ? (
              <>
                <FlashcardReviewMode
                  cards={filteredFlashcards}
                  onComplete={() => {
                    setReviewMode(false)
                    showToast('Revisão concluída!')
                    loadData()
                  }}
                  onClose={() => setReviewMode(false)}
                />
              </>
            ) : (
              <>
                {/* Filters */}
                <div className="flex items-center gap-2">
                  <select
                    value={flashcardFilters.type}
                    onChange={e =>
                      setFlashcardFilters({
                        ...flashcardFilters,
                        type: e.target.value,
                      })
                    }
                    className="text-xs rounded-md border border-border-default bg-bg-surface px-2 py-1 text-fg-secondary focus:border-accent-primary outline-none"
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="definition">Definição</option>
                    <option value="theorem">Teorema</option>
                    <option value="procedure">Procedimento</option>
                    <option value="example">Exemplo</option>
                  </select>

                  {dueFlashcards.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-accent-warning font-medium">
                        {dueFlashcards.length} pendente(s)
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => setFlashcardModalOpen(true)}
                    className="ml-auto flex items-center gap-2 rounded-md bg-accent-primary px-3 py-2 text-xs font-medium text-white hover:bg-accent-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Flashcard
                  </button>

                  <button
                    onClick={() => setReviewMode(true)}
                    disabled={filteredFlashcards.length === 0}
                    className="flex items-center gap-2 rounded-md bg-accent-primary/20 px-3 py-2 text-xs font-medium text-accent-primary hover:bg-accent-primary/30 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Revisar
                  </button>
                </div>

                {/* Flashcards Grid */}
                <div className="flex-1 overflow-y-auto">
                  {filteredFlashcards.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Brain className="h-12 w-12 text-fg-muted/30 mx-auto mb-2" />
                        <p className="text-sm text-fg-tertiary">
                          Nenhum flashcard encontrado
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 pr-3">
                      {filteredFlashcards.map(card => {
                        const isDue = card.next_review <= todayStr

                        return (
                          <div
                            key={card.id}
                            className={cn(
                              'rounded-md border p-4 transition-colors',
                              isDue
                                ? 'border-accent-warning/30 bg-accent-warning/5'
                                : 'border-border-default bg-bg-surface hover:border-accent-primary/30'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span
                                className={cn(
                                  'text-xs px-2 py-1 rounded font-medium',
                                  card.type === 'definition'
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : card.type === 'theorem'
                                      ? 'bg-purple-500/10 text-purple-400'
                                      : card.type === 'procedure'
                                        ? 'bg-green-500/10 text-green-400'
                                        : 'bg-orange-500/10 text-orange-400'
                                )}
                              >
                                {card.type === 'definition'
                                  ? 'Def'
                                  : card.type === 'theorem'
                                    ? 'Teo'
                                    : card.type === 'procedure'
                                      ? 'Proc'
                                      : 'Ex'}
                              </span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3].map(i => (
                                  <span
                                    key={i}
                                    className={cn(
                                      'text-xs',
                                      i <= card.difficulty
                                        ? 'text-accent-warning'
                                        : 'text-fg-muted/30'
                                    )}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>

                            <p className="text-sm font-medium text-fg-primary mb-1 line-clamp-2">
                              {card.front}
                            </p>
                            <p className="text-xs text-fg-tertiary line-clamp-2 mb-3">
                              {card.back}
                            </p>

                            <div className="flex items-center justify-between text-xs text-fg-muted mb-3">
                              <span>Box {card.sr_box}/4</span>
                              <span
                                className={isDue ? 'text-accent-warning font-medium' : ''}
                              >
                                {isDue
                                  ? 'Pendente'
                                  : new Date(card.next_review).toLocaleDateString(
                                    'pt-BR'
                                  )}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteFlashcard(card.id)}
                              className="w-full text-xs border border-accent-danger/30 rounded px-2 py-1 text-accent-danger hover:bg-accent-danger/10 transition-colors"
                            >
                              <Trash2 className="h-3 w-3 mx-auto" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ORAL TAB */}
        {tab === 'oral' && (
          <div className="flex flex-col h-full">
            {filteredOralQuestions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-fg-muted/30 mx-auto mb-2" />
                  <p className="text-sm text-fg-tertiary">
                    Nenhuma pergunta oral encontrada
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-3 space-y-3">
                {filteredOralQuestions.map(question => (
                  <div
                    key={question.id}
                    className="rounded-md border border-border-default bg-bg-surface p-4"
                  >
                    <button
                      onClick={() =>
                        setExpandedOralId(
                          expandedOralId === question.id ? null : question.id
                        )
                      }
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-fg-primary mb-1">
                            {question.question}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-fg-secondary">
                            <span
                              className={cn(
                                'px-2 py-1 rounded font-medium',
                                question.difficulty === 'easy'
                                  ? 'bg-green-500/10 text-green-400'
                                  : question.difficulty === 'medium'
                                    ? 'bg-yellow-500/10 text-yellow-400'
                                    : 'bg-red-500/10 text-red-400'
                              )}
                            >
                              {question.difficulty === 'easy'
                                ? 'Fácil'
                                : question.difficulty === 'medium'
                                  ? 'Médio'
                                  : 'Difícil'}
                            </span>
                            <span>
                              {question.expected_points.length} ponto(s)
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-fg-muted transition-transform',
                            expandedOralId === question.id && 'rotate-180'
                          )}
                        />
                      </div>
                    </button>

                    {expandedOralId === question.id && (
                      <div className="mt-4 pt-4 border-t border-border-default">
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-fg-secondary mb-2">
                            Resposta esperada:
                          </h4>
                          <p className="text-sm text-fg-primary">
                            {question.model_answer}
                          </p>
                        </div>

                        {question.expected_points.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-fg-secondary mb-2">
                              Pontos esperados:
                            </h4>
                            <ul className="space-y-1">
                              {question.expected_points.map((point, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-fg-tertiary flex gap-2"
                                >
                                  <span className="text-accent-primary">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {flashcardModalOpen && (
        <FlashcardModal
          disciplines={disciplines}
          topics={topics}
          onSave={handleCreateFlashcard}
          onClose={() => setFlashcardModalOpen(false)}
        />
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-40 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'rounded-md px-4 py-3 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300',
              toast.type === 'success'
                ? 'bg-accent-success/20 text-accent-success'
                : 'bg-accent-danger/20 text-accent-danger'
            )}
          >
            {toast.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
