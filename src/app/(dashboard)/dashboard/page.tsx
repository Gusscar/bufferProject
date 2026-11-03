import { SetupGate } from "@/components/SetupGate";
import { getBufferApiKey } from "@/lib/store";
import {
  BufferError,
  getAccount,
  getAggregatedMetrics,
  getChannels,
  getPosts,
} from "@/lib/buffer";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { ErrorPanel } from "@/components/ErrorPanel";
import type { Account, AggregatedMetrics, Channel, PostsPage } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!getBufferApiKey()) return <SetupGate />;

  let account: Account;
  let organizationId: string | undefined;

  try {
    account = await getAccount();
    organizationId = account.organizations[0]?.id;
  } catch (err) {
    if (err instanceof BufferError && err.status === 401) {
      return <SetupGate />;
    }
    return (
      <ErrorPanel
        title="No se pudo conectar con Buffer"
        message={
          err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado al cargar tus datos."
        }
      />
    );
  }

  if (!organizationId) {
    return (
      <ErrorPanel
        title="Sin espacios de trabajo"
        message="Tu cuenta de Buffer no tiene espacios de trabajo (organizaciones)."
      />
    );
  }

  let channels: Channel[] = [];
  let posts: PostsPage = { edges: [], pageInfo: { hasNextPage: false } };
  let aggregated: AggregatedMetrics | null = null;

  try {
    [channels, posts] = await Promise.all([
      getChannels(organizationId),
      getPosts(organizationId, {}, 12),
    ]);

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      aggregated = await getAggregatedMetrics(
        organizationId,
        start.toISOString(),
        end.toISOString(),
      );
    } catch {
      aggregated = null;
    }
  } catch (err) {
    if (err instanceof BufferError && err.status === 401) {
      return <SetupGate />;
    }
    return (
      <ErrorPanel
        title="No se pudieron cargar los datos"
        message={
          err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado al cargar tus datos."
        }
      />
    );
  }

  return (
    <DashboardView
      account={account}
      channels={channels}
      posts={posts}
      aggregated={aggregated}
    />
  );
}