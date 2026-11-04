"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import {
  IconCalendar,
  IconChart,
  IconClock,
  IconDashboard,
  IconPosts,
  IconSettings,
} from "@/components/icons";

const NAV = [
  { href: "/dashboard", label: "Panel", icon: IconDashboard },
  { href: "/posts", label: "Publicaciones", icon: IconPosts },
  { href: "/calendar", label: "Calendario", icon: IconCalendar },
  { href: "/insights", label: "KPIs", icon: IconChart },
  { href: "/schedule", label: "Horarios", icon: IconClock },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="neu-raised sticky top-6 flex h-[calc(100vh-3rem)] flex-col p-5">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-1">
          <span className="neu-pressed-sm flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden !bg-white p-1.5">
            <Image src="/brand/logo-mark.png" alt="" width={32} height={32} className="h-full w-full object-contain" />
          </span>
          <span className="leading-tight">
            <span className="font-script block text-base font-semibold tracking-tight">
              Niños de la Luz
            </span>
            <span className="block text-[11px] font-bold tracking-wide text-teal uppercase">
              Venezuela
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "neu-raised-sm flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all",
                  active
                    ? "!shadow-[inset_3px_3px_7px_var(--shadow-dark),inset_-3px_-3px_7px_var(--shadow-light)] text-accent"
                    : "text-muted hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/settings"
          className={cn(
            "neu-raised-sm flex items-center gap-3 px-4 py-3 text-sm font-semibold",
            pathname.startsWith("/settings")
              ? "!shadow-[inset_3px_3px_7px_var(--shadow-dark),inset_-3px_-3px_7px_var(--shadow-light)] text-accent"
              : "text-muted hover:text-foreground",
          )}
        >
          <IconSettings />
          Ajustes
        </Link>
      </div>
    </aside>
  );
}