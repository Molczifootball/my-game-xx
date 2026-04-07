"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { GameProvider } from "@/context/GameContext";
import Header from "@/components/Header";
import ResourceBar from "@/components/ResourceBar";
import SidebarLeft from "@/components/SidebarLeft";

const PUBLIC_PATHS = ["/login", "/register"];

export function GameShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Public pages (login/register) — no game shell
  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // Loading
  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-dim">
        <div className="text-center">
          <h1 className="text-2xl text-primary font-bold medieval-font tracking-widest mb-2">Lechia Online</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!session) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-dim">
        <p className="text-gray-500 text-xs uppercase tracking-widest">Redirecting to login...</p>
      </div>
    );
  }

  // Logged in — full game shell
  return (
    <GameProvider>
      <div className="shrink-0 z-50 sticky top-0">
        <Header />
        <ResourceBar />
      </div>
      <main className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden w-full relative">
        <SidebarLeft />
        <section className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          {children}
        </section>
      </main>
    </GameProvider>
  );
}
