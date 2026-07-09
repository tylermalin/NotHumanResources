// Client-side NEUS session. Site sign-in uses NEUS intent=login, which
// redirects back with the verified profile in the URL (primaryAccount = the
// wallet, plus handle). That wallet address IS the account credential; the
// server re-confirms it belongs to a real, proofed NEUS account before trusted
// actions (see lib/neus.ts).
const ACCOUNT_KEY = "nhr_account";
const HANDLE_KEY = "nhr_handle";
const DEMO_KEY = "nhr_demo_mode";
export const SESSION_EVENT = "nhr-session-change";
export const ACCOUNT_HEADER = "x-neus-account";

export interface NeusSession {
  /** Verified wallet address from NEUS login, or null. */
  account: string | null;
  /** NEUS handle, e.g. "tylermalin". */
  handle: string | null;
  demo: boolean;
}

export function getSession(): NeusSession {
  if (typeof window === "undefined")
    return { account: null, handle: null, demo: false };
  return {
    account: window.localStorage.getItem(ACCOUNT_KEY),
    handle: window.localStorage.getItem(HANDLE_KEY),
    demo: window.localStorage.getItem(DEMO_KEY) === "1",
  };
}

export function saveLogin(account: string, handle: string | null): void {
  window.localStorage.setItem(ACCOUNT_KEY, account);
  if (handle) window.localStorage.setItem(HANDLE_KEY, handle);
  else window.localStorage.removeItem(HANDLE_KEY);
  window.localStorage.removeItem(DEMO_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function saveDemo(): void {
  window.localStorage.setItem(DEMO_KEY, "1");
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession(): void {
  window.localStorage.removeItem(ACCOUNT_KEY);
  window.localStorage.removeItem(HANDLE_KEY);
  window.localStorage.removeItem(DEMO_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function hasSession(s: NeusSession): boolean {
  return Boolean(s.account) || s.demo;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

// Params NEUS appends to the returnUrl after intent=login. Stripped after we
// read them so a refresh doesn't re-trigger.
const LOGIN_PARAMS = [
  "code",
  "expiresIn",
  "handle",
  "profileId",
  "primaryAccount",
  "accountType",
  "proofCount",
  "hasProofs",
  "needsOnboarding",
  "account",
];

/**
 * Complete sign-in from the NEUS intent=login redirect. Reads the verified
 * wallet (primaryAccount) and handle from the callback URL, saves the session,
 * and strips the login params from the address bar. Also accepts a manual
 * ?account=0x… for local testing. Returns the account if one was consumed.
 */
export function consumeLoginReturn(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const p = url.searchParams;
  const account = p.get("primaryAccount") ?? p.get("account");
  if (!account || !ADDRESS_RE.test(account)) {
    // Log an unexpected callback so we can see what NEUS returned.
    if (p.get("code") || p.get("profileId")) {
      console.warn(
        "[NHR] login return without a usable account:",
        Object.fromEntries(p)
      );
    }
    return null;
  }
  saveLogin(account, p.get("handle"));
  for (const k of LOGIN_PARAMS) p.delete(k);
  url.search = p.toString();
  window.history.replaceState({}, "", url.toString());
  console.log("[NHR] signed in as", account);
  return account;
}

/**
 * fetch() for trusted (state-changing) actions: attaches the account so the
 * server can re-confirm it (see lib/neus.ts). If the server rejects the account
 * (401), the local session is cleared so the gate prompts a fresh sign-in —
 * but only when the account itself is the problem, not a transient check error.
 */
export async function trustedFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const { account } = getSession();
  if (account) headers.set(ACCOUNT_HEADER, account);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    const reason = await res
      .clone()
      .json()
      .then((b: { reason?: string }) => b?.reason)
      .catch(() => null);
    if (reason === "no-account" || reason === "account-not-verified") {
      clearSession();
    }
  }
  return res;
}
