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
