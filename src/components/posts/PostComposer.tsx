"use client";

import { useMemo, useRef, useState } from "react";
import { NeuButton, NeuSpinner } from "@/components/neu/NeuButton";
import { NeuInput } from "@/components/neu/NeuInput";
import { NeuSelect } from "@/components/neu/NeuSelect";
import { NeuTextarea } from "@/components/neu/NeuTextarea";
import { NeuCard } from "@/components/neu/NeuCard";
import { IMAGE_SIZES } from "@/lib/pollinations";
import { cn, SERVICE_LABEL } from "@/lib/format";
import {
  IconAlert,
  IconCheck,
  IconLink,
  IconRefresh,
  IconSparkles,
  IconUpload,
} from "@/components/icons";
import type { Channel } from "@/types";
import type { ComposerInit } from "@/components/posts/PostsBoard";

const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  threads: 500,
  bluesky: 300,
  linkedin: 3000,
  instagram: 2200,
  tiktok: 2200,
  mastodon: 500,
  facebook: 63_206,
  pinterest: 500,
};

const MODES: Record<string, string> = {
  addToQueue: "Añadir a la cola",
  customScheduled: "Programar fecha y hora",
  shareNow: "Publicar ahora",
};

const INSTAGRAM_TYPES: Record<string, string> = {
  post: "Publicación",
  story: "Historia",
  reel: "Reel",
};

const IMAGE_STYLES: Array<{ id: string; label: string; suffix: string }> = [
  { id: "none", label: "Sin estilo", suffix: "" },
  { id: "photo", label: "Fotográfico", suffix: "professional photography, realistic, high detail" },
  { id: "3d", label: "Render 3D", suffix: "3D render, octane render, studio lighting" },
  { id: "watercolor", label: "Acuarela", suffix: "watercolor painting, soft brush strokes" },
  { id: "minimal", label: "Minimalista", suffix: "minimalist flat design, clean background" },
  { id: "illustration", label: "Ilustración", suffix: "digital illustration, vector art style" },
];

export function PostComposer({
  channels,
  init,
  onDone,
}: {
  channels: Channel[];
  init?: ComposerInit;
  onDone: () => Promise<void>;
}) {
  const isEdit = Boolean(init?.postId);

  const [channelId, setChannelId] = useState("");
  const [text, setText] = useState(init?.text ?? "");
  const [mode, setMode] = useState(init?.mode ?? "addToQueue");
  const [dueAt, setDueAt] = useState(
    init?.dueAt ? toLocalInput(init.dueAt) : tomorrowOneHour(),
  );
  const [imageUrl, setImageUrl] = useState(init?.imageUrl ?? "");
  const [instagramType, setInstagramType] = useState<"post" | "story" | "reel">("post");
  const [prompt, setPrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("none");
  const [aiPrompt, setAiPrompt] = useState("");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const counterRef = useRef(0);

  const channel = useMemo(
    () => channels.find((c) => c.id === channelId),
    [channels, channelId],
  );
  const charLimit = CHANNEL_LIMIT(channel?.service);

  async function uploadImageFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir la imagen.");
      setImageUrl(json.url);
      setOk("Imagen subida correctamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error subiendo la imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function generateImage() {
    const p = prompt.trim();
    if (!p) {
      setError("Escribe un prompt en español o inglés para la imagen.");
      return;
    }
    setGenerating(true);
    setError(null);
    const attempt = counterRef.current + 1;
    counterRef.current = attempt;
    try {
      const size = IMAGE_SIZES[sizeIdx];
      const styleSuffix = IMAGE_STYLES.find((s) => s.id === imageStyle)?.suffix;
      const finalPrompt = styleSuffix ? `${p}, ${styleSuffix}` : p;
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          width: size.width,
          height: size.height,
          seed: randomSeed(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo generar la imagen.");
      setImageUrl(json.url);
      setOk("Imagen generada. Puedes recargarla si no te convence.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando la imagen.");
    } finally {
      setGenerating(false);
    }
  }

  async function generateTextForPost() {
    const p = aiPrompt.trim();
    if (!p) {
      setError("Escribe qué quieres publicar (tema, tono, gancho…).");
      return;
    }
    setGeneratingText(true);
    setError(null);
    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:
            "Eres un copywriter experto en redes sociales. Redacta la publicación completa solicitada por el usuario en español, con un tono cercano y profesional. No añadas hashtags repetidos ni emojis en exceso, no uses comillas, y devuelve únicamente el texto de la publicación.",
          user: `${p}\n\nRed social: ${SERVICE_LABEL[channel?.service ?? ""] ?? "genérica"}. Máximo ${charLimit} caracteres.`,
          maxChars: charLimit,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo generar el texto.");
      setText(json.text.slice(0, charLimit));
      setOk("Texto generado con IA. Revísalo y edítalo si lo necesitas.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando el texto.");
    } finally {
      setGeneratingText(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId) {
      setError("Selecciona un canal para publicar.");
      return;
    }
    if (!text.trim() && !imageUrl) {
      setError("Escribe un texto o añade una imagen.");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const payload: Record<string, unknown> = {
        channelId,
        text: text,
        mode,
        schedulingType: "automatic",
      };

      if (imageUrl) {
        payload.assets = [{ image: { url: imageUrl } }];
        if (!init?.postId && mode === "customScheduled" && imageUrl && !text.trim()) {
          payload.text = undefined;
        }
      }
      if (mode === "customScheduled") {
        if (!dueAt) {
          setError("Indica la fecha y hora para programar.");
          setBusy(false);
          return;
        }
        payload.dueAt = new Date(dueAt).toISOString();
      }
      if (mode !== "customScheduled") payload.dueAt = undefined;
      if (isEdit) payload.text = text || "";

      if (channel?.service === "instagram") {
        payload.metadata = {
          instagram: { type: instagramType, shouldShareToFeed: true },
        };
      }

      const op = isEdit ? "editPost" : "createPost";
      const res = await fetch("/api/buffer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { op, id: init?.postId, input: payload } : { op, input: payload },
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "La operación falló en Buffer.");
      await onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          <IconAlert width={16} height={16} /> {error}
        </p>
      )}
      {ok && (
        <p className="flex items-center gap-2 rounded-xl bg-teal-soft px-3 py-2 text-sm font-medium text-teal">
          <IconCheck width={16} height={16} /> {ok}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NeuSelect label="Canal" required value={channelId} onChange={(e) => setChannelId(e.target.value)}>
          <option value="" disabled>
            Selecciona un canal…
          </option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {SERVICE_LABEL[c.service]} · {c.displayName || c.name}
            </option>
          ))}
        </NeuSelect>
        <NeuSelect
          label="Cuándo"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          {(Object.keys(MODES) as Array<keyof typeof MODES>).map((m) => (
            <option key={m} value={m}>
              {MODES[m]}
            </option>
          ))}
        </NeuSelect>
      </div>

      {channel?.service === "instagram" && (
        <NeuSelect
          label="Tipo de publicación en Instagram"
          value={instagramType}
          onChange={(e) => setInstagramType(e.target.value as "post" | "story" | "reel")}
          className="sm:max-w-xs"
        >
          {(Object.keys(INSTAGRAM_TYPES) as Array<keyof typeof INSTAGRAM_TYPES>).map((t) => (
            <option key={t} value={t}>
              {INSTAGRAM_TYPES[t]}
            </option>
          ))}
        </NeuSelect>
      )}

      {mode === "customScheduled" && (
        <NeuInput
          type="datetime-local"
          label="Fecha y hora de publicación"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="sm:max-w-xs"
        />
      )}

      <NeuTextarea
        label={isEdit ? "Texto" : "Texto del post"}
        placeholder="Escribe el contenido…"
        value={text}
        max={charLimit}
        count={text.length}
        onChange={(e) => setText(e.target.value)}
      />

      {/* AI text generator */}
      <NeuCard className="flex flex-col gap-4">
        <p className="flex items-center gap-2 text-sm font-bold">
          <IconSparkles className="text-accent" /> Texto con IA
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            className="neu-input min-h-16 flex-1 resize-y px-4 py-3 text-sm"
            placeholder="Describe el tema, tono y gancho, p. ej. «publicación sobre los beneficios del café, tono casual, con una pregunta al final»"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <div className="flex flex-col justify-end gap-2">
            <NeuButton
              variant="primary"
              type="button"
              disabled={generatingText || !aiPrompt.trim()}
              onClick={() => void generateTextForPost()}
            >
              {generatingText ? (
                <>
                  <NeuSpinner className="h-4 w-4" /> Generando…
                </>
              ) : (
                <>
                  <IconSparkles className="h-4 w-4" /> Generar texto
                </>
              )}
            </NeuButton>
            {text && (
              <NeuButton
                variant="ghost"
                size="xs"
                type="button"
                onClick={() => {
                  setText("");
                  setAiPrompt("");
                }}
              >
                Limpiar
              </NeuButton>
            )}
          </div>
        </div>
        <p className="text-xs text-muted">
          Usa Pollinations (proveedor configurable en Ajustes). El texto se limita a{" "}
          {charLimit} caracteres según el canal.
        </p>
      </NeuCard>

      {/* Image generator */}
      <NeuCard className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold">
            <IconSparkles className="text-accent" /> Imagen con IA
          </p>
          {imageUrl && (
            <NeuButton
              variant="ghost"
              size="xs"
              onClick={() => {
                setImageUrl("");
                setPrompt("");
              }}
            >
              Quitar imagen
            </NeuButton>
          )}
        </div>

        {imageUrl ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <img
              src={imageUrl}
              alt="Imagen generada"
              className="neu-pressed-sm h-44 w-44 shrink-0 rounded-2xl object-cover"
            />
            <div className="flex w-full flex-col gap-2">
              <NeuButton
                variant="ghost"
                size="sm"
                type="button"
                disabled={generating}
                onClick={generateImage}
              >
                {generating ? (
                  <>
                    <NeuSpinner className="h-4 w-4" /> Generando…
                  </>
                ) : (
                  <>
                    <IconRefresh className="h-4 w-4" /> Regenerar
                  </>
                )}
              </NeuButton>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
                  <IconLink className="h-4 w-4" /> O usa tu propia URL
                </span>
                <input
                  className="neu-input px-4 py-2.5 text-sm"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…/imagen.jpg"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                className="neu-input min-h-20 flex-1 resize-y px-4 py-3 text-sm"
                placeholder="Describe la imagen, p. ej. «minimalist 3D render of a coffee cup on pastel background»"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="flex flex-col justify-end gap-2">
                <NeuButton
                  variant="primary"
                  type="button"
                  disabled={generating || !prompt.trim()}
                  onClick={generateImage}
                >
                  {generating ? (
                    <>
                      <NeuSpinner className="h-4 w-4" /> Generando…
                    </>
                  ) : (
                    <>
                      <IconSparkles className="h-4 w-4" /> Generar
                    </>
                  )}
                </NeuButton>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {IMAGE_SIZES.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSizeIdx(i)}
                  className={cn(
                    "neu-chip px-3 py-1.5 text-xs font-semibold",
                    i === sizeIdx ? "!shadow-[inset_3px_3px_7px_var(--shadow-dark),inset_-3px_-3px_7px_var(--shadow-light)] text-accent" : "text-muted",
                  )}
                  title={s.hint}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-muted">Estilo</span>
              <div className="flex flex-wrap gap-2">
                {IMAGE_STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setImageStyle(s.id)}
                    className={cn(
                      "neu-chip px-3 py-1.5 text-xs font-semibold",
                      s.id === imageStyle ? "!shadow-[inset_3px_3px_7px_var(--shadow-dark),inset_-3px_-3px_7px_var(--shadow-light)] text-accent" : "text-muted",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-muted">
              <span className="h-px flex-1 bg-current opacity-20" />
              o usa tu propia imagen
              <span className="h-px flex-1 bg-current opacity-20" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex-1 cursor-pointer">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
                  <IconUpload className="h-4 w-4" /> Subir desde tu equipo
                </span>
                <span className="neu-btn w-full !justify-center px-4 py-2.5 text-sm">
                  {uploading ? (
                    <>
                      <NeuSpinner className="h-4 w-4" /> Subiendo…
                    </>
                  ) : (
                    "Elegir archivo"
                  )}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImageFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <label className="flex-1 block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
                  <IconLink className="h-4 w-4" /> O pega una URL
                </span>
                <input
                  className="neu-input px-4 py-2.5 text-sm"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…/imagen.jpg"
                />
              </label>
            </div>
          </div>
        )}
      </NeuCard>

      <div className="flex items-center justify-end gap-3">
        <NeuButton variant="ghost" type="button" onClick={() => onDone()}>
          Cancelar
        </NeuButton>
        <NeuButton variant="primary" type="submit" loading={busy} disabled={generating || generatingText || uploading}>
          {busy ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear publicación"}
        </NeuButton>
      </div>
    </form>
  );
}

function CHANNEL_LIMIT(service?: string): number {
  if (!service) return 2200;
  return CHAR_LIMITS[service] ?? 2200;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Venezuela ha usado UTC-4 sin horario de verano desde 2016.
const CARACAS_UTC_OFFSET_HOURS = 4;

function tomorrowOneHour(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  // 10:00 hora de Caracas == 10:00 + 4h en UTC (sin cambio de día, sin horario de verano).
  const tomorrowAt10Caracas = new Date(
    Date.UTC(get("year"), get("month") - 1, get("day") + 1, 10 + CARACAS_UTC_OFFSET_HOURS, 0, 0),
  );
  return toLocalInput(tomorrowAt10Caracas.toISOString());
}

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}