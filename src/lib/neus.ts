// Server-side sign-in check — "confirm before trusted actions".
//
// Site sign-in is a NEUS login (intent=login); the browser stores the verified
// wallet the login returned. A browser can't be fully trusted (localStorage is
// editable), so before every trusted action (hire, run, approve, offboard) we
// re-confirm server-side that the presented account is a real NEUS account with
// verified proofs, via getProofsByWallet with our profile key.
//
// NOTE ON STRENGTH: intent=login returns an OAuth code that could be exchanged
// for a cryptographically-bound session; we don't do that exchange yet, so this
// check confirms the account is a real proofed NEUS account but does not prove
// the caller *is* that account. Exchanging the login code server-side is the
// hardening step. Still strictly better than trusting the client outright.
//
// Framework-agnostic on purpose: speaks web-standard Request/Response.
import { NeusClient } from "@neus/sdk";

// Proxy for "NEUS is configured for this deployment". When unset (pure local
// dev), there is nothing to verify against, so the guard allows.
const GATE_ID = process.env.NEXT_PUBLIC_NEUS_GATE_ID;

// Profile key — lets us read proofs for an arbitrary wallet. Never sent to the
// client.
const client = new NeusClient({ apiKey: process.env.NEUS_API_KEY });

/** Header the client sets from its signed-in account (see session.ts). */
export const ACCOUNT_HEADER = "x-neus-account";

export interface Eligibility {
  ok: boolean;
  reason: string | null;
  walletAddress: string | null;
}

/**
 * Confirm the account is a real, proofed NEUS account. Fails closed on any
 * error — a trust product denies under uncertainty. When NEUS isn't configured
 * (local dev), there is nothing to enforce, so it allows.
 */
export async function checkEligibility(
  account: string | null
): Promise<Eligibility> {
  if (!GATE_ID) {
    return { ok: true, reason: "no-neus-configured", walletAddress: null };
  }
  if (!account) {
    return { ok: false, reason: "no-account", walletAddress: null };
  }
  try {
    const result = await client.getProofsByWallet(account, { limit: 1 });
    const hasProofs = result.success && (result.proofs?.length ?? 0) > 0;
    if (!hasProofs) {
      return { ok: false, reason: "account-not-verified", walletAddress: null };
    }
    return { ok: true, reason: null, walletAddress: account };
  } catch (err) {
    console.error("[NHR] account check error:", err);
    return { ok: false, reason: "check-error", walletAddress: null };
  }
}

export type GateGuard =
  | { ok: false; response: Response }
  | { ok: true; qHash: string | null; walletAddress: string | null };

/**
 * Route guard: confirm the caller's account server-side before a trusted
 * action. On success it hands back the verified wallet so a handler can bind it
 * (hiring stores it on the agent — "the credential passes to us"). On failure it
 * carries a ready 401. Usage in a route:
 *
 *   const gate = await requireEligibility(req);
 *   if (!gate.ok) return gate.response;
 *   // ... gate.walletAddress available here
 */
export async function requireEligibility(req: Request): Promise<GateGuard> {
  const account = req.headers.get(ACCOUNT_HEADER);
  const eligibility = await checkEligibility(account);
  if (!eligibility.ok) {
    return {
      ok: false,
      response: Response.json(
        { error: "Account verification required", reason: eligibility.reason },
        { status: 401 }
      ),
    };
  }
  return { ok: true, qHash: null, walletAddress: eligibility.walletAddress };
}
