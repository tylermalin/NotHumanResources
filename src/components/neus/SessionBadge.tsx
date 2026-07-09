"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  SESSION_EVENT,
  clearSession,
  getSession,
  type NeusSession,
} from "./session";

const ProofBadge = dynamic(
  () => import("@neus/sdk/widgets").then((m) => m.ProofBadge),
  { ssr: false }
);

export function SessionBadge() {
  const [session, setSession] = useState<NeusSession | null>(null);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener(SESSION_EVENT, sync);
    return () => window.removeEventListener(SESSION_EVENT, sync);
  }, []);

  if (!session) return null;

  if (session.qHash) {
    return (
      <span className="flex items-center gap-2">
        <ProofBadge qHash={session.qHash} size="sm" />
        <button
          onClick={clearSession}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Sign out
        </button>
      </span>
    );
  }
  if (session.demo) {
    return (
      <span className="flex items-center gap-2">
        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
          Demo mode
        </span>
        <button
          onClick={clearSession}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Exit
        </button>
      </span>
    );
  }
  return null;
}
