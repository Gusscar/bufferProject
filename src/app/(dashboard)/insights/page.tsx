import { SetupGate } from "@/components/SetupGate";
import { getBufferApiKey, listSnapshots } from "@/lib/store";
import { BufferError, getAccount, getAggregatedMetrics } from "@/lib/buffer";
import { InsightsBoard } from "@/components/insights/InsightsBoard";
import { ErrorPanel } from "@/components/ErrorPanel";
import type { KpiSnapshot, PostMetric } from "@/types";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
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

  let initialMetrics: PostMetric[] = [];
  let initialUpdatedAt: string | null = null;
  let initialSnapshots: KpiSnapshot[] = [];

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 28);

    const [aggregated, snapshots] = await Promise.all([
      getAggregatedMetrics(organizationId, start.toISOString(), end.toISOString()),
      listSnapshots(),
    ]);
    initialMetrics = aggregated.metrics ?? [];
    initialUpdatedAt = aggregated.metricsUpdatedAt ?? null;
    initialSnapshots = snapshots;
  } catch (err) {
    if (err instanceof BufferError && err.status === 401) return <SetupGate />;
    return (
      <ErrorPanel
        title="No se pudieron cargar los datos de métricas"
        message={err instanceof Error ? err.message : "Error inesperado."}
      />
    );
  }

  return (
    <InsightsBoard
      organizationId={organizationId}
      initialMetrics={initialMetrics}
      initialUpdatedAt={initialUpdatedAt}
      initialSnapshots={initialSnapshots}
    />
  );
}