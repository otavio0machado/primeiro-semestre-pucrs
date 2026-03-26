// ============================================================
// API Route helpers — validação, error handling, rate limiting
// ============================================================

import { NextResponse } from "next/server";
import type { AIError } from "./types";

/**
 * Wrapper para route handlers AI.
 * Valida método, parseia body, captura erros, retorna formato consistente.
 */
export async function handleAIRoute<TInput, TOutput>(
  request: Request,
  validator: (body: unknown) => TInput | null,
  handler: (input: TInput) => Promise<{ data: TOutput; usage: { inputTokens: number; outputTokens: number; estimatedCostUSD: number }; model: string; durationMs: number }>
): Promise<NextResponse> {
  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Body JSON inválido." } },
      { status: 400 }
    );
  }

  // Validate
  const input = validator(body);
  if (!input) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Campos obrigatórios ausentes ou inválidos." } },
      { status: 400 }
    );
  }

  // Execute
  try {
    const result = await handler(input);
    return NextResponse.json({
      data: result.data,
      meta: {
        model: result.model,
        durationMs: result.durationMs,
        usage: result.usage,
      },
    });
  } catch (err) {
    const aiError = err as AIError;
    const statusMap: Record<string, number> = {
      RATE_LIMIT: 429,
      AUTH_ERROR: 500,
      CONTEXT_LENGTH: 400,
      TIMEOUT: 504,
      UNKNOWN: 500,
    };
    return NextResponse.json(
      { error: { code: aiError.code ?? "UNKNOWN", message: aiError.message ?? "Erro interno." } },
      { status: statusMap[aiError.code] ?? 500 }
    );
  }
}
