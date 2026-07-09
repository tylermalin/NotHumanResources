// Core domain types for the Agent Harness Platform (AHP).
//
// Naming note: the trust layer (identity, delegation, receipts) is NEUS
// infrastructure. Per the PRD, none of this vocabulary is user-facing —
// the UI renders it as "Identity", "Permissions", and "Activity".

export type Decision = "allowed" | "denied";

export interface Workspace {
  id: string;
  name: string;
  plan: "free" | "pro" | "team";
  createdAt: string;
}

/** NEUS agent identity — one per installed harness, independently revocable. */
export interface AgentIdentity {
  agentId: string;
  publicKeyPem: string;
  issuedAt: string;
  status: "active" | "revoked";
}

/** NEUS scoped delegation — what the harness may do, enforced before execution. */
export interface Delegation {
  id: string;
  agentId: string;
  allowedActions: string[]; // supports trailing wildcards, e.g. "drive.*"
  deniedActions: string[]; // deny wins over allow
  maxSpendCents: number;
  spentCents: number;
  grantedAt: string;
  expiresAt: string;
  status: "active" | "revoked";
}

/**
 * The NEUS sign-in credential the user presented when they hired this agent,
 * bound to the agent at install time — "the credential passes to us." Optional
 * so agents hired before this field existed (and local demo hires) still load.
 */
export interface AgentAuthorization {
  /** Trust-receipt id from the user's site sign-in. Null in local demo mode. */
  qHash: string | null;
  /** Wallet the receipt resolved to, server-verified (not client-claimed). */
  walletAddress: string | null;
  authorizedAt: string;
}

/**
 * Reference to the real NEUS Trusted Agent backing this harness — the
 * agent-identity + agent-delegation proofs written to the controller's NEUS
 * profile at hire time (see lib/neus-agents.ts). Optional: absent for local
 * demo hires or if NEUS agent creation was unavailable.
 */
export interface NeusAgentRef {
  agentId: string;
  agentWallet: string;
  identityQHash: string;
  delegationQHash: string;
}

export interface InstalledHarness {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  workspaceId: string;
  installedAt: string;
  status: "active" | "revoked";
  identity: AgentIdentity;
  /** Server-side only. Never sent to the client. */
  privateKeyPem: string;
  delegation: Delegation;
  authorization?: AgentAuthorization;
  /** The real NEUS agent this harness maps to, when one was created. */
  neusAgent?: NeusAgentRef;
  /**
   * Set when NEUS agent creation needs a browser signature the server session
   * couldn't provide. The controller finishes at hostedVerifyUrl, then we
   * resolve the agent and move it to neusAgent.
   */
  neusAgentPending?: { hostedVerifyUrl: string; agentWallet: string };
  /**
   * The dedicated agent wallet's private key. Server-side only, never sent to
   * the client — the agent signs its own identity/actions with this.
   */
  neusAgentKey?: string;
}

/**
 * Trust receipt (CAIP-380-shaped): issued for every allowed AND denied
 * action, hash-chained per agent and signed with the harness's own key so
 * it verifies independently of AHP's database being trusted.
 */
export interface Receipt {
  id: string;
  seq: number;
  agentId: string;
  harnessId: string;
  runId: string | null;
  action: string;
  paramsSummary: string;
  decision: Decision;
  reason: string | null;
  resultSummary: string | null;
  costCents: number;
  issuedAt: string;
  prevHash: string;
  hash: string;
  signature: string;
}

export interface RunStep {
  index: number;
  action: string;
  params: Record<string, string>;
  decision: Decision;
  reason: string | null;
  resultSummary: string | null;
  receiptId: string;
  approvedByHuman: boolean;
  /**
   * True when the step ran against a simulated adapter (no live integration
   * connected). Not part of the signed receipt — this is UI-facing metadata
   * so the workspace can show which actions were real vs. demonstrated.
   */
  simulated: boolean;
}

/**
 * OAuth provider backing one or more skills. Gmail, Calendar, and Drive all
 * ride a single Google connection; Slack, HubSpot, and Web Search each have
 * their own. Web Search is key-based (env), the rest are per-workspace OAuth.
 */
export type Provider = "google" | "slack" | "hubspot" | "websearch";

/**
 * A live integration connection for a workspace — the credential material a
 * real adapter needs. Stored server-side only; tokens never reach the client.
 * This is the seam that turns a simulated adapter into a real one: when a
 * connection exists for an action's provider, the adapter calls the real API.
 */
export interface Connection {
  id: string;
  workspaceId: string;
  provider: Provider;
  status: "connected";
  /** Human-readable account label, e.g. the connected email or Slack team. */
  accountLabel: string;
  accessToken: string;
  refreshToken: string | null;
  /** ISO timestamp the access token expires, or null if it does not expire. */
  expiresAt: string | null;
  scopes: string[];
  connectedAt: string;
}

export interface Run {
  id: string;
  harnessId: string;
  taskId: string;
  taskLabel: string;
  startedAt: string;
  status: "completed" | "completed_with_denials";
  steps: RunStep[];
}

export interface DB {
  workspace: Workspace;
  harnesses: InstalledHarness[];
  receipts: Receipt[];
  runs: Run[];
  connections: Connection[];
}
