import { NextResponse } from "next/server";
import {
  generateText,
  getLlmModel,
  LlmError,
  LlmNotConfigured,
} from "@/lib/llm";

const MAX_PROMPT = 3000;
const MAX_TOKENS = 2000;

type Body = { system?: string; user: string; maxChars?: number };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido en el cuerpo." }, { status: 400 });
  }

  const user = (body.user ?? "").trim();
  if (!user) {
    return NextResponse.json({ error: "Falta el texto de la consulta." }, { status: 400 });
  }
  if (user.length > MAX_PROMPT) {
    return NextResponse.json(
      { error: `El prompt no puede superar ${MAX_PROMPT} caracteres.` },
      { status: 400 },
    );
  }

  const maxChars = Math.min(Number(body.maxChars) || 0, 8000);
  const maxTokens = maxChars > 0 ? Math.max(64, Math.round(maxChars * 1.3)) : MAX_TOKENS;

  try {
    const text = await generateText(body.system ?? "", user, {
      maxTokens: Math.min(maxTokens, MAX_TOKENS),
      temperature: 0.8,
    });
    return NextResponse.json({ text, model: getLlmModel() });
  } catch (err) {
    if (err instanceof LlmNotConfigured || (err instanceof LlmError && err.status === 401)) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Error inesperado.";
    const status =
      err instanceof LlmError && err.status && !Number.isNaN(err.status)
        ? err.status
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  return NextResponse.json({ model: getLlmModel() });
}