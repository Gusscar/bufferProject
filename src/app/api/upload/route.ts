import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { translateApiError } from "@/lib/errorTranslate";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  // Vercel conecta un Blob store vía OIDC (BLOB_STORE_ID + VERCEL_OIDC_TOKEN en runtime)
  // o, para uso fuera de Vercel, vía BLOB_READ_WRITE_TOKEN. Cualquiera de los dos sirve.
  if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Falta configurar el almacenamiento de imágenes. Habilita Vercel Blob en tu proyecto (Storage → Create Database → Blob) y conéctalo a este proyecto.",
      },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo enviado." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecciona una imagen para subir." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa JPG, PNG, WEBP o GIF." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera el tamaño máximo de 10 MB." },
      { status: 400 },
    );
  }

  try {
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido.";
    return NextResponse.json({ error: translateApiError(message) }, { status: 502 });
  }
}
