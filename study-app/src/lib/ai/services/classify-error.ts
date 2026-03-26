// ============================================================
// classifyError — Classifica erros do aluno em categorias
// ============================================================

import { callAnthropic, parseJSON } from "../anthropic";
import type { ClassifyErrorInput, ClassifyErrorOutput, AIServiceConfig, AIResponse } from "../types";

const SYSTEM_PROMPT = `Você é um especialista em diagnóstico de erros de aprendizagem em matemática e computação.

CATEGORIAS DE ERRO:
- conceptual: O aluno não entende o conceito subjacente
- procedural: O aluno entende o conceito mas erra na execução do procedimento
- algebraic: Erro puramente algébrico/aritmético (conta errada, sinal trocado)
- prerequisite: O erro vem de um conceito anterior que o aluno não domina
- reading: O aluno não entendeu o enunciado

INSTRUÇÕES:
1. Compare a resposta do aluno com a correta
2. Identifique ONDE exatamente o erro ocorreu
3. Classifique na categoria mais específica
4. Infira o raciocínio provável do aluno
5. Se for prerequisite, identifique QUAL conceito está faltando
6. Sugira remediação específica e acionável

FORMATO DE RESPOSTA — JSON estrito:
{
  "errorClass": "conceptual | procedural | algebraic | prerequisite | reading",
  "confidence": 0.0-1.0,
  "explanation": "string — o que o aluno errou",
  "likelyReasoning": "string — o que o aluno provavelmente pensou",
  "missingPrerequisite": "string | null — só se errorClass === prerequisite",
  "remediation": "string — ação concreta para corrigir"
}`;

export async function classifyError(
  input: ClassifyErrorInput,
  config?: AIServiceConfig
): Promise<AIResponse<ClassifyErrorOutput>> {
  const userMessage = `DISCIPLINA: ${input.courseName}
TÓPICO: ${input.topicName}

ENUNCIADO:
${input.exerciseStatement}

RESPOSTA CORRETA:
${input.correctAnswer}

RESPOSTA DO ALUNO:
${input.studentAnswer}

Classifique o erro.`;

  return callAnthropic<ClassifyErrorOutput>(
    {
      service: "classifyError",
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 768,
      temperature: 0.2,
      ...config,
    },
    parseJSON
  );
}
