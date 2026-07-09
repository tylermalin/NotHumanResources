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
        <span className="flex items-center gap-1.5 rounded-sm border border-accent/30 bg-ghost px-2.5 py-0.5 text-xs font-medium text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_#00ff66]" />
          {session.handle ? `@${session.handle}` : shortAccount(session.account)}
        </span>
        <button
          onClick={clearSession}
          className="text-xs uppercase tracking-wide text-muted hover:text-ink"
        >
          Sign out
        </button>
      </span>
    );
  }
  if (session.demo) {
    return (
      <span className="flex items-center gap-2">
        <span className="rounded-sm border border-hairline bg-inset px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
          Demo mode
        </span>
        <button
          onClick={clearSession}
          className="text-xs uppercase tracking-wide text-muted hover:text-ink"
        >
          Exit
        </button>
      </span>
    );
  }
  return null;
}
