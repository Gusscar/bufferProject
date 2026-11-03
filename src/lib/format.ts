export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const DAY_NAMES: Record<string, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
  sun: "Dom",
};

export function dayName(day: string): string {
  return DAY_NAMES[day] ?? day;
}

export const APP_TIMEZONE = "America/Caracas";

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDay(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    notation: n >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-ES").format(Math.round(n));
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "hace un momento";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  return `hace ${days} d`;
}

export const SERVICE_LABEL: Record<string, string> = {
  bluesky: "Bluesky",
  facebook: "Facebook",
  googlebusiness: "Google Business",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  mastodon: "Mastodon",
  pinterest: "Pinterest",
  startPage: "Start Page",
  substack: "Substack",
  threads: "Threads",
  tiktok: "TikTok",
  twitter: "X (Twitter)",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
};

export const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  needs_approval: "Aprobación",
  scheduled: "Programada",
  sending: "Enviando",
  sent: "Publicada",
  error: "Error",
};

export function slugToText(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/^./, (c) => c.toUpperCase());
}