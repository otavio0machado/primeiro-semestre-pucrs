// ============================================================
// summarizeDocument — Resume documentos acadêmicos
// ============================================================

import { callAnthropic, parseJSON } from "../anthropic";
import type { SummarizeDocumentInput, SummarizeDocumentOutput, AIServiceConfig, AIResponse } from "../types";

const SYSTEM_PROMPT = `Você resume documentos acadêmicos de matemática e ciência da computação.

NÍVEIS DE PROFUNDIDADE:
- brief: 2-3 frases com o essencial
- standard: 1-2 parágrafos com definições e resultados principais
- detailed: Resumo completo com hierarquia de seções, todas as definições, e resultados-chave

REGRAS:
- Extraia definições formais com notação precisa
- Identifique teoremas/lemas/resultados-chave
- Se focusTopics fornecido, enfatize esses tópicos
- NÃO invente conteúdo que não está no documento
- Use LaTeX para notação matemática

FORMATO DE RESPOSTA — JSON estrito:
{
  "summary": "string — resumo em markdown",
  "topicsFound": ["string — tópicos identificados"],
  "definitions": [{"term": "string", "definition": "string"}],
  "keyResults": ["string — teoremas/resultados principais"]
}`;

export async function summarizeDocument(
  input: SummarizeDocumentInput,
  config?: AIServiceConfig
): Promise<AIResponse<SummarizeDocumentOutput>> {
  const focusStr = input.focusTopics?.length
    ? `\nFOCO: ${input.focusTopics.join(", ")}`
    : "";

  const userMessage = `DISCIPLINA: ${input.courseName}
PROFUNDIDADE: ${input.depth}${focusStr}

DOCUMENTO:
${input.content.slice(0, 12000)}

Resuma o documento.`;

  const maxTokensMap = { brief: 512, standard: 1024, detailed: 2048 };

  return callAnthropic<SummarizeDocumentOutput>(
    {
      service: "summarizeDocument",
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: maxTokensMap[input.depth],
      temperature: 0.2,
      ...config,
    },
    parseJSON
  );
}
