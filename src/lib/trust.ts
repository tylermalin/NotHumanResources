// NEUS trust layer (v1 in-process implementation).
//
// Three primitives, mirroring the PRD's architecture table:
//   issueIdentity()    -> agent-identity      (who this harness is)
//   grantDelegation()  -> agent-delegation    (what it may do)
//   issueReceipt()     -> trust receipt       (what it did — allowed or denied)
//
// Receipts are hash-chained per agent and signed with the harness's own
// ed25519 key, so a receipt holder can verify integrity without trusting
// AHP's database. When the production NEUS server-side API is ready
// (PRD open decision #2), this module is the seam to swap.
import { createHash, generateKeyPairSync, sign, verify } from "node:crypto";
import { uid } from "./store";
import type {
  AgentIdentity,
  DB,
  Decision,
  Delegation,
  InstalledHarness,
  Receipt,
} from "./types";

export const GENESIS_HASH = "0".repeat(64);

// ---------------------------------------------------------------------------
// Identity

export function issueIdentity(): {
  identity: AgentIdentity;
  privateKeyPem: string;
} {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    identity: {
      agentId: uid("agent"),
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
      issuedAt: new Date().toISOString(),
      status: "active",
    },
    privateKeyPem: privateKey
      .export({ type: "pkcs8", format: "pem" })
      .toString(),
  };
}

// ---------------------------------------------------------------------------
// Delegation

export interface DelegationPreset {
  allowedActions: string[];
  deniedActions: string[];
  maxSpendCents: number;
  expiresInDays: number;
}

export function grantDelegation(
  agentId: string,
  preset: DelegationPreset
): Delegation {
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + preset.expiresInDays);
  return {
    id: uid("dlg"),
    agentId,
    allowedActions: preset.allowedActions,
    deniedActions: preset.deniedActions,
    maxSpendCents: preset.maxSpendCents,
    spentCents: 0,
    grantedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    status: "active",
  };
}

function matchesAny(action: string, patterns: string[]): boolean {
  return patterns.some((p) =>
    p.endsWith(".*") ? action.startsWith(p.slice(0, -1)) : action === p
  );
}

export interface GateResult {
  allowed: boolean;
  reason: string | null;
}

/**
 * The gate. Runs BEFORE every tool call — the delegation is the enforced
 * backstop, not the model's judgment (prompt-injection containment).
 */
export function checkDelegation(
  harness: InstalledHarness,
  action: string,
  costCents: number
): GateResult {
  if (harness.status === "revoked" || harness.identity.status === "revoked") {
    return { allowed: false, reason: "Agent identity has been revoked" };
  }
  const d = harness.delegation;
  if (d.status === "revoked") {
    return { allowed: false, reason: "Delegation has been revoked" };
  }
  if (new Date(d.expiresAt).getTime() < Date.now()) {
    return { allowed: false, reason: "Delegation has expired" };
  }
  if (matchesAny(action, d.deniedActions)) {
    return {
      allowed: false,
      reason: `Action "${action}" is outside this harness's permissions — requires human approval`,
    };
  }
  if (!matchesAny(action, d.allowedActions)) {
    return {
      allowed: false,
      reason: `Action "${action}" was never granted to this harness`,
    };
  }
  if (d.spentCents + costCents > d.maxSpendCents) {
    return {
      allowed: false,
      reason: `Spend limit reached (${formatCents(d.spentCents)} of ${formatCents(d.maxSpendCents)} used)`,
    };
  }
  return { allowed: true, reason: null };
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Receipts

function receiptPayload(r: Omit<Receipt, "hash" | "signature">): string {
  // Canonical field order — verification recomputes exactly this.
  return JSON.stringify({
    id: r.id,
    seq: r.seq,
    agentId: r.agentId,
    harnessId: r.harnessId,
    runId: r.runId,
    action: r.action,
    paramsSummary: r.paramsSummary,
    decision: r.decision,
    reason: r.reason,
    resultSummary: r.resultSummary,
    costCents: r.costCents,
    issuedAt: r.issuedAt,
    prevHash: r.prevHash,
  });
}

export function issueReceipt(
  db: DB,
  harness: InstalledHarness,
  input: {
    runId: string | null;
    action: string;
    paramsSummary: string;
    decision: Decision;
    reason: string | null;
    resultSummary: string | null;
    costCents: number;
  }
): Receipt {
  const chain = db.receipts.filter((r) => r.agentId === harness.identity.agentId);
  const prev = chain[chain.length - 1];
  const base: Omit<Receipt, "hash" | "signature"> = {
    id: uid("rcpt"),
    seq: chain.length + 1,
    agentId: harness.identity.agentId,
    harnessId: harness.id,
    prevHash: prev ? prev.hash : GENESIS_HASH,
    issuedAt: new Date().toISOString(),
    ...input,
  };
  const payload = receiptPayload(base);
  const hash = createHash("sha256").update(payload).digest("hex");
  const signature = sign(null, Buffer.from(hash, "hex"), harness.privateKeyPem)
    .toString("base64");
  const receipt: Receipt = { ...base, hash, signature };
  db.receipts.push(receipt);
  return receipt;
}

export interface ChainVerification {
  valid: boolean;
  checked: number;
  firstInvalidSeq: number | null;
  error: string | null;
}

/** Recompute every hash, signature, and chain link for one harness. */
export function verifyChain(
  db: DB,
  harness: InstalledHarness
): ChainVerification {
  const chain = db.receipts
    .filter((r) => r.agentId === harness.identity.agentId)
    .sort((a, b) => a.seq - b.seq);
  let prevHash = GENESIS_HASH;
  for (const r of chain) {
    const expectedHash = createHash("sha256")
      .update(receiptPayload(r))
      .digest("hex");
    if (r.prevHash !== prevHash) {
      return chainError(chain.length, r.seq, "chain link broken");
    }
    if (r.hash !== expectedHash) {
      return chainError(chain.length, r.seq, "content hash mismatch");
    }
    const sigOk = verify(
      null,
      Buffer.from(r.hash, "hex"),
      harness.identity.publicKeyPem,
      Buffer.from(r.signature, "base64")
    );
    if (!sigOk) {
      return chainError(chain.length, r.seq, "signature invalid");
    }
    prevHash = r.hash;
  }
  return { valid: true, checked: chain.length, firstInvalidSeq: null, error: null };
}

function chainError(
  checked: number,
  seq: number,
  error: string
): ChainVerification {
  return { valid: false, checked, firstInvalidSeq: seq, error };
}
