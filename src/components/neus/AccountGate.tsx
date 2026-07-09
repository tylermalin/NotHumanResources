"use client";
// Account setup for (not)Human Resources issues through NEUS.
//
// This gate delivers its receipt by REDIRECT (artifact type redirect_url with a
// successReturnUrl), so we drive Hosted Verify as a full-page redirect rather
// than the popup widget: the popup waits for a postMessage this gate never
// sends. We send the browser to Hosted Verify, the user completes the gate's
// checks on NEUS (no verifier logic here, no password shared), and NEUS
// redirects back to successReturnUrl with the receipt (qHash) in the URL, which
// consumeReturnedQHash() picks up on return. End users never need a NEUS
// account or API key.
//
// NOTE: the gate's successReturnUrl must match the origin you're testing on. In
// production that's https://nothumanresources.xyz/hire; for local dev, point it
// at http://localhost:3000/hire in the NEUS portal (Profile → Portals).
import { getHostedCheckoutUrl } from "@neus/sdk";
import { useEffect, useState } from "react";
import {
  SESSION_EVENT,
  consumeReturnedQHash,
  getSession,
  hasSession,
  saveDemo,
} from "./session";

const GATE_ID = process.env.NEXT_PUBLIC_NEUS_GATE_ID;

export function AccountGate({ children }: { children: React.ReactNode }) {
  // null = not yet hydrated; avoids a flash of the wrong state on load.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    // If we've just been redirected back from Hosted Verify with a receipt in
    // the URL, complete sign-in from it before reading session state.
    consumeReturnedQHash();
    const sync = () => setSignedIn(hasSession(getSession()));
    sync();
    window.addEventListener(SESSION_EVENT, sync);
    return () => window.removeEventListener(SESSION_EVENT, sync);
  }, []);

  function startSignIn() {
    if (!GATE_ID) return;
    setStarting(true);
    // returnUrl is where NEUS sends the browser back; the gate's own
    // successReturnUrl governs if it's locked server-side.
    const url = getHostedCheckoutUrl({
      gateId: GATE_ID,
      returnUrl: window.location.href,
    });
    window.location.assign(url);
  }

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
            <button
              onClick={startSignIn}
              disabled={starting}
              className="w-full rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50"
            >
              {starting ? "Opening NEUS…" : "Verify & get started"}
            </button>
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
