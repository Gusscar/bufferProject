import { NextResponse } from "next/server";
import {
  addSnapshot,
  deleteSnapshot,
  getStore,
  listSnapshots,
  setBufferApiKey,
  setPollinationsApiKey,
} from "@/lib/store";

type Body =
  | { action: "list" }
  | { action: "setKey"; key: string }
  | { action: "setPollinationsKey"; key: string }
  | { action: "setModel"; model: string }
  | { action: "setLlmModel"; model: string }
  | {
      action: "addSnapshot";
      snapshot: { date: string; metrics: Record<string, number>; channelFilter: string };
    }
  | { action: "deleteSnapshot"; id: string };

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    configured: Boolean(process.env.BUFFER_API_KEY) || Boolean(store.bufferApiKey),
    model: store.pollinationsModel,
    llmModel: store.llmModel,
    snapshots: listSnapshots(),
  });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido en el cuerpo." }, { status: 400 });
  }

  switch (body.action) {
    case "list":
      return NextResponse.json({
        configured:
          Boolean(process.env.BUFFER_API_KEY) || Boolean(getStore().bufferApiKey),
        snapshots: listSnapshots(),
      });

    case "setKey": {
      const key = body.key.trim();
      if (!key) {
        return NextResponse.json({ error: "La API key no puede estar vacía." }, { status: 400 });
      }
      setBufferApiKey(key);
      return NextResponse.json({ ok: true });
    }

    case "setPollinationsKey": {
      const key = body.key.trim();
      if (!key) {
        return NextResponse.json({ error: "La API key no puede estar vacía." }, { status: 400 });
      }
      setPollinationsApiKey(key);
      return NextResponse.json({ ok: true });
    }

    case "setModel": {
      getStore().pollinationsModel = body.model;
      return NextResponse.json({ ok: true });
    }

    case "setLlmModel": {
      getStore().llmModel = body.model;
      return NextResponse.json({ ok: true });
    }

    case "addSnapshot": {
      if (!body.snapshot.date || !body.snapshot.metrics) {
        return NextResponse.json({ error: "Snapshot incompleto." }, { status: 400 });
      }
      const snapshot = addSnapshot(body.snapshot);
      return NextResponse.json({ snapshot });
    }

    case "deleteSnapshot": {
      const ok = deleteSnapshot(body.id);
      return NextResponse.json({ ok });
    }

    default:
      return NextResponse.json({ error: "Acción no soportada." }, { status: 400 });
  }
}