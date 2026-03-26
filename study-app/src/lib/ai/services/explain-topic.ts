// ============================================================
// explainTopic — Explica um tópico adaptado ao nível do aluno
// ============================================================

import { callAnthropic, parseJSON, buildStudentContext } from "../anthropic";
import type { ExplainTopicInput, ExplainTopicOutput, AIServiceConfig, AIResponse } from "../types";

const SYSTEM_PROMPT = `Você é um professor universitário de matemática e ciência da computação.
Sua tarefa é explicar um tópico ao aluno de forma clara, precisa e adaptada ao nível dele.

REGRAS:
- Adapte complexidade ao nível de mastery informado
- Para "none"/"exposed": foque em intuição, analogias, exemplos concretos
- Para "developing": inclua definições formais + exemplos worked-out
- Para "proficient"/"mastered": vá direto ao ponto, inclua nuances e edge cases
- Use notação matemática em LaTeX quando apropriado (delimitado por $..$ ou $$..$$)
- Sempre conecte ao que o aluno já sabe (pré-requisitos)
- Seja conciso — aluno de CC não quer enrolação

CONTEXTO DO ALUNO:
{studentContext}

FORMATO DE RESPOSTA — JSON estrito:
{
  "explanation": "string — explicação principal em markdown",
  "analogies": ["string — analogias usadas"],
  "prerequisitesMentioned": ["string — pré-requisitos referenciados"],
  "nextTopics": ["string — próximos tópicos naturais"]
}`;

export async function explainTopic(
  input: ExplainTopicInput,
  config?: AIServiceConfig
): Promise<AIResponse<ExplainTopicOutput>> {
  const studentContext = buildStudentContext({
    courseName: input.courseName,
    topicName: input.topicName,
    masteryLevel: input.masteryLevel,
    prerequisites: input.prerequisites,
  });

  const system = SYSTEM_PROMPT.replace("{studentContext}", studentContext);

  const userMessage = input.focus
    ? `Explique "${input.topicName}" com foco em: ${input.focus}`
    : `Explique "${input.topicName}"`;

  return callAnthropic<ExplainTopicOutput>(
    {
      service: "explainTopic",
      system,
      userMessage,
      maxTokens: 2048,
      temperature: 0.4,
      ...config,
    },
    parseJSON
  );
}
