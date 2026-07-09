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
}
