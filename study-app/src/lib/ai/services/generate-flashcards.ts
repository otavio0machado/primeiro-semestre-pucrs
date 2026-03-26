// ============================================================
// generateFlashcards — Gera flashcards para spaced repetition
// ============================================================

import { callAnthropic, parseJSON, buildStudentContext } from "../anthropic";
import type { GenerateFlashcardsInput, GenerateFlashcardsOutput, AIServiceConfig, AIResponse } from "../types";

const SYSTEM_PROMPT = `Você gera flashcards de alta qualidade para estudo universitário de matemática/CS.

REGRAS:
- Front: pergunta clara e atômica (um conceito por card)
- Back: resposta precisa, concisa, com notação LaTeX quando apropriado
- Tipos: definition (o que é X?), theorem (enuncie Y), procedure (como se faz Z?), example (resolva W)
- Dificuldade: 1 (reconhecimento), 2 (aplicação), 3 (análise/síntese)
- Adapte ao nível de mastery:
  - none/exposed: foco em definitions + exemplos simples, dificuldade 1
  - developing: mix de todos, dificuldade 1-2
  - proficient/mastered: mais procedures + theorems, dificuldade 2-3
- Se sourceContent fornecido, baseie os cards nesse material

CONTEXTO DO ALUNO:
{studentContext}

FORMATO DE RESPOSTA — JSON estrito:
{
  "cards": [
    {
      "front": "string",
      "back": "string",
      "type": "definition | theorem | procedure | example",
      "difficulty": 1 | 2 | 3
    }
  ]
}`;

export async function generateFlashcards(
  input: GenerateFlashcardsInput,
  config?: AIServiceConfig
): Promise<AIResponse<GenerateFlashcardsOutput>> {
  const studentContext = buildStudentContext({
    courseName: input.courseName,
    topicName: input.topicName,
    masteryLevel: input.masteryLevel,
  });

  const system = SYSTEM_PROMPT.replace("{studentContext}", studentContext);

  const count = input.count ?? 5;
  const typeFilter = input.cardTypes?.length
    ? `\nTipos desejados: ${input.cardTypes.join(", ")}`
    : "";
  const sourceBlock = input.sourceContent
    ? `\n\nMATERIAL-FONTE:\n${input.sourceContent.slice(0, 4000)}`
    : "";

  const userMessage = `Gere ${count} flashcards sobre "${input.topicName}".${typeFilter}${sourceBlock}`;

  return callAnthropic<GenerateFlashcardsOutput>(
    {
      service: "generateFlashcards",
      system,
      userMessage,
      maxTokens: 1536,
      temperature: 0.4,
      ...config,
    },
    parseJSON
  );
}
