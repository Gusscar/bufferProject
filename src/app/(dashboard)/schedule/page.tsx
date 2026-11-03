import { SetupGate } from "@/components/SetupGate";
import { getBufferApiKey } from "@/lib/store";
import { BufferError, getAccount, getChannels } from "@/lib/buffer";
import { ScheduleBoard } from "@/components/schedule/ScheduleBoard";
import { ErrorPanel } from "@/components/ErrorPanel";
import type { Channel } from "@/types";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  if (!getBufferApiKey()) return <SetupGate />;

  let organizationId: string | undefined;

  try {
    const account = await getAccount();
    organizationId = account.organizations[0]?.id;
  } catch (err) {
    if (err instanceof BufferError && err.status === 401) return <SetupGate />;
    return (
      <ErrorPanel
        title="No se pudo conectar con Buffer"
        message={err instanceof Error ? err.message : "Error inesperado."}
      />
    );
  }

  if (!organizationId) {
    return (
      <ErrorPanel
        title="Sin espacio de trabajo"
        message="No se encontró un espacio de trabajo en tu cuenta de Buffer."
      />
    );
  }

  let channels: Channel[] = [];

  try {
    channels = await getChannels(organizationId);
  } catch (err) {
    if (err instanceof BufferError && err.status === 401) return <SetupGate />;
    return (
      <ErrorPanel
        title="No se pudieron cargar los horarios"
        message={err instanceof Error ? err.message : "Error inesperado."}
      />
    );
  }

  return <ScheduleBoard channels={channels} />;
}