import { SetupGate } from "@/components/SetupGate";
import { getBufferApiKey } from "@/lib/store";
import { BufferError, getAccount, getChannels, getPosts } from "@/lib/buffer";
import { CalendarBoard } from "@/components/calendar/CalendarBoard";
import { ErrorPanel } from "@/components/ErrorPanel";
import { gridDaysFor, todayCaracas, ymdToUtcIso } from "@/lib/calendarDate";
import type { Channel, PostsPage } from "@/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
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
  let initialPosts: PostsPage = { edges: [], pageInfo: { hasNextPage: false } };

  try {
    const today = todayCaracas();
    const days = gridDaysFor("month", today);
    [channels, initialPosts] = await Promise.all([
      getChannels(organizationId),
      getPosts(
        organizationId,
        {
          dueAt: {
            start: ymdToUtcIso(days[0], 0, 0),
            end: ymdToUtcIso(days[days.length - 1], 23, 59),
          },
        },
        100,
      ),
    ]);
  } catch (err) {
    if (err instanceof BufferError && err.status === 401) return <SetupGate />;
    return (
      <ErrorPanel
        title="No se pudo cargar el calendario"
        message={err instanceof Error ? err.message : "Error inesperado."}
      />
    );
  }

  return (
    <CalendarBoard
      organizationId={organizationId}
      channels={channels}
      initialPosts={initialPosts}
    />
  );
}
