import Link from "next/link";

const sessionInit = `POST /v1/sessions/initialize

{
  "session_id": "agent_wf_99281a",
  "application_id": "crm_outbound_auto",
  "policy": {
    "max_budget_usd": 2.50,
    "circuit_breaker": {
      "max_recursive_depth": 5,
      "action": "terminate_and_alert"
    },
    "routing_strategy": "dynamic_cost_optimized",
    "allowed_mcp_servers": [
      "salesforce-reader-production",
      "slack-notifications-internal"
    ]
  },
  "initial_context": { "user_id": "usr_4021", "scope": "read_only" }
}`;

const sessionResp = `200 OK

{
  "status": "initialized",
  "harness_token": "nhr_sec_tok_8f3d192c73be",
  "endpoints": {
    "mcp_gateway_url": "https://gateway.nothumanresources.xyz/v1/mcp/agent_wf_99281a",
    "llm_proxy_url":   "https://gateway.nothumanresources.xyz/v1/chat/completions"
  }
}`;

const execCall = `POST /v1/mcp/execute

{
  "harness_token": "nhr_sec_tok_8f3d192c73be",
  "mcp_server": "salesforce-reader-production",
  "tool_intent": {
    "name": "update_lead_status",
    "arguments": {
      "lead_id": "00Q8W00000TvK1u",
      "status": "Qualified",
      "override_protection": false
    }
  }
}`;

function Code({ children }: { children: string }) {
  return (
    <div className="overflow-x-auto rounded-md border border-hairline bg-raise">
      <pre className="p-4 font-mono text-xs leading-6 text-ink/85">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl uppercase tracking-tight text-ink">
      {children}
    </h2>
  );
}

const neusPillars = [
  {
    title: "Verifiable identity",
    body: "Every hire calls neus_agent_create — an agent-identity proof written to your NEUS profile, on the agent's own dedicated wallet. Not a label; a credential that verifies and revokes independently of this platform.",
  },
  {
    title: "Scoped delegation",
    body: "The agent-delegation proof carries the exact allow/deny action lists, a spend cap, and an expiry. The harness checks it before every tool call — denied actions never execute; they wait for one-click human approval at the gate.",
  },
  {
    title: "Tamper-evident receipts",
    body: "Every decision — allowed and denied — is hash-chained and signed. The trail verifies offline, so your audit doesn't depend on our uptime or a single vendor's logs.",
  },
  {
    title: "Real revocation",
    body: "Offboarding owner-revokes the identity and delegation proofs on NEUS. The agent's authority dies at the source, not just at our gate.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="space-y-16 py-8">
      {/* Header */}
      <section>
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
          Architecture &amp; developer documentation
        </div>
        <h1 className="mt-2 font-display text-3xl uppercase leading-tight tracking-tight sm:text-4xl">
          Decoupled agent orchestration
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted sm:text-base">
          (not)Human Resources sits as a secure, zero-trust infrastructure proxy
          between your application logic, your internal data stores, and upstream
          frontier models. Instead of embedding brittle interceptors,
          rate-limiters, and logging wrappers inside your code, you route agent
          intents and tool executions through the harness — and every agent runs
          on a verifiable NEUS identity with an enforceable delegation.
        </p>
      </section>

      {/* Architecture diagram */}
      <section>
        <div className="rounded-md border border-hairline bg-surface p-6">
          <div className="mx-auto mb-5 max-w-sm rounded-sm border border-hairline bg-inset/50 px-4 py-3 text-center text-xs uppercase tracking-wide text-muted">
            Application logic · LangChain / AutoGen
            <div className="mt-1 text-[10px] text-accent">↓ signed payload</div>
          </div>
          <div className="mb-5 rounded-sm border border-accent/30 bg-ghost p-4">
            <div className="mb-3 text-center font-display text-xs uppercase tracking-[0.15em] text-accent">
              (!) The Harness
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { t: "MCP Router", s: "Schema enforcer" },
                { t: "FinOps Guardrails", s: "Cache · budget circuit" },
                { t: "Immutable Ledger", s: "Crypto-signed traces" },
                { t: "NEUS Trust", s: "Identity · delegation" },
              ].map((b) => (
                <div
                  key={b.t}
                  className="rounded-sm border border-hairline bg-void/60 p-3 text-center"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wide text-ink">
                    {b.t}
                  </div>
                  <div className="mt-1 text-[10px] text-muted">{b.s}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-sm border border-hairline bg-inset/50 px-4 py-3 text-center text-xs uppercase tracking-wide text-muted">
              Internal DBs · via MCP
            </div>
            <div className="rounded-sm border border-hairline bg-inset/50 px-4 py-3 text-center text-xs uppercase tracking-wide text-muted">
              Upstream LLM · proxy route
            </div>
          </div>
        </div>
      </section>

      {/* MCP */}
      <section className="space-y-4">
        <H2>Native Model Context Protocol integration</H2>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          The harness builds natively on MCP. By formalizing the connection
          between applications and data sources, it decouples data access from
          model intelligence.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-hairline bg-surface p-5">
            <h3 className="font-display text-sm uppercase tracking-tight text-ink">
              Harness as an MCP gateway
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Your internal tools, databases, and microservices expose standard
              MCP server endpoints. The harness is the secure client gateway —
              managing authentication, connection pooling, and payload scrubbing.
              Identity and delegation ride the NEUS MCP server (
              <span className="font-mono text-xs text-accent">
                mcp.neus.network/mcp
              </span>
              ).
            </p>
          </div>
          <div className="rounded-md border border-hairline bg-surface p-5">
            <h3 className="font-display text-sm uppercase tracking-tight text-ink">
              Context isolation
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Upstream models never ingest naked, unvetted environment context.
              The harness forces all tool discovery and resource sampling to match
              explicit JSON-schema invariants before they reach the model.
            </p>
          </div>
        </div>
      </section>

      {/* NEUS trust layer */}
      <section className="space-y-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
          The trust layer
        </div>
        <H2>Every agent runs on NEUS</H2>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          Trust isn&apos;t a feature you configure after the fact — it&apos;s the
          substrate. When you hire an agent, the harness registers it as a real
          NEUS Trusted Agent: an <span className="text-ink">agent-identity</span>{" "}
          and <span className="text-ink">agent-delegation</span> proof pair
          written to your NEUS profile. The delegation is what the harness
          enforces before any tool executes.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {neusPillars.map((p) => (
            <div
              key={p.title}
              className="rounded-md border border-hairline border-l-2 border-l-accent bg-surface p-5"
            >
              <h3 className="font-display text-sm uppercase tracking-tight text-ink">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">{p.body}</p>
            </div>
          ))}
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          Because identity, permissions, and audit live on NEUS — not baked into
          your app against one vendor — you swap frontier models with a config
          line while your security posture and human-in-the-loop policies stay
          intact.
        </p>
      </section>

      {/* Core infra */}
      <section className="space-y-4">
        <H2>Core infrastructure</H2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-hairline bg-surface p-5">
            <h3 className="font-display text-sm uppercase tracking-tight text-ink">
              Circuit breakers &amp; budget enforcement
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Every session declares a metadata policy with a maximum compute
              spend. The state engine evaluates cumulative token consumption and
              latency per turn; a recursive loop or unhandled exception that
              breaks your boundaries drops the connection at the socket level.
            </p>
          </div>
          <div className="rounded-md border border-hairline bg-surface p-5">
            <h3 className="font-display text-sm uppercase tracking-tight text-ink">
              Semantic caching engine
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Before forwarding context to upstream providers, the harness runs
              an async semantic lookup against a low-latency vector cache. Exact
              and high-similarity hits resolve locally in sub-10ms, slashing
              redundant token cost by 40–80%.
            </p>
          </div>
        </div>
      </section>

      {/* API */}
      <section className="space-y-6">
        <H2>API design &amp; integration</H2>
        <div className="space-y-3">
          <h3 className="font-display text-sm uppercase tracking-tight text-ink">
            Session initialization
          </h3>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            Send an explicit session policy to spin up a containerized execution
            harness.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Code>{sessionInit}</Code>
            <Code>{sessionResp}</Code>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-display text-sm uppercase tracking-tight text-ink">
            Executing a monitored tool call
          </h3>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            When the model issues a tool call, the application routes the intent
            through the proxy to guarantee schema compliance and check the NEUS
            delegation.
          </p>
          <Code>{execCall}</Code>
          <div className="rounded-md border border-fault/30 bg-fault/10 p-4 text-sm leading-6 text-ink/90">
            <span className="font-semibold text-fault">
              ⚠ Zero-trust enforcement:
            </span>{" "}
            if the tool intent deviates from your JSON schema, targets an
            unauthorized collection, or falls outside the agent&apos;s NEUS
            delegation, the harness blocks the write and logs a telemetry alert
            with an immutable cryptographic signature.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-hairline bg-surface p-6">
        <p className="font-display text-sm uppercase tracking-tight text-ink">
          Deploy an agent on a verifiable harness.
        </p>
        <Link
          href="/hire"
          className="rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-void hover:bg-accent-press"
        >
          Deploy the harness
        </Link>
      </section>
    </div>
  );
}
