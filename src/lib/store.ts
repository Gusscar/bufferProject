import type { AppStore, BrandProfile, KpiSnapshot } from "@/types";

declare global {
  var __appStore: AppStore | undefined;
}

export const DEFAULT_BRAND: BrandProfile = {
  name: "Niños de la Luz Venezuela",
  mission: "",
  tone: "",
  audience: "",
  visualStyle: "",
  hashtags: "",
};

const defaults = (): AppStore => ({
  bufferApiKey: undefined,
  pollinationsApiKey: undefined,
  pollinationsModel: "flux",
  llmModel: "openai",
  imageSeed: Math.floor(Math.random() * 1_000_000),
  snapshots: [],
  bufferCache: {},
  brand: DEFAULT_BRAND,
});

export function getStore(): AppStore {
  if (!globalThis.__appStore) {
    globalThis.__appStore = defaults();
  }
  return globalThis.__appStore;
}

export function getBufferApiKey(): string | undefined {
  return process.env.BUFFER_API_KEY || getStore().bufferApiKey;
}

export function setBufferApiKey(key: string): void {
  getStore().bufferApiKey = key;
}

export function getPollinationsApiKey(): string | undefined {
  return process.env.POLLINATIONS_API_KEY || getStore().pollinationsApiKey;
}

export function setPollinationsApiKey(key: string): void {
  getStore().pollinationsApiKey = key;
}

export function getPublicBaseUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  return url ? url.replace(/\/+$/, "") : undefined;
}

/* ---------- KPI snapshots ---------- */

export function listSnapshots(): KpiSnapshot[] {
  return [...getStore().snapshots].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export function addSnapshot(input: Omit<KpiSnapshot, "id">): KpiSnapshot {
  const snapshot: KpiSnapshot = {
    ...input,
    id: crypto.randomUUID(),
  };
  const store = getStore();
  store.snapshots = [...store.snapshots, snapshot];
  return snapshot;
}

export function deleteSnapshot(id: string): boolean {
  const store = getStore();
  const before = store.snapshots.length;
  store.snapshots = store.snapshots.filter((s) => s.id !== id);
  return store.snapshots.length !== before;
}

/* ---------- Tiny TTL cache for Buffer reads ---------- */

export function cacheGet<T>(key: string): T | undefined {
  const hit = getStore().bufferCache[key];
  if (hit && Date.now() - hit.ts < 60_000) return hit.value as T;
  if (hit) delete getStore().bufferCache[key];
  return undefined;
}

export function cacheSet<T>(key: string, value: T): void {
  getStore().bufferCache[key] = { ts: Date.now(), value };
}