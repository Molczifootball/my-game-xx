"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { GameProvider } from "@/context/GameContext";
import Header from "@/components/Header";
import ResourceBar from "@/components/ResourceBar";
import SidebarLeft from "@/components/SidebarLeft";
import ChatPanel from "@/components/ChatPanel";

function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register" || pathname === "/terms" || pathname === "/privacy" || pathname.startsWith("/api/");
}

export function GameShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = isPublicPath(pathname);

  // Redirect to login if not authenticated and not on a public page
  useEffect(() => {
    if (status === "unauthenticated" && !isPublic) {
      router.replace("/login");
    }
  }, [status, isPublic, router]);

  // Public pages (login/register) — no game shell
  if (isPublic) {
    return <>{children}</>;
  }

  // Loading or redirecting
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-dim">
        <div className="text-center">
          <h1 className="text-2xl text-primary font-bold medieval-font tracking-widest mb-2">Lechia Online</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Logged in — full game shell
  return (
    <GameProvider>
      <div className="flex flex-col h-full overflow-hidden">
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
        <ChatPanel />
        <footer className="shrink-0 py-1.5 px-4 bg-surface-base border-t border-outline-variant flex justify-center">
          <span className="text-[9px] text-gray-600 font-mono uppercase tracking-widest opacity-50">
            Property of <span className="text-primary/70">Malachite Software</span> © 2026
          </span>
        </footer>
      </div>
    </GameProvider>
  );
}
