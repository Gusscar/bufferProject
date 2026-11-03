import Image from "next/image";
import { IconKey, IconSparkles } from "@/components/icons";
import { SetupForm } from "@/components/SetupForm";

export function SetupGate() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="neu-raised w-full max-w-xl p-8">
        <Image
          src="/illustrations/hug.webp"
          alt=""
          width={640}
          height={478}
          className="neu-raised-sm mb-6 h-40 w-full object-cover"
          priority
        />
        <div className="neu-pressed-sm mb-6 flex h-16 w-16 items-center justify-center bg-accent text-white">
          <IconKey width={28} height={28} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Conecta tu cuenta de Buffer
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          PublishFlow usa la API pública de Buffer para listar tus canales,
          programar publicaciones y leer métricas. La clave se guarda solo en el
          servidor de esta app (en memoria), nunca se envía al navegador.
        </p>
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>
            Entra en{" "}
            <a
              href="https://publish.buffer.com/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent underline underline-offset-2"
            >
              Buffer → Settings → API
            </a>{" "}
            y crea una <strong>personal API key</strong>.
          </li>
          <li>
            La sección <strong>KPIs</strong> (métricas) usa el scope{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">insightsRead</code>,
            que las personal API keys ya incluyen.
          </li>
          <li>Pega la clave abajo y empieza a gestionar tus publicaciones.</li>
        </ol>
        <SetupForm />
        <div className="mt-6 flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-xs leading-5 text-warning">
          <IconSparkles className="mt-0.5 shrink-0" />
          <span>
            La generación de imágenes usa Pollinations.ai (gratis, sin API key).
            El plan gratuito tiene un tope de ~1 imagen cada 15 s y puede añadir
            marca de agua.
          </span>
        </div>
      </div>
    </div>
  );
}