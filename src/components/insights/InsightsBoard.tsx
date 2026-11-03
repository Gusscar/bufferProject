"use client";

import { useCallback, useState, type ReactElement } from "react";
import { NeuButton, NeuSpinner } from "@/components/neu/NeuButton";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuStatCard } from "@/components/neu/NeuStatCard";
import {
  IconAlert,
  IconCheck,
  IconChat,
  IconClock,
  IconExternal,
  IconLink,
  IconPosts,
  IconRefresh,
  IconSend,
  IconSparkles,
  IconTrash,
} from "@/components/icons";
import { cn, formatDay, formatCompact } from "@/lib/format";
import type { KpiSnapshot, PostMetric } from "@/types";

const ICON_MAP: Record<string, ReactElement> = {
  postCount: <IconPosts className="text-accent" />,
  impressions: <IconExternal className="text-accent" />,
  reach: <IconExternal className="text-teal" />,
  reactions: <IconSend className="text-teal" />,
  comments: <IconChat className="text-warning" />,
  shares: <IconLink className="text-warning" />,
  engagementRate: <IconSparkles className="text-danger" />,
  likes: <IconSend className="text-teal" />,
  linkClicks: <IconLink className="text-warning" />,
  retweets: <IconRefresh className="text-accent" />,
  favorites: <IconSend className="text-teal" />,
};

function statIcon(type: string) {
  return ICON_MAP[type] ?? <IconClock className="text-muted" />;
}

function statLabel(type: string) {
  const labels: Record<string, string> = {
    postCount: "Publicaciones",
    impressions: "Impresiones",
    reach: "Alcance",
    reactions: "Reacciones",
    comments: "Comentarios",
    shares: "Compartidos",
    engagementRate: "Tasa de interacción",
    likes: "Me gusta",
    linkClicks: "Clics en enlace",
    retweets: "Republicaciones",
    favorites: "Favoritos",
  };
  return labels[type] ?? type;
}

const RANGES = [
  { label: "7 días", days: 7 },
  { label: "28 días", days: 28 },
];

function rangeDates(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function InsightsBoard({
  organizationId,
  initialMetrics,
  initialUpdatedAt,
  initialSnapshots,
}: {
  organizationId: string;
  initialMetrics: PostMetric[];
  initialUpdatedAt: string | null;
  initialSnapshots: KpiSnapshot[];
}) {
  const [rangeDays, setRangeDays] = useState(28);
  const [metrics, setMetrics] = useState<PostMetric[]>(initialMetrics);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt);
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<KpiSnapshot[]>(initialSnapshots);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const loadMetrics = useCallback(
    async (days: number) => {
      setLoading(true);
      setMessage(null);
      try {
        const { start, end } = rangeDates(days);
        const res = await fetch("/api/buffer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "getAggregatedMetrics",
            organizationId,
            start,
            end,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudieron cargar las métricas.");
        setMetrics(json.metrics?.metrics ?? []);
        setUpdatedAt(json.metrics?.metricsUpdatedAt ?? null);
      } catch (e) {
        setMessage({ kind: "error", text: e instanceof Error ? e.message : "Error" });
      } finally {
        setLoading(false);
      }
    },
    [organizationId],
  );

  const loadSnapshots = useCallback(async () => {
    try {
      const res = await fetch("/api/store");
      const json = await res.json();
      setSnapshots(json.snapshots ?? []);
    } catch {
      /* silenciar */
    }
  }, []);

  async function saveSnapshot() {
    setMessage(null);
    const dateStr = new Date().toISOString();
    const metricMap: Record<string, number> = {};
    metrics.forEach((m) => {
      metricMap[m.type] = m.value;
    });
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addSnapshot",
          snapshot: {
            date: dateStr,
            metrics: metricMap,
            channelFilter: "all",
          },
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el snapshot.");
      setMessage({ kind: "ok", text: "Snapshot de KPIs guardado." });
      await loadSnapshots();
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Error al guardar." });
    }
  }

  async function deleteSnapshot(id: string) {
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteSnapshot", id }),
      });
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
      setMessage({ kind: "ok", text: "Snapshot eliminado." });
    } catch {
      setMessage({ kind: "error", text: "Error al eliminar snapshot." });
    }
  }

  const rangeLabel = RANGES.find((r) => r.days === rangeDays)?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <p
          className={cn(
            "neu-raised-sm flex items-center gap-2 px-4 py-3 text-sm font-medium",
            message.kind === "error" ? "!bg-danger/10 text-danger" : "!bg-teal-soft text-teal",
          )}
        >
          {message.kind === "error" ? (
            <IconAlert width={16} height={16} />
          ) : (
            <IconCheck width={16} height={16} />
          )}
          {message.text}
        </p>
      )}

      <section className="neu-raised relative flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between">
        <img
          src="/brand/squiggle.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-4 -right-2 w-32 opacity-15 sm:w-40"
        />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Métricas</h1>
          {updatedAt && (
            <p className="mt-1 text-xs text-muted">
              Las métricas se actualizan periódicamente. Última actualización conocida:{" "}
              {formatDay(updatedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              className={cn(
                "neu-chip px-4 py-1.5 text-xs font-semibold transition-colors",
                rangeDays === r.days
                  ? "!shadow-[inset_3px_3px_7px_var(--shadow-dark),inset_-3px_-3px_7px_var(--shadow-light)] text-accent"
                  : "text-muted hover:text-foreground",
              )}
              onClick={() => {
                setRangeDays(r.days);
                void loadMetrics(r.days);
              }}
            >
              {r.label}
            </button>
          ))}
          <NeuButton
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={() => void loadMetrics(rangeDays)}
          >
            <IconRefresh className="h-4 w-4" /> Actualizar
          </NeuButton>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-12">
          <NeuSpinner className="h-8 w-8" />
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.length === 0 && (
            <NeuCard className="col-span-full text-center text-sm text-muted">
              No hay métricas disponibles para este rango. Espera hasta 24 h tras la primera
              publicación para ver datos.
            </NeuCard>
          )}
          {metrics.map((m) => (
            <NeuStatCard
              key={m.type}
              label={statLabel(m.type)}
              value={
                m.unit === "percentage"
                  ? `${Math.round(m.value * 10) / 10}%`
                  : formatCompact(m.value)
              }
              hint={`${m.unit === "percentage" ? "Tasa" : "Total"} · ${rangeLabel}`}
              icon={statIcon(m.type)}
              accent="accent"
            />
          ))}
        </section>
      )}

      <section className="neu-raised flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
            Snapshots históricos
          </h2>
          <NeuButton size="sm" onClick={saveSnapshot} disabled={metrics.length === 0}>
            Guardar snapshot
          </NeuButton>
        </div>
        {snapshots.length === 0 ? (
          <p className="text-sm text-muted">
            Guarda un snapshot para comparar métricas en el tiempo. Los datos son locales (se
            pierden al reiniciar el servidor).
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {snapshots.map((snap) => (
              <NeuCard
                key={snap.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {formatDay(snap.date)}
                    {snap.channelFilter !== "all" && (
                      <span className="ml-2 rounded-lg bg-accent/10 px-2 py-0.5 text-accent">
                        Canal filtrado
                      </span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {Object.entries(snap.metrics)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .slice(0, 6)
                      .map(([type, val]) => (
                        <span key={type} className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">
                            {formatCompact(val)}
                          </span>
                          <span className="text-muted">{statLabel(type)}</span>
                        </span>
                      ))}
                  </div>
                </div>
                <NeuButton
                  variant="danger"
                  size="xs"
                  onClick={() => void deleteSnapshot(snap.id)}
                >
                  <IconTrash className="h-4 w-4" />
                </NeuButton>
              </NeuCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}