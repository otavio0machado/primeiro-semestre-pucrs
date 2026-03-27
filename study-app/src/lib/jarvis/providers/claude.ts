import Anthropic from '@anthropic-ai/sdk'
import type { ProviderRequest, ProviderResponse, ToolCall } from '../types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

/** Stream Claude response, yielding text deltas via callback */
export async function streamClaude(
  model: string,
  request: ProviderRequest,
  onDelta: (delta: string) => void,
): Promise<ProviderResponse> {
  const startTime = Date.now()

  const messages = request.messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const tools = request.tools?.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool.InputSchema,
  }))

  const apiRequest: Anthropic.MessageCreateParams = {
    model,
    max_tokens: request.maxTokens,
    temperature: request.temperature,
    system: request.systemPrompt,
    messages,
    ...(tools && tools.length > 0 ? { tools } : {}),
    stream: true,
  }

  let content = ''
  const toolCalls: ToolCall[] = []
  let inputTokens = 0
  let outputTokens = 0
  let responseModel = model

  const stream = client.messages.stream(apiRequest)

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      if (event.delta.type === 'text_delta') {
        content += event.delta.text
        onDelta(event.delta.text)
      } else if (event.delta.type === 'input_json_delta') {
        // Tool input being built — no action needed until complete
      }
    } else if (event.type === 'content_block_start') {
      if (event.content_block.type === 'tool_use') {
        toolCalls.push({
          id: event.content_block.id,
          name: event.content_block.name,
          arguments: {},
        })
      }
    } else if (event.type === 'message_start') {
      if (event.message.usage) {
        inputTokens = event.message.usage.input_tokens
      }
      responseModel = event.message.model
    } else if (event.type === 'message_delta') {
      if (event.usage) {
        outputTokens = event.usage.output_tokens
      }
    }
  }

  // Get final tool arguments from the stream's final message
  const finalMessage = await stream.finalMessage()
  for (const block of finalMessage.content) {
    if (block.type === 'tool_use') {
      const existing = toolCalls.find(tc => tc.id === block.id)
      if (existing) {
        existing.arguments = block.input as Record<string, unknown>
      }
    }
  }
  inputTokens = finalMessage.usage.input_tokens
  outputTokens = finalMessage.usage.output_tokens

  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: { inputTokens, outputTokens },
    model: responseModel,
    durationMs: Date.now() - startTime,
  }
}

export async function callClaude(
  model: string,
  request: ProviderRequest
): Promise<ProviderResponse> {
  const startTime = Date.now()

  // Build messages array for Anthropic API
  const messages = request.messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Build tools array if provided
  const tools = request.tools?.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool.InputSchema,
  }))

  const apiRequest: Anthropic.MessageCreateParams = {
    model,
    max_tokens: request.maxTokens,
    temperature: request.temperature,
    system: request.systemPrompt,
    messages,
    ...(tools && tools.length > 0 ? { tools } : {}),
  }

  const response = await client.messages.create(apiRequest)

  // Extract text content and tool calls
  let content = ''
  const toolCalls: ToolCall[] = []

  for (const block of response.content) {
    if (block.type === 'text') {
      content += block.text
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        arguments: block.input as Record<string, unknown>,
      })
    }
  }

  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    model: response.model,
    durationMs: Date.now() - startTime,
  }
}
