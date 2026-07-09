// Skills library — the six v1 integrations from the PRD (Gmail, Google
// Calendar, Slack, Google Drive, web search, HubSpot).
//
// v1 prototype: adapters are simulated so the delegation gate and receipt
// flow can be exercised end-to-end without live OAuth. Each action carries
// a cost (model + infra proxy, in cents) that draws down the delegation's
// maxSpend, and an `irreversible` flag used by catalog presets to decide
// what is denied-by-default.

export interface ToolAction {
  action: string;
  label: string;
  integration: string;
  irreversible: boolean;
  costCents: number;
  simulate: (params: Record<string, string>) => string;
}

const actions: ToolAction[] = [
  // Gmail
  {
    action: "gmail.search_inbox",
    label: "Search inbox",
    integration: "Gmail",
    irreversible: false,
    costCents: 2,
    simulate: (p) =>
      `Found 3 messages matching "${p.query ?? ""}" — newest from ${p.from ?? "a prospective client"}.`,
  },
  {
    action: "gmail.create_draft",
    label: "Create draft",
    integration: "Gmail",
    irreversible: false,
    costCents: 4,
    simulate: (p) => `Draft created: "${p.subject ?? "Re: your inquiry"}" (saved to Drafts, not sent).`,
  },
  {
    action: "gmail.send_email",
    label: "Send email",
    integration: "Gmail",
    irreversible: true,
    costCents: 4,
    simulate: (p) => `Email sent to ${p.to ?? "recipient"}: "${p.subject ?? ""}".`,
  },
  // Google Calendar
  {
    action: "calendar.list_events",
    label: "List events",
    integration: "Google Calendar",
    irreversible: false,
    costCents: 1,
    simulate: () => "Next 7 days: 4 client meetings, 1 internal review.",
  },
  {
    action: "calendar.create_event",
    label: "Create event",
    integration: "Google Calendar",
    irreversible: true,
    costCents: 2,
    simulate: (p) =>
      `Held "${p.title ?? "Consultation"}" on the calendar with an invite drafted for ${p.with ?? "the client"}.`,
  },
  // Slack
  {
    action: "slack.read_channel",
    label: "Read channel",
    integration: "Slack",
    irreversible: false,
    costCents: 1,
    simulate: (p) => `Read last 50 messages in #${p.channel ?? "general"}.`,
  },
  {
    action: "slack.post_message",
    label: "Post message",
    integration: "Slack",
    irreversible: true,
    costCents: 2,
    simulate: (p) => `Posted summary to #${p.channel ?? "general"}.`,
  },
  // Google Drive
  {
    action: "drive.search_files",
    label: "Search files",
    integration: "Google Drive",
    irreversible: false,
    costCents: 2,
    simulate: (p) => `Found 5 documents matching "${p.query ?? ""}".`,
  },
  {
    action: "drive.read_file",
    label: "Read file",
    integration: "Google Drive",
    irreversible: false,
    costCents: 2,
    simulate: (p) => `Read "${p.name ?? "document"}" (12 pages) into working context.`,
  },
  {
    action: "drive.create_doc",
    label: "Create document",
    integration: "Google Drive",
    irreversible: false,
    costCents: 5,
    simulate: (p) => `Created "${p.name ?? "New document"}" in the workspace folder.`,
  },
  // Web search
  {
    action: "websearch.search",
    label: "Web search",
    integration: "Web Search",
    irreversible: false,
    costCents: 3,
    simulate: (p) => `Researched "${p.query ?? ""}" across 8 sources; key findings extracted.`,
  },
  // HubSpot
  {
    action: "hubspot.search_contacts",
    label: "Search contacts",
    integration: "HubSpot",
    irreversible: false,
    costCents: 2,
    simulate: (p) => `Found 12 contacts matching "${p.query ?? "active clients"}".`,
  },
  {
    action: "hubspot.update_record",
    label: "Update record",
    integration: "HubSpot",
    irreversible: true,
    costCents: 3,
    simulate: (p) => `Updated ${p.record ?? "contact record"}: ${p.change ?? "field corrected"}.`,
  },
  {
    action: "hubspot.create_deal",
    label: "Create deal",
    integration: "HubSpot",
    irreversible: true,
    costCents: 3,
    simulate: (p) => `Created deal "${p.name ?? "New opportunity"}" in pipeline.`,
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
