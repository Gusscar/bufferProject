"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NeuButton } from "@/components/neu/NeuButton";
import { NeuInput } from "@/components/neu/NeuInput";
import { IconAlert, IconCheck, IconKey } from "@/components/icons";

export function SetupForm() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setKey", key }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar la clave.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de red al guardar la clave.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-6 space-y-4">
      <NeuInput
        type="password"
        autoComplete="off"
        label="API key de Buffer"
        icon={<IconKey width={16} height={16} />}
        placeholder="Pega aquí tu personal API key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        required
      />
      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          <IconAlert width={16} height={16} /> {error}
        </p>
      )}
      <NeuButton type="submit" variant="primary" size="lg" loading={busy} className="w-full">
        {busy ? "Verificando…" : "Conectar Buffer"}
      </NeuButton>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <IconCheck width={13} height={13} className="text-teal" />
        También puedes definir BUFFER_API_KEY en tu archivo .env.local
      </p>
    </form>
  );
}