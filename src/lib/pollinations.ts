import { getStore, getPollinationsApiKey } from "@/lib/store";

export const IMAGE_BASE = "https://gen.pollinations.ai/image";

export interface ImageSize {
  width: number;
  height: number;
  label: string;
  hint: string;
}

export const IMAGE_SIZES: ImageSize[] = [
  { width: 1080, height: 1080, label: "Cuadrado · 1080×1080", hint: "Feed Instagram / Facebook / LinkedIn" },
  { width: 1080, height: 1350, label: "Vertical · 1080×1350", hint: "Reels / TikTok / Stories" },
  { width: 1200, height: 630, label: "Paisaje · 1200×630", hint: "Posts de enlace / X / LinkedIn" },
  { width: 1080, height: 1920, label: "Historias · 1080×1920", hint: "Stories y formatos fullscreen" },
];

export function buildImageUrl(
  prompt: string,
  opts: { width?: number; height?: number; model?: string; seed?: number } = {},
): string {
  const store = getStore();
  const base = `${IMAGE_BASE}/${encodeURIComponent(prompt)}`;
  const params = new URLSearchParams();
  params.set("model", opts.model ?? store.pollinationsModel ?? "flux");
  params.set("width", String(opts.width ?? 1080));
  params.set("height", String(opts.height ?? 1080));
  params.set("seed", String(opts.seed ?? store.imageSeed));
  params.set("nologo", "true");
  return `${base}?${params.toString()}`;
}

export function listImageModels(): string[] {
  return [
    "flux",
    "turbo",
    "seedream",
    "kontext",
    "nanobanana",
    "nanobanana-pro",
    "gptimage",
    "qwen-image",
  ];
}

export async function probeImage(prompt: string): Promise<boolean> {
  try {
    const apiKey = getPollinationsApiKey();
    const url = buildImageUrl(prompt, { width: 64, height: 64 });
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}