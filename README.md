# (not)Human Resources — your HR department for AI agents

**nothumanresources.xyz** · v1 prototype of the Agent Harness Platform PRD (v4.0)

A no-code platform where you *hire* pre-built AI workers that run on a trust
layer by construction. Every hire gets an employee ID (a verifiable agent
identity), a role scoped to exactly what you allow (revocable delegation), and
a tamper-evident work record covering every action it takes **or is blocked
from taking**. Offboarding is one click and takes effect at the gate, not on a
promise.

Brand vocabulary → PRD/NEUS primitives: **hire** = install + identity issuance,
**role & permissions** = scoped delegation, **work record** = trust receipts,
**offboard** = revocation. The UI speaks HR; the cryptography stays backstage
(per the PRD's no-crypto-vocabulary constraint).

Repo: https://github.com/tylermalin/NotHumanResources · Live domain target: nothumanresources.xyz

## Run it

```bash
npm install
npm run dev
```

## Account setup — issues through NEUS

The landing page at `/` is public; everything else (hiring, your team, worker
profiles) sits behind NEUS account setup via `@neus/sdk`'s `VerifyGate`
widget. End users never need a NEUS account or API key — the gate reuses an
existing trust receipt or opens Hosted Verify, and the returned receipt ID
(`qHash`) is the account credential (shown as a `ProofBadge` in the nav).

To turn it on:

1. Sign in at neus.network → Profile → Portals, choose the checks visitors
   must pass, set pricing, and **Publish**. Copy your `gateId`.
2. `cp .env.example .env.local` and set `NEXT_PUBLIC_NEUS_GATE_ID=gate_…`

Without a `gateId`, the app offers a clearly-labeled local demo mode so the
rest of the product can be exercised. Server-side eligibility checks (looking
up the `qHash` via the NEUS HTTP API with an `npk_*` profile key before
trusted actions) are the next hardening step — the client stores the `qHash`
for exactly that purpose.

Open http://localhost:3000, hire a worker from the directory, assign one of
its tasks, then look at its Role & permissions and Work record. Try:

1. **Client Intake Assistant** → "Process a new client inquiry" — the final
   `gmail.send_email` step is denied at the gate (it's outside the worker's
   role) and waits for your one-click approval.
2. **Offboard** a worker — its identity and delegation are revoked, and it can
   no longer run anything. The rest of the team is unaffected.
3. **Verify work record** — recomputes every receipt hash, chain link, and
   ed25519 signature. Edit `.data/db.json` by hand and verify again to watch it
   catch tampering.

## What's implemented (PRD mapping)

| PRD concept | Where |
|---|---|
| Agent identity (per-harness, revocable) | `src/lib/trust.ts` — ed25519 keypair issued at install |
| Scoped delegation (`allowedActions`/`deniedActions`/`maxSpend`/`expiresAt`) | `src/lib/trust.ts` — `checkDelegation`, enforced **before** execution |
| Trust receipts (CAIP-380-shaped, allowed *and* denied) | `src/lib/trust.ts` — hash-chained per agent, signed, independently verifiable |
| Curated harness library (no marketplace) | `src/lib/catalog.ts` — 6 first-party harnesses across the 3 launch categories |
| Skills library (6 v1 integrations) | `src/lib/tools.ts` — Gmail, Calendar, Slack, Drive, web search, HubSpot (simulated adapters) |
| Human approval, enforced not reviewed | denied steps surface an "Approve & run" action; approval issues a *new* receipt, the denial stays in the chain |
| Network-level metrics | Workspace page — identities issued, active delegations, receipts allowed/denied |
| No crypto vocabulary in the UI | UI says Identity / Permissions / Activity; keys, hashes, and signatures stay in the backend |

## What's deliberately stubbed (and where it plugs in)

- **NEUS server-side API** — `src/lib/trust.ts` is an in-process implementation
  of the three primitives. It's the seam to swap for the production NEUS API
  once the server-side issuance path exists (PRD open decision #2).
- **Model execution** — tasks run deterministic plans from the catalog so the
  gate/receipt flow is exercised end-to-end without API keys. The planner in
  `src/lib/engine.ts` (`runTask`) is where model-driven planning (AI SDK)
  replaces the scripted plan.
- **Tool adapters** — simulated in `src/lib/tools.ts`; real OAuth-backed
  integrations replace each `simulate` function without touching the gate.
- **Auth & multi-tenancy** — single seeded workspace; the store
  (`src/lib/store.ts`) is a JSON file behind a two-function interface, swap for
  Postgres + real auth without touching the trust layer.
- **Memory & knowledge** — not in this prototype; orthogonal to the trust-layer
  proof this build exists to make.

## Architecture

```
src/lib/types.ts     domain types
src/lib/store.ts     persistence (JSON file, swappable)
src/lib/trust.ts     NEUS trust layer: identity, delegation gate, receipts
src/lib/tools.ts     skills library (6 integrations, simulated)
src/lib/catalog.ts   curated harness library + delegation presets
src/lib/engine.ts    install / run / approve / revoke — the only place tools execute
src/app/api/**       thin HTTP wrappers over the engine
src/app/**           Library, Workspace, Harness detail (Run / Permissions / Activity)
```

The invariant the whole product hangs on lives in `engine.ts`: **no tool call
executes without passing the delegation gate, and every decision issues a
signed receipt** — including denials, and including the revocation event itself.
