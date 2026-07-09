// NEUS Trusted Agent client (server-side).
//
// Turns a hired harness into a REAL NEUS agent: neus_agent_create writes an
// agent-identity + agent-delegation proof pair to the controller's profile, so
// the scoped actions are an enforceable NEUS delegation — not the in-process
// simulation trust.ts provides. Speaks the NEUS MCP server over JSON-RPC with
// the npk profile key (server-only). When the controller is the key owner and
// signed in, NEUS signs automatically (path: session_auto_complete); otherwise
// it reports the hosted step needed.
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

/**
 * Create (or update) a NEUS Trusted Agent for a hired harness. Writes the
 * agent-identity + agent-delegation proofs and returns their references.
 */
export async function createAgent(input: {
  agentId: string;
  controllerWallet: string;
  agentLabel: string;
  description: string;
  instructions: string;
  preset: DelegationPreset;
  expiresAt: string; // ISO — the delegation's computed expiry
}): Promise<NeusAgentRef> {
  const r = await callTool("neus_agent_create", {
    agentId: input.agentId,
    controllerWallet: input.controllerWallet,
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
  const agent = (r.agent ?? {}) as Record<string, string>;
  const proofs = (r.proofs ?? {}) as {
    identity?: { qHash?: string };
    delegation?: { qHash?: string };
  };
  const identityQHash = proofs.identity?.qHash ?? "";
  const delegationQHash = proofs.delegation?.qHash ?? "";
  // NEUS auto-signs when the controller is the signed-in key owner
  // (status: session_auto_complete). If it returns signatures_required (a step
  // the session can't complete server-side — e.g. a non-owner controller), no
  // proofs are issued; treat that as "not created" so we fall back to the local
  // identity instead of storing an empty NEUS agent. The hosted "finish on
  // NEUS" flow is where that case gets completed.
  if (!identityQHash || !delegationQHash) {
    throw new Error(
      `neus_agent_create did not complete (status: ${String(r.status)})`
    );
  }
  return {
    agentId: agent.agentId ?? input.agentId,
    agentWallet: agent.agentWallet ?? input.controllerWallet,
    identityQHash,
    delegationQHash,
  };
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
