'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  Send,
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  Clock,
  DollarSign,
  StickyNote,
  Layers,
  Dumbbell,
  Sparkles,
  Brain,
  X,
  Plus,
  Cpu,
  Copy,
  Check,
  Calendar,
  BookOpen,
  GraduationCap,
  GitBranch,
  Play,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import type { JarvisMessage, ModelId, ModelInfo, PostAction } from '@/lib/jarvis/types'
import { MODELS } from '@/lib/jarvis/types'
import {
  createConversation,
  getMessages,
  saveMessage,
  updateConversation,
  generateTitle,
  type ConversationRow,
} from '@/lib/services/conversations'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const MermaidDiagram = dynamic(
  () => import('@/components/notes/mermaid-diagram').then(m => ({ default: m.MermaidDiagram })),
  { ssr: false, loading: () => <div className="h-40 flex items-center justify-center text-xs text-fg-muted">Renderizando diagrama...</div> }
)

interface JarvisChatProps {
  mode: 'floating' | 'fullpage'
  currentPage?: string
  disciplineId?: string
  topicId?: string
  conversationId?: string | null
  onConversationCreated?: (conv: ConversationRow) => void
  onConversationUpdated?: (id: string, title: string) => void
}

const SUGGESTIONS = [
  { icon: Brain, text: 'Explica limites com analogias pro meu nível', tag: 'Explicação adaptativa' },
  { icon: GraduationCap, text: 'Me ajude a resolver esse exercício passo a passo', tag: 'Tutor socrático' },
  { icon: Calendar, text: 'Gere um plano de estudo para a próxima prova', tag: 'Plano de estudo' },
  { icon: Dumbbell, text: 'Gere exercícios focados nas minhas fraquezas', tag: 'Exercícios direcionados' },
  { icon: GitBranch, text: 'Crie um mapa conceitual de derivadas', tag: 'Mermaid' },
  { icon: Play, text: 'Crie uma visualização interativa de funções', tag: 'Interativo' },
  { icon: Layers, text: 'Gere flashcards adaptativos sobre indução', tag: 'Flashcards smart' },
  { icon: FileText, text: 'Resuma esse conteúdo extraindo definições', tag: 'Resumo IA' },
]

// Icon map for post-action buttons
const POST_ACTION_ICONS: Record<string, LucideIcon> = {
  StickyNote, Layers, Dumbbell, Brain, Zap, Clock, Calendar, BookOpen,
  GraduationCap, GitBranch, Play, FileText, Sparkles,
}

function getActionIcon(iconName: string): LucideIcon {
  return POST_ACTION_ICONS[iconName] ?? Zap
}

// ── Rich Markdown Renderer (react-markdown + KaTeX) ─────────

function MessageContent({ content }: { content: string }) {
  // Extract SVG blocks before markdown processing
  const segments = useMemo(() => {
    const parts: { type: 'md' | 'svg'; content: string }[] = []
    const svgRegex = /(<svg[\s\S]*?<\/svg>)/gi
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = svgRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'md', content: content.slice(lastIndex, match.index) })
      }
      parts.push({ type: 'svg', content: match[1] })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'md', content: content.slice(lastIndex) })
    }
    return parts
  }, [content])

  return (
    <div className="jarvis-prose text-sm text-fg-primary leading-relaxed">
      {segments.map((seg, i) =>
        seg.type === 'svg' ? (
          <div
            key={i}
            className="my-4 rounded-lg overflow-hidden border border-border-default bg-bg-secondary p-3 flex justify-center"
            dangerouslySetInnerHTML={{ __html: seg.content }}
          />
        ) : (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Headings
              h1: ({ children }) => (
                <h2 className="text-xl font-bold text-fg-primary mt-6 mb-3">{children}</h2>
              ),
              h2: ({ children }) => (
                <h3 className="text-lg font-semibold text-fg-primary mt-5 mb-2">{children}</h3>
              ),
              h3: ({ children }) => (
                <h4 className="text-base font-semibold text-fg-primary mt-4 mb-2">{children}</h4>
              ),
              h4: ({ children }) => (
                <h5 className="text-sm font-semibold text-fg-secondary mt-3 mb-1">{children}</h5>
              ),
              // Paragraphs
              p: ({ children }) => (
                <p className="text-sm text-fg-primary leading-relaxed mb-3 last:mb-0">{children}</p>
              ),
              // Strong / Em
              strong: ({ children }) => (
                <strong className="font-semibold text-fg-primary">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-fg-secondary">{children}</em>
              ),
              // Code blocks
              pre: ({ children }) => <>{children}</>,
              code: ({ className, children, ...props }) => {
                const codeString = String(children).replace(/\n$/, '')
                const langMatch = className?.match(/language-(\w+)/)
                const isBlock = className?.startsWith('language-') || codeString.includes('\n')

                if (isBlock) {
                  const lang = langMatch?.[1] || ''
                  // Render SVG code blocks as actual SVG
                  if (lang === 'svg' || (lang === '' && codeString.trimStart().startsWith('<svg'))) {
                    return (
                      <div
                        className="my-4 rounded-lg overflow-hidden border border-border-default bg-bg-secondary p-3 flex justify-center"
                        dangerouslySetInnerHTML={{ __html: codeString }}
                      />
                    )
                  }
                  // Render Mermaid diagrams
                  if (lang === 'mermaid') {
                    return <div className="my-4"><MermaidDiagram chart={codeString} /></div>
                  }
                  return <CodeBlock lang={lang} code={codeString} />
                }
                return (
                  <code className="bg-bg-tertiary text-accent-primary px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                    {children}
                  </code>
                )
              },
              // Links
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                  {children}
                </a>
              ),
              // Lists
              ul: ({ children }) => (
                <ul className="list-disc pl-6 space-y-1.5 my-3 text-fg-primary">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 space-y-1.5 my-3 text-fg-primary">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-sm leading-relaxed">{children}</li>
              ),
              // Blockquotes
              blockquote: ({ children }) => (
                <blockquote className="border-l-3 border-accent-primary pl-4 py-1 my-3 text-fg-secondary bg-bg-secondary/50 rounded-r-lg">
                  {children}
                </blockquote>
              ),
              // Horizontal rules
              hr: () => <hr className="border-border-default my-5" />,
              // Tables
              table: ({ children }) => (
                <div className="my-4 overflow-x-auto rounded-lg border border-border-default">
                  <table className="w-full text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-bg-tertiary">{children}</thead>
              ),
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => (
                <tr className="border-b border-border-default last:border-0 hover:bg-bg-secondary/30 transition-colors">{children}</tr>
              ),
              th: ({ children }) => (
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-fg-secondary uppercase tracking-wider">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2.5 text-fg-primary">{children}</td>
              ),
            }}
          >
            {seg.content}
          </ReactMarkdown>
        )
      )}
    </div>
  )
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border-default">
      <div className="flex items-center justify-between px-4 py-2 bg-bg-tertiary text-xs text-fg-tertiary">
        <span className="font-medium">{lang || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-fg-secondary transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="px-4 py-3 bg-bg-secondary overflow-x-auto text-xs font-mono text-fg-secondary leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ── Main Chat Component ──────────────────────────────────────

export function JarvisChat({
  mode,
  currentPage,
  disciplineId,
  topicId,
  conversationId: externalConversationId,
  onConversationCreated,
  onConversationUpdated,
}: JarvisChatProps) {
  const [messages, setMessages] = useState<JarvisMessage[]>([])
  const [currentModel, setCurrentModel] = useState<ModelId>('claude-sonnet-4-6')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [expandedModelDropdown, setExpandedModelDropdown] = useState(false)
  const [expandedToolResults, setExpandedToolResults] = useState<Set<string>>(new Set())
  const [expandedMixSources, setExpandedMixSources] = useState<Set<string>>(new Set())
  const [activeConvId, setActiveConvId] = useState<string | null>(externalConversationId ?? null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Sync external conversationId changes
  useEffect(() => {
    if (externalConversationId !== undefined) {
      setActiveConvId(externalConversationId)
    }
  }, [externalConversationId])

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([])
      return
    }
    let cancelled = false
    setError(null)
    setLoadingHistory(true)
    getMessages(activeConvId)
      .then((msgs) => {
        if (!cancelled) setMessages(msgs)
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load Jarvis messages:', err)
          setError('Não foi possível carregar as mensagens desta conversa.')
          setMessages([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false)
      })
    return () => { cancelled = true }
  }, [activeConvId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Ensure a conversation exists, creating one if needed
  const ensureConversation = useCallback(async (firstMessageContent: string): Promise<string> => {
    if (activeConvId) return activeConvId

    const conv = await createConversation({
      title: generateTitle(firstMessageContent),
      model: currentModel,
      currentPage: currentPage ?? undefined,
      disciplineId: disciplineId ?? undefined,
      topicId: topicId ?? undefined,
    })
    setActiveConvId(conv.id)
    onConversationCreated?.(conv)
    return conv.id
  }, [activeConvId, currentModel, currentPage, disciplineId, topicId, onConversationCreated])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMsg: JarvisMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      const convId = await ensureConversation(content)
      await saveMessage(convId, userMsg).catch(() => {})

      if (messages.length === 0) {
        const title = generateTitle(content)
        await updateConversation(convId, { title }).catch(() => {})
        onConversationUpdated?.(convId, title)
      }

      const allMessages = [...messages, userMsg]

      // Try streaming first (Anthropic models), fall back to regular
      const useStreaming = currentModel !== 'mix' && currentModel.startsWith('claude')

      if (useStreaming) {
        await sendStreamingRequest(allMessages, convId)
      } else {
        await sendRegularRequest(allMessages, convId)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const sendStreamingRequest = async (allMessages: JarvisMessage[], convId: string) => {
    const assistantMsgId = `jarvis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    let streamedContent = ''
    let toolResults: JarvisMessage['toolResults']
    let postActions: JarvisMessage['postActions']
    let meta: JarvisMessage['meta']

    // Add placeholder assistant message
    setMessages((prev) => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      model: currentModel,
      timestamp: Date.now(),
    }])

    const res = await fetch('/api/jarvis/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: allMessages,
        model: currentModel,
        currentPage,
        disciplineId,
        topicId,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      // Remove placeholder
      setMessages((prev) => prev.filter(m => m.id !== assistantMsgId))
      throw new Error(err.error || 'Erro ao processar')
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('Stream not available')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      let eventType = ''
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7)
        } else if (line.startsWith('data: ') && eventType) {
          try {
            const data = JSON.parse(line.slice(6))
            if (eventType === 'delta') {
              streamedContent += data.text
              setMessages((prev) => prev.map(m =>
                m.id === assistantMsgId ? { ...m, content: streamedContent } : m
              ))
            } else if (eventType === 'tool_results') {
              toolResults = data
              setMessages((prev) => prev.map(m =>
                m.id === assistantMsgId ? { ...m, toolResults: data } : m
              ))
              // After tool results, the follow-up stream will replace content
              streamedContent = ''
            } else if (eventType === 'post_actions') {
              postActions = data
              setMessages((prev) => prev.map(m =>
                m.id === assistantMsgId ? { ...m, postActions: data } : m
              ))
            } else if (eventType === 'meta') {
              meta = data
              setMessages((prev) => prev.map(m =>
                m.id === assistantMsgId ? { ...m, meta: data } : m
              ))
            } else if (eventType === 'error') {
              throw new Error(data.message)
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
              throw e
            }
          }
          eventType = ''
        }
      }
    }

    // Save final message
    const finalMsg: JarvisMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: streamedContent,
      model: currentModel,
      toolResults,
      postActions,
      meta,
      timestamp: Date.now(),
    }
    await saveMessage(convId, finalMsg).catch(() => {})
    if (meta?.estimatedCostUsd) {
      await updateConversation(convId, { total_cost_usd: meta.estimatedCostUsd }).catch(() => {})
    }
  }

  const sendRegularRequest = async (allMessages: JarvisMessage[], convId: string) => {
    const res = await fetch('/api/jarvis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: allMessages,
        model: currentModel,
        currentPage,
        disciplineId,
        topicId,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Erro ao processar')
    }

    const data = await res.json()
    const assistantMsg: JarvisMessage = data.message
    setMessages((prev) => [...prev, assistantMsg])

    await saveMessage(convId, assistantMsg).catch(() => {})
    if (assistantMsg.meta?.estimatedCostUsd) {
      await updateConversation(convId, { total_cost_usd: assistantMsg.meta.estimatedCostUsd }).catch(() => {})
    }
  }

  const handleExecuteAction = async (action: PostAction) => {
    if (isLoading) return

    const userMsg: JarvisMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      content: action.label,
      timestamp: Date.now(),
    }

    const nextMessages = [...messages, userMsg]

    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    setError(null)

    try {
      const convId = await ensureConversation(action.label)

      await saveMessage(convId, userMsg).catch(() => {})

      const res = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          action,
          model: currentModel,
          currentPage,
          disciplineId,
          topicId,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao processar ação')
      }

      const data = await res.json()
      const assistantMsg: JarvisMessage = data.message

      setMessages((prev) => [...prev, assistantMsg])

      await saveMessage(convId, assistantMsg).catch(() => {})

      if (assistantMsg.meta?.estimatedCostUsd) {
        await updateConversation(convId, {
          total_cost_usd: assistantMsg.meta.estimatedCostUsd,
        }).catch(() => {})
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const toggleToolResult = (toolId: string) => {
    setExpandedToolResults((prev) => {
      const next = new Set(prev)
      if (next.has(toolId)) {
        next.delete(toolId)
      } else {
        next.add(toolId)
      }
      return next
    })
  }

  const toggleMixSources = (messageId: string) => {
    setExpandedMixSources((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  const modelsList = Object.values(MODELS)
  const groupedModels = modelsList.reduce(
    (acc, model) => {
      const provider = model.provider || 'other'
      if (!acc[provider]) acc[provider] = []
      acc[provider].push(model)
      return acc
    },
    {} as Record<string, ModelInfo[]>
  )

  const currentModelData = MODELS[currentModel]
  const providerLabels: Record<string, string> = { anthropic: 'Anthropic', google: 'Google', mix: 'Mix' }

  return (
    <div className="flex flex-col h-full bg-bg-primary border border-border-default rounded-lg overflow-hidden">
      {/* Model Selector Bar */}
      <div className="px-3 py-2 border-b border-border-default bg-bg-secondary flex items-center gap-2">
        <Bot className="w-4 h-4 text-accent-primary flex-shrink-0" />
        <div className="relative flex-1">
          <button
            onClick={() => setExpandedModelDropdown(!expandedModelDropdown)}
            className="flex items-center gap-2 px-2 py-1 rounded bg-bg-tertiary hover:bg-bg-surface transition-colors text-fg-primary text-xs"
          >
            <span>{currentModelData?.name || 'Modelo'}</span>
            <ChevronDown className="w-3 h-3 text-fg-tertiary" />
          </button>

          {expandedModelDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
              {/* Mix */}
              <button
                onClick={() => { setCurrentModel('mix'); setExpandedModelDropdown(false) }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                  currentModel === 'mix' ? 'bg-blue-500/20 text-blue-400' : 'text-fg-primary hover:bg-bg-tertiary'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-medium">Mix (Multi-IA)</span>
                <span className="ml-auto text-fg-muted">Combina respostas</span>
              </button>
              <div className="h-px bg-border-default" />

              {Object.entries(groupedModels).filter(([p]) => p !== 'mix').map(([provider, models]) => (
                <div key={provider}>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-fg-muted bg-bg-tertiary/50">
                    {providerLabels[provider] || provider}
                  </div>
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => { setCurrentModel(model.id); setExpandedModelDropdown(false) }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                        currentModel === model.id ? 'bg-blue-500/20 text-blue-400' : 'text-fg-primary hover:bg-bg-tertiary'
                      }`}
                    >
                      <span className="flex-1">{model.name}</span>
                      <span className="text-fg-muted">
                        {model.tier === 'fast' && '⚡ Rápido'}
                        {model.tier === 'balanced' && '⚖️ Balanceado'}
                        {model.tier === 'powerful' && '🔥 Poderoso'}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {currentModelData && (
          <div className="flex items-center gap-1.5">
            {currentModel.startsWith('claude') && (
              <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-[9px] font-medium text-green-400 tracking-wide">STREAM</span>
            )}
            <span className="text-[10px] text-fg-muted">
              {currentModelData.tier === 'fast' && '⚡'}
              {currentModelData.tier === 'balanced' && '⚖️'}
              {currentModelData.tier === 'powerful' && '🔥'}
            </span>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {loadingHistory ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="ml-2 text-sm text-fg-tertiary">Carregando conversa...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-cyan-500/20 flex items-center justify-center mb-4 ring-1 ring-blue-500/10">
              <Bot className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-fg-primary">JARVIS</h2>
              <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-[10px] font-bold text-blue-400 tracking-wide">2.0</span>
            </div>
            <p className="text-xs text-fg-tertiary mb-1 max-w-sm">
              Copiloto de estudo adaptativo com tutor socrático, exercícios direcionados, planos de prova e visualizações interativas.
            </p>
            <p className="text-[10px] text-fg-muted mb-6 max-w-xs">
              Adapta-se ao seu nível de mastery e padrões de erro
            </p>
            <div className={`grid gap-2 w-full ${mode === 'floating' ? 'grid-cols-1 max-w-sm' : 'grid-cols-2 max-w-xl'}`}>
              {SUGGESTIONS.slice(0, mode === 'floating' ? 4 : 8).map((sugg, idx) => {
                const Icon = sugg.icon
                return (
                  <button
                    key={idx}
                    onClick={() => sendMessage(sugg.text)}
                    className="text-left p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-all border border-border-default group hover:border-blue-500/20 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-bg-tertiary group-hover:bg-blue-500/10 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-fg-muted group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-medium text-fg-muted group-hover:text-blue-400/80 transition-colors">{sugg.tag}</span>
                        <p className="text-xs text-fg-secondary group-hover:text-fg-primary transition-colors mt-0.5 line-clamp-2">{sugg.text}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="group">
                {msg.role === 'user' ? (
                  /* User message */
                  <div className="flex gap-3 justify-end">
                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-blue-500/15 border border-blue-500/20">
                      <p className="text-sm text-fg-primary">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  /* Assistant message */
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-bg-tertiary flex items-center justify-center mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-blue-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Rendered content */}
                      <MessageContent content={msg.content} />

                      {/* Meta badges */}
                      {msg.meta && (
                        <div className="flex flex-wrap gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.meta.model && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary rounded text-[10px] text-fg-muted">
                              <Cpu className="w-2.5 h-2.5" />
                              {msg.meta.model}
                            </span>
                          )}
                          {msg.meta.durationMs != null && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary rounded text-[10px] text-fg-muted">
                              <Clock className="w-2.5 h-2.5" />
                              {(msg.meta.durationMs / 1000).toFixed(1)}s
                            </span>
                          )}
                          {msg.meta.estimatedCostUsd != null && msg.meta.estimatedCostUsd > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary rounded text-[10px] text-fg-muted">
                              <DollarSign className="w-2.5 h-2.5" />
                              ${msg.meta.estimatedCostUsd.toFixed(4)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tool Results */}
                      {msg.toolResults && msg.toolResults.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {msg.toolResults.map((tool) => {
                            const toolData = tool.data as Record<string, unknown> | undefined
                            const hasHtml = !!(toolData?.html && typeof toolData.html === 'string')
                            const hasMermaid = !!(toolData?.mermaid && typeof toolData.mermaid === 'string')

                            return (
                              <div key={tool.toolCallId} className="rounded-lg overflow-hidden border border-border-default bg-bg-secondary">
                                <button
                                  onClick={() => toggleToolResult(tool.toolCallId)}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-tertiary transition-colors text-xs"
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tool.success ? 'bg-green-500' : 'bg-red-500'}`} />
                                  <Zap className="w-3 h-3 text-fg-muted flex-shrink-0" />
                                  <span className="text-fg-secondary flex-1 text-left truncate">{tool.message.slice(0, 200)}</span>
                                  {(hasHtml || hasMermaid) && (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[9px] font-medium text-purple-400 flex-shrink-0">
                                      {hasHtml ? 'INTERATIVO' : 'DIAGRAMA'}
                                    </span>
                                  )}
                                  {expandedToolResults.has(tool.toolCallId)
                                    ? <ChevronUp className="w-3 h-3 text-fg-muted flex-shrink-0" />
                                    : <ChevronDown className="w-3 h-3 text-fg-muted flex-shrink-0" />}
                                </button>
                                {expandedToolResults.has(tool.toolCallId) && tool.data != null && (
                                  <div className="border-t border-border-default bg-bg-primary">
                                    {/* Interactive HTML preview */}
                                    {hasHtml && (
                                      <div className="p-3">
                                        <iframe
                                          srcDoc={toolData!.html as string}
                                          className="w-full rounded-lg border border-border-default bg-white"
                                          style={{ height: `${(toolData!.height as number) || 400}px` }}
                                          sandbox="allow-scripts"
                                          title={toolData!.title as string || 'Interativo'}
                                        />
                                      </div>
                                    )}
                                    {/* Mermaid diagram preview */}
                                    {hasMermaid && (
                                      <div className="p-3">
                                        <MermaidDiagram chart={toolData!.mermaid as string} />
                                      </div>
                                    )}
                                    {/* Raw data fallback */}
                                    {!hasHtml && !hasMermaid && (
                                      <div className="px-3 py-2 text-[11px] text-fg-tertiary">
                                        <pre className="whitespace-pre-wrap break-words font-mono max-h-40 overflow-y-auto">
                                          {JSON.stringify(tool.data as Record<string, unknown>, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Post-Action Buttons */}
                      {msg.postActions && msg.postActions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {msg.postActions.map((action) => {
                            const ActionIcon = getActionIcon(action.icon)
                            return (
                              <button
                                key={action.id}
                                onClick={() => handleExecuteAction(action)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                                  action.variant === 'primary'
                                    ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20 hover:shadow-sm'
                                    : action.variant === 'secondary'
                                      ? 'bg-bg-tertiary text-fg-secondary hover:text-fg-primary border border-border-default hover:border-blue-500/20'
                                      : 'text-fg-tertiary hover:text-fg-secondary hover:bg-bg-tertiary'
                                }`}
                              >
                                <ActionIcon className="w-3 h-3" />
                                {action.label}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Mix Sources */}
                      {msg.mixSources && msg.mixSources.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleMixSources(msg.id)}
                            className="text-[11px] text-fg-muted hover:text-fg-tertiary transition-colors flex items-center gap-1"
                          >
                            {expandedMixSources.has(msg.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <Layers className="w-3 h-3" />
                            {msg.mixSources.length} modelos contribuíram
                          </button>
                          {expandedMixSources.has(msg.id) && (
                            <div className="mt-2 space-y-2">
                              {msg.mixSources.map((source) => (
                                <div key={source.model} className="pl-3 border-l-2 border-blue-500/30 text-xs">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-medium text-blue-400">{MODELS[source.model]?.name ?? source.model}</span>
                                    <span className="text-fg-muted">{(source.durationMs / 1000).toFixed(1)}s · {source.tokensUsed} tokens</span>
                                  </div>
                                  <p className="text-fg-tertiary line-clamp-2">{source.content.slice(0, 200)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && !messages.some(m => m.role === 'assistant' && m.content === '' && m.id?.startsWith('jarvis_')) && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-bg-tertiary flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-bg-secondary border border-border-default">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span className="text-xs text-fg-tertiary">Pensando...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-400">Erro</p>
                  <p className="text-xs text-fg-tertiary mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-3 py-3 border-t border-border-default bg-bg-secondary">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(inputValue)
              }
            }}
            placeholder="Pergunte algo..."
            className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary text-fg-primary placeholder-fg-muted text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 min-h-[40px] max-h-32"
            rows={1}
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
