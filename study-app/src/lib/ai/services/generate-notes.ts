// ============================================================
// generateNotes — Gera notas estruturadas a partir de conteúdo-fonte
// ============================================================

import { callAnthropic, parseJSON } from "../anthropic";
import type { GenerateNotesInput, GenerateNotesOutput, AIServiceConfig, AIResponse } from "../types";

const SYSTEM_PROMPT = `Você transforma conteúdo acadêmico em notas de estudo de alta qualidade.

FORMATOS:
- cornell: Seções "Notas", "Cues" (perguntas laterais), e "Resumo"
- outline: Hierarquia I. A. 1. a. com indentação clara
- concept-map: Lista de nós (conceitos) e arestas (relações) em texto
- summary: Parágrafo denso com os pontos essenciais

REGRAS:
- Extraia CONCEITOS-CHAVE — não copie texto verbatim
- Identifique RELAÇÕES entre conceitos (implica, depende de, é caso particular de)
- Use notação LaTeX para fórmulas
- Mantenha precisão terminológica da disciplina
- Seja conciso — notas, não livro-texto

FORMATO DE RESPOSTA — JSON estrito:
{
  "title": "string — título da nota",
  "content": "string — conteúdo no formato solicitado (markdown)",
  "keyConcepts": ["string — conceitos-chave"],
  "connections": [{"from": "string", "to": "string", "relation": "string"}]
}`;

export async function generateNotes(
  input: GenerateNotesInput,
  config?: AIServiceConfig
): Promise<AIResponse<GenerateNotesOutput>> {
  const userMessage = `DISCIPLINA: ${input.courseName}
TÓPICO: ${input.topicName}
FORMATO: ${input.format}

CONTEÚDO-FONTE:
${input.sourceContent.slice(0, 8000)}

Gere as notas.`;

  return callAnthropic<GenerateNotesOutput>(
    {
      service: "generateNotes",
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 2048,
      temperature: 0.3,
      ...config,
    },
    parseJSON
  );
}
