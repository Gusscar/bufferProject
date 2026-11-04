import { list, put } from "@vercel/blob";
import { DEFAULT_BRAND, getStore } from "@/lib/store";
import type { BrandProfile } from "@/types";

// El store en memoria (globalThis.__appStore) no sobrevive entre invocaciones
// serverless en Vercel. El perfil de marca se guarda en Vercel Blob (igual que
// las imágenes subidas) para que persista de verdad; si Blob no está
// configurado (ej. desarrollo local sin habilitarlo) se usa el store en
// memoria como respaldo.
const BRAND_PATH = "config/brand.json";

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getBrand(): Promise<BrandProfile> {
  if (!blobConfigured()) return getStore().brand;
  try {
    const { blobs } = await list({ prefix: BRAND_PATH, limit: 1 });
    const blob = blobs.find((b) => b.pathname === BRAND_PATH);
    if (!blob) return DEFAULT_BRAND;
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return DEFAULT_BRAND;
    const json = (await res.json()) as Partial<BrandProfile>;
    return { ...DEFAULT_BRAND, ...json };
  } catch {
    return DEFAULT_BRAND;
  }
}

export async function setBrand(partial: Partial<BrandProfile>): Promise<BrandProfile> {
  const current = await getBrand();
  const next: BrandProfile = { ...current, ...partial };
  if (!blobConfigured()) {
    getStore().brand = next;
    return next;
  }
  await put(BRAND_PATH, JSON.stringify(next), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return next;
}
