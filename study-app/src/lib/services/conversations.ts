import { supabase } from '@/lib/supabase'
import type { JarvisMessage, ModelId } from '@/lib/jarvis/types'

// ─── Row Types ──────────────────────────────────────────────

export interface ConversationRow {
  id: string
  title: string
  model: string
  current_page: string | null
  discipline_id: string | null
  topic_id: string | null
  total_cost_usd: number
  message_count: number
  created_at: string
  updated_at: string
}

export interface MessageRow {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  model: string | null
  meta: Record<string, unknown> | null
  tool_results: Record<string, unknown>[] | null
  post_actions: Record<string, unknown>[] | null
  mix_sources: Record<string, unknown>[] | null
  created_at: string
}

// ─── Conversation CRUD ──────────────────────────────────────

export async function getConversations(limit = 50): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from('jarvis_conversations')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getConversation(id: string): Promise<ConversationRow | null> {
  const { data, error } = await supabase
    .from('jarvis_conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createConversation(params: {
  title?: string
  model?: string
  currentPage?: string
  disciplineId?: string
  topicId?: string
}): Promise<ConversationRow> {
  const { data, error } = await supabase
    .from('jarvis_conversations')
    .insert({
      title: params.title ?? 'Nova conversa',
      model: params.model ?? 'claude-sonnet-4-6',
      current_page: params.currentPage ?? null,
      discipline_id: params.disciplineId ?? null,
      topic_id: params.topicId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateConversation(
  id: string,
  updates: { title?: string; model?: string; total_cost_usd?: number }
): Promise<void> {
  const { error } = await supabase
    .from('jarvis_conversations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('jarvis_conversations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Message CRUD ───────────────────────────────────────────

export async function getMessages(conversationId: string): Promise<JarvisMessage[]> {
  const { data, error } = await supabase
    .from('jarvis_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map(rowToJarvisMessage)
}

export async function saveMessage(
  conversationId: string,
  msg: JarvisMessage
): Promise<void> {
  const messageId = isUuid(msg.id) ? msg.id : undefined

  const { error } = await supabase
    .from('jarvis_messages')
    .insert({
      id: messageId,
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      model: msg.model ?? null,
      meta: msg.meta ? (msg.meta as unknown as Record<string, unknown>) : null,
      tool_results: msg.toolResults ? (msg.toolResults as unknown as Record<string, unknown>[]) : null,
      post_actions: msg.postActions ? (msg.postActions as unknown as Record<string, unknown>[]) : null,
      mix_sources: msg.mixSources ? (msg.mixSources as unknown as Record<string, unknown>[]) : null,
    })

  if (error) throw error
}

export async function saveMessages(
  conversationId: string,
  msgs: JarvisMessage[]
): Promise<void> {
  for (const msg of msgs) {
    await saveMessage(conversationId, msg)
  }
}

// ─── Auto-title ─────────────────────────────────────────────

export function generateTitle(firstMessage: string): string {
  const clean = firstMessage.trim()
  if (clean.length <= 50) return clean
  return clean.slice(0, 47) + '...'
}

// ─── Helpers ────────────────────────────────────────────────

function rowToJarvisMessage(row: MessageRow): JarvisMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    model: (row.model as ModelId) ?? undefined,
    meta: row.meta
      ? (row.meta as unknown as JarvisMessage['meta'])
      : undefined,
    toolResults: row.tool_results as unknown as JarvisMessage['toolResults'],
    postActions: row.post_actions as unknown as JarvisMessage['postActions'],
    mixSources: row.mix_sources as unknown as JarvisMessage['mixSources'],
    timestamp: new Date(row.created_at).getTime(),
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}
