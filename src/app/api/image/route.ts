import { NextResponse } from "next/server";
import { buildImageUrl, IMAGE_SIZES } from "@/lib/pollinations";
import { getPollinationsApiKey } from "@/lib/store";
import { translateApiError } from "@/lib/errorTranslate";

const MAX_PROMPT = 1200;
const TIMEOUT_MS = 120_000;

export async function POST(request: Request) {
  let body: { prompt?: string; width?: number; height?: number; model?: string; seed?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido en el cuerpo." }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Escribe un prompt para generar la imagen." }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT) {
    return NextResponse.json(
      { error: `El prompt no puede superar ${MAX_PROMPT} caracteres.` },
      { status: 400 },
    );
  }

  const size = IMAGE_SIZES.some(
    (s) => s.width === body.width && s.height === body.height,
  )
    ? { width: body.width, height: body.height }
    : { width: 1080, height: 1080 };

  const params = new URLSearchParams({
    prompt,
    width: String(size.width),
    height: String(size.height),
  });
  if (body.model) params.set("model", body.model);
  if (body.seed != null) params.set("seed", String(body.seed));

  return NextResponse.json({ url: `/api/image?${params.toString()}` });
}

export async function GET(request: Request) {
  const get = (name: string): string | undefined => {
    const v = new URL(request.url).searchParams.get(name);
    return v == null ? undefined : v;
  };

  const prompt = (get("prompt") ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Falta el prompt de la imagen." }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT) {
    return NextResponse.json(
      { error: `El prompt no puede superar ${MAX_PROMPT} caracteres.` },
      { status: 400 },
    );
  }

  const apiKey = getPollinationsApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Falta la API key de Pollinations. Configúrala en Ajustes o con POLLINATIONS_API_KEY en .env.local.",
      },
      { status: 401 },
    );
  }

  const url = buildImageUrl(prompt, {
    width: Number(get("width") ?? 1080),
    height: Number(get("height") ?? 1080),
    model: get("model"),
    seed: get("seed") != null ? Number(get("seed")) : undefined,
  });

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      { error: "Tiempo de espera agotado al generar la imagen. Inténtalo de nuevo." },
      { status: 504 },
    );
  }

  if (!upstream.ok) {
    const message = await upstream
      .text()
      .then((t) => {
        try {
          const parsed = JSON.parse(t) as { error?: { message?: string } };
          return parsed?.error?.message || t;
        } catch {
          return t;
        }
      })
      .catch(() => undefined);
    return NextResponse.json(
      {
        error: message
          ? translateApiError(message)
          : `Pollinations devolvió un error (${upstream.status}).`,
      },
      { status: upstream.status },
    );
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    upstream.headers.get("content-type") ?? "image/jpeg",
  );
  headers.set("Cache-Control", "public, max-age=3600, immutable");
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new NextResponse(upstream.body, { status: 200, headers });
}