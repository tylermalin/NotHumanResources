"use client";
// Account setup for (not)Human Resources issues through NEUS.
//
// VerifyGate owns the whole flow — it reuses an existing receipt when the
// visitor has one and opens Hosted Verify only when needed. The published
// gate (created at neus.network → Profile → Portals) owns the checks,
// pricing, and checkout; this app never implements verifier logic. End
// users never need a NEUS account or API key.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  SESSION_EVENT,
  getSession,
  hasSession,
  saveDemo,
  saveVerified,
} from "./session";

const VerifyGate = dynamic(
  () => import("@neus/sdk/widgets").then((m) => m.VerifyGate),
  { ssr: false }
);

const GATE_ID = process.env.NEXT_PUBLIC_NEUS_GATE_ID;

export function AccountGate({ children }: { children: React.ReactNode }) {
  // null = not yet hydrated; avoids a flash of the wrong state on load.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setSignedIn(hasSession(getSession()));
    sync();
    window.addEventListener(SESSION_EVENT, sync);
    return () => window.removeEventListener(SESSION_EVENT, sync);
  }, []);

  if (signedIn === null) {
    return (
      <div className="py-24 text-center text-sm text-zinc-400">Loading…</div>
    );
  }
  if (signedIn) return <>{children}</>;

  return (
    <div className="mx-auto max-w-xl py-16">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Set up your account
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          Verify once and you&apos;re in — no new passwords. Your account is a
          portable trust receipt, and every AI worker you hire is accountable
          to it.
        </p>
        <div className="mt-6 flex justify-center">
          {GATE_ID ? (
            <VerifyGate
              gateId={GATE_ID}
              buttonText="Verify & get started"
              onVerified={(result: { qHash: string }) => {
                saveVerified(result.qHash);
              }}
            />
          ) : (
            <div className="w-full text-left">
              <div className="rounded-md border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-4 text-sm text-amber-900 dark:text-amber-200">
                <div className="font-medium">Verification not configured</div>
                <p className="mt-1">
                  Publish a gate at neus.network (Profile → Portals), then set{" "}
                  <code className="font-mono text-xs">
                    NEXT_PUBLIC_NEUS_GATE_ID
                  </code>{" "}
                  in <code className="font-mono text-xs">.env.local</code>.
                </p>
              </div>
              <button
                onClick={saveDemo}
                className="mt-4 w-full rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Continue in local demo mode
              </button>
            </div>
          )}
        </div>
        <p className="mt-4 text-xs text-zinc-400">
          Account setup issues through NEUS. You never share a password with
          us, and your verification is reusable anywhere NEUS is accepted.
        </p>
      </div>
    </div>
  );
}
