import { IconAlert } from "@/components/icons";
import { NeuCard } from "@/components/neu/NeuCard";

export function ErrorPanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <NeuCard className="flex max-w-2xl flex-col items-start gap-3 !border-l-4 !border-l-danger">
      <div className="flex items-center gap-3">
        <span className="neu-pressed-sm flex h-11 w-11 items-center justify-center bg-danger/15 text-danger">
          <IconAlert />
        </span>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <p className="text-sm leading-6 text-muted">{message}</p>
    </NeuCard>
  );
}