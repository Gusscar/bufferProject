import { NextResponse } from "next/server";
import {
  BufferError,
  createPost,
  deletePost,
  editPost,
  getAccount,
  getAggregatedMetrics,
  getChannels,
  getPosts,
} from "@/lib/buffer";
import { getPublicBaseUrl } from "@/lib/store";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function resolveAssetUrls(assets: unknown[] | undefined): unknown[] | undefined {
  if (!assets) return assets;
  const base = getPublicBaseUrl();

  return assets.map((asset) => {
    if (!asset || typeof asset !== "object") return asset;
    const clone = structuredClone(asset) as Record<string, { url?: string } | undefined>;

    for (const key of ["image", "video"] as const) {
      const media = clone[key];
      if (!media?.url) continue;

      let resolved: URL;
      if (media.url.startsWith("/")) {
        if (!base) {
          throw new BufferError(
            "Buffer no puede leer imágenes servidas desde una ruta relativa. Configura NEXT_PUBLIC_SITE_URL con la URL pública de tu sitio (o SITE_URL) en .env.local.",
            400,
          );
        }
        resolved = new URL(media.url, base);
      } else {
        try {
          resolved = new URL(media.url);
        } catch {
          throw new BufferError(`URL de imagen inválida: ${media.url}`, 400);
        }
      }

      if (LOCAL_HOSTNAMES.has(resolved.hostname)) {
        throw new BufferError(
          "Buffer no puede acceder a URLs en localhost. Despliega la app o expón tu servidor local con un túnel público (ej. ngrok) y configura NEXT_PUBLIC_SITE_URL con esa URL.",
          400,
        );
      }

      media.url = resolved.toString();
    }

    return clone;
  });
}

type Body =
  | { op: "getAccount" }
  | { op: "getChannels"; organizationId: string }
  | { op: "getPosts"; organizationId: string; filter?: Record<string, unknown>; first?: number }
  | { op: "getAggregatedMetrics"; organizationId: string; start: string; end: string; channelIds?: string[] }
  | {
      op: "createPost";
      input: {
        channelId: string;
        text?: string;
        mode: string;
        schedulingType?: string;
        dueAt?: string;
        assets?: unknown[];
        tagIds?: string[];
        saveToDraft?: boolean;
      };
    }
  | { op: "editPost"; id: string; input: Record<string, unknown> }
  | { op: "deletePost"; id: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido en el cuerpo." }, { status: 400 });
  }

  try {
    switch (body.op) {
      case "getAccount": {
        const account = await getAccount();
        return NextResponse.json({ account });
      }
      case "getChannels": {
        const channels = await getChannels(body.organizationId);
        return NextResponse.json({ channels });
      }
      case "getPosts": {
        const page = await getPosts(
          body.organizationId,
          (body.filter ?? {}) as Parameters<typeof getPosts>[1],
          body.first,
        );
        return NextResponse.json({ posts: page });
      }
      case "getAggregatedMetrics": {
        const metrics = await getAggregatedMetrics(
          body.organizationId,
          body.start,
          body.end,
          body.channelIds,
        );
        return NextResponse.json({ metrics });
      }
      case "createPost": {
        const id = await createPost({
          channelId: body.input.channelId,
          text: body.input.text,
          mode: body.input.mode as never,
          schedulingType: (body.input.schedulingType ?? "automatic") as never,
          dueAt: body.input.dueAt,
          assets: resolveAssetUrls(body.input.assets) as never,
          tagIds: body.input.tagIds,
          saveToDraft: body.input.saveToDraft,
        });
        return NextResponse.json({ id });
      }
      case "editPost": {
        const input = body.input as Record<string, unknown>;
        await editPost(body.id, {
          ...input,
          ...(input.assets !== undefined
            ? { assets: resolveAssetUrls(input.assets as unknown[]) }
            : {}),
        } as never);
        return NextResponse.json({ ok: true });
      }
      case "deletePost": {
        await deletePost(body.id);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Operación no soportada." }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const status = err instanceof Error && "status" in err ? Number((err as { status?: number }).status) : 500;
    if (!status || Number.isNaN(status)) {
      return NextResponse.json({ error: message }, { status: 502 });
    }
    return NextResponse.json({ error: message }, { status });
  }
}