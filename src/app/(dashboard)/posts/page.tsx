import { SetupGate } from "@/components/SetupGate";
import { getBufferApiKey } from "@/lib/store";
import { BufferError, getAccount, getChannels, getPosts } from "@/lib/buffer";
import { PostsBoard } from "@/components/posts/PostsBoard";
import { ErrorPanel } from "@/components/ErrorPanel";
import type { Channel, PostsPage } from "@/types";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
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
        title="Sin espacios de trabajo"
        message="Tu cuenta de Buffer no tiene espacios de trabajo."
      />
    );
  }

  let channels: Channel[] = [];
  let posts: PostsPage = { edges: [], pageInfo: { hasNextPage: false } };

  try {
    [channels, posts] = await Promise.all([
      getChannels(organizationId),
      getPosts(organizationId, {}, 100),
    ]);
  } catch (err) {
    if (err instanceof BufferError && err.status === 401) return <SetupGate />;
    return (
      <ErrorPanel
        title="No se pudieron cargar las publicaciones"
        message={err instanceof Error ? err.message : "Error inesperado."}
      />
    );
  }

  return (
    <PostsBoard
      organizationId={organizationId}
      channels={channels}
      initialPosts={posts}
    />
  );
}