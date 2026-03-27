import { callAnthropic, parseJSON } from "../anthropic";
import type {
  AIResponse,
  AIServiceConfig,
  GenerateNoteGraphInput,
  GenerateNoteGraphOutput,
} from "../types";

const SYSTEM_PROMPT = `Você gera diagramas Mermaid para notas de estudo universitárias.

OBJETIVO:
- Transformar explicações ou pedidos do usuário em um gráfico Mermaid claro e útil para revisão.

REGRAS:
- Responda com JSON estrito.
- Gere apenas sintaxe Mermaid válida, sem cercas de markdown.
- Se graphType = auto, escolha o tipo mais adequado.
- Tipos suportados: flowchart, mindmap, sequenceDiagram, journey, quadrantChart, xychart.
- Para funções, séries numéricas, comparações ao longo de um eixo x ou pares ordenados, prefira xychart.
- Não use quadrantChart para plotar função matemática, a menos que o usuário peça explicitamente análise por quadrantes.
- Prefira rótulos curtos e legíveis.
- O diagrama deve ser fiel ao conteúdo da nota e ao pedido do usuário.
- Não invente conceitos fora do contexto dado.
- Se houver fórmulas, represente a relação conceitual, não tente forçar LaTeX no Mermaid.
- Nunca adicione explicação, observação ou texto narrativo dentro do campo "mermaid".
- Se o pedido descrever interface, mockup, dashboard, tela de celular, app ou layout visual, converta isso para uma estrutura conceitual simples em vez de tentar simular UI detalhada.
- Prefira poucos nós e legibilidade alta. Evite diagramas gigantescos que fiquem ilegíveis ao serem inseridos na nota.
- Em quadrantChart, use a sintaxe oficial sem aspas nos pontos: \`Ponto A: [0.75, 0.80]\`.
- Em quadrantChart, os valores x e y devem ficar entre 0 e 1.
- O campo "mermaid" deve começar diretamente com a definição Mermaid, por exemplo:
  - "flowchart TD"
  - "mindmap"
  - "sequenceDiagram"
  - "journey"
  - "quadrantChart"
  - "xychart"

FORMATO DE RESPOSTA:
{
  "title": "string",
  "mermaid": "string",
  "explanation": "string"
}`;

export async function generateNoteGraph(
  input: GenerateNoteGraphInput,
  config?: AIServiceConfig,
): Promise<AIResponse<GenerateNoteGraphOutput>> {
  const courseBlock = input.courseName ? `DISCIPLINA: ${input.courseName}\n` : "";
  const topicBlock = input.topicName ? `TÓPICO: ${input.topicName}\n` : "";

  const userMessage = `${courseBlock}${topicBlock}TIPO PREFERIDO: ${input.graphType}

PEDIDO DO USUÁRIO:
${input.request}

TRECHO DA NOTA:
${input.noteContent.slice(0, 6000)}

Gere um diagrama Mermaid adequado para inserir na nota.`;

  return callAnthropic<GenerateNoteGraphOutput>(
    {
      service: "generateNoteGraph",
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 1536,
      temperature: 0.2,
      ...config,
    },
    parseJSON,
  );
}
