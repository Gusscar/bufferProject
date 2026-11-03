import Link from "next/link";
import { ChannelAvatar } from "@/components/ChannelAvatar";
import { NeuStatCard } from "@/components/neu/NeuStatCard";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuButton } from "@/components/neu/NeuButton";
import { StatusBadge } from "@/components/neu/NeuBadge";
import {
  IconChat,
  IconClock,
  IconImage,
  IconPlus,
  IconPosts,
  IconSend,
  IconSparkles,
} from "@/components/icons";
import { formatDay, SERVICE_LABEL, STATUS_LABEL } from "@/lib/format";
import type { Account, AggregatedMetrics, Channel, PostsPage } from "@/types";

function metric(list: AggregatedMetrics["metrics"] | undefined, type: string) {
  return list?.find((m) => m.type === type)?.value ?? 0;
}

function firstAsset(post: PostsPage["edges"][number]) {
  return post.assets?.[0];
}

export function DashboardView({
  account,
  channels,
  posts,
  aggregated,
}: {
  account: Account;
  channels: Channel[];
  posts: PostsPage;
  aggregated: AggregatedMetrics | null;
}) {
  const activeChannels = channels;
  const iconClass = "text-accent";

  const KPI = aggregated
    ? {
        posts: metric(aggregated.metrics, "postCount"),
        reactions: metric(aggregated.metrics, "reactions"),
        comments: metric(aggregated.metrics, "comments"),
        engagement: metric(aggregated.metrics, "engagementRate"),
        impressions: metric(aggregated.metrics, "impressions"),
        reach: metric(aggregated.metrics, "reach"),
      }
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="neu-raised relative flex flex-col gap-4 overflow-hidden p-6 sm:flex-row sm:items-center sm:justify-between">
        <img
          src="/brand/blob.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -top-6 -right-6 w-28 opacity-20 sm:w-36"
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Hola, {account.name || account.email}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            Resumen de los últimos 30 días
          </h1>
          <p className="mt-1 text-sm text-muted">
            {activeChannels.length} canales activos conectados
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/posts?new=1">
            <NeuButton variant="primary">
              <IconPlus /> Nueva publicación
            </NeuButton>
          </Link>
          <Link href="/insights">
            <NeuButton>
              <IconSparkles /> Ver KPIs
            </NeuButton>
          </Link>
        </div>
      </section>

      {/* KPIs */}
      {KPI ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NeuStatCard
            label="Publicaciones"
            value={KPI.posts}
            hint="Últimos 30 días"
            icon={<IconPosts className={iconClass} />}
            accent="accent"
          />
          <NeuStatCard
            label="Reacciones"
            value={KPI.reactions}
            hint={`${formatRatio(KPI.reactions, KPI.posts)} por post`}
            icon={<IconSend className="text-teal" />}
            accent="teal"
          />
          <NeuStatCard
            label="Comentarios"
            value={KPI.comments}
            hint={`${formatRatio(KPI.comments, KPI.posts)} por post`}
            icon={<IconChat className="text-warning" />}
            accent="warning"
          />
          <NeuStatCard
            label="Interacción"
            value={KPI.engagement ? `${round(KPI.engagement)}%` : KPI.impressions}
            hint={
              KPI.engagement
                ? "Tasa de interacción"
                : KPI.impressions
                  ? "Impresiones totales"
                  : "Sin datos aún"
            }
            icon={<IconClock className="text-danger" />}
            accent="danger"
          />
        </section>
      ) : (
        <NeuCard className="flex items-center gap-3 !bg-warning/10 text-sm">
          <IconClock className="text-warning" />
          <p className="text-muted">
            Las métricas agregadas tardan hasta 24 h en actualizarse.
            Aún no hay datos para este rango.
          </p>
        </NeuCard>
      )}

      {/* Channels */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">
          Canales conectados
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activeChannels.length === 0 && (
            <NeuCard className="col-span-full text-sm text-muted">
              No hay canales conectados. Conéctalos y pulsa actualizar.
            </NeuCard>
          )}
          {activeChannels.map((ch) => (
            <Link key={ch.id} href="/schedule">
              <NeuCard className="flex items-center gap-4 transition-transform hover:-translate-y-0.5">
                <ChannelAvatar
                  id={ch.id}
                  src={ch.avatar}
                  className="neu-pressed-sm h-11 w-11 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{ch.displayName || ch.name}</p>
                  <p className="truncate text-xs text-muted">
                    {SERVICE_LABEL[ch.service] ?? ch.descriptor}
                  </p>
                </div>
                <span className="neu-chip px-3 py-1 text-xs font-semibold text-muted">
                  {ch.isQueuePaused ? "Cola pausada" : ch.postingSchedule[0]?.times[0] || "—"}
                </span>
              </NeuCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent posts */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
            Publicaciones recientes
          </h2>
          <Link
            href="/posts"
            className="text-sm font-semibold text-accent hover:underline"
          >
            Ver todas ({posts.edges.length})
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {posts.edges.length === 0 && (
            <NeuCard className="text-sm text-muted">
              Aún no has publicado nada. Crea tu primera publicación desde{' '}
              «Publicaciones».
            </NeuCard>
          )}
          {posts.edges.slice(0, 5).map((post) => {
            const asset = firstAsset(post);
            return (
              <NeuCard key={post.id} className="flex items-center gap-4 !py-3">
                {asset ? (
                  <img
                    src={asset.thumbnail || asset.source}
                    alt=""
                    width={56}
                    height={56}
                    className="neu-pressed-sm h-14 w-14 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="neu-pressed-sm flex h-14 w-14 shrink-0 items-center justify-center text-muted">
                    <IconImage className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {post.text || "Publicación sin texto"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {SERVICE_LABEL[post.channelService] ?? "Red"} ·{" "}
                    {post.status === "scheduled"
                      ? formatDay(post.dueAt)
                      : post.status === "sent"
                        ? formatDay(post.sentAt)
                        : STATUS_LABEL[post.status] ?? post.status}
                  </p>
                </div>
                <StatusBadge status={post.status} />
              </NeuCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function formatRatio(part: number, total: number) {
  if (!total) return "0";
  return (part / total).toFixed(1);
}