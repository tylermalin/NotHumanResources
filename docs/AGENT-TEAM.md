# Enterprise Agent Team — NEUS-ready plan

Maps the five enterprise use cases to **(not)Human Resources** harnesses, each a
**real NEUS Trusted Agent** (agent-identity + agent-delegation proofs) with a
scoped, enforceable delegation. This is the spec for expanding `catalog.ts`,
`tools.ts`, and `neus-agents.ts`.

## What "NEUS-ready" means here

Every agent on the team is real by construction, not configured after the fact:

1. **Identity + delegation are NEUS proofs.** `neus_agent_create` writes an
   `agent-identity` + `agent-delegation` proof pair to the controller's profile
   (already wired in `installHarness`). The delegation carries
   `allowedActions` / `deniedActions` / `maxSpend` / `expiresAt`.
2. **Least privilege by default.** Each preset allows only read/draft actions;
   every irreversible or policy-sensitive action is in `deniedActions`, so it is
   **denied at the gate** (`checkDelegation`) and requires human approval —
   `approveStep` issues a *new* receipt and never rewrites the denial. This is
   how every HITL requirement below is enforced, uniformly.
3. **Human-in-the-loop is a policy, not a prompt.** In addition to
   `deniedActions`, the NEUS delegation carries
   `delegationApprovalPolicy.humanApprovalRequiredForNewClaims` and
   `delegationRuntimePolicy.requiresHumanApproval` — so the boundary travels
   with the agent's credential, off-platform.
4. **Tamper-evident audit.** Every decision (allowed *and* denied) is a
   hash-chained, signed receipt (`trust.ts`) plus the NEUS proof record.
5. **Dedicated wallet per agent** (see Cross-cutting #1) so each agent is a
   distinct identity, not a shared one.
6. **Offboarding is real.** `revokeHarness` owner-revokes both NEUS proofs, so
   authority dies on NEUS, not just at our gate.

## Cross-cutting architecture

### 1. Dedicated agent wallets (prerequisite)

Today every hire passes `controllerWallet` and lets the agent wallet default to
the user's account — so all agents share one `agent-identity` (the latest wins).
For a *team* of distinct agents, each needs its own `agentWallet`.
`neus_agent_create` accepts `agentWallet`, and the hosted flow exposes "Create
dedicated wallet" (`generatedWallet`). **Action:** request a dedicated/generated
wallet per agent at create time; store it on the harness. This is the first
implementation step and unblocks a real multi-agent roster.

### 2. NEUS capabilities → per-agent grants

The hosted registration exposes these capability toggles; grant the minimum set
per agent:

| Capability | Meaning | Granted to |
|---|---|---|
| Search | look up live information | Knowledge, Data, Web, Workflow |
| Tools | use connected apps / remote tools | Integration, Workflow |
| Browser | open web pages | Web Automation |
| Publish | share drafts/posts you approve | (none by default — HITL) |
| Payments | pay when you allow it | (none by default — HITL) |
| Callbacks | notify your systems when work finishes | Integration, Web, Workflow |
| Action records | keep a trail of what it did | **all** (audit) |
| Trust checks | run new checks, create receipts | **all** |
| Hand off | pass work to another trusted agent | Workflow (orchestrator) |

### 3. Connections (OAuth2)

Integration and Web agents need scoped third-party access. NEUS "Connected
accounts" (Google / Microsoft / GitHub) + our `connections.ts` seam supply the
tokens; secrets ride in NEUS `neus_secret_create` (vault), never in receipts
(`delegationRuntimePolicy.secretsExposedToReceipt: false`).

### 4. Error handling as delegation, not vibes

Each use case's error rule maps to an enforceable mechanism:
low-confidence → clarification (skill returns a "needs clarification" result, no
action taken); accuracy/validation failure → **halt** (the action is denied and
routed to a human via `approveStep`); DOM/timeouts → the adapter throws and the
run records the failure receipt.

---

## The five agents

Each: catalog entry · delegation preset · NEUS capabilities/skills · the source
tool schema → our `tools.ts` action mapping · HITL & error handling.

### 1. Knowledge Assistant — `knowledge-assistant`

- **Category:** Consulting ops · **Type:** `ai`
- **Does:** semantic search / RAG across SharePoint, Confluence, wikis, Drive.
- **Delegation preset**
  - `allowedActions`: `knowledge.semantic_search`, `drive.search_files`,
    `drive.read_file`, `confluence.search`, `sharepoint.search` — **all read-only**
  - `deniedActions`: `knowledge.write`, `drive.create_doc` (nothing writes)
  - `maxSpendCents`: 800 · `expiresInDays`: 30
- **Capabilities:** Search, Action records, Trust checks
- **Source tool:** `knowledge_assistant_search` → `knowledge.semantic_search`
  (params `query`, `data_sources[]`, `max_results`)
- **HITL / errors:** confidence below threshold → return a clarification prompt,
  take no action (no gate needed — it's read-only). MCP: `resources` (read KBs) +
  `tools` (search).

### 2. Data Analysis Assistant — `data-analyst`

- **Category:** Analytics · **Type:** `ai`
- **Does:** Text2SQL over a governed warehouse; **execution is HITL**.
- **Delegation preset**
  - `allowedActions`: `data.generate_sql`, `data.preview_query`,
    `data.list_schema` (draft/preview only)
  - `deniedActions`: `data.execute_query`, `data.write` — **execution denied by
    default** → human approval
  - `maxSpendCents`: 1000 · `expiresInDays`: 30
  - `delegationApprovalPolicy.humanApprovalRequiredForNewClaims: true`
- **Capabilities:** Search, Action records, Trust checks
- **Source tool:** `data_analysis_query` → `data.generate_sql` (+ preview);
  the run's execute step maps to the denied `data.execute_query`.
- **HITL / errors:** validation/accuracy < 80% → the generate step returns
  "route to analyst" and the execute step stays denied. Read-only + row-level
  security enforced at the connector, write access forbidden.

### 3. Tool & App Integration Assistant — `app-integration`

- **Category:** Ops automation · **Type:** `service`
- **Does:** maps NL intent → structured internal API calls (HRIS, Payroll, ERP).
- **Delegation preset**
  - `allowedActions`: `hris.read`, `integration.dispatch_read`,
    `integration.validate_payload`
  - `deniedActions`: `hris.write`, `payroll.update`,
    `integration.dispatch_write`, `document.reveal` — **all mutations denied**
  - `maxSpendCents`: 600 · `expiresInDays`: 30
- **Capabilities:** Tools, Callbacks, Action records · **Connections:** OAuth2
  (Google/Microsoft/GitHub), custom remote endpoint
- **Source tool:** `app_integration_dispatcher` → `integration.dispatch_*`
  (`user_intent`, `target_system`, `authentication_context`). The
  `authentication_context` maps to a resolved OAuth connection, **not** a
  client-passed token.
- **HITL / errors:** strict schema validation before transmission; failures
  return human-readable field errors and take no action. Writes → approval.

### 4. Web Automation Agent — `web-automation`

- **Category:** Ops automation · **Type:** `automation`
- **Does:** drives whitelisted legacy portals to read/extract/fill.
- **Delegation preset**
  - `allowedActions`: `web.navigate` (whitelist-scoped), `web.extract`,
    `web.read_dom`
  - `deniedActions`: `web.submit_form`, `web.download`, and **any
    non-whitelisted domain** (enforced by the adapter + a `scope` rule)
  - `maxSpendCents`: 1200 · `expiresInDays`: 14 (shorter — higher blast radius)
  - `delegationRuntimePolicy.secretsExposedToReceipt: false`
- **Capabilities:** Browser, Action records, Trust checks
- **Source tool:** `web_automation_executor` → `web.navigate` / `web.extract`
  (`target_url`, `automation_instructions[]`, `max_timeout_seconds`)
- **HITL / errors:** form submissions denied → approval. DOM mutation / render
  timeout → the adapter throws, the run records a failure receipt and stops
  (no broken-state submission). SSO creds via NEUS vault reference only.

### 5. Custom Workflow Assistant (Orchestrator) — `workflow-orchestrator`

- **Category:** Orchestration · **Type:** `agent`
- **Does:** coordinates the other four; persistent async state; hard sign-off
  checkpoints.
- **Delegation preset**
  - `allowedActions`: `workflow.advance` (non-signoff steps),
    `workflow.read_state`, `workflow.handoff` (to a named team agent)
  - `deniedActions`: `workflow.signoff_step`, `workflow.finalize` — **every
    checkpoint requires an explicit signed approval**
  - `maxSpendCents`: 2000 · `expiresInDays`: 30
  - `delegationApprovalPolicy`: `{ humanApprovalRequiredForNewClaims: true,
    preApprovedContentOnly: true }`
- **Capabilities:** Tools, Callbacks, Action records, Trust checks, **Hand off**
  (+ conceptual Resources/Prompts for orchestration)
- **Source tool:** `orchestrated_workflow_manager` → `workflow.*`
  (`workflow_id`, `current_step`, `context_payload`, `requires_human_signoff`)
- **HITL / errors:** the state machine **locks** at any failed step or approval
  checkpoint; `workflow.signoff_step` is denied, so progress needs `approveStep`
  (a signed receipt). Hand-off uses the NEUS **Hand off** capability to delegate
  to `data-analyst` / `app-integration` / `web-automation`, each with its own
  delegation — so authority never widens across the chain.

---

## Implementation phases

1. **Dedicated wallets** — `createAgent` requests a dedicated agent wallet;
   `NeusAgentRef` gains the distinct `agentWallet`. Unblocks a real roster.
2. **Catalog** — add the five harnesses above to `catalog.ts` with their presets
   and example tasks (so the gate/receipt flow is exercised per agent).
3. **Skills** — add the new adapters to `tools.ts` (`knowledge.*`, `data.*`,
   `integration.*`, `web.*`, `workflow.*`): simulated first, real via
   `connections.ts` (OAuth) — same seam Web Search already uses.
4. **Capabilities + policy** — pass `capabilities`, `delegationApprovalPolicy`,
   and `delegationRuntimePolicy` through `neus-agents.ts createAgent`.
5. **HITL** — reuse the denied-actions gate + `approveStep`; add the approval
   policy so the boundary is also on the NEUS credential.
6. **Connections** — wire OAuth2 for `app-integration` and `web-automation`;
   secrets via `neus_secret_create`.
7. **Orchestration** — implement `workflow.handoff` on top of the NEUS Hand-off
   capability so the orchestrator can delegate to the other four.

## Open decisions (need a call before phase 1)

- **Wallet provisioning:** NEUS-`generatedWallet` vs. app-minted EOA per agent.
- **Skill sourcing:** map to NEUS skill-library entries vs. our own `tools.ts`
  adapters (likely both — NEUS skills for identity, our adapters for execution).
- **`maxSpend` calibration** per agent, and whether it denominates model/infra
  cost (our `costCents`) or a real payment cap (USDC).
