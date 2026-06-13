"use client";

import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isQuotations = pathname.startsWith("/quotations");

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileNav />
        <main className={`flex-1 overflow-hidden ${isQuotations ? "p-0" : "overflow-y-auto p-4 md:p-6 lg:p-8"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
