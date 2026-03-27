'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  Plus,
  MessageSquare,
  StickyNote,
  Layers,
  Dumbbell,
  Brain,
  BarChart3,
  Trash2,
  Sparkles,
  DollarSign,
  Loader2,
} from 'lucide-react'
import { JarvisChat } from '@/components/jarvis/chat'
import {
  getConversations,
  createConversation,
  deleteConversation as deleteConv,
  type ConversationRow,
} from '@/lib/services/conversations'

export default function JarvisPage() {
  const pathname = usePathname()
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [totalCost, setTotalCost] = useState(0)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [conversationsError, setConversationsError] = useState<string | null>(null)
  // Force chat remount when switching conversations
  const [chatKey, setChatKey] = useState(0)

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true)
      setConversationsError(null)
      const data = await getConversations(50)
      setConversations(data)
      // Auto-open latest conversation on first load
      if (data.length > 0) {
        setActiveConversation((prev) => prev ?? data[0].id)
      }
    } catch (err) {
      console.error('Failed to load Jarvis conversations:', err)
      setConversationsError('Não foi possível carregar o histórico de conversas.')
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  // Load conversations from Supabase on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Recalculate total cost whenever conversations change
  useEffect(() => {
    const cost = conversations.reduce((sum, c) => sum + Number(c.total_cost_usd || 0), 0)
    setTotalCost(cost)
  }, [conversations])

  const handleNewConversation = async (title: string) => {
    try {
      const conv = await createConversation({ title })
      setConversations((prev) => [conv, ...prev])
      setActiveConversation(conv.id)
      setChatKey((k) => k + 1)
    } catch {
      // fallback: create locally
      const localId = `local_${Date.now()}`
      setActiveConversation(localId)
      setChatKey((k) => k + 1)
    }
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConv(id)
    } catch {
      // continue with local removal
    }
    setConversations((prev) => prev.filter((conv) => conv.id !== id))
    if (activeConversation === id) {
      setActiveConversation(null)
      setChatKey((k) => k + 1)
    }
  }

  const handleSelectConversation = (id: string) => {
    if (id === activeConversation) return
    setActiveConversation(id)
    setChatKey((k) => k + 1)
  }

  // Called by JarvisChat when it auto-creates a conversation
  const handleConversationCreated = useCallback((conv: ConversationRow) => {
    setConversations((prev) => {
      // Avoid duplicates
      if (prev.some((c) => c.id === conv.id)) return prev
      return [conv, ...prev]
    })
    setActiveConversation(conv.id)
  }, [])

  // Called by JarvisChat when it updates the title
  const handleConversationUpdated = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    )
  }, [])

  const quickActions = [
    {
      icon: StickyNote,
      label: 'Criar nota',
      action: () => handleNewConversation('Criar nota sobre tópico de estudo'),
    },
    {
      icon: Layers,
      label: 'Gerar flashcards',
      action: () => handleNewConversation('Gerar flashcards'),
    },
    {
      icon: Dumbbell,
      label: 'Plano de estudo',
      action: () => handleNewConversation('Criar plano de estudo para prova'),
    },
    {
      icon: Brain,
      label: 'Revisar flashcards',
      action: () => handleNewConversation('Flashcards para revisar'),
    },
    {
      icon: BarChart3,
      label: 'Diagnóstico',
      action: () => handleNewConversation('Analisar erros e sugerir melhorias'),
    },
  ]

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `${diffMins}min atrás`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h atrás`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d atrás`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Sidebar */}
      <div className="w-64 border-r border-border-default flex flex-col bg-bg-secondary">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border-default">
          <button
            onClick={() => handleNewConversation('Nova conversa')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 transition-colors text-bg-primary font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova conversa
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-4 border-b border-border-default space-y-2">
          <h3 className="text-xs font-semibold text-fg-tertiary uppercase tracking-wider mb-3">
            Ações rápidas
          </h3>
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={action.action}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-surface transition-colors text-fg-secondary hover:text-fg-primary text-xs font-medium"
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            )
          })}
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {conversationsError && (
            <div className="mb-3 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10">
              <p className="text-[11px] text-red-300">{conversationsError}</p>
            </div>
          )}
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-fg-muted" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-fg-tertiary mx-auto mb-2" />
              <p className="text-xs text-fg-tertiary">
                Nenhuma conversa ainda
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-fg-tertiary uppercase tracking-wider mb-3 px-1">
                Histórico
              </h3>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`px-3 py-2.5 rounded-lg transition-colors group relative cursor-pointer ${
                    activeConversation === conv.id
                      ? 'bg-blue-500/15 border border-blue-500/25'
                      : 'hover:bg-bg-tertiary border border-transparent'
                  }`}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <p className={`text-xs font-medium truncate pr-6 ${
                    activeConversation === conv.id ? 'text-blue-400' : 'text-fg-secondary'
                  }`}>
                    {conv.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-fg-muted">
                      {formatDate(conv.updated_at)}
                    </span>
                    {conv.message_count > 0 && (
                      <span className="text-[10px] text-fg-muted">
                        · {conv.message_count} msgs
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id) }}
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3 text-fg-muted hover:text-red-400" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Cost Tracker */}
        <div className="px-4 py-3 border-t border-border-default">
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-tertiary">Custo total:</span>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-accent-primary" />
              <span className="text-sm font-semibold text-fg-primary">
                ${totalCost.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default bg-bg-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-accent-primary" />
              <h1 className="text-2xl font-bold text-fg-primary">JARVIS</h1>
            </div>
            {totalCost > 0 && (
              <div className="flex items-center gap-2 text-sm text-fg-secondary">
                <DollarSign className="w-4 h-4" />
                <span>Gastos totais: ${totalCost.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <JarvisChat
            key={chatKey}
            mode="fullpage"
            currentPage={pathname}
            conversationId={activeConversation}
            onConversationCreated={handleConversationCreated}
            onConversationUpdated={handleConversationUpdated}
          />
        </div>
      </div>
    </div>
  )
}
