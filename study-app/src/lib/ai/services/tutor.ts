// ============================================================
// tutor — Tutoria socrática adaptativa
// ============================================================

import { callAnthropic, parseJSON, buildStudentContext } from "../anthropic";
import type { TutorInput, TutorOutput, AIServiceConfig, AIResponse } from "../types";

const SYSTEM_PROMPT = `Você é um tutor socrático para um aluno de Ciência da Computação (1º semestre).

PRINCÍPIOS INEGOCIÁVEIS:
1. NUNCA dê a resposta direta — guie com perguntas
2. Quando o aluno errar, investigue O QUE ele pensou antes de corrigir
3. Celebre progresso genuíno, não esforço vazio
4. Se detectar misconception, nomeie explicitamente e explique por que é errado
5. Sugira exercícios quando perceber que a conversa teórica saturou
6. Adapte linguagem ao nível de mastery

MÉTODO:
- Pergunta → espere → analise resposta → aprofunde ou corrija → próxima pergunta
- Máximo 2 conceitos por interação
- Se o aluno pedir "me dá a resposta", dê uma dica mais forte mas NÃO a resposta

CONTEXTO DO ALUNO:
{studentContext}

{exerciseContext}

FORMATO DE RESPOSTA — JSON estrito:
{
  "reply": "string — resposta principal do tutor",
  "hint": "string | null — dica socrática se aplicável",
  "detectedMisconception": "string | null — misconception identificado",
  "suggestedExercise": "string | null — exercício sugerido se apropriado"
}`;

export async function tutor(
  input: TutorInput,
  config?: AIServiceConfig
): Promise<AIResponse<TutorOutput>> {
  const studentContext = buildStudentContext({
    courseName: input.courseName,
    topicName: input.topicName,
    masteryLevel: input.masteryLevel,
  });

  const exerciseContext = input.currentExercise
    ? `EXERCÍCIO EM ANDAMENTO:\n${input.currentExercise}`
    : "";

  const system = SYSTEM_PROMPT
    .replace("{studentContext}", studentContext)
    .replace("{exerciseContext}", exerciseContext);

  // Monta conversa como uma mensagem única com histórico formatado
  const historyStr = input.history
    .slice(-10) // últimas 10 mensagens para controlar contexto
    .map((m) => `${m.role === "user" ? "Aluno" : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const userMessage = historyStr
    ? `${historyStr}\n\nAluno: ${input.message}`
    : `Aluno: ${input.message}`;

  return callAnthropic<TutorOutput>(
    {
      service: "tutor",
      system,
      userMessage,
      maxTokens: 1024,
      temperature: 0.5,
      ...config,
    },
    parseJSON
  );
}
