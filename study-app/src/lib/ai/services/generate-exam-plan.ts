// ============================================================
// generateExamPlan — Plano de estudo otimizado para prova
// ============================================================

import { callAnthropic, parseJSON } from "../anthropic";
import type { GenerateExamPlanInput, GenerateExamPlanOutput, AIServiceConfig, AIResponse } from "../types";

const SYSTEM_PROMPT = `Você é um planejador de estudo baseado em evidência (spaced repetition, interleaving, testing effect).

PRINCÍPIOS:
1. Tópicos com menor score = maior prioridade
2. Erros "conceptual" e "prerequisite" devem ser atacados ANTES dos procedurais
3. Intercale teoria e exercícios (nunca mais de 2h seguidas do mesmo tipo)
4. Reserve o último dia antes da prova para revisão e simulado, NÃO conteúdo novo
5. Se horas/dia insuficientes, priorize ruthlessly — melhor dominar 70% do que ver 100% superficialmente
6. Inclua revisão espaçada de tópicos estudados dias anteriores

CONTEXTO:
- Aluno de 1º semestre CC — precisa de plano realista, não ideal
- Cada bloco tem duração em minutos (30-120 min)

FORMATO DE RESPOSTA — JSON estrito:
{
  "totalDays": number,
  "blocks": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "topic": "string",
      "activity": "theory | exercises | review | simulation",
      "durationMin": number,
      "priority": "critical | high | medium | low",
      "rationale": "string — por que este bloco neste momento"
    }
  ],
  "riskTopics": ["string — tópicos com maior chance de queda"],
  "strategy": "string — resumo da estratégia geral em 2-3 frases"
}`;

export async function generateExamPlan(
  input: GenerateExamPlanInput,
  config?: AIServiceConfig
): Promise<AIResponse<GenerateExamPlanOutput>> {
  const topicsSummary = input.topics
    .map((t) => `  - ${t.name}: mastery=${t.mastery}, score=${t.score.toFixed(2)}`)
    .join("\n");

  const errorsSummary = input.errorPatterns?.length
    ? `\nPADRÕES DE ERRO:\n${input.errorPatterns.map((e) => `  - ${e.class}: ${e.count} ocorrências`).join("\n")}`
    : "";

  const userMessage = `PROVA: ${input.examName}
DISCIPLINA: ${input.courseName}
DATA DA PROVA: ${input.examDate}
DATA DE HOJE: ${new Date().toISOString().split("T")[0]}
HORAS DISPONÍVEIS POR DIA: ${input.hoursPerDay}

TÓPICOS:
${topicsSummary}
${errorsSummary}

Gere o plano de estudo otimizado.`;

  return callAnthropic<GenerateExamPlanOutput>(
    {
      service: "generateExamPlan",
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 3072,
      temperature: 0.3,
      ...config,
    },
    parseJSON
  );
}
