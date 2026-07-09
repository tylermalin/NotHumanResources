// Client-side NEUS session: account setup issues through NEUS Hosted Verify,
// and the resulting trust receipt ID (qHash) IS the account credential.
// Stored locally; server-side eligibility checks can look the receipt up
// later via the NEUS HTTP API using this same qHash.
const QHASH_KEY = "nhr_neus_qhash";
const DEMO_KEY = "nhr_demo_mode";
export const SESSION_EVENT = "nhr-session-change";

export interface NeusSession {
  qHash: string | null;
  demo: boolean;
}

export function getSession(): NeusSession {
  if (typeof window === "undefined") return { qHash: null, demo: false };
  return {
    qHash: window.localStorage.getItem(QHASH_KEY),
    demo: window.localStorage.getItem(DEMO_KEY) === "1",
  };
}

export function saveVerified(qHash: string): void {
  window.localStorage.setItem(QHASH_KEY, qHash);
  window.localStorage.removeItem(DEMO_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function saveDemo(): void {
  window.localStorage.setItem(DEMO_KEY, "1");
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession(): void {
  window.localStorage.removeItem(QHASH_KEY);
  window.localStorage.removeItem(DEMO_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function hasSession(s: NeusSession): boolean {
  return Boolean(s.qHash) || s.demo;
}

/**
 * Complete sign-in from a redirect-delivery gate. This gate delivers the
 * receipt by redirecting the browser to its successReturnUrl with the qHash in
 * the URL (rather than the popup postMessage the widget also supports). On
 * return we read that qHash, save it, and strip it from the address bar so a
 * refresh doesn't re-trigger. Returns the qHash if one was consumed.
 */
export function consumeReturnedQHash(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  // NEUS returns the receipt as ?qHash=…; also tolerate a #qHash=… fragment.
  const fromQuery = url.searchParams.get("qHash");
  const fromHash = new URLSearchParams(
    url.hash.startsWith("#") ? url.hash.slice(1) : url.hash
  ).get("qHash");
  const qHash = fromQuery ?? fromHash;
  if (!qHash) return null;
  saveVerified(qHash);
  url.searchParams.delete("qHash");
  url.hash = "";
  window.history.replaceState({}, "", url.toString());
  return qHash;
}

/**
 * fetch() for trusted (state-changing) actions: attaches the receipt id so the
 * server can re-confirm eligibility (see lib/neus.ts). If the server rejects
 * the receipt (401), the local session is cleared so the account gate prompts a
 * fresh verification instead of the UI silently doing nothing.
 */
export async function trustedFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const { qHash } = getSession();
  if (qHash) headers.set("x-neus-qhash", qHash);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    // Only force re-verification when the receipt itself is the problem —
    // not when the server merely couldn't complete the check (transient),
    // which would otherwise bounce a genuinely signed-in user in a loop.
    const reason = await res
      .clone()
      .json()
      .then((b: { reason?: string }) => b?.reason)
      .catch(() => null);
    if (
      reason === "no-receipt" ||
      reason === "receipt-not-found" ||
      reason === "gate-not-satisfied"
    ) {
      clearSession();
    }
  }
  return res;
}
