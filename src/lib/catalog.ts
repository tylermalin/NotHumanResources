// Curated harness library — first-party, no marketplace (PRD v1 scope).
// Six of the planned 15–20, covering the three launch categories:
// consulting ops, legal intake, agency reporting.
//
// Each harness ships a delegation preset: read/draft actions are allowed,
// irreversible actions (send/post/update) are denied by default so they
// require human approval at the gate. Example tasks are deterministic
// plans so the trust layer can be exercised end-to-end; the model-driven
// planner plugs in behind the same engine interface later.
import type { DelegationPreset } from "./trust";

export interface ExampleTask {
  id: string;
  label: string;
  plan: { action: string; params: Record<string, string> }[];
}

export interface CatalogHarness {
  slug: string;
  name: string;
  category: string;
  description: string;
  systemPrompt: string;
  integrations: string[];
  delegationPreset: DelegationPreset;
  exampleTasks: ExampleTask[];
}

export const catalog: CatalogHarness[] = [
  {
    slug: "client-intake-assistant",
    name: "Client Intake Assistant",
    category: "Legal intake",
    description:
      "Reads new client inquiries, prepares an intake memo, drafts a reply, and holds a consultation slot. Never sends anything without your approval.",
    systemPrompt:
      "You are a legal intake assistant. Summarize inquiries neutrally, never give legal advice, and prepare drafts for attorney review.",
    integrations: ["Gmail", "Google Calendar", "Google Drive"],
    delegationPreset: {
      allowedActions: [
        "gmail.search_inbox",
        "gmail.create_draft",
        "calendar.list_events",
        "calendar.create_event",
        "drive.*",
      ],
      deniedActions: ["gmail.send_email"],
      maxSpendCents: 500,
      expiresInDays: 30,
    },
    exampleTasks: [
      {
        id: "process-intake",
        label: "Process a new client inquiry",
        plan: [
          { action: "gmail.search_inbox", params: { query: "new client inquiry", from: "j.rivera@example.com" } },
          { action: "drive.create_doc", params: { name: "Intake memo — Rivera matter" } },
          { action: "gmail.create_draft", params: { subject: "Re: Consultation request" } },
          { action: "calendar.create_event", params: { title: "Initial consultation — Rivera", with: "J. Rivera" } },
          { action: "gmail.send_email", params: { to: "j.rivera@example.com", subject: "Re: Consultation request" } },
        ],
      },
    ],
  },
  {
    slug: "meeting-prep-researcher",
    name: "Meeting Prep Researcher",
    category: "Consulting ops",
    description:
      "Before each client meeting, researches the company, pulls your past notes, and writes a one-page prep brief.",
    systemPrompt:
      "You prepare concise meeting briefs: company context, open threads from prior notes, and three suggested talking points.",
    integrations: ["Web Search", "Google Calendar", "Google Drive"],
    delegationPreset: {
      allowedActions: ["websearch.*", "calendar.list_events", "drive.*"],
      deniedActions: [],
      maxSpendCents: 800,
      expiresInDays: 30,
    },
    exampleTasks: [
      {
        id: "prep-brief",
        label: "Prep brief for tomorrow's client meeting",
        plan: [
          { action: "calendar.list_events", params: {} },
          { action: "websearch.search", params: { query: "Acme Corp recent news funding leadership" } },
          { action: "drive.search_files", params: { query: "Acme Corp meeting notes" } },
          { action: "drive.read_file", params: { name: "Acme Corp — Q2 engagement notes" } },
          { action: "drive.create_doc", params: { name: "Prep brief — Acme Corp, Jul 10" } },
        ],
      },
    ],
  },
  {
    slug: "weekly-client-reporter",
    name: "Weekly Client Reporter",
    category: "Agency reporting",
    description:
      "Compiles the week's client activity from your CRM into a status report, posts it to your team channel, and drafts the client email.",
    systemPrompt:
      "You compile weekly client status reports: wins, in-progress work, blockers, and next week's plan. Factual, no spin.",
    integrations: ["HubSpot", "Google Drive", "Slack", "Gmail"],
    delegationPreset: {
      allowedActions: [
        "hubspot.search_contacts",
        "drive.create_doc",
        "slack.post_message",
        "gmail.create_draft",
      ],
      deniedActions: ["gmail.send_email", "hubspot.update_record"],
      maxSpendCents: 600,
      expiresInDays: 30,
    },
    exampleTasks: [
      {
        id: "weekly-report",
        label: "Compile and share this week's client report",
        plan: [
          { action: "hubspot.search_contacts", params: { query: "active client engagements" } },
          { action: "drive.create_doc", params: { name: "Weekly client report — Jul 6–10" } },
          { action: "slack.post_message", params: { channel: "client-updates" } },
          { action: "gmail.create_draft", params: { subject: "Weekly status — Jul 10" } },
          { action: "gmail.send_email", params: { to: "client@example.com", subject: "Weekly status — Jul 10" } },
        ],
      },
    ],
  },
  {
    slug: "inbox-triage-assistant",
    name: "Inbox Triage Assistant",
    category: "Consulting ops",
    description:
      "Scans your inbox, flags what needs you today, drafts routine replies, and pings you on Slack with the shortlist.",
    systemPrompt:
      "You triage email: urgent-and-important first, draft replies for routine threads, escalate anything ambiguous.",
    integrations: ["Gmail", "Slack"],
    delegationPreset: {
      allowedActions: ["gmail.search_inbox", "gmail.create_draft", "slack.post_message"],
      deniedActions: ["gmail.send_email"],
      maxSpendCents: 400,
      expiresInDays: 30,
    },
    exampleTasks: [
      {
        id: "morning-triage",
        label: "Run morning inbox triage",
        plan: [
          { action: "gmail.search_inbox", params: { query: "is:unread newer_than:1d" } },
          { action: "gmail.create_draft", params: { subject: "Re: Invoice question" } },
          { action: "gmail.create_draft", params: { subject: "Re: Scheduling follow-up" } },
          { action: "slack.post_message", params: { channel: "my-assistant" } },
        ],
      },
    ],
  },
  {
    slug: "proposal-drafter",
    name: "Proposal Drafter",
    category: "Consulting ops",
    description:
      "Turns a discovery call summary into a structured proposal draft using your past proposals as templates, and stages the deal in your CRM.",
    systemPrompt:
      "You draft proposals from discovery notes, reusing structure and pricing patterns from prior winning proposals.",
    integrations: ["Google Drive", "HubSpot", "Gmail"],
    delegationPreset: {
      allowedActions: ["drive.*", "gmail.create_draft", "hubspot.search_contacts"],
      deniedActions: ["hubspot.create_deal", "gmail.send_email"],
      maxSpendCents: 700,
      expiresInDays: 30,
    },
    exampleTasks: [
      {
        id: "draft-proposal",
        label: "Draft proposal from discovery notes",
        plan: [
          { action: "drive.search_files", params: { query: "discovery call notes Northwind" } },
          { action: "drive.read_file", params: { name: "Northwind discovery — call notes" } },
          { action: "drive.search_files", params: { query: "winning proposals 2026" } },
          { action: "drive.create_doc", params: { name: "Proposal — Northwind engagement" } },
          { action: "hubspot.create_deal", params: { name: "Northwind engagement" } },
        ],
      },
    ],
  },
  {
    slug: "crm-hygiene-bot",
    name: "CRM Hygiene Bot",
    category: "Agency reporting",
    description:
      "Audits your CRM for stale records and proposes fixes — every actual record change waits for your one-click approval.",
    systemPrompt:
      "You audit CRM data quality: stale deals, missing fields, duplicate contacts. Propose specific corrections.",
    integrations: ["HubSpot", "Slack"],
    delegationPreset: {
      allowedActions: ["hubspot.search_contacts", "slack.post_message"],
      deniedActions: ["hubspot.update_record"],
      maxSpendCents: 400,
      expiresInDays: 30,
    },
    exampleTasks: [
      {
        id: "hygiene-audit",
        label: "Audit CRM and fix stale records",
        plan: [
          { action: "hubspot.search_contacts", params: { query: "deals with no activity 30d" } },
          { action: "slack.post_message", params: { channel: "crm-hygiene" } },
          { action: "hubspot.update_record", params: { record: "Deal: Globex renewal", change: "stage → stalled, owner reassigned" } },
          { action: "hubspot.update_record", params: { record: "Contact: m.diaz", change: "merged duplicate record" } },
        ],
      },
    ],
  },
];

export function getCatalogHarness(slug: string): CatalogHarness | undefined {
  return catalog.find((h) => h.slug === slug);
}
