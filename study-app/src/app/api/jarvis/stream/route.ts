// ============================================================
// JARVIS — Streaming API Route
// POST /api/jarvis/stream — SSE endpoint for streaming responses
// ============================================================

import { buildContext } from '@/lib/jarvis/context'
import { orchestrateStream } from '@/lib/jarvis/orchestrator'
import type { ModelId, JarvisMessage } from '@/lib/jarvis/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      messages,
      model,
      currentPage,
      disciplineId,
      topicId,
      noteContent,
      noteTitle,
    } = body as {
      messages: JarvisMessage[]
      model: ModelId
      currentPage?: string
      disciplineId?: string
      topicId?: string
      noteContent?: string
      noteTitle?: string
    }

    if (!model || !messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Model and messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const context = await buildContext(
      currentPage ?? '/',
      disciplineId,
      topicId,
      noteContent,
      noteTitle,
    )

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }

        try {
          await orchestrateStream(
            messages,
            model,
            context,
            // onDelta
            (delta) => send('delta', { text: delta }),
            // onToolResults
            (results) => send('tool_results', results),
            // onPostActions
            (actions) => send('post_actions', actions),
            // onMeta
            (meta) => send('meta', meta),
          )
          send('done', {})
        } catch (error) {
          send('error', { message: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
