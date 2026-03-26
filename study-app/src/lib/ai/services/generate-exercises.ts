// ============================================================
// generateExercises — Gera exercícios adaptativos
// ============================================================

import { callAnthropic, parseJSON, buildStudentContext } from "../anthropic";
import type { GenerateExercisesInput, GenerateExercisesOutput, AIServiceConfig, AIResponse } from "../types";

const SYSTEM_PROMPT = `Você gera exercícios de matemática/CS para um aluno de 1º semestre.

REGRAS DE DIFICULDADE (1-5):
1: Reconhecimento — "O que é...", "Qual a definição de..."
2: Aplicação direta — aplique a fórmula/procedimento uma vez
3: Aplicação com variação — mesmo conceito, setup diferente, ou 2 passos
4: Combinação — exige 2+ conceitos ou procedimentos encadeados
5: Análise/Prova — demonstre, prove, ou analise edge cases

TIPOS:
- multiple-choice: 4 opções (A-D), exatamente 1 correta, distractors baseados em erros comuns
- open-ended: resposta livre com solução detalhada
- proof: demonstração formal (nível 4-5 apenas)
- computation: cálculo com resposta numérica/simbólica

REQUISITOS:
- Cada exercício deve ter 1-3 hints progressivos (do vago ao específico)
- A solução deve ser COMPLETA e step-by-step
- Se targetErrors fornecido, gere exercícios que forcem o aluno a confrontar esses erros
- Gere IDs únicos no formato "ex-{topicId}-{n}"
- Use LaTeX para notação ($..$ inline, $$...$$ display)

CONTEXTO DO ALUNO:
{studentContext}

FORMATO DE RESPOSTA — JSON estrito:
{
  "exercises": [
    {
      "id": "string",
      "statement": "string — enunciado completo",
      "type": "multiple-choice | open-ended | proof | computation",
      "difficulty": 1-5,
      "options": [{"label": "A", "text": "string", "isCorrect": boolean}] | null,
      "solution": "string — solução completa step-by-step",
      "hints": ["string — dica 1 (vaga)", "string — dica 2 (média)", "string — dica 3 (forte)"],
      "conceptsTested": ["string"]
    }
  ]
}`;

export async function generateExercises(
  input: GenerateExercisesInput,
  config?: AIServiceConfig
): Promise<AIResponse<GenerateExercisesOutput>> {
  const studentContext = buildStudentContext({
    courseName: input.courseName,
    topicName: input.topicName,
    masteryLevel: input.masteryLevel,
  });

  const system = SYSTEM_PROMPT.replace("{studentContext}", studentContext);

  const count = input.count ?? 3;
  const difficulty = input.difficulty ?? (
    input.masteryLevel === "none" ? 1 :
    input.masteryLevel === "exposed" ? 2 :
    input.masteryLevel === "developing" ? 3 :
    input.masteryLevel === "proficient" ? 4 : 5
  );

  const typeFilter = input.types?.length
    ? `\nTipos: ${input.types.join(", ")}`
    : "";
  const errorFilter = input.targetErrors?.length
    ? `\nErros-alvo que o aluno comete: ${input.targetErrors.join(", ")}`
    : "";

  const userMessage = `Gere ${count} exercícios sobre "${input.topicName}".
Dificuldade alvo: ${difficulty}${typeFilter}${errorFilter}`;

  return callAnthropic<GenerateExercisesOutput>(
    {
      service: "generateExercises",
      system,
      userMessage,
      maxTokens: 3072,
      temperature: 0.5,
      ...config,
    },
    parseJSON
  );
}
