// ============================================================
// Document Analysis via Claude
// Classifies document type and extracts structured information
// ============================================================

import { callAI } from '@/lib/ai/router'
import { parseJSON } from '@/lib/ai/anthropic'
import type { DocumentAnalysis, BootstrapInput, BootstrapResult } from './types'

/**
 * Analyze a document's content using Claude.
 * Classifies type, extracts topics, exercises, dates, and key concepts.
 */
export async function analyzeDocument(
  text: string,
  context: { disciplineName?: string; fileName: string }
): Promise<DocumentAnalysis> {
  // Truncate to keep within context + keep processing fast
  const maxChars = 30_000 // ~7.5k tokens — faster processing
  const truncatedText = text.length > maxChars
    ? text.slice(0, maxChars) + '\n\n[... texto truncado ...]'
    : text

  const system = `Analise este documento acadêmico. Retorne APENAS JSON puro, sem markdown, sem texto antes ou depois.

{"doc_type":"syllabus|exercise_list|slides|textbook|past_exam|lecture_notes|solution_key|other","confidence":0.0-1.0,"topics":[{"name":"...","module_hint":"...","difficulty_estimate":1-5}],"key_concepts":["..."],"exercises":[{"statement":"...","topic_hint":"...","difficulty":1-5}],"dates":[{"label":"...","date":"YYYY-MM-DD","type":"exam|assignment|deadline|other"}],"summary":"resumo curto","assessment_info":{"type":"...","weight":"...","topics_covered":["..."]}}

REGRAS: max 10 tópicos, max 3 exercícios amostra, summary max 150 chars. Sem markdown. JSON puro.`

  const userMessage = `Arquivo: ${context.fileName}
${context.disciplineName ? `Disciplina: ${context.disciplineName}` : ''}

CONTEÚDO DO DOCUMENTO:
${truncatedText}`

  const response = await callAI<DocumentAnalysis>(
    {
      service: 'document-analysis',
      system,
      userMessage,
      maxTokens: 4096,
      temperature: 0.1,
    },
    parseJSON<DocumentAnalysis>
  )

  return response.data
}

/**
 * Generate a complete curriculum from document analyses and academic profile.
 * This is the core bootstrap intelligence.
 */
export async function generateCurriculum(input: BootstrapInput): Promise<BootstrapResult> {
  const documentsContext = input.documents
    .filter((d) => d.analysis || d.extractedText)
    .map((d) => {
      const parts = [`--- DOCUMENTO: ${d.fileName} (${d.docType}) ---`]
      if (d.analysis) {
        parts.push(`Tipo detectado: ${d.analysis.doc_type} (confiança: ${d.analysis.confidence})`)
        parts.push(`Resumo: ${d.analysis.summary}`)
        if (d.analysis.topics.length > 0) {
          parts.push(`Tópicos: ${d.analysis.topics.map((t) => t.name).join(', ')}`)
        }
        if (d.analysis.dates.length > 0) {
          parts.push(`Datas: ${d.analysis.dates.map((dt) => `${dt.label}: ${dt.date}`).join(', ')}`)
        }
        if (d.analysis.key_concepts.length > 0) {
          parts.push(`Conceitos-chave: ${d.analysis.key_concepts.join(', ')}`)
        }
        if (d.analysis.assessment_info) {
          parts.push(`Info avaliação: ${JSON.stringify(d.analysis.assessment_info)}`)
        }
      }
      if (d.extractedText) {
        // Include first 2000 chars of raw text for context
        parts.push(`Texto (amostra): ${d.extractedText.slice(0, 2000)}`)
      }
      return parts.join('\n')
    })
    .join('\n\n')

  const system = `Você é o motor de curricularização do cogni., um sistema de estudo com IA.
Recebeu os documentos acadêmicos de um estudante e precisa gerar um currículo estruturado.

DADOS DO ALUNO:
- Universidade: ${input.university}
- Curso: ${input.course}
- Semestre: ${input.currentSemester}/${input.totalSemesters}
- Período: ${input.enrollmentYear}

Retorne EXCLUSIVAMENTE um JSON válido com esta estrutura:
{
  "disciplines": [
    {
      "name": "Nome da Disciplina",
      "professor": "Prof. Nome" (se detectado nos documentos),
      "modules": [
        {
          "name": "Nome do Módulo",
          "order": 1,
          "topics": [
            {
              "name": "Nome do Tópico",
              "difficulty": 1-5,
              "prerequisites": ["nome_topico_prerequisito"]
            }
          ]
        }
      ],
      "assessments": [
        {
          "name": "P1",
          "type": "prova" | "trabalho",
          "date": "YYYY-MM-DD" (se detectado),
          "weight": 0.3,
          "topics": ["topico1", "topico2"]
        }
      ]
    }
  ]
}

REGRAS:
- Tópicos devem seguir a ordem do plano de ensino/ementa se disponível
- Pré-requisitos devem ser inferidos da lógica conceitual
- Dificuldade: 1=básico, 2=fácil, 3=médio, 4=difícil, 5=avançado
- Se informação conflitar entre documentos, priorize: ementa > slides > livro
- Agrupe tópicos em módulos lógicos (3-5 tópicos por módulo)
- MÁXIMO 4 módulos por disciplina, MÁXIMO 5 tópicos por módulo
- MÁXIMO 5 assessments por disciplina
- Nomes curtos para tópicos (max 40 caracteres)
- Pré-requisitos: use APENAS nomes de tópicos já listados na mesma disciplina
- Se nenhum documento for fornecido, gere um currículo padrão para o curso/semestre
- Cada disciplina deve ter pelo menos 2 módulos e 5 tópicos
- RESPONDA COM O JSON MAIS COMPACTO POSSÍVEL, sem espaços desnecessários`

  const userMessage = documentsContext.length > 0
    ? `DOCUMENTOS ANALISADOS:\n\n${documentsContext}`
    : `Nenhum documento foi fornecido. Gere um currículo padrão para ${input.course} - semestre ${input.currentSemester} na ${input.university}.`

  const response = await callAI<{ disciplines: BootstrapResult['disciplines'] }>(
    {
      service: 'bootstrap-curriculum',
      system,
      userMessage,
      maxTokens: 8192,
      temperature: 0.2,
    },
    parseJSON<{ disciplines: BootstrapResult['disciplines'] }>
  )

  return {
    disciplines: response.data.disciplines,
    flashcardsGenerated: 0, // Will be populated after DB inserts
    kgNodesCreated: 0,
    kgEdgesCreated: 0,
  }
}

/**
 * Generate initial flashcards for a set of topics.
 */
export async function generateInitialFlashcards(
  disciplineName: string,
  topics: Array<{ name: string; difficulty: number }>
): Promise<Array<{ front: string; back: string; topic: string; type: string }>> {
  const system = `Gere flashcards de estudo para os tópicos fornecidos.
Cada flashcard deve ter front (pergunta) e back (resposta concisa).
Foque em definições e conceitos fundamentais, não cálculos.
Gere 2-3 flashcards por tópico.

Retorne EXCLUSIVAMENTE um JSON array:
[{ "front": "...", "back": "...", "topic": "nome_do_topico", "type": "definition" | "theorem" | "procedure" | "example" }]`

  const userMessage = `Disciplina: ${disciplineName}
Tópicos:
${topics.map((t) => `- ${t.name} (dificuldade: ${t.difficulty}/5)`).join('\n')}`

  const response = await callAI<Array<{ front: string; back: string; topic: string; type: string }>>(
    {
      service: 'bootstrap-flashcards',
      system,
      userMessage,
      maxTokens: 2048,
      temperature: 0.3,
    },
    parseJSON
  )

  return response.data
}
