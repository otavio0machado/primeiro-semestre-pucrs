import { callAnthropic, parseJSON } from "../anthropic";
import type {
  AIResponse,
  AIServiceConfig,
  GenerateNoteInteractiveInput,
  GenerateNoteInteractiveOutput,
} from "../types";

const SYSTEM_PROMPT = `Voce cria blocos interativos em HTML/CSS/JS para notas de estudo universitarias.

OBJETIVO:
- Transformar o pedido do usuario e o contexto da nota em uma experiencia interativa realmente util.
- A experiencia pode ser um dashboard, simulador, painel, explicacao exploravel, quiz curto, comparador ou mockup funcional.

REGRAS OBRIGATORIAS:
- Responda com JSON estrito.
- O campo "html" deve ser AUTOCONTIDO: HTML, CSS e JS inline, sem CDN, sem imports, sem assets externos.
- Nao use bibliotecas externas.
- O bloco sera renderizado dentro de um iframe sandboxado. Tudo deve funcionar offline.
- Use texto legivel, espacamento generoso e contraste alto.
- Se o pedido mencionar celular, mobile, app, dashboard mobile, transporte ativo em celular, iPhone ou Android, prefira frame = "phone".
- Caso contrario, escolha frame = "canvas" quando a experiencia ficar melhor em largura maior.
- Evite interfaces gigantescas ou miniaturas impraticaveis. O layout inicial precisa nascer bem proporcionado.
- Para frame = "phone", projete pensando em largura de 390px.
- Para frame = "canvas", projete pensando em largura responsiva e altura moderada.
- Nao invente conteudo fora do contexto da nota. Pode reorganizar e sintetizar, mas deve permanecer fiel.
- Nao use alert, prompt, confirm, navegacao externa ou chamadas de rede.
- O JS deve ser curto, deterministico e focado na interacao essencial.
- O campo "height" deve ser um inteiro entre 560 e 920.

FORMATO DE RESPOSTA:
{
  "title": "string",
  "html": "string",
  "explanation": "string",
  "frame": "phone | canvas",
  "height": 720
}`;

export async function generateNoteInteractive(
  input: GenerateNoteInteractiveInput,
  config?: AIServiceConfig,
): Promise<AIResponse<GenerateNoteInteractiveOutput>> {
  const courseBlock = input.courseName ? `DISCIPLINA: ${input.courseName}\n` : "";
  const topicBlock = input.topicName ? `TOPICO: ${input.topicName}\n` : "";
  const frameBlock = `FRAME PREFERIDO: ${input.frameHint ?? "auto"}\n`;

  const userMessage = `${courseBlock}${topicBlock}${frameBlock}
PEDIDO DO USUARIO:
${input.request}

TRECHO DA NOTA:
${input.noteContent.slice(0, 8000)}

Gere um bloco interativo pronto para insercao na nota.`;

  return callAnthropic<GenerateNoteInteractiveOutput>(
    {
      service: "generateNoteInteractive",
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 4096,
      temperature: 0.3,
      ...config,
    },
    parseJSON,
  );
}
