// NEUS Trusted Agent client (server-side).
//
// Turns a hired harness into a REAL NEUS agent: neus_agent_create writes an
// agent-identity + agent-delegation proof pair to the controller's profile, so
// the scoped actions are an enforceable NEUS delegation — not the in-process
// simulation trust.ts provides. Speaks the NEUS MCP server over JSON-RPC with
// the npk profile key (server-only). When the controller is the key owner and
// signed in, NEUS signs automatically (path: session_auto_complete); otherwise
// it reports the hosted step needed.
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { DelegationPreset } from "./trust";
import type { NeusAgentRef } from "./types";

const MCP_URL = "https://mcp.neus.network/mcp";
const API_URL = "https://api.neus.network";
const CHAIN = "eip155:84532"; // Base Sepolia — matches the login did:pkh chain.

/** One JSON-RPC tools/call against the NEUS MCP server; parses the SSE reply. */
async function callTool(
  name: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const key = process.env.NEUS_API_KEY;
  if (!key) throw new Error("NEUS_API_KEY not set");
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  const body = await res.text();
  // The transport is SSE (event: message / data: {...}); fall back to plain JSON.
  let envelope: {
    error?: { message?: string };
    result?: {
      isError?: boolean;
      content?: { type: string; text?: string }[];
      structuredContent?: unknown;
    };
  } | null = null;
  for (const line of body.split("\n")) {
    const t = line.trim();
    const json = t.startsWith("data:") ? t.slice(5).trim() : t;
    if (json.startsWith("{")) {
      try {
        envelope = JSON.parse(json);
      } catch {
        /* keep scanning */
      }
    }
  }
  if (!envelope) throw new Error(`NEUS MCP ${name}: unparseable response`);
  if (envelope.error) {
    throw new Error(`NEUS MCP ${name}: ${envelope.error.message ?? "error"}`);
  }
  const result = envelope.result;
  const text = result?.content?.find((c) => c.type === "text")?.text;
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (result?.isError) {
    throw new Error(
      `NEUS MCP ${name}: ${(payload.message as string) ?? "tool error"}`
    );
  }
  return payload;
}

/** cents → 6-decimal base units (USDC-style), the maxSpend the delegation wants. */
function centsToMaxSpend(cents: number): string {
  return String(Math.round(cents * 10000));
}

/** Pull an identity+delegation ref out of a create/link response's proofs. */
function refFromProofs(
  agentId: string,
  agentWallet: string,
  proofs: Record<string, unknown>
): NeusAgentRef | null {
  const identity = (proofs.identity ?? {}) as { qHash?: string };
  const delegation = (proofs.delegation ?? {}) as { qHash?: string };
  if (!identity.qHash || !delegation.qHash) return null;
  return {
    agentId,
    agentWallet,
    identityQHash: identity.qHash,
    delegationQHash: delegation.qHash,
  };
}

export type CreateAgentResult =
  | { status: "created"; agent: NeusAgentRef; agentPrivateKey: string }
  | {
      status: "pending";
      hostedVerifyUrl: string;
      agentWallet: string;
      agentPrivateKey: string;
    };

interface SigStep {
  signer?: string;
  signerString?: string;
  signedTimestamp?: number;
  verifierId?: string;
  data?: Record<string, unknown>;
}

/**
 * Create a NEUS Trusted Agent for a hired harness on its OWN dedicated wallet,
 * so every agent is a distinct identity (not the shared controller identity).
 *
 * We mint an EOA for the agent, sign the agent-identity step with it (the agent
 * wallet is the required signer), and complete the agent-delegation step via the
 * controller's signed-in session. If the delegation can't finish server-side
 * (needs credits, or a controller who isn't the key owner), we return "pending"
 * with the hosted URL and keep the minted key so it can be resolved later.
 */
export async function createAgent(input: {
  agentId: string;
  controllerWallet: string;
  agentLabel: string;
  description: string;
  instructions: string;
  preset: DelegationPreset;
  expiresAt: string; // ISO — the delegation's computed expiry
}): Promise<CreateAgentResult> {
  const agentPrivateKey = generatePrivateKey();
  const account = privateKeyToAccount(agentPrivateKey);
  const agentWallet = account.address;

  const r = await callTool("neus_agent_create", {
    agentId: input.agentId,
    controllerWallet: input.controllerWallet,
    agentWallet,
    agentLabel: input.agentLabel,
    agentType: "ai",
    chain: CHAIN,
    description: input.description,
    instructions: input.instructions,
    delegationAllowedActions: input.preset.allowedActions,
    delegationDeniedActions: input.preset.deniedActions,
    maxSpend: centsToMaxSpend(input.preset.maxSpendCents),
    expiresAt: Math.floor(new Date(input.expiresAt).getTime() / 1000),
  });

  const sigs = (r.signatures ?? {}) as Record<string, SigStep>;

  // Step 1 — agent-identity, signed by the agent's own wallet.
  const step1 = sigs.step1_agent_identity;
  if (
    step1?.signerString &&
    step1.signer?.toLowerCase() === agentWallet.toLowerCase()
  ) {
    const signature = await account.signMessage({
      message: step1.signerString,
    });
    await callTool("neus_verify", {
      walletAddress: agentWallet,
      verifierIds: ["agent-identity"],
      data: step1.data,
      chain: CHAIN,
      signature,
      signedTimestamp: step1.signedTimestamp,
    }).catch((e) => console.error("[NHR] identity verify:", e));
  }

  // Step 2 — agent-delegation, authorized by the controller's session.
  const step2 = sigs.step2_agent_delegation;
  if (step2?.data) {
    await callTool("neus_verify", {
      walletAddress: input.controllerWallet,
      verifierIds: ["agent-delegation"],
      data: step2.data,
      chain: CHAIN,
    }).catch((e) => console.error("[NHR] delegation verify:", e));
  }

  // Resolve the finished agent from its dedicated wallet.
  const ref = await resolveAgent(agentWallet);
  if (ref) return { status: "created", agent: ref, agentPrivateKey };

  const hostedVerifyUrl = r.hostedVerifyUrl as string | undefined;
  if (hostedVerifyUrl) {
    return { status: "pending", hostedVerifyUrl, agentWallet, agentPrivateKey };
  }
  throw new Error("neus_agent_create did not complete");
}

/**
 * Resolve an agent that was completed via the hosted flow. Checks readiness
 * with neus_agent_link and returns the proof pair once both identity and
 * delegation are on file, or null if it isn't ready yet.
 */
export async function resolveAgent(
  agentWallet: string
): Promise<NeusAgentRef | null> {
  const r = await callTool("neus_agent_link", { agentWallet });
  if (r.linked !== true) return null;
  const identity = (r.proofs ?? {}) as {
    identity?: { qHash?: string; verifiedVerifiers?: { data?: { agentId?: string } }[] };
    delegation?: { qHash?: string };
  };
  const proofs = r.proofs as Record<string, unknown>;
  const agentId =
    identity.identity?.verifiedVerifiers?.[0]?.data?.agentId ?? "";
  return refFromProofs(agentId, agentWallet, proofs);
}

/** Owner-revoke a single proof by qHash via the profile key. Best-effort. */
async function revokeProof(qHash: string): Promise<boolean> {
  const key = process.env.NEUS_API_KEY;
  if (!key || !qHash) return false;
  try {
    const res = await fetch(`${API_URL}/api/v1/proofs/revoke-self/${qHash}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: "{}",
    });
    if (!res.ok) {
      console.error(`[NHR] revoke proof ${qHash.slice(0, 10)}… → ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[NHR] revoke proof error:", err);
    return false;
  }
}

/**
 * Offboard the real NEUS agent: revoke both its delegation and identity proofs
 * so it can no longer act on NEUS, not just at our local gate. Best-effort —
 * revoking the delegation is what removes the agent's authority; the identity
 * revoke is a follow-through. Never throws, so offboarding always completes.
 */
export async function revokeAgent(agent: NeusAgentRef): Promise<void> {
  await Promise.allSettled([
    revokeProof(agent.delegationQHash),
    revokeProof(agent.identityQHash),
  ]);
}
