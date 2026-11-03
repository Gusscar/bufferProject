import { cacheGet, cacheSet, getBufferApiKey } from "@/lib/store";
import type {
  Account,
  AggregatedMetrics,
  Channel,
  Post,
  PostsPage,
  ShareMode,
  SchedulingType,
} from "@/types";

export const BUFFER_ENDPOINT = "https://api.buffer.com/graphql";

export class BufferError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "BufferError";
    this.status = status;
  }
}

export class BufferNotConfigured extends BufferError {
  constructor() {
    super(
      "No hay una API key de Buffer configurada. Configúrala en Ajustes o en la variable BUFFER_API_KEY.",
      401,
    );
    this.name = "BufferNotConfigured";
  }
}

export interface BufferQueryResult<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function bufferFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  opts: { bypass?: boolean } = {},
): Promise<T> {
  const apiKey = getBufferApiKey();
  if (!apiKey) throw new BufferNotConfigured();

  const cacheKey = `buffer:${query}:${JSON.stringify(variables ?? {})}`;
  if (!opts.bypass) {
    const hit = cacheGet<T>(cacheKey);
    if (hit) return hit;
  }

  const res = await fetch(BUFFER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables: variables ?? {} }),
    cache: "no-store",
  });

  let json: BufferQueryResult<T>;
  try {
    json = (await res.json()) as BufferQueryResult<T>;
  } catch {
    throw new BufferError(
      `Buffer respondió con un formato inesperado (HTTP ${res.status}). Revísala API key.`,
      res.status,
    );
  }

  if (!res.ok) {
    const msg =
      json?.errors?.[0]?.message || `Buffer devolvió HTTP ${res.status}`;
    throw new BufferError(msg, res.status);
  }
  if (json.errors?.length) {
    throw new BufferError(json.errors[0].message);
  }
  if (!json.data) {
    throw new BufferError("Buffer no devolvió datos.");
  }

  if (!opts.bypass) cacheSet(cacheKey, json.data);
  return json.data!;
}

const ACCOUNT_QUERY = /* GraphQL */ `
  query account {
    account {
      id
      email
      name
      avatar
      timezone
      organizations {
        id
        name
      }
    }
  }
`;

export async function getAccount(): Promise<Account> {
  const data = await bufferFetch<{ account: Account }>(ACCOUNT_QUERY);
  return data.account;
}

const CHANNELS_QUERY = /* GraphQL */ `
  query channels($input: ChannelsInput!) {
    channels(input: $input) {
      id
      name
      displayName
      descriptor
      avatar
      service
      type
      timezone
      isQueuePaused
      postingSchedule {
        day
        paused
        times
      }
      externalLink
    }
  }
`;

export async function getChannels(organizationId: string): Promise<Channel[]> {
  const data = await bufferFetch<{ channels: Channel[] }>(CHANNELS_QUERY, {
    input: { organizationId },
  });
  return data.channels;
}

const POSTS_QUERY = /* GraphQL */ `
  query posts($first: Int, $input: PostsInput!) {
    posts(first: $first, input: $input) {
      edges {
        node {
          id
          text
          status
          dueAt
          sentAt
          createdAt
          updatedAt
          channelId
          channelService
          schedulingType
          shareMode
          isCustomScheduled
          externalLink
          error { message }
          assets { id source thumbnail type }
          metrics { type name value unit }
          metricsUpdatedAt
          tags { id name color }
          allowedActions
        }
      }
      pageInfo { endCursor hasNextPage }
    }
  }
`;

export interface PostsFilter {
  channelIds?: string[];
  status?: string[];
  tagIds?: string[];
  dueAt?: { start?: string; end?: string };
  createdAt?: { start?: string; end?: string };
  startDate?: string;
  endDate?: string;
}

const MAX_PAGE_SIZE = 100;

export async function getPosts(
  organizationId: string,
  filter: PostsFilter = {},
  first = 100,
  bypass = false,
): Promise<PostsPage> {
  const pageSize = Math.min(Math.max(1, Math.floor(first)), MAX_PAGE_SIZE);
  const filterInput: Record<string, unknown> = {};
  if (filter.channelIds?.length) filterInput.channelIds = filter.channelIds;
  if (filter.status?.length) filterInput.status = filter.status;
  if (filter.tagIds?.length) filterInput.tagIds = filter.tagIds;
  if (filter.dueAt) filterInput.dueAt = filter.dueAt;
  if (filter.createdAt) filterInput.createdAt = filter.createdAt;
  if (filter.startDate) filterInput.startDate = filter.startDate;
  if (filter.endDate) filterInput.endDate = filter.endDate;

  const data = await bufferFetch<{
    posts: { edges: { node: Post }[]; pageInfo: PostsPage["pageInfo"] };
  }>(
    POSTS_QUERY,
    { first: pageSize, input: { organizationId, filter: filterInput, sort: [{ field: "dueAt", direction: "desc" }] } },
    { bypass },
  );

  const edges = data.posts.edges.map((e) => e.node);
  return {
    edges,
    pageInfo: data.posts.pageInfo,
    totalCount: edges.length,
  };
}

const AGGREGATED_METRICS_QUERY = /* GraphQL */ `
  query aggregatedPostMetrics($input: AggregatedPostMetricsInput!) {
    aggregatedPostMetrics(input: $input) {
      metrics { type name value unit }
      metricsUpdatedAt
    }
  }
`;

export async function getAggregatedMetrics(
  organizationId: string,
  startDateTime: string,
  endDateTime: string,
  channelIds?: string[],
  bypass = false,
): Promise<AggregatedMetrics> {
  const input: Record<string, unknown> = {
    organizationId,
    startDateTime,
    endDateTime,
  };
  if (channelIds?.length) input.channelIds = channelIds;

  const data = await bufferFetch<{ aggregatedPostMetrics: AggregatedMetrics }>(
    AGGREGATED_METRICS_QUERY,
    { input },
    { bypass },
  );
  return data.aggregatedPostMetrics;
}

export type InstagramPostType = "post" | "story" | "reel";

export interface PostInputMetadata {
  instagram?: { type: InstagramPostType; shouldShareToFeed: boolean };
}

export interface CreatePostInput {
  channelId: string;
  text?: string;
  mode: ShareMode;
  schedulingType: SchedulingType;
  dueAt?: string;
  assets?: Array<{ image: { url: string }; video?: never } | { video: { url: string } }>;
  tagIds?: string[];
  saveToDraft?: boolean;
  needsApproval?: boolean;
  metadata?: PostInputMetadata;
}

const CREATE_POST_MUTATION = /* GraphQL */ `
  mutation createPost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post { id text }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export async function createPost(input: CreatePostInput): Promise<string> {
  const data = await bufferFetch<{
    createPost: { post?: { id: string }; message?: string };
  }>(
    CREATE_POST_MUTATION,
    {
      input: {
        channelId: input.channelId,
        text: input.text,
        mode: input.mode,
        schedulingType: input.schedulingType,
        dueAt: input.dueAt,
        assets: input.assets,
        tagIds: input.tagIds,
        saveToDraft: input.saveToDraft,
        needsApproval: input.needsApproval ?? false,
        metadata: input.metadata,
      },
    },
    { bypass: true },
  );
  if (!data.createPost.post) {
    throw new BufferError(data.createPost.message || "No se pudo crear la publicación.");
  }
  return data.createPost.post.id;
}

const EDIT_POST_MUTATION = /* GraphQL */ `
  mutation editPost($input: EditPostInput!) {
    editPost(input: $input) {
      ... on PostActionSuccess {
        post { id }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export async function editPost(
  id: string,
  input: Partial<CreatePostInput>,
): Promise<void> {
  const data = await bufferFetch<{
    editPost: { post?: { id: string }; message?: string };
  }>(
    EDIT_POST_MUTATION,
    {
      input: {
        id,
        ...(input.text !== undefined ? { text: input.text } : {}),
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
        ...(input.mode !== undefined ? { mode: input.mode } : {}),
        ...(input.assets !== undefined ? { assets: input.assets } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      },
    },
    { bypass: true },
  );
  if (!data.editPost.post) {
    throw new BufferError(data.editPost.message || "No se pudo editar la publicación.");
  }
}

const DELETE_POST_MUTATION = /* GraphQL */ `
  mutation deletePost($input: DeletePostInput!) {
    deletePost(input: $input) {
      ... on PostActionSuccess {
        post { id }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export async function deletePost(id: string): Promise<void> {
  const data = await bufferFetch<{
    deletePost: { post?: { id: string }; message?: string };
  }>(DELETE_POST_MUTATION, { input: { id } }, { bypass: true });
  if (!data.deletePost.post) {
    throw new BufferError(data.deletePost.message || "No se pudo eliminar la publicación.");
  }
}