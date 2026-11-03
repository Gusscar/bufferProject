import { ChannelAvatar } from "@/components/ChannelAvatar";
import { NeuCard } from "@/components/neu/NeuCard";
import { NeuBadge } from "@/components/neu/NeuBadge";
import { IconClock, IconExternal } from "@/components/icons";
import { dayName } from "@/lib/format";
import type { Channel, DayOfWeek } from "@/types";

const DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function ScheduleBoard({ channels }: { channels: Channel[] }) {
  const withSchedule = channels.filter((c) => c.postingSchedule.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <section className="neu-raised p-5">
        <h1 className="text-xl font-extrabold tracking-tight">Horarios de publicación</h1>
        <p className="mt-1 text-sm text-muted">
          Buffer publica automáticamente en la cola según estos horarios. La cola asigna las
          fechas según el orden de creación. Para cambiarlos, edítalos en Buffer.
        </p>
      </section>

      {withSchedule.length === 0 && (
        <NeuCard className="text-sm text-muted">
          Ningún canal tiene horario configurado aún. Configúralos desde Buffer.
        </NeuCard>
      )}

      {withSchedule.map((ch) => (
        <section key={ch.id}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <ChannelAvatar
                id={ch.id}
                src={ch.avatar}
                size={36}
                className="neu-pressed-sm h-9 w-9 rounded-xl object-cover"
              />
              <div>
                <h2 className="text-sm font-bold">{ch.displayName || ch.name}</h2>
                <p className="text-xs text-muted">
                  Zona horaria {ch.timezone || "—"}
                  {ch.isQueuePaused && " · "}
                  {ch.isQueuePaused && <span className="font-semibold text-warning">Cola pausada</span>}
                </p>
              </div>
            </div>
            {ch.externalLink && (
              <a
                href={ch.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-btn !px-3 !py-1.5 text-xs"
              >
                <IconExternal className="h-3.5 w-3.5" /> Editar en Buffer
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {DAYS.map((day) => {
              const slot = ch.postingSchedule.find((s) => s.day === day);
              return (
                <NeuCard key={day} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{dayName(day)}</p>
                    {slot?.paused && <NeuBadge className="!bg-warning/10 text-warning">Pausado</NeuBadge>}
                  </div>
                  {slot && slot.times.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {slot.times.map((t, i) => (
                        <span
                          key={`${t}-${i}`}
                          className="neu-chip px-2.5 py-1 text-xs font-semibold text-accent"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      <IconClock className="h-3.5 w-3.5" /> Sin horas
                    </p>
                  )}
                </NeuCard>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}