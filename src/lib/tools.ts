// Skills library — the six v1 integrations from the PRD (Gmail, Google
// Calendar, Slack, Google Drive, web search, HubSpot).
//
// Each action is an adapter with an async `execute`. When a live credential
// for the action's provider resolves, `execute` calls the real API; otherwise
// it falls back to `simulate` and reports `simulated: true`. The delegation
// gate runs BEFORE execute (in engine.ts) and is untouched by this layer —
// adapters only decide what happens once an action is already allowed.
//
// Each action carries a cost (model + infra proxy, in cents) that draws down
// the delegation's maxSpend, and an `irreversible` flag used by catalog
// presets to decide what is denied-by-default.
import type { ResolvedCredential } from "./connections";

export interface ToolResult {
  /** One-line, human-readable outcome recorded on the receipt. */
  summary: string;
  /** True when produced by the simulated fallback (no live integration). */
  simulated: boolean;
}

export interface ToolContext {
  /** Credential for this action's provider, or null if not connected. */
  credential: ResolvedCredential | null;
}

export interface ToolAction {
  action: string;
  label: string;
  integration: string;
  irreversible: boolean;
  costCents: number;
  execute: (
    params: Record<string, string>,
    ctx: ToolContext
  ) => Promise<ToolResult>;
}

/** Wrap a synchronous simulation as an adapter that never calls a real API. */
function simulated(
  fn: (params: Record<string, string>) => string
): ToolAction["execute"] {
  return async (params) => ({ summary: fn(params), simulated: true });
}

// ---------------------------------------------------------------------------
// Real adapter: Web Search (Tavily)
//
// Key-based, no OAuth — the credential is a process-wide API key resolved from
// TAVILY_API_KEY. When absent, resolveCredential returns null and we simulate.

async function webSearch(
  params: Record<string, string>,
  ctx: ToolContext
): Promise<ToolResult> {
  const query = params.query ?? "";
  if (!ctx.credential) {
    return {
      summary: `Researched "${query}" across 8 sources; key findings extracted.`,
      simulated: true,
    };
  }
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: ctx.credential.accessToken,
        query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Tavily ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      answer?: string;
      results?: { title: string; url: string }[];
    };
    const count = data.results?.length ?? 0;
    const answer = data.answer?.trim() || `No synthesized answer for "${query}".`;
    return {
      summary: `${answer} (${count} source${count === 1 ? "" : "s"})`,
      simulated: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return { summary: `Web search failed: ${msg}`, simulated: false };
  }
}

// ---------------------------------------------------------------------------

const actions: ToolAction[] = [
  // Gmail
  {
    action: "gmail.search_inbox",
    label: "Search inbox",
    integration: "Gmail",
    irreversible: false,
    costCents: 2,
    execute: simulated(
      (p) =>
        `Found 3 messages matching "${p.query ?? ""}" — newest from ${p.from ?? "a prospective client"}.`
    ),
  },
  {
    action: "gmail.create_draft",
    label: "Create draft",
    integration: "Gmail",
    irreversible: false,
    costCents: 4,
    execute: simulated(
      (p) => `Draft created: "${p.subject ?? "Re: your inquiry"}" (saved to Drafts, not sent).`
    ),
  },
  {
    action: "gmail.send_email",
    label: "Send email",
    integration: "Gmail",
    irreversible: true,
    costCents: 4,
    execute: simulated((p) => `Email sent to ${p.to ?? "recipient"}: "${p.subject ?? ""}".`),
  },
  // Google Calendar
  {
    action: "calendar.list_events",
    label: "List events",
    integration: "Google Calendar",
    irreversible: false,
    costCents: 1,
    execute: simulated(() => "Next 7 days: 4 client meetings, 1 internal review."),
  },
  {
    action: "calendar.create_event",
    label: "Create event",
    integration: "Google Calendar",
    irreversible: true,
    costCents: 2,
    execute: simulated(
      (p) =>
        `Held "${p.title ?? "Consultation"}" on the calendar with an invite drafted for ${p.with ?? "the client"}.`
    ),
  },
  // Slack
  {
    action: "slack.read_channel",
    label: "Read channel",
    integration: "Slack",
    irreversible: false,
    costCents: 1,
    execute: simulated((p) => `Read last 50 messages in #${p.channel ?? "general"}.`),
  },
  {
    action: "slack.post_message",
    label: "Post message",
    integration: "Slack",
    irreversible: true,
    costCents: 2,
    execute: simulated((p) => `Posted summary to #${p.channel ?? "general"}.`),
  },
  // Google Drive
  {
    action: "drive.search_files",
    label: "Search files",
    integration: "Google Drive",
    irreversible: false,
    costCents: 2,
    execute: simulated((p) => `Found 5 documents matching "${p.query ?? ""}".`),
  },
  {
    action: "drive.read_file",
    label: "Read file",
    integration: "Google Drive",
    irreversible: false,
    costCents: 2,
    execute: simulated((p) => `Read "${p.name ?? "document"}" (12 pages) into working context.`),
  },
  {
    action: "drive.create_doc",
    label: "Create document",
    integration: "Google Drive",
    irreversible: false,
    costCents: 5,
    execute: simulated((p) => `Created "${p.name ?? "New document"}" in the workspace folder.`),
  },
  // Web search — real adapter (Tavily), simulated fallback when unconnected.
  {
    action: "websearch.search",
    label: "Web search",
    integration: "Web Search",
    irreversible: false,
    costCents: 3,
    execute: webSearch,
  },
  // HubSpot
  {
    action: "hubspot.search_contacts",
    label: "Search contacts",
    integration: "HubSpot",
    irreversible: false,
    costCents: 2,
    execute: simulated((p) => `Found 12 contacts matching "${p.query ?? "active clients"}".`),
  },
  {
    action: "hubspot.update_record",
    label: "Update record",
    integration: "HubSpot",
    irreversible: true,
    costCents: 3,
    execute: simulated(
      (p) => `Updated ${p.record ?? "contact record"}: ${p.change ?? "field corrected"}.`
    ),
  },
  {
    action: "hubspot.create_deal",
    label: "Create deal",
    integration: "HubSpot",
    irreversible: true,
    costCents: 3,
    execute: simulated((p) => `Created deal "${p.name ?? "New opportunity"}" in pipeline.`),
  },
];

export const toolRegistry: Map<string, ToolAction> = new Map(
  actions.map((a) => [a.action, a])
);

export function getAction(action: string): ToolAction {
  const found = toolRegistry.get(action);
  if (!found) throw new Error(`Unknown tool action: ${action}`);
  return found;
}
