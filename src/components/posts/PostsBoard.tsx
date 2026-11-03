"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChannelAvatar } from "@/components/ChannelAvatar";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuInput } from "@/components/neu/NeuInput";
import { NeuSelect } from "@/components/neu/NeuSelect";
import { StatusBadge } from "@/components/neu/NeuBadge";
import { NeuModal } from "@/components/neu/NeuModal";
import { PostComposer } from "@/components/posts/PostComposer";
import {
  IconAlert,
  IconEdit,
  IconExternal,
  IconImage,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSend,
  IconTrash,
} from "@/components/icons";
import { cn, formatDay, SERVICE_LABEL } from "@/lib/format";
import type { Channel, Post, PostsPage } from "@/types";

export interface ComposerInit {
  postId?: string;
  text?: string;
  imageUrl?: string;
  mode?: string;
  dueAt?: string;
}

const ORDER = ["scheduled", "sending", "sent", "needs_approval", "draft", "error"];

function sortPosts(list: Post[]): Post[] {
  return [...list].sort((a, b) => {
    const oa = ORDER.indexOf(a.status);
    const ob = ORDER.indexOf(b.status);
    if (oa !== ob) return oa - ob;
    return (b.dueAt ?? b.createdAt).localeCompare(a.dueAt ?? a.createdAt);
  });
}

export function PostsBoard({
  organizationId,
  channels,
  initialPosts,
}: {
  organizationId: string;
  channels: Channel[];
  initialPosts: PostsPage;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openNew = searchParams.get("new") === "1";

  const [posts, setPosts] = useState<Post[]>(sortPosts(initialPosts.edges));
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(openNew);
  const [composerInit, setComposerInit] = useState<ComposerInit | undefined>(
    openNew ? {} : undefined,
  );
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [confirm, setConfirm] = useState<Post | null>(null);

  const load = useCallback(
    async (status: string, channel: string, norefresh = false) => {
      setLoading(true);
      try {
        const filter: Record<string, unknown> = {};
        if (status !== "all") filter.status = [status];
        if (channel !== "all") filter.channelIds = [channel];
        const res = await fetch("/api/buffer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "getPosts", organizationId, filter }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Error al cargar publicaciones");
        setPosts(sortPosts(json.posts?.edges ?? []));
      } catch (e) {
        setMessage({ kind: "error", text: e instanceof Error ? e.message : "Error" });
      } finally {
        setLoading(false);
        if (!norefresh) router.refresh();
      }
    },
    [organizationId, router],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.text?.toLowerCase().includes(q) ||
        (p.channelName ?? "").toLowerCase().includes(q),
    );
  }, [posts, query]);

  const channelById = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels]);

  async function run(op: string, body: Record<string, unknown>) {
    setMessage(null);
    try {
      const res = await fetch("/api/buffer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op, ...body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error en la operación");
      return json;
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Error" });
      throw e;
    }
  }

  async function handleDelete(post: Post) {
    try {
      await run("deletePost", { id: post.id });
      setConfirm(null);
      await load(statusFilter, channelFilter, true);
      setMessage({ kind: "ok", text: "Publicación eliminada." });
    } catch {
      /* el error ya se mostró */
    }
  }

  async function handleShareNow(post: Post) {
    try {
      await run("editPost", { id: post.id, input: { mode: "shareNow", dueAt: undefined } });
      await load(statusFilter, channelFilter, true);
      setMessage({ kind: "ok", text: "Publicación enviada ahora." });
    } catch {
      /* el error ya se mostró */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <p
          className={cn(
            "neu-raised-sm flex items-center gap-2 px-4 py-3 text-sm font-medium",
            message.kind === "error" ? "!bg-danger/10 text-danger" : "!bg-teal-soft text-teal",
          )}
        >
          <IconAlert width={16} height={16} />
          {message.text}
        </p>
      )}

      {/* Toolbar */}
      <section className="neu-raised flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Publicaciones</h1>
            <p className="text-sm text-muted">
              {posts.length} publicaciones · agrupadas por estado
            </p>
          </div>
          <div className="flex gap-3">
            <NeuButton
              variant="ghost"
              onClick={() => {
                setStatusFilter("all");
                setChannelFilter("all");
                load("all", "all");
              }}
            >
              <IconRefresh /> Actualizar
            </NeuButton>
            <NeuButton
              variant="primary"
              onClick={() => {
                setComposerInit({});
                setComposerOpen(true);
              }}
            >
              <IconPlus /> Nueva
            </NeuButton>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_220px]">
          <NeuInput
            icon={<IconSearch className="h-4 w-4" />}
            placeholder="Buscar por texto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <NeuSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              load(e.target.value, channelFilter);
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="scheduled">Programadas</option>
            <option value="sent">Publicadas</option>
            <option value="sending">Enviando</option>
            <option value="needs_approval">Aprobación</option>
            <option value="draft">Borradores</option>
            <option value="error">Con error</option>
          </NeuSelect>
          <NeuSelect
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              load(statusFilter, e.target.value);
            }}
          >
            <option value="all">Todos los canales</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {SERVICE_LABEL[c.service]} · {c.displayName || c.name}
              </option>
            ))}
          </NeuSelect>
        </div>
      </section>

      {loading && <p className="py-4 text-center text-sm text-muted">Cargando publicaciones…</p>}

      {/* List */}
      <section className="flex flex-col gap-4">
        {filtered.length === 0 && !loading && (
          <NeuCard className="text-center text-sm text-muted">
            No hay publicaciones que coincidan.
          </NeuCard>
        )}
        {filtered.map((post) => {
          const ch = channelById.get(post.channelId);
          const asset = post.assets?.[0];
          return (
            <NeuCard
              key={post.id}
              className="flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              {asset ? (
                <img
                  src={asset.thumbnail || asset.source}
                  alt=""
                  width={72}
                  height={72}
                  className="neu-pressed-sm h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="neu-pressed-sm flex h-[72px] w-[72px] shrink-0 items-center justify-center text-muted">
                  <IconImage className="h-6 w-6" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">
                  {post.text || "Publicación sin texto"}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <ChannelAvatar
                    id={post.channelId}
                    src={ch?.avatar}
                    size={16}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                  <span className="font-semibold text-foreground">
                    {SERVICE_LABEL[post.channelService]} · {ch?.displayName || ch?.name}
                  </span>
                  <span>·</span>
                  {post.status === "scheduled" && <span>⏱ {formatDay(post.dueAt)}</span>}
                  {post.status === "sent" && post.sentAt && <span>✓ {formatDay(post.sentAt)}</span>}
                  {post.error && (
                    <span className="font-medium text-danger">{post.error.message}</span>
                  )}
                </div>
              </div>

              <StatusBadge status={post.status} />

              <div className="flex shrink-0 gap-2">
                <NeuButton
                  variant="ghost"
                  size="xs"
                  disabled={post.status === "sent"}
                  title="Editar"
                  onClick={() => {
                    setComposerInit({
                      postId: post.id,
                      text: post.text,
                      imageUrl: asset?.source,
                      mode: post.shareMode ?? "customScheduled",
                      dueAt: post.dueAt ?? undefined,
                    });
                    setComposerOpen(true);
                  }}
                >
                  <IconEdit className="h-4 w-4" />
                </NeuButton>
                {post.allowedActions?.includes("editPost") && (
                  <NeuButton
                    variant="ghost"
                    size="xs"
                    title="Publicar ahora"
                    onClick={() => handleShareNow(post)}
                  >
                    <IconSend className="h-4 w-4" />
                  </NeuButton>
                )}
                {post.externalLink && (
                  <a
                    href={post.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver en la red"
                    className="neu-btn !px-3 !py-1.5 text-xs"
                  >
                    <IconExternal className="h-4 w-4" />
                  </a>
                )}
                {post.allowedActions?.includes("deletePost") && (
                  <NeuButton
                    variant="danger"
                    size="xs"
                    title="Eliminar"
                    onClick={() => setConfirm(post)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </NeuButton>
                )}
              </div>
            </NeuCard>
          );
        })}
      </section>

      {/* Composer */}
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
            await load(statusFilter, channelFilter, true);
          }}
        />
      </NeuModal>

      {/* Delete confirm */}
      <NeuModal open={Boolean(confirm)} onClose={() => setConfirm(null)} title="Eliminar publicación">
        {confirm && (
          <div className="flex flex-col gap-5">
            <p className="text-sm leading-6 text-muted">
              ¿Seguro que quieres eliminar{" "}
              <strong className="text-foreground">
                {confirm.text || "esta publicación"}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <NeuButton variant="ghost" onClick={() => setConfirm(null)}>
                Cancelar
              </NeuButton>
              <NeuButton variant="danger" onClick={() => handleDelete(confirm)}>
                <IconTrash className="h-4 w-4" /> Eliminar
              </NeuButton>
            </div>
          </div>
        )}
      </NeuModal>
    </div>
  );
}