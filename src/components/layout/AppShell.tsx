import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav, Topbar } from "@/components/layout/Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Topbar />
          {children}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}