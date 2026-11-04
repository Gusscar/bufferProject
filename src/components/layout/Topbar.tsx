"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  IconBell,
  IconCalendar,
  IconDashboard,
  IconPosts,
  IconChart,
  IconClock,
  IconSettings,
} from "@/components/icons";
import { cn } from "@/lib/format";
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Panel", icon: IconDashboard },
  { href: "/posts", label: "Posts", icon: IconPosts },
  { href: "/calendar", label: "Calendario", icon: IconCalendar },
  { href: "/insights", label: "KPIs", icon: IconChart },
  { href: "/schedule", label: "Horarios", icon: IconClock },
  { href: "/settings", label: "Ajustes", icon: IconSettings },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="neu-raised fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-black/5 px-2 py-2 lg:hidden">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            className={cn(
              "neu-pressed-sm flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-semibold",
              active ? "text-accent" : "text-muted",
            )}
          >
            <item.icon width={20} height={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Topbar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="neu-raised flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Panel de control
        </p>
        <p className="text-sm font-medium">
          {now
            ? new Intl.DateTimeFormat("es-ES", {
                dateStyle: "full",
                timeStyle: "short",
              }).format(now)
            : "…"}
        </p>
      </div>
      <button
        aria-label="Notificaciones"
        className="neu-pressed-sm relative flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-foreground"
      >
        <IconBell />
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
          0
        </span>
      </button>
    </header>
  );
}