// ============================================================
// JARVIS — Type System
// ============================================================

// ── Provider Models ─────────────────────────────────────────

export type ClaudeModel = 'claude-opus-4-6' | 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001'
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro'
export type ModelId = ClaudeModel | GeminiModel | 'mix'

export interface ModelInfo {
  id: ModelId
  name: string
  provider: 'anthropic' | 'google' | 'mix'
  tier: 'fast' | 'balanced' | 'powerful'
  costPer1kInput: number   // USD
  costPer1kOutput: number  // USD
  maxTokens: number
  supportsTools: boolean
  supportsStreaming: boolean
}

export const MODELS: Record<string, ModelInfo> = {
  'claude-opus-4-6': {
    id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'anthropic',
    tier: 'powerful', costPer1kInput: 0.015, costPer1kOutput: 0.075,
    maxTokens: 16384, supportsTools: true, supportsStreaming: true,
  },
  'claude-sonnet-4-6': {
    id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic',
    tier: 'balanced', costPer1kInput: 0.003, costPer1kOutput: 0.015,
    maxTokens: 8192, supportsTools: true, supportsStreaming: true,
  },
  'claude-haiku-4-5-20251001': {
    id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'anthropic',
    tier: 'fast', costPer1kInput: 0.0008, costPer1kOutput: 0.004,
    maxTokens: 8192, supportsTools: true, supportsStreaming: true,
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google',
    tier: 'fast', costPer1kInput: 0.00015, costPer1kOutput: 0.0006,
    maxTokens: 8192, supportsTools: true, supportsStreaming: true,
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google',
    tier: 'powerful', costPer1kInput: 0.00125, costPer1kOutput: 0.01,
    maxTokens: 16384, supportsTools: true, supportsStreaming: true,
  },
  'mix': {
    id: 'mix', name: 'Mix (Multi-IA)', provider: 'mix',
    tier: 'powerful', costPer1kInput: 0, costPer1kOutput: 0,
    maxTokens: 16384, supportsTools: true, supportsStreaming: false,
  },
}

// ── Messages ────────────────────────────────────────────────

export interface JarvisMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  model?: ModelId
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  postActions?: PostAction[]
  meta?: {
    model: string
    durationMs: number
    inputTokens: number
    outputTokens: number
    estimatedCostUsd: number
  }
  mixSources?: MixSource[]
  timestamp: number
}

export interface MixSource {
  model: ModelId
  content: string
  durationMs: number
  tokensUsed: number
}

// ── Tool System ─────────────────────────────────────────────

export interface ToolDefinition {
  name: string
  description: string
  category: 'notes' | 'flashcards' | 'sessions' | 'exercises' | 'exams' | 'errors' | 'explain' | 'progress' | 'visual' | 'ai-services' | 'tutoring'
  parameters: Record<string, ToolParameter>
  required: string[]
  execute: (params: Record<string, unknown>, context?: JarvisContext) => Promise<ToolResult>
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array'
  description: string
  enum?: string[]
  items?: { type: string; properties?: Record<string, unknown>; required?: string[] }
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  success: boolean
  data?: unknown
  error?: string
  message: string // human-readable summary
}

// ── Post-Response Actions ───────────────────────────────────

export interface PostAction {
  id: string
  label: string
  icon: string // lucide icon name
  action: string // tool name to execute
  params: Record<string, unknown>
  variant: 'primary' | 'secondary' | 'ghost'
}

// ── Context ─────────────────────────────────────────────────

export interface TopicMastery {
  id: string
  name: string
  mastery: string
  score: number
  disciplineId: string
  disciplineName: string
}

export interface ErrorBreakdown {
  category: string
  count: number
  recentExample?: string
}

export interface JarvisContext {
  currentPage: string
  currentDisciplineId?: string
  currentTopicId?: string
  currentDisciplineName?: string
  currentTopicName?: string
  disciplines: { id: string; name: string }[]
  upcomingExams: { name: string; date: string; daysUntil: number; disciplineId: string }[]
  recentTopics: { id: string; name: string; mastery: string }[]
  studyStreak: number
  totalStudyMinutesThisWeek: number
  unresolvedErrors: number
  dueFlashcards: number
  /** Mastery breakdown per topic with scores */
  topicMasteries: TopicMastery[]
  /** Error breakdown by category with examples */
  errorBreakdown: ErrorBreakdown[]
  /** Content of the currently open note (if on notes page) */
  currentNoteContent?: string
  /** Title of the currently open note */
  currentNoteTitle?: string
}

// ── Orchestrator ────────────────────────────────────────────

export interface OrchestratorRequest {
  messages: JarvisMessage[]
  model: ModelId
  context: JarvisContext
  stream?: boolean
}

export interface OrchestratorResponse {
  message: JarvisMessage
  toolsExecuted: ToolResult[]
}

// ── Provider Interface ──────────────────────────────────────

export interface ProviderRequest {
  systemPrompt: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  tools?: ProviderTool[]
  maxTokens: number
  temperature: number
  stream?: boolean
}

export interface ProviderTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}

export interface ProviderResponse {
  content: string
  toolCalls?: ToolCall[]
  usage: { inputTokens: number; outputTokens: number }
  model: string
  durationMs: number
}
