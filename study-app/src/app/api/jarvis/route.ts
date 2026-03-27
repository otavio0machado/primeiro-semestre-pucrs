// ============================================================
// JARVIS — API Route
// POST /api/jarvis — Main endpoint for Jarvis interactions
// ============================================================

import { NextResponse } from 'next/server'
import { orchestrate } from '@/lib/jarvis/orchestrator'
import { buildContext } from '@/lib/jarvis/context'
import { executeTool, getTool } from '@/lib/jarvis/tools'
import type { ModelId, JarvisMessage, PostAction } from '@/lib/jarvis/types'

function buildActionInstruction(action: PostAction): string {
  const params = Object.keys(action.params).length > 0
    ? JSON.stringify(action.params, null, 2)
    : '{}'

  return [
    `Execute a ação "${action.action}" com base no contexto atual.`,
    `Rótulo do botão: ${action.label}`,
    `Parâmetros:`,
    params,
  ].join('\n')
}

function makeAssistantMessage(
  model: ModelId,
  content: string,
  toolResults: JarvisMessage['toolResults'] = [],
): JarvisMessage {
  return {
    id: `jarvis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content,
    model,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    timestamp: Date.now(),
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      messages,
      action,
      model,
      currentPage,
      disciplineId,
      topicId,
      noteContent,
      noteTitle,
    } = body as {
      messages?: JarvisMessage[]
      action?: PostAction
      model: ModelId
      currentPage?: string
      disciplineId?: string
      topicId?: string
      noteContent?: string
      noteTitle?: string
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      )
    }

    if (!action && (!messages || messages.length === 0)) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // Build context from current app state
    const context = await buildContext(
      currentPage ?? '/',
      disciplineId,
      topicId,
      noteContent,
      noteTitle,
    )

    if (action) {
      const tool = getTool(action.action)

      if (tool) {
        const toolResult = await executeTool(
          action.action,
          action.params,
          `action_${Date.now()}`,
          context,
        )

        return NextResponse.json({
          message: makeAssistantMessage(model, toolResult.message, [toolResult]),
          toolsExecuted: [toolResult],
        })
      }

      const actionMessage: JarvisMessage = {
        id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: 'user',
        content: buildActionInstruction(action),
        timestamp: Date.now(),
      }

      const result = await orchestrate([...(messages ?? []), actionMessage], model, context)

      return NextResponse.json({
        message: result.message,
        toolsExecuted: result.toolsExecuted,
      })
    }

    // Run orchestrator
    const result = await orchestrate(messages ?? [], model, context)

    return NextResponse.json({
      message: result.message,
      toolsExecuted: result.toolsExecuted,
    })
  } catch (error) {
    console.error('[Jarvis API Error]', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = errorMessage.includes('API key') ? 401
      : errorMessage.includes('rate') ? 429
      : errorMessage.includes('not found') ? 404
      : 500

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
