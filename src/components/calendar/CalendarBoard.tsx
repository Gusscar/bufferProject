"use client";

import { useMemo, useState } from "react";
import { ChannelAvatar } from "@/components/ChannelAvatar";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuSelect } from "@/components/neu/NeuSelect";
import { NeuModal } from "@/components/neu/NeuModal";
import { StatusBadge } from "@/components/neu/NeuBadge";
import { PostComposer } from "@/components/posts/PostComposer";
import type { ComposerInit } from "@/components/posts/PostsBoard";
import {
  IconAlert,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
} from "@/components/icons";
import { cn, SERVICE_LABEL } from "@/lib/format";
import {
  addDays,
  addMonths,
  dayLabel,
  gridDaysFor,
  isSameMonth,
  isSameYmd,
  isoToYmdCaracas,
  monthLabel,
  timeLabelCaracas,
  todayCaracas,
  weekRangeLabel,
  ymdKey,
  ymdToUtcIso,
  type Ymd,
} from "@/lib/calendarDate";
import type { Channel, Post, PostsPage } from "@/types";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarBoard({
  organizationId,
  channels,
  initialPosts,
}: {
  organizationId: string;
  channels: Channel[];
  initialPosts: PostsPage;
}) {
  const [view, setView] = useState<"month" | "week">("month");
  const [anchor, setAnchor] = useState<Ymd>(() => todayCaracas());
  const [channelFilter, setChannelFilter] = useState("all");
  const [posts, setPosts] = useState<Post[]>(initialPosts.edges);
  const [loading, setLoading] = useState(false);
  const [truncated, setTruncated] = useState(Boolean(initialPosts.pageInfo.hasNextPage));
  const [message, setMessage] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerInit, setComposerInit] = useState<ComposerInit | undefined>(undefined);

  const today = useMemo(() => todayCaracas(), []);
  const gridDays = useMemo(() => gridDaysFor(view, anchor), [view, anchor]);

  async function load(days: Ymd[], channel: string) {
    setLoading(true);
    setMessage(null);
    try {
      const filter: Record<string, unknown> = {
        dueAt: {
          start: ymdToUtcIso(days[0], 0, 0),
          end: ymdToUtcIso(days[days.length - 1], 23, 59),
        },
      };
      if (channel !== "all") filter.channelIds = [channel];
      const res = await fetch("/api/buffer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "getPosts", organizationId, filter, first: 100 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudieron cargar las publicaciones.");
      setPosts(json.posts?.edges ?? []);
      setTruncated(Boolean(json.posts?.pageInfo?.hasNextPage));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const post of posts) {
      const ymd = isoToYmdCaracas(post.dueAt ?? post.sentAt ?? post.createdAt);
      if (!ymd) continue;
      const key = ymdKey(ymd);
      const list = map.get(key) ?? [];
      list.push(post);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.dueAt ?? a.sentAt ?? "").localeCompare(b.dueAt ?? b.sentAt ?? ""));
    }
    return map;
  }, [posts]);

  const channelById = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels]);

  function openEdit(post: Post) {
    const asset = post.assets?.[0];
    setComposerInit({
      postId: post.id,
      channelId: post.channelId,
      text: post.text,
      imageUrl: asset?.source,
      mode: post.shareMode ?? "customScheduled",
      dueAt: post.dueAt ?? undefined,
    });
    setComposerOpen(true);
  }

  function openCreate(ymd: Ymd) {
    setComposerInit({
      mode: "customScheduled",
      dueAt: ymdToUtcIso(ymd, 10, 0),
    });
    setComposerOpen(true);
  }

  const headerLabel =
    view === "month" ? capitalize(monthLabel(anchor)) : weekRangeLabel(gridDays[0], gridDays[6]);

  function navigate(dir: -1 | 1) {
    const nextAnchor = view === "month" ? addMonths(anchor, dir) : addDays(anchor, dir * 7);
    setAnchor(nextAnchor);
    void load(gridDaysFor(view, nextAnchor), channelFilter);
  }

  function goToday() {
    const t = todayCaracas();
    setAnchor(t);
    void load(gridDaysFor(view, t), channelFilter);
  }

  function changeView(v: "month" | "week") {
    setView(v);
    void load(gridDaysFor(v, anchor), channelFilter);
  }

  function changeChannelFilter(value: string) {
    setChannelFilter(value);
    void load(gridDays, value);
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <p className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          <IconAlert width={16} height={16} /> {message}
        </p>
      )}

      <section className="neu-raised flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Calendario</h1>
            <p className="text-sm text-muted">
              Publicaciones programadas, en cola y publicadas · hora de Venezuela
            </p>
          </div>
          <NeuButton
            variant="primary"
            onClick={() => openCreate(view === "month" ? today : anchor)}
          >
            <IconPlus /> Nueva
          </NeuButton>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <NeuButton variant="ghost" size="sm" onClick={() => navigate(-1)} aria-label="Anterior">
              <IconChevronLeft className="h-4 w-4" />
            </NeuButton>
            <NeuButton variant="ghost" size="sm" onClick={goToday}>
              Hoy
            </NeuButton>
            <NeuButton variant="ghost" size="sm" onClick={() => navigate(1)} aria-label="Siguiente">
              <IconChevronRight className="h-4 w-4" />
            </NeuButton>
            <span className="ml-2 text-sm font-bold">{headerLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5">
              {(["month", "week"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => changeView(v)}
                  className={cn(
                    "neu-chip px-3.5 py-1.5 text-xs font-semibold",
                    v === view
                      ? "!shadow-[inset_3px_3px_7px_var(--shadow-dark),inset_-3px_-3px_7px_var(--shadow-light)] text-accent"
                      : "text-muted",
                  )}
                >
                  {v === "month" ? "Mes" : "Semana"}
                </button>
              ))}
            </div>
            <NeuSelect
              value={channelFilter}
              onChange={(e) => changeChannelFilter(e.target.value)}
              className="min-w-[180px]"
            >
              <option value="all">Todos los canales</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {SERVICE_LABEL[c.service]} · {c.displayName || c.name}
                </option>
              ))}
            </NeuSelect>
          </div>
        </div>

        {truncated && (
          <p className="text-xs text-warning">
            Hay más de 100 publicaciones en este rango; se muestran solo las primeras 100.
          </p>
        )}
      </section>

      {loading && <p className="py-2 text-center text-sm text-muted">Cargando…</p>}

      {view === "month" ? (
        <section className="neu-raised overflow-hidden p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted sm:gap-2">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="py-1.5">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {gridDays.map((ymd) => {
              const key = ymdKey(ymd);
              const dayPosts = postsByDay.get(key) ?? [];
              const inMonth = isSameMonth(ymd, anchor);
              const isToday = isSameYmd(ymd, today);
              return (
                <div
                  key={key}
                  className={cn(
                    "neu-pressed-sm flex min-h-24 flex-col gap-1 rounded-xl p-1.5 sm:min-h-32 sm:p-2",
                    !inMonth && "opacity-40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                        isToday && "bg-accent text-white",
                      )}
                    >
                      {ymd.d}
                    </span>
                    <button
                      type="button"
                      onClick={() => openCreate(ymd)}
                      className="text-muted transition-colors hover:text-accent"
                      aria-label="Nueva publicación"
                      title="Nueva publicación"
                    >
                      <IconPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    {dayPosts.slice(0, 3).map((post) => (
                      <PostChip
                        key={post.id}
                        post={post}
                        channel={channelById.get(post.channelId)}
                        onClick={() => openEdit(post)}
                      />
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="text-[10px] font-semibold text-muted">
                        +{dayPosts.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {gridDays.map((ymd) => {
            const key = ymdKey(ymd);
            const dayPosts = postsByDay.get(key) ?? [];
            const isToday = isSameYmd(ymd, today);
            return (
              <NeuCard key={key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-bold", isToday && "text-accent")}>
                    {capitalize(dayLabel(ymd))}
                  </span>
                  <button
                    type="button"
                    onClick={() => openCreate(ymd)}
                    className="text-muted transition-colors hover:text-accent"
                    aria-label="Nueva publicación"
                    title="Nueva publicación"
                  >
                    <IconPlus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {dayPosts.length === 0 && (
                    <p className="text-xs text-muted">Sin publicaciones.</p>
                  )}
                  {dayPosts.map((post) => (
                    <PostChip
                      key={post.id}
                      post={post}
                      channel={channelById.get(post.channelId)}
                      onClick={() => openEdit(post)}
                      expanded
                    />
                  ))}
                </div>
              </NeuCard>
            );
          })}
        </section>
      )}

      <NeuModal
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setComposerInit(undefined);
        }}
        title={composerInit?.postId ? "Editar publicación" : "Nueva publicación"}
        wide
      >
        <PostComposer
          channels={channels}
          init={composerInit}
          onDone={async () => {
            setComposerOpen(false);
            setComposerInit(undefined);
            await load(gridDays, channelFilter);
          }}
        />
      </NeuModal>
    </div>
  );
}

function PostChip({
  post,
  channel,
  onClick,
  expanded = false,
}: {
  post: Post;
  channel: Channel | undefined;
  onClick: () => void;
  expanded?: boolean;
}) {
  const time = timeLabelCaracas(post.dueAt ?? post.sentAt);
  return (
    <button
      type="button"
      onClick={onClick}
      className="neu-chip flex w-full items-center gap-1.5 overflow-hidden px-1.5 py-1 text-left text-[11px] font-semibold"
      title={post.text || "Publicación sin texto"}
    >
      <ChannelAvatar
        id={post.channelId}
        src={channel?.avatar}
        size={14}
        className="h-3.5 w-3.5 shrink-0 rounded-full object-cover"
      />
      {time && <span className="shrink-0 text-muted">{time}</span>}
      <span className="min-w-0 flex-1 truncate">{post.text || "Sin texto"}</span>
      {expanded && <StatusBadge status={post.status} />}
    </button>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
