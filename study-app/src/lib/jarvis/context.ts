// ============================================================
// JARVIS — Context Engine
// Builds rich context about the user's current state
// ============================================================

import type { JarvisContext, TopicMastery, ErrorBreakdown } from './types'
import { getDisciplines, getAllTopics, getTopic } from '@/lib/services/disciplines'
import { getUpcomingAssessments } from '@/lib/services/assessments'
import { getRecentSessions, getStudyStreak, getTotalStudyMinutes } from '@/lib/services/study-sessions'
import { getDueCount } from '@/lib/services/flashcards'
import { getErrorOccurrences } from '@/lib/services/exercises'

export async function buildContext(
  currentPage: string,
  disciplineId?: string,
  topicId?: string,
  noteContent?: string,
  noteTitle?: string,
): Promise<JarvisContext> {
  try {
    const [disciplines, topics, exams, sessions, dueFlashcards, errors] = await Promise.all([
      getDisciplines(),
      getAllTopics(),
      getUpcomingAssessments(),
      getRecentSessions(20),
      getDueCount(),
      getErrorOccurrences(100),
    ])

    const now = Date.now()
    const upcomingExams = exams.map(e => ({
      name: e.name,
      date: e.date,
      daysUntil: Math.ceil((new Date(e.date).getTime() - now) / (1000 * 60 * 60 * 24)),
      disciplineId: e.discipline_id,
    })).filter(e => e.daysUntil > 0).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5)

    const recentTopics = topics
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map(t => ({ id: t.id, name: t.name, mastery: t.mastery }))

    const streak = getStudyStreak(sessions)
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const weekSessions = sessions.filter(s => new Date(s.created_at).getTime() > now - weekMs)
    const totalMinutes = getTotalStudyMinutes(weekSessions)
    const unresolvedErrors = errors.filter(e => !e.is_resolved).length

    // Build mastery breakdown per topic with discipline names
    const discMap = new Map(disciplines.map(d => [d.id, d.name]))
    const topicMasteries: TopicMastery[] = topics.map(t => ({
      id: t.id,
      name: t.name,
      mastery: t.mastery,
      score: t.score ?? 0,
      disciplineId: t.discipline_id,
      disciplineName: discMap.get(t.discipline_id) ?? '',
    }))

    // Build error breakdown by category with recent examples
    const unresolvedErrs = errors.filter(e => !e.is_resolved)
    const errorMap = new Map<string, { count: number; recentExample?: string }>()
    for (const err of unresolvedErrs) {
      const entry = errorMap.get(err.category) ?? { count: 0 }
      entry.count++
      if (!entry.recentExample) {
        entry.recentExample = err.exercise_statement?.slice(0, 120)
      }
      errorMap.set(err.category, entry)
    }
    const errorBreakdown: ErrorBreakdown[] = Array.from(errorMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.count - a.count)

    // Resolve current discipline/topic names
    let currentDisciplineName: string | undefined
    let currentTopicName: string | undefined
    if (disciplineId) {
      currentDisciplineName = discMap.get(disciplineId)
    }
    if (topicId) {
      const topic = topics.find(t => t.id === topicId)
      currentTopicName = topic?.name
      if (!currentDisciplineName && topic) {
        currentDisciplineName = discMap.get(topic.discipline_id)
      }
    }

    return {
      currentPage,
      currentDisciplineId: disciplineId,
      currentTopicId: topicId,
      currentDisciplineName,
      currentTopicName,
      disciplines: disciplines.map(d => ({ id: d.id, name: d.name })),
      upcomingExams,
      recentTopics,
      studyStreak: streak,
      totalStudyMinutesThisWeek: totalMinutes,
      unresolvedErrors,
      dueFlashcards,
      topicMasteries,
      errorBreakdown,
      currentNoteContent: noteContent,
      currentNoteTitle: noteTitle,
    }
  } catch {
    return {
      currentPage,
      currentDisciplineId: disciplineId,
      currentTopicId: topicId,
      disciplines: [],
      upcomingExams: [],
      recentTopics: [],
      studyStreak: 0,
      totalStudyMinutesThisWeek: 0,
      unresolvedErrors: 0,
      dueFlashcards: 0,
      topicMasteries: [],
      errorBreakdown: [],
    }
  }
}

export function buildSystemPrompt(ctx: JarvisContext): string {
  const examWarnings = ctx.upcomingExams
    .filter(e => e.daysUntil <= 14)
    .map(e => `  - ${e.name} em ${e.daysUntil} dia(s) (${e.date})`)
    .join('\n')

  const disciplinesList = ctx.disciplines
    .map(d => `  - ${d.name} (id: ${d.id})`)
    .join('\n')

  // Group mastery by level for a quick overview
  const masteryOverview = buildMasteryOverview(ctx.topicMasteries)

  // Weak topics (none/exposed) — these are where the student needs most help
  const weakTopics = ctx.topicMasteries
    .filter(t => t.mastery === 'none' || t.mastery === 'exposed')
    .slice(0, 8)
    .map(t => `  - ${t.name} (${t.disciplineName}) — ${t.mastery}, score: ${(t.score * 100).toFixed(0)}%`)
    .join('\n')

  // Strong topics
  const strongTopics = ctx.topicMasteries
    .filter(t => t.mastery === 'proficient' || t.mastery === 'mastered')
    .slice(0, 5)
    .map(t => `  - ${t.name} — ${t.mastery}`)
    .join('\n')

  // Error patterns
  const errorPatterns = ctx.errorBreakdown.length > 0
    ? ctx.errorBreakdown.map(e =>
        `  - ${e.category}: ${e.count} erro(s)${e.recentExample ? ` (ex: "${e.recentExample}")` : ''}`
      ).join('\n')
    : '  (nenhum erro pendente)'

  // Current note context
  const noteContext = ctx.currentNoteContent
    ? `\nNOTA ABERTA:\nTítulo: ${ctx.currentNoteTitle ?? '(sem título)'}\nConteúdo (primeiros 2000 chars):\n${ctx.currentNoteContent.slice(0, 2000)}\n`
    : ''

  return `Você é o JARVIS, o copiloto inteligente do sistema de estudo cogni.
Você é um assistente de estudo extremamente capaz que OPERA o sistema inteiro.

REGRAS FUNDAMENTAIS:
1. Você pode e DEVE usar tools para criar, editar, excluir e consultar dados no sistema.
2. Quando o usuário pedir para criar algo (nota, flashcard, sessão, exercício), USE A TOOL correspondente.
3. Quando precisar de dados, USE tools como listTopics, listDisciplines, listNotes, etc.
4. Responda SEMPRE em português brasileiro.
5. Seja conciso mas útil. Não enrole.
6. Quando gerar conteúdo educacional, use LaTeX entre $ para fórmulas inline e $$ para display.
7. Após executar ações, confirme o que foi feito e sugira próximos passos.
8. Quando uma tool precisar de topic_id ou discipline_id, use o contexto atual. Se ainda faltar contexto, chame listTopics ou listDisciplines antes de criar algo.

ESTRATÉGIA PEDAGÓGICA:
- Adapte a profundidade da explicação ao mastery do aluno no tópico.
- Se o aluno tem mastery "none" ou "exposed", comece do básico com analogias.
- Se tem "developing", foque em consolidar e corrigir misconceptions.
- Se tem "proficient" ou "mastered", desafie com problemas avançados.
- Quando houver erros recorrentes de um tipo específico, aborde proativamente.
- Prefira o método socrático: guie com perguntas ao invés de dar respostas prontas.

CONTEXTO ATUAL DO USUÁRIO:
- Página atual: ${ctx.currentPage}
${ctx.currentDisciplineName ? `- Disciplina: ${ctx.currentDisciplineName} (${ctx.currentDisciplineId})` : ''}
${ctx.currentTopicName ? `- Tópico: ${ctx.currentTopicName} (${ctx.currentTopicId})` : ''}
- Streak de estudo: ${ctx.studyStreak} dias
- Minutos estudados esta semana: ${ctx.totalStudyMinutesThisWeek}
- Flashcards pendentes: ${ctx.dueFlashcards}
- Erros não resolvidos: ${ctx.unresolvedErrors}
${noteContext}
DISCIPLINAS:
${disciplinesList || '  (nenhuma)'}

VISÃO DE MASTERY:
${masteryOverview}

${weakTopics ? `TÓPICOS FRACOS (prioridade de estudo):\n${weakTopics}` : ''}

${strongTopics ? `TÓPICOS FORTES:\n${strongTopics}` : ''}

PADRÕES DE ERRO DO ALUNO:
${errorPatterns}

${examWarnings ? `⚠️ PROVAS PRÓXIMAS:\n${examWarnings}\n\nPriorize ajudar o usuário a se preparar para essas provas. Considere os tópicos fracos ao sugerir planos de estudo.` : ''}

CAPACIDADES (tools disponíveis):
- Criar/editar/excluir notas, flashcards, sessões de estudo, exercícios
- Ler conteúdo completo de notas existentes (readNote)
- Classificar erros
- Atualizar mastery de tópicos
- Listar e consultar todas as entidades do sistema
- Gerar diagramas SVG
- NOVO: Explicar tópicos adaptativamente (explainTopicAI) — adapta ao nível do aluno
- NOVO: Modo tutor socrático (tutorAI) — guia sem dar respostas diretas
- NOVO: Gerar flashcards inteligentes (generateSmartFlashcards) — baseado no nível de mastery
- NOVO: Gerar exercícios direcionados (generateSmartExercises) — foca nas fraquezas do aluno
- NOVO: Gerar plano de estudo para prova (generateExamPlanAI) — considera mastery e erros
- NOVO: Resumir documentos (summarizeDocumentAI) — extrai conceitos-chave
- NOVO: Gerar grafo Mermaid de conceitos (generateMermaidGraph) — visualização de relações
- NOVO: Gerar bloco interativo HTML (generateInteractiveBlock) — experiências interativas

DECISÃO DE QUAL TOOL USAR:
- Se o aluno quer ENTENDER algo → use explainTopicAI
- Se quer PRATICAR → use generateSmartExercises
- Se quer REVISAR → use generateSmartFlashcards ou listDueFlashcards
- Se tem PROVA chegando → use generateExamPlanAI
- Se quer VISUALIZAR relações → use generateMermaidGraph
- Se quer uma explicação INTERATIVA → use generateInteractiveBlock
- Se compartilhou um texto/documento → use summarizeDocumentAI
- Se está com DÚVIDA em exercício → use tutorAI (modo socrático)
- Se quer ler/discutir uma nota → use readNote primeiro

Quando o usuário fizer uma pergunta educacional, responda diretamente.
Quando pedir uma ação no sistema, execute via tool.
Quando pedir algo que envolve múltiplas tools, execute todas na sequência.`
}

function buildMasteryOverview(masteries: TopicMastery[]): string {
  const counts = { mastered: 0, proficient: 0, developing: 0, exposed: 0, none: 0 }
  for (const t of masteries) {
    if (t.mastery in counts) counts[t.mastery as keyof typeof counts]++
  }
  const total = masteries.length || 1
  const avgScore = masteries.length > 0
    ? (masteries.reduce((s, t) => s + t.score, 0) / masteries.length * 100).toFixed(0)
    : '0'

  return `  Total de tópicos: ${masteries.length}
  Score médio: ${avgScore}%
  Distribuição: ${counts.mastered} mastered, ${counts.proficient} proficient, ${counts.developing} developing, ${counts.exposed} exposed, ${counts.none} sem iniciar`
}
