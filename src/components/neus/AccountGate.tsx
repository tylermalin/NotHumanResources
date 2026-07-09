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
  consumeLoginReturn,
  getSession,
  hasSession,
  saveDemo,
} from "./session";

const GATE_ID = process.env.NEXT_PUBLIC_NEUS_GATE_ID;
// Canonical app origin. When set, NEUS login always returns here regardless of
// which URL the visitor started on (e.g. a *.vercel.app deploy URL); when unset
// (local dev, preview deploys), we fall back to the current URL.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export function AccountGate({ children }: { children: React.ReactNode }) {
  // null = not yet hydrated; avoids a flash of the wrong state on load.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    // If we've just been redirected back from NEUS login, complete sign-in
    // from the callback params before reading session state.
    consumeLoginReturn();
    const sync = () => setSignedIn(hasSession(getSession()));
    sync();
    window.addEventListener(SESSION_EVENT, sync);
    return () => window.removeEventListener(SESSION_EVENT, sync);
  }, []);

  function startSignIn() {
    setStarting(true);
    // Site sign-in uses NEUS intent=login — a clean session sign-in that
    // redirects back to returnUrl with the login receipt. The Google-org gate
    // (GATE_ID) is reserved for per-agent credentialing at hire time, not site
    // access; a login receipt wouldn't satisfy that gate anyway.
    // Pin the return to the canonical origin (keeping the current path), so a
    // visitor who landed on a *.vercel.app URL still comes back to the real
    // domain signed in — not to the deploy URL.
    const returnUrl = APP_URL
      ? new URL(
          window.location.pathname + window.location.search,
          APP_URL
        ).toString()
      : window.location.href;
    const url = getHostedCheckoutUrl({ intent: "login", returnUrl });
    window.location.assign(url);
  }

  if (signedIn === null) {
    return (
      <div className="py-24 text-center text-sm uppercase tracking-wide text-muted">
        Loading…
      </div>
    );
  }
  if (signedIn) return <>{children}</>;

  return (
    <div className="mx-auto max-w-xl py-16">
      <div className="overflow-hidden rounded-md border border-hairline bg-surface shadow-[0_0_40px_rgba(0,255,102,0.05)]">
        <div className="flex items-center gap-2 border-b border-hairline bg-raise px-6 py-3.5 font-display text-xs uppercase tracking-[0.15em]">
          <span className="text-accent">(!)</span>
          <span className="text-accent">(not)</span>
          <span>Human Resources</span>
        </div>
        <div className="p-8 text-center">
          <h1 className="font-display text-xl uppercase tracking-tight">
            Set up your account
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Verify once and you&apos;re in — no new passwords. Your account is a
            portable trust receipt, and every AI worker you hire is accountable
            to it.
          </p>
          <div className="mt-6 flex justify-center">
            {GATE_ID ? (
              <button
                onClick={startSignIn}
                disabled={starting}
                className="w-full rounded-sm bg-accent px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-base hover:bg-accent-press disabled:opacity-40"
              >
                {starting ? "Opening NEUS…" : "Verify & get started"}
              </button>
            ) : (
              <div className="w-full text-left">
                <div className="rounded-sm border border-pending/30 bg-pending/10 p-4 text-sm text-pending">
                  <div className="font-medium uppercase tracking-wide">
                    Verification not configured
                  </div>
                  <p className="mt-1 text-ink/70">
                    Publish a gate at neus.network (Profile → Portals), then set{" "}
                    <code className="font-mono text-xs text-accent">
                      NEXT_PUBLIC_NEUS_GATE_ID
                    </code>{" "}
                    in <code className="font-mono text-xs text-accent">.env.local</code>.
                  </p>
                </div>
                <button
                  onClick={saveDemo}
                  className="mt-4 w-full rounded-sm border border-hairline px-3 py-2 text-sm font-medium uppercase tracking-wide hover:bg-inset"
                >
                  Continue in local demo mode
                </button>
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-muted">
            Account setup issues through NEUS. You never share a password with
            us, and your verification is reusable anywhere NEUS is accepted.
          </p>
        </div>
      </div>
    </div>
  );
}
