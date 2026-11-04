// Venezuela ha usado UTC-4 sin horario de verano desde 2016.
const CARACAS_UTC_OFFSET_HOURS = 4;

export interface Ymd {
  y: number;
  m: number; // 1-12
  d: number;
}

export function ymdKey(ymd: Ymd): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ymd.y}-${pad(ymd.m)}-${pad(ymd.d)}`;
}

// Normaliza vía Date.UTC, que hace el "carry" de mes/año por nosotros
// (ej. día 32 de enero pasa a 1 de febrero).
function normalize(y: number, m: number, d: number): Ymd {
  const utc = new Date(Date.UTC(y, m - 1, d));
  return { y: utc.getUTCFullYear(), m: utc.getUTCMonth() + 1, d: utc.getUTCDate() };
}

export function addDays(ymd: Ymd, days: number): Ymd {
  return normalize(ymd.y, ymd.m, ymd.d + days);
}

export function addMonths(ymd: Ymd, months: number): Ymd {
  return normalize(ymd.y, ymd.m + months, 1);
}

// Lunes = 0 ... Domingo = 6, para que la semana empiece en lunes.
function mondayIndex(ymd: Ymd): number {
  const utcDay = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d)).getUTCDay();
  return (utcDay + 6) % 7;
}

export function startOfWeek(ymd: Ymd): Ymd {
  return addDays(ymd, -mondayIndex(ymd));
}

export function startOfMonth(ymd: Ymd): Ymd {
  return { y: ymd.y, m: ymd.m, d: 1 };
}

export function isSameYmd(a: Ymd, b: Ymd): boolean {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

export function isSameMonth(a: Ymd, b: Ymd): boolean {
  return a.y === b.y && a.m === b.m;
}

export function todayCaracas(): Ymd {
  return isoToYmdCaracas(new Date().toISOString())!;
}

// Ubica un instante ISO en el día calendario que le corresponde en hora de
// Venezuela, sin importar la zona horaria del navegador o del servidor.
export function isoToYmdCaracas(iso?: string | null): Ymd | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

// Instante UTC que corresponde a una hora de reloj de Venezuela en ese día
// (ej. hour=0 -> inicio del día, hour=23.999 -> fin del día).
export function ymdToUtcIso(ymd: Ymd, hour = 0, minute = 0): string {
  return new Date(
    Date.UTC(ymd.y, ymd.m - 1, ymd.d, hour + CARACAS_UTC_OFFSET_HOURS, minute, 0),
  ).toISOString();
}

export function monthLabel(ymd: Ymd): string {
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    month: "long",
    year: "numeric",
  }).format(new Date(ymdToUtcIso(ymd, 12)));
}

export function weekRangeLabel(start: Ymd, end: Ymd): string {
  const fmt = (ymd: Ymd, withYear: boolean) =>
    new Intl.DateTimeFormat("es-VE", {
      timeZone: "America/Caracas",
      day: "numeric",
      month: "short",
      year: withYear ? "numeric" : undefined,
    }).format(new Date(ymdToUtcIso(ymd, 12)));
  const sameYear = start.y === end.y;
  return `${fmt(start, !sameYear)} – ${fmt(end, true)}`;
}

export function gridDaysFor(view: "month" | "week", anchor: Ymd): Ymd[] {
  if (view === "week") {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }
  const start = startOfWeek(startOfMonth(anchor));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function timeLabelCaracas(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function dayLabel(ymd: Ymd): string {
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(ymdToUtcIso(ymd, 12)));
}
