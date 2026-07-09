"use client";
import { useEffect, useState } from "react";
import {
  SESSION_EVENT,
  clearSession,
  getSession,
  type NeusSession,
} from "./session";

function shortAccount(account: string): string {
  return `${account.slice(0, 6)}…${account.slice(-4)}`;
}

export function SessionBadge() {
  const [session, setSession] = useState<NeusSession | null>(null);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener(SESSION_EVENT, sync);
    return () => window.removeEventListener(SESSION_EVENT, sync);
  }, []);

  if (!session) return null;

  if (session.account) {
    return (
      <span className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {session.handle ? `@${session.handle}` : shortAccount(session.account)}
        </span>
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
