// Server-side NEUS gate check — "confirm before trusted actions".
//
// The account gate in the browser (VerifyGate) decides what the user sees, but
// a browser can't be trusted to guard state-changing actions: localStorage is
// editable and requests can be forged. So every trusted action (hire, run,
// approve, offboard) re-confirms the caller on the server before it executes,
// exactly as the NEUS Quickstart prescribes.
//
// The caller presents its receipt id (qHash). We do NOT trust a client-claimed
// wallet address — we resolve the qHash to its wallet via getProof (binding the
// receipt to an owner we didn't let the client pick), then run gateCheck to
// confirm that wallet still satisfies every requirement of our published gate.
// `allRequiredSatisfied === true` is the only readiness signal NEUS honors.
//
// Framework-agnostic on purpose: this module speaks the web-standard Request/
// Response, so it swaps cleanly if the API layer changes.
import { NeusClient } from "@neus/sdk";

// Same gate the browser widget uses. Readable server-side; the NEXT_PUBLIC_
// prefix just also exposes it to the client bundle.
const GATE_ID = process.env.NEXT_PUBLIC_NEUS_GATE_ID;

// Optional profile key — only needed if the gate issues private proofs that
// aren't publicly readable. Never sent to the client. Absent by default.
const client = new NeusClient({ apiKey: process.env.NEUS_API_KEY });

/** Header the client sets from its stored receipt id (see session.ts). */
export const QHASH_HEADER = "x-neus-qhash";

/** True when a gate is configured; when false, verification isn't set up. */
export function gateConfigured(): boolean {
  return Boolean(GATE_ID);
}

export interface Eligibility {
  ok: boolean;
  reason: string | null;
  walletAddress: string | null;
}

/**
 * Confirm a receipt still satisfies our gate. Fails closed on any error — a
 * trust product denies under uncertainty rather than waving the action through.
 * When no gate is configured (local dev / demo), there is nothing to enforce,
 * so it allows.
 */
export async function checkEligibility(
  qHash: string | null
): Promise<Eligibility> {
  if (!GATE_ID) {
    return { ok: true, reason: "no-gate-configured", walletAddress: null };
  }
  if (!qHash) {
    return { ok: false, reason: "no-receipt", walletAddress: null };
  }
  try {
    // Site sign-in is a NEUS login (intent=login), not a gate proof — so we
    // confirm the receipt is a real, verified NEUS receipt bound to a wallet we
    // didn't let the client choose. (The Google-org gate is enforced per-agent
    // at hire time, not for site access.)
    const proof = await client.getProof(qHash);
    const address = proof.data?.walletAddress ?? null;
    const verified = proof.data?.status === "verified";
    if (!proof.success || !address || !verified) {
      return { ok: false, reason: "receipt-not-found", walletAddress: null };
    }
    return { ok: true, reason: null, walletAddress: address };
  } catch (err) {
    console.error("[NHR] sign-in check error:", err);
    return { ok: false, reason: "check-error", walletAddress: null };
  }
}

export type GateGuard =
  | { ok: false; response: Response }
  | { ok: true; qHash: string | null; walletAddress: string | null };

/**
 * Route guard: confirm the caller's sign-in receipt server-side before a
 * trusted action. On success it hands back the resolved receipt so a handler
 * can bind it (e.g. hiring stores it on the agent — "the credential passes to
 * us"). On failure it carries a ready 401 Response. Usage in a route:
 *
 *   const gate = await requireEligibility(req);
 *   if (!gate.ok) return gate.response;
 *   // ... gate.qHash / gate.walletAddress available here
 */
export async function requireEligibility(req: Request): Promise<GateGuard> {
  const qHash = req.headers.get(QHASH_HEADER);
  const eligibility = await checkEligibility(qHash);
  if (!eligibility.ok) {
    return {
      ok: false,
      response: Response.json(
        { error: "Account verification required", reason: eligibility.reason },
        { status: 401 }
      ),
    };
  }
  return { ok: true, qHash, walletAddress: eligibility.walletAddress };
}
