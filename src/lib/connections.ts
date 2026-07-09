// Connection resolution — the seam between an allowed action and the real API
// call behind it. An adapter never fetches its own credentials; the engine
// resolves a credential for the action's provider and hands it in. When no
// credential resolves, the adapter falls back to a simulated result.
//
// Two credential sources:
//   • OAuth providers (Google, Slack, HubSpot) — a per-workspace Connection
//     stored in the DB, created by an OAuth callback route (not yet built).
//   • Key-based providers (Web Search) — a process-wide API key from the
//     environment, shared across the workspace, no per-user consent.
import type { Connection, DB, Provider } from "./types";

/** The credential material an adapter receives. Provider-shaped, minimal. */
export interface ResolvedCredential {
  provider: Provider;
  accessToken: string;
  accountLabel: string;
}

/** Which provider backs an action, derived from its `integration.` prefix. */
const PROVIDER_BY_PREFIX: Record<string, Provider> = {
  gmail: "google",
  calendar: "google",
  drive: "google",
  slack: "slack",
  hubspot: "hubspot",
  websearch: "websearch",
};

export function providerForAction(action: string): Provider | null {
  const prefix = action.split(".")[0];
  return PROVIDER_BY_PREFIX[prefix] ?? null;
}

/** Env var holding the API key for each key-based (non-OAuth) provider. */
const ENV_KEY_BY_PROVIDER: Partial<Record<Provider, string>> = {
  websearch: "TAVILY_API_KEY",
};

/**
 * Resolve a usable credential for a provider in a workspace, or null if the
 * integration is not connected (adapter then simulates). Key-based providers
 * resolve from the environment; OAuth providers from the DB connections table.
 */
export function resolveCredential(
  db: DB,
  workspaceId: string,
  provider: Provider
): ResolvedCredential | null {
  const envKey = ENV_KEY_BY_PROVIDER[provider];
  if (envKey) {
    const token = process.env[envKey];
    if (!token) return null;
    return { provider, accessToken: token, accountLabel: "environment key" };
  }

  const conn = getConnection(db, workspaceId, provider);
  if (!conn) return null;
  return {
    provider,
    accessToken: conn.accessToken,
    accountLabel: conn.accountLabel,
  };
}

// ---------------------------------------------------------------------------
// Connection store helpers (OAuth providers)

export function getConnection(
  db: DB,
  workspaceId: string,
  provider: Provider
): Connection | undefined {
  return db.connections.find(
    (c) => c.workspaceId === workspaceId && c.provider === provider
  );
}

export function listConnections(db: DB, workspaceId: string): Connection[] {
  return db.connections.filter((c) => c.workspaceId === workspaceId);
}
