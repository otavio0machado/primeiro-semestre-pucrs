// ============================================================
// JARVIS — Orchestrator
// Routes requests to providers, executes tools, synthesizes
// ============================================================

import type {
  ModelId,
  JarvisMessage,
  JarvisContext,
  OrchestratorResponse,
  ProviderResponse,
  ToolResult,
  PostAction,
  MixSource,
} from './types'
import { MODELS as ModelRegistry } from './types'
import { callClaude, streamClaude } from './providers/claude'
import { callGemini } from './providers/gemini'
import { buildSystemPrompt } from './context'
import { toProviderTools, executeTool } from './tools'
import { supabase } from '@/lib/supabase'

// ── Main Entry Point ────────────────────────────────────────

export async function orchestrate(
  messages: JarvisMessage[],
  model: ModelId,
  context: JarvisContext,
): Promise<OrchestratorResponse> {
  const systemPrompt = buildSystemPrompt(context)
  const providerTools = toProviderTools()

  if (model === 'mix') {
    return executeMixMode(messages, context, systemPrompt, providerTools)
  }

  return executeSingleModel(messages, model, context, systemPrompt, providerTools)
}

// ── Single Model Execution ──────────────────────────────────

async function executeSingleModel(
  messages: JarvisMessage[],
  model: ModelId,
  context: JarvisContext,
  systemPrompt: string,
  providerTools: ReturnType<typeof toProviderTools>,
): Promise<OrchestratorResponse> {
  const modelInfo = ModelRegistry[model]
  if (!modelInfo) throw new Error(`Model ${model} not found`)

  const conversationMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Call provider
  let response: ProviderResponse

  if (modelInfo.provider === 'anthropic') {
    response = await callClaude(model, {
      systemPrompt,
      messages: conversationMessages,
      tools: providerTools,
      maxTokens: modelInfo.maxTokens,
      temperature: 0.4,
    })
  } else if (modelInfo.provider === 'google') {
    response = await callGemini(model, {
      systemPrompt,
      messages: conversationMessages,
      tools: providerTools,
      maxTokens: modelInfo.maxTokens,
      temperature: 0.4,
    })
  } else {
    throw new Error(`Unknown provider for model ${model}`)
  }

  // Execute tool calls if any
  const toolResults: ToolResult[] = []
  let finalContent = response.content

  if (response.toolCalls && response.toolCalls.length > 0) {
    for (const tc of response.toolCalls) {
      const result = await executeTool(tc.name, tc.arguments, tc.id, context)
      toolResults.push(result)
    }

    // If tools were called, make a follow-up call with tool results
    const toolResultsSummary = toolResults.map(r =>
      `[Tool ${r.toolCallId}]: ${r.success ? '✓' : '✗'} ${r.message}`
    ).join('\n')

    const followUpMessages = [
      ...conversationMessages,
      { role: 'assistant' as const, content: response.content || 'Executando ações...' },
      { role: 'user' as const, content: `Resultados das ferramentas:\n${toolResultsSummary}\n\nResuma o que foi feito e sugira próximos passos.` },
    ]

    let followUp: ProviderResponse

    if (modelInfo.provider === 'anthropic') {
      followUp = await callClaude(model, {
        systemPrompt,
        messages: followUpMessages,
        maxTokens: modelInfo.maxTokens,
        temperature: 0.4,
      })
    } else {
      followUp = await callGemini(model, {
        systemPrompt,
        messages: followUpMessages,
        maxTokens: modelInfo.maxTokens,
        temperature: 0.4,
      })
    }

    finalContent = followUp.content
    response.usage.inputTokens += followUp.usage.inputTokens
    response.usage.outputTokens += followUp.usage.outputTokens
    response.durationMs += followUp.durationMs
  }

  // Generate post-actions based on context
  const postActions = generatePostActions(finalContent, toolResults, messages, context)

  // Estimate cost
  const costInput = (response.usage.inputTokens / 1000) * modelInfo.costPer1kInput
  const costOutput = (response.usage.outputTokens / 1000) * modelInfo.costPer1kOutput
  const totalCost = costInput + costOutput

  // Log usage
  await logUsage(model, response.usage.inputTokens, response.usage.outputTokens, totalCost, response.durationMs)

  const assistantMessage: JarvisMessage = {
    id: `jarvis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content: finalContent,
    model,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    postActions: postActions.length > 0 ? postActions : undefined,
    meta: {
      model: response.model,
      durationMs: response.durationMs,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      estimatedCostUsd: totalCost,
    },
    timestamp: Date.now(),
  }

  return { message: assistantMessage, toolsExecuted: toolResults }
}

// ── Mix Mode ────────────────────────────────────────────────

async function executeMixMode(
  messages: JarvisMessage[],
  context: JarvisContext,
  systemPrompt: string,
  providerTools: ReturnType<typeof toProviderTools>,
): Promise<OrchestratorResponse> {
  // Send to multiple models in parallel
  const mixModels: ModelId[] = []

  // Always include one Claude model
  if (process.env.ANTHROPIC_API_KEY) {
    mixModels.push('claude-sonnet-4-6')
  }
  // Include Gemini if available
  if (process.env.GOOGLE_AI_API_KEY) {
    mixModels.push('gemini-2.5-flash')
  }
  // If we only have one provider, add a second model from same provider
  if (mixModels.length === 1 && process.env.ANTHROPIC_API_KEY) {
    mixModels.push('claude-haiku-4-5-20251001')
  }

  if (mixModels.length === 0) {
    throw new Error('No AI providers configured for Mix mode')
  }

  const conversationMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Call all models in parallel
  const results = await Promise.allSettled(
    mixModels.map(async (modelId) => {
      const modelInfo = ModelRegistry[modelId]
      const start = Date.now()
      let resp: ProviderResponse

      if (modelInfo.provider === 'anthropic') {
        resp = await callClaude(modelId, {
          systemPrompt,
          messages: conversationMessages,
          tools: providerTools,
          maxTokens: modelInfo.maxTokens,
          temperature: 0.4,
        })
      } else {
        resp = await callGemini(modelId, {
          systemPrompt,
          messages: conversationMessages,
          tools: providerTools,
          maxTokens: modelInfo.maxTokens,
          temperature: 0.4,
        })
      }

      return {
        modelId,
        content: resp.content,
        toolCalls: resp.toolCalls,
        durationMs: Date.now() - start,
        tokensUsed: resp.usage.inputTokens + resp.usage.outputTokens,
      }
    })
  )

  const successResults = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<{
      modelId: ModelId
      content: string
      toolCalls?: ProviderResponse['toolCalls']
      durationMs: number
      tokensUsed: number
    }>).value)

  if (successResults.length === 0) {
    throw new Error('All models failed in Mix mode')
  }

  // Execute tools from the first model that requested them
  const toolResults: ToolResult[] = []
  for (const result of successResults) {
    if (result.toolCalls && result.toolCalls.length > 0) {
      for (const tc of result.toolCalls) {
        const toolResult = await executeTool(tc.name, tc.arguments, tc.id, context)
        toolResults.push(toolResult)
      }
      break // Only execute tools from one model
    }
  }

  // Synthesize responses using the strongest available model
  const synthesisModel = process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4-6' : mixModels[0]
  const synthesisModelInfo = ModelRegistry[synthesisModel]

  const responsesText = successResults.map((r, i) =>
    `--- Resposta ${i + 1} (${ModelRegistry[r.modelId].name}) ---\n${r.content}`
  ).join('\n\n')

  const synthesisMessages = [
    ...conversationMessages,
    {
      role: 'user' as const,
      content: `Múltiplas IAs responderam à última pergunta. Sintetize uma resposta final que combine o melhor de cada uma.\n\n${responsesText}\n\n${toolResults.length > 0 ? `Ferramentas executadas:\n${toolResults.map(r => `- ${r.message}`).join('\n')}\n\n` : ''}Gere a melhor resposta possível, combinando os pontos fortes de cada IA. Não mencione que houve múltiplas respostas.`,
    },
  ]

  let synthesisResponse: ProviderResponse
  if (synthesisModelInfo.provider === 'anthropic') {
    synthesisResponse = await callClaude(synthesisModel, {
      systemPrompt,
      messages: synthesisMessages,
      maxTokens: synthesisModelInfo.maxTokens,
      temperature: 0.3,
    })
  } else {
    synthesisResponse = await callGemini(synthesisModel, {
      systemPrompt,
      messages: synthesisMessages,
      maxTokens: synthesisModelInfo.maxTokens,
      temperature: 0.3,
    })
  }

  const mixSources: MixSource[] = successResults.map(r => ({
    model: r.modelId,
    content: r.content,
    durationMs: r.durationMs,
    tokensUsed: r.tokensUsed,
  }))

  const totalDuration = successResults.reduce((sum, r) => sum + r.durationMs, 0) + synthesisResponse.durationMs
  const postActions = generatePostActions(synthesisResponse.content, toolResults, messages, context)

  const assistantMessage: JarvisMessage = {
    id: `jarvis_mix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content: synthesisResponse.content,
    model: 'mix',
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    postActions: postActions.length > 0 ? postActions : undefined,
    mixSources,
    meta: {
      model: 'mix',
      durationMs: totalDuration,
      inputTokens: successResults.reduce((s, r) => s + r.tokensUsed, 0),
      outputTokens: synthesisResponse.usage.outputTokens,
      estimatedCostUsd: 0, // Complex to calculate for mix
    },
    timestamp: Date.now(),
  }

  return { message: assistantMessage, toolsExecuted: toolResults }
}

// ── Post-Action Generation (Context-Aware) ──────────────────

function generatePostActions(
  content: string,
  toolResults: ToolResult[],
  messages: JarvisMessage[],
  context: JarvisContext,
): PostAction[] {
  const actions: PostAction[] = []
  const ts = Date.now()
  const contentLower = content.toLowerCase()
  const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() ?? ''

  // Detect conversation intent
  const isExplanation = contentLower.includes('definição') || contentLower.includes('teorema') ||
    contentLower.includes('conceito') || contentLower.includes('fórmula') ||
    lastUserMsg.includes('explica') || lastUserMsg.includes('o que é') || lastUserMsg.includes('como funciona')
  const isExerciseRelated = contentLower.includes('exercício') || contentLower.includes('questão') ||
    contentLower.includes('resolva') || contentLower.includes('calcule')
  const hasPlanContent = contentLower.includes('plano') || contentLower.includes('cronograma')
  const createdContent = toolResults.some(r => r.success)

  // Find current topic mastery for smart suggestions
  const currentMastery = context.topicMasteries.find(t => t.id === context.currentTopicId)
  const masteryLevel = currentMastery?.mastery ?? 'none'
  const topicName = context.currentTopicName ?? ''
  const courseName = context.currentDisciplineName ?? ''

  // 1. After explanation → offer to save as note + generate flashcards
  if (isExplanation) {
    actions.push({
      id: `pa_note_${ts}`,
      label: 'Salvar como nota',
      icon: 'StickyNote',
      action: 'createNote',
      params: { content, title: `${topicName || 'Nota'} — Jarvis`, format: 'summary', topic_id: context.currentTopicId, discipline_id: context.currentDisciplineId },
      variant: 'primary',
    })
    actions.push({
      id: `pa_flash_${ts}`,
      label: 'Gerar flashcards',
      icon: 'Layers',
      action: 'generateSmartFlashcards',
      params: { topic_name: topicName, course_name: courseName, source_content: content, topic_id: context.currentTopicId, discipline_id: context.currentDisciplineId },
      variant: 'secondary',
    })
  }

  // 2. After exercises → offer more exercises or tutor mode
  if (isExerciseRelated) {
    actions.push({
      id: `pa_more_ex_${ts}`,
      label: 'Mais exercícios',
      icon: 'Dumbbell',
      action: 'generateSmartExercises',
      params: { topic_name: topicName, course_name: courseName, topic_id: context.currentTopicId, discipline_id: context.currentDisciplineId },
      variant: 'secondary',
    })
    actions.push({
      id: `pa_tutor_${ts}`,
      label: 'Modo tutor',
      icon: 'Brain',
      action: 'tutorAI',
      params: { topic_name: topicName, course_name: courseName, message: 'Me ajude a entender como resolver esse tipo de exercício' },
      variant: 'ghost',
    })
  }

  // 3. Based on mastery level — proactive suggestions
  if (!isExplanation && !isExerciseRelated && currentMastery) {
    if (masteryLevel === 'none' || masteryLevel === 'exposed') {
      actions.push({
        id: `pa_explain_${ts}`,
        label: `Explicar ${topicName || 'tópico'}`,
        icon: 'Brain',
        action: 'explainTopicAI',
        params: { topic_name: topicName, course_name: courseName },
        variant: 'primary',
      })
    } else if (masteryLevel === 'developing') {
      actions.push({
        id: `pa_practice_${ts}`,
        label: 'Praticar com exercícios',
        icon: 'Dumbbell',
        action: 'generateSmartExercises',
        params: { topic_name: topicName, course_name: courseName, topic_id: context.currentTopicId, discipline_id: context.currentDisciplineId },
        variant: 'primary',
      })
    } else if (masteryLevel === 'proficient' || masteryLevel === 'mastered') {
      actions.push({
        id: `pa_challenge_${ts}`,
        label: 'Desafio avançado',
        icon: 'Zap',
        action: 'generateSmartExercises',
        params: { topic_name: topicName, course_name: courseName, difficulty: 5, topic_id: context.currentTopicId, discipline_id: context.currentDisciplineId },
        variant: 'secondary',
      })
    }
  }

  // 4. If there are upcoming exams, suggest exam plan
  if (!hasPlanContent && context.upcomingExams.length > 0) {
    const nextExam = context.upcomingExams[0]
    if (nextExam.daysUntil <= 14) {
      actions.push({
        id: `pa_exam_${ts}`,
        label: `Plano para ${nextExam.name}`,
        icon: 'Calendar',
        action: 'generateExamPlanAI',
        params: { exam_name: nextExam.name, course_name: courseName, exam_date: nextExam.date, hours_per_day: 3 },
        variant: 'ghost',
      })
    }
  }

  // 5. If there are due flashcards, remind
  if (context.dueFlashcards > 0 && !isExerciseRelated && !isExplanation) {
    actions.push({
      id: `pa_review_${ts}`,
      label: `Revisar ${context.dueFlashcards} flashcards`,
      icon: 'Layers',
      action: 'listDueFlashcards',
      params: {},
      variant: 'ghost',
    })
  }

  // 6. After study plan → register session
  if (hasPlanContent || createdContent) {
    actions.push({
      id: `pa_session_${ts}`,
      label: 'Registrar sessão',
      icon: 'Clock',
      action: 'createStudySession',
      params: { kind: 'study', topic_id: context.currentTopicId, discipline_id: context.currentDisciplineId },
      variant: 'ghost',
    })
  }

  return actions.slice(0, 4)
}

// ── Streaming Orchestration ─────────────────────────────────

export async function orchestrateStream(
  messages: JarvisMessage[],
  model: ModelId,
  context: JarvisContext,
  onDelta: (delta: string) => void,
  onToolResults: (results: ToolResult[]) => void,
  onPostActions: (actions: PostAction[]) => void,
  onMeta: (meta: JarvisMessage['meta']) => void,
): Promise<void> {
  const systemPrompt = buildSystemPrompt(context)
  const providerTools = toProviderTools()
  const modelInfo = ModelRegistry[model]

  if (!modelInfo || model === 'mix') {
    // Fall back to non-streaming for mix mode
    const result = await orchestrate(messages, model, context)
    onDelta(result.message.content)
    if (result.toolsExecuted.length > 0) onToolResults(result.toolsExecuted)
    if (result.message.postActions) onPostActions(result.message.postActions)
    if (result.message.meta) onMeta(result.message.meta)
    return
  }

  const conversationMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  let response: import('./types').ProviderResponse

  if (modelInfo.provider === 'anthropic') {
    response = await streamClaude(model, {
      systemPrompt,
      messages: conversationMessages,
      tools: providerTools,
      maxTokens: modelInfo.maxTokens,
      temperature: 0.4,
    }, onDelta)
  } else {
    // Gemini doesn't support streaming in our implementation yet — fall back
    response = await (await import('./providers/gemini')).callGemini(model, {
      systemPrompt,
      messages: conversationMessages,
      tools: providerTools,
      maxTokens: modelInfo.maxTokens,
      temperature: 0.4,
    })
    onDelta(response.content)
  }

  // Execute tool calls if any
  const toolResults: ToolResult[] = []
  let finalContent = response.content

  if (response.toolCalls && response.toolCalls.length > 0) {
    for (const tc of response.toolCalls) {
      const result = await executeTool(tc.name, tc.arguments, tc.id, context)
      toolResults.push(result)
    }
    onToolResults(toolResults)

    // Follow-up call with tool results (streamed)
    const toolResultsSummary = toolResults.map(r =>
      `[Tool ${r.toolCallId}]: ${r.success ? '✓' : '✗'} ${r.message}`
    ).join('\n')

    const followUpMessages = [
      ...conversationMessages,
      { role: 'assistant' as const, content: response.content || 'Executando ações...' },
      { role: 'user' as const, content: `Resultados das ferramentas:\n${toolResultsSummary}\n\nResuma o que foi feito e sugira próximos passos.` },
    ]

    let followUp: import('./types').ProviderResponse

    if (modelInfo.provider === 'anthropic') {
      followUp = await streamClaude(model, {
        systemPrompt,
        messages: followUpMessages,
        maxTokens: modelInfo.maxTokens,
        temperature: 0.4,
      }, onDelta)
    } else {
      followUp = await (await import('./providers/gemini')).callGemini(model, {
        systemPrompt,
        messages: followUpMessages,
        maxTokens: modelInfo.maxTokens,
        temperature: 0.4,
      })
      onDelta(followUp.content)
    }

    finalContent = followUp.content
    response.usage.inputTokens += followUp.usage.inputTokens
    response.usage.outputTokens += followUp.usage.outputTokens
    response.durationMs += followUp.durationMs
  }

  // Post-actions and meta
  const postActions = generatePostActions(finalContent, toolResults, messages, context)
  if (postActions.length > 0) onPostActions(postActions)

  const costInput = (response.usage.inputTokens / 1000) * modelInfo.costPer1kInput
  const costOutput = (response.usage.outputTokens / 1000) * modelInfo.costPer1kOutput
  const totalCost = costInput + costOutput

  onMeta({
    model: response.model,
    durationMs: response.durationMs,
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
    estimatedCostUsd: totalCost,
  })

  await logUsage(model, response.usage.inputTokens, response.usage.outputTokens, totalCost, response.durationMs)
}

// ── Usage Logging ───────────────────────────────────────────

async function logUsage(model: string, inputTokens: number, outputTokens: number, cost: number, durationMs: number) {
  try {
    await supabase.from('ai_usage_log').insert({
      service: 'jarvis',
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: cost,
      duration_ms: durationMs,
    })
  } catch {
    // Logging failure shouldn't break the flow
  }
}
