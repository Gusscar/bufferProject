"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChannelAvatar } from "@/components/ChannelAvatar";
import { NeuButton, NeuSpinner } from "@/components/neu/NeuButton";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuInput } from "@/components/neu/NeuInput";
import { NeuSelect } from "@/components/neu/NeuSelect";
import { listImageModels } from "@/lib/pollinations";
import { listTextModels } from "@/lib/llm";
import { cn, SERVICE_LABEL } from "@/lib/format";
import {
  IconAlert,
  IconCheck,
  IconKey,
  IconSparkles,
  IconStack,
} from "@/components/icons";
import type { Account, Channel } from "@/types";
import { SetupForm } from "@/components/SetupForm";

export function SettingsForm({
  configured,
  account,
  channels,
  model,
  llmModel,
}: {
  configured: boolean;
  account: Account | null;
  channels: Channel[];
  model: string;
  llmModel: string;
}) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pollinationsKey, setPollinationsKey] = useState("");
  const [savingPollinationsKey, setSavingPollinationsKey] = useState(false);
  const [pollinationsMessage, setPollinationsMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [activeModel, setActiveModel] = useState(model || "flux");
  const [savingModel, setSavingModel] = useState(false);
  const [activeLlmModel, setActiveLlmModel] = useState(llmModel || "openai");
  const [savingLlmModel, setSavingLlmModel] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  async function saveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setTesting(true);
    setTestResult(null);
    setMessage(null);
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setKey", key }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la clave.");
      const test = await fetch("/api/buffer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "getAccount" }),
      });
      const testJson = await test.json().catch(() => ({}));
      if (!test.ok) {
        setTestResult({
          ok: false,
          text: `Clave guardada, pero Buffer rechazó la conexión: ${testJson.error ?? "revísala e inténtalo de nuevo."}`,
        });
        return;
      }
      setTestResult({ ok: true, text: "Conexión exitosa con Buffer." });
      setKey("");
      router.refresh();
    } catch (e) {
      setTestResult({ ok: false, text: e instanceof Error ? e.message : "Error de red." });
    } finally {
      setTesting(false);
    }
  }

  async function savePollinationsKey(e: React.FormEvent) {
    e.preventDefault();
    if (!pollinationsKey.trim()) return;
    setSavingPollinationsKey(true);
    setPollinationsMessage(null);
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setPollinationsKey", key: pollinationsKey }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la clave.");
      setPollinationsMessage({
        kind: "ok",
        text: "API key de Pollinations guardada. Ya puedes generar imágenes.",
      });
      setPollinationsKey("");
      router.refresh();
    } catch (e) {
      setPollinationsMessage({
        kind: "error",
        text: e instanceof Error ? e.message : "Error de red.",
      });
    } finally {
      setSavingPollinationsKey(false);
    }
  }

  async function onModelChange(next: string) {
    setActiveModel(next);
    setSavingModel(true);
    setMessage(null);
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setModel", model: next }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el modelo.");
      setMessage({ kind: "ok", text: `Modelo de imagen actualizado a ${next}.` });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Error al guardar." });
    } finally {
      setSavingModel(false);
    }
  }

  async function onLlmModelChange(next: string) {
    setActiveLlmModel(next);
    setSavingLlmModel(true);
    setMessage(null);
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setLlmModel", model: next }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el modelo.");
      setMessage({ kind: "ok", text: `Modelo de texto actualizado a ${next}.` });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Error al guardar." });
    } finally {
      setSavingLlmModel(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="neu-raised p-5">
        <h1 className="text-xl font-extrabold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-muted">
          Configuración de la API key de Buffer y del generador de imágenes.
        </p>
      </section>

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

      {/* Account info */}
      {account ? (
        <NeuCard className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {account.avatar ? (
            <ChannelAvatar
              id={account.id}
              src={account.avatar}
              size={56}
              className="neu-pressed-sm h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <span className="neu-pressed-sm flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 font-bold text-accent">
              {account.name?.charAt(0) || account.email.charAt(0)}
            </span>
          )}
          <div className="flex-1">
            <p className="font-bold">{account.name || account.email}</p>
            <p className="text-sm text-muted">{account.email}</p>
            <p className="mt-1 text-xs text-muted">
              {account.organizations.map((o) => o.name).join(", ") || "Sin organización"} ·{" "}
              {channels.length} canales conectados
            </p>
          </div>
          <div className="flex gap-2">
            {channels.slice(0, 5).map((ch) => (
              <ChannelAvatar
                key={ch.id}
                id={ch.id}
                src={ch.avatar}
                size={32}
                title={`${SERVICE_LABEL[ch.service]} · ${ch.name}`}
                className="neu-pressed-sm h-8 w-8 rounded-xl object-cover"
              />
            ))}
          </div>
        </NeuCard>
      ) : (
        <NeuCard className="text-sm text-muted">
          Sin conexión actual. Guarda tu API key abajo. También puedes configurarla en el
          archivo <code className="text-foreground">.env.local</code> con{" "}
          <code className="text-foreground">BUFFER_API_KEY=</code>.
        </NeuCard>
      )}

      {/* API key */}
      {!configured && (
        <NeuCard>
          <SetupForm />
        </NeuCard>
      )}

      {configured && (
        <NeuCard className="flex flex-col gap-4">
          <form onSubmit={(e) => void saveKey(e)} className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <IconKey className="text-accent" /> Actualizar API key
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <NeuInput
                type="password"
                autoComplete="off"
                placeholder="Nueva API key de Buffer (opcional)"
                icon={<IconKey width={16} height={16} />}
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <NeuButton type="submit" variant="primary" loading={testing} disabled={!key.trim()}>
                {testing ? "Probando…" : "Guardar y probar"}
              </NeuButton>
            </div>
            {testResult && (
              <p
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                  testResult.ok ? "bg-teal-soft text-teal" : "bg-danger/10 text-danger",
                )}
              >
                {testResult.ok ? (
                  <IconCheck width={16} height={16} />
                ) : (
                  <IconAlert width={16} height={16} />
                )}
                {testResult.text}
              </p>
            )}
          </form>
        </NeuCard>
      )}

      {/* Image model */}
      <NeuCard className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <IconSparkles className="text-accent" /> Generador de imágenes (Pollinations)
        </h2>
        <form
          onSubmit={(e) => void savePollinationsKey(e)}
          className="flex flex-col gap-3"
        >
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
              <IconKey className="h-4 w-4" /> API key de Pollinations (obligatoria)
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <NeuInput
                type="password"
                autoComplete="off"
                placeholder="sk_… (consíguela en enter.pollinations.ai/keys)"
                icon={<IconKey width={16} height={16} />}
                value={pollinationsKey}
                onChange={(e) => setPollinationsKey(e.target.value)}
              />
              <NeuButton
                type="submit"
                variant="primary"
                loading={savingPollinationsKey}
                disabled={!pollinationsKey.trim()}
              >
                {savingPollinationsKey ? "Guardando…" : "Guardar"}
              </NeuButton>
            </div>
          </label>
          {pollinationsMessage && (
            <p
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                pollinationsMessage.kind === "ok"
                  ? "bg-teal-soft text-teal"
                  : "bg-danger/10 text-danger",
              )}
            >
              {pollinationsMessage.kind === "ok" ? (
                <IconCheck width={16} height={16} />
              ) : (
                <IconAlert width={16} height={16} />
              )}
              {pollinationsMessage.text}
            </p>
          )}
        </form>
        <NeuSelect
          label="Modelo"
          value={activeModel}
          onChange={(e) => void onModelChange(e.target.value)}
        >
          {listImageModels().map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </NeuSelect>
        {savingModel && (
          <p className="flex items-center gap-2 text-xs text-muted">
            <NeuSpinner className="h-3.5 w-3.5" /> Guardando…
          </p>
        )}
        <ul className="flex flex-col gap-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            Pollinations exige una API key válida para generar imágenes (error 401 en caso
            contrario). Puedes obtenerla en{" "}
            <span className="text-foreground">enter.pollinations.ai/keys</span> o definirla con{" "}
            <code className="text-foreground">POLLINATIONS_API_KEY=</code> en{" "}
            <code className="text-foreground">.env.local</code>.
          </li>
          <li className="flex items-start gap-2">
            <IconStack className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            La imagen se genera en la nube de Pollinations. Sin key pueden aparecer marcas de
            agua y el servicio impone límites por cuenta.
          </li>
          <li className="flex items-start gap-2">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            Recomendado: “flux” para calidad general y “turbo” para resultados más rápidos.
          </li>
        </ul>
      </NeuCard>

      {/* Text AI */}
      <NeuCard className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <IconSparkles className="text-accent" /> Texto con IA (gratis)
        </h2>
        <p className="text-sm text-muted">
          Usa el mismo proveedor y API key de Pollinations para generar el texto de los posts
          y sugerir respuestas a comentarios. El modelo es configurable aquí y más adelante
          puedes conectar otro proveedor con{" "}
          <code className="text-foreground">LLM_API_KEY</code>,{" "}
          <code className="text-foreground">LLM_MODEL</code> y{" "}
          <code className="text-foreground">LLM_BASE_URL</code> en{" "}
          <code className="text-foreground">.env.local</code>.
        </p>
        <NeuSelect
          label="Modelo de texto"
          value={activeLlmModel}
          onChange={(e) => void onLlmModelChange(e.target.value)}
        >
          {listTextModels().map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </NeuSelect>
        {savingLlmModel && (
          <p className="flex items-center gap-2 text-xs text-muted">
            <NeuSpinner className="h-3.5 w-3.5" /> Guardando…
          </p>
        )}
        <ul className="flex flex-col gap-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            Necesita la misma API key de Pollinations (Ajustes → Generador de imágenes) o la
            variable <code className="text-foreground">POLLINATIONS_API_KEY</code>.
          </li>
          <li className="flex items-start gap-2">
            <IconStack className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            La respuesta del asistente siempre se revisa antes de enviar: nada se publica ni se
            responde de forma automática.
          </li>
        </ul>
      </NeuCard>

      <div className="flex flex-col items-center gap-2 py-4 opacity-70">
        <img src="/brand/logo-lockup.png" alt="Niños de la Luz Venezuela" className="h-10 w-auto" />
        <p className="text-xs text-muted">Hecho para el equipo de comunicaciones de Niños de la Luz</p>
      </div>
    </div>
  );
}