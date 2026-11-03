import { getPollinationsApiKey, getStore } from "@/lib/store";

export const LLM_BASE_URL = "https://gen.pollinations.ai/v1";
export const LLM_DEFAULT_MODEL = "openai";

export class LlmError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "LlmError";
    this.status = status;
  }
}

export class LlmNotConfigured extends LlmError {
  constructor() {
    super(
      "No hay una API key de texto con IA configurada. Configúrala en Ajustes, o con LLM_API_KEY o POLLINATIONS_API_KEY en .env.local.",
      401,
    );
    this.name = "LlmNotConfigured";
  }
}

export function getLlmModel(): string {
  return process.env.LLM_MODEL || getStore().llmModel || LLM_DEFAULT_MODEL;
}

export function getLlmApiKey(): string | undefined {
  return process.env.LLM_API_KEY || getPollinationsApiKey();
}

export function getLlmBaseUrl(): string {
  return (process.env.LLM_BASE_URL || LLM_BASE_URL).replace(/\/+$/, "");
}

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function llmChat(
  messages: LlmMessage[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const apiKey = getLlmApiKey();
  if (!apiKey) throw new LlmNotConfigured();

  const res = await fetch(`${getLlmBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getLlmModel(),
      messages,
      temperature: opts.temperature ?? 0.7,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(90_000),
  });

  let json: {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new LlmError(
      `El proveedor de IA respondió con un formato inesperado (HTTP ${res.status}).`,
      res.status,
    );
  }

  if (!res.ok) {
    const msg = json.error?.message || `El proveedor de IA devolvió HTTP ${res.status}`;
    throw new LlmError(msg, res.status);
  }

  const text = json.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new LlmError("El proveedor de IA no devolvió texto.");
  }
  return text.trim();
}

export async function generateText(
  system: string,
  user: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const messages: LlmMessage[] = [];
  if (system.trim()) messages.push({ role: "system", content: system.trim() });
  messages.push({ role: "user", content: user.trim() });
  return llmChat(messages, opts);
}

export function listTextModels(): string[] {
  return ["openai", "claude", "gemini", "mistral", "searchgpt", "llama"];
}