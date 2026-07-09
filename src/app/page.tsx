import Link from "next/link";

const CONTACT =
  "mailto:tyler@malamaproject.org?subject=(not)Human%20Resources%20%E2%80%94%20Technical%20Demo";

const risks = [
  {
    tag: "The Operational Risk",
    title: "Data privileges",
    body: "Giving an autonomous agent direct root API tokens or database access risks unintended data deletion, privilege escalation, and massive security holes.",
    tone: "fault" as const,
  },
  {
    tag: "The Financial Leak",
    title: "Infinite loops",
    body: "A minor bug or unhandled edge case can cause an autonomous agent to loop recursively, running up a $10,000 token bill overnight while your team sleeps.",
    tone: "pending" as const,
  },
  {
    tag: "The Compliance Black Box",
    title: "Untraceable logic",
    body: "When an agent sends an incorrect invoice or drops a critical lead, standard application logs don't show you why the LLM made that choice.",
    tone: "muted" as const,
  },
];

const features = [
  {
    icon: "🛡️",
    title: "Zero-trust token sandboxing",
    body: "Stop giving AI the keys to the kingdom. The harness sits between your internal APIs and the LLM layer. Agents operate via temporary, strictly scoped tokens with zero root access. Try to execute a tool it hasn't been cleared for, and the harness drops the action instantly.",
  },
  {
    icon: "🛑",
    title: "Execution circuit breakers & cost caps",
    body: "Bring predictable unit economics to AI operations. Assign hard budgets down to the session, user, or workflow. If an agent gets stuck in a recursive loop, the circuit breaker trips automatically — freezing the process before costs balloon.",
  },
  {
    icon: "📼",
    title: "Immutable step-logging — the flight recorder",
    body: "Every prompt, intermediate thought, tool execution, and raw JSON payload is preserved in a secure, lookback-ready audit trail. When an agent acts, you always have a precise forensic path showing exactly why it made that decision.",
  },
  {
    icon: "🔀",
    title: "Dynamic multi-LLM routing & caching",
    body: "Maximize ROI on every token. The harness resolves repetitive queries locally via semantic caching to save 40–80% on redundant calls, and routes simpler steps to ultra-cheap open-weight models — reserving frontier models like Claude Opus for when deep reasoning is strictly required.",
  },
];

const harness = [
  { title: "Security Layer", items: ["Token sandboxing", "Scoped privileges"] },
  { title: "FinOps Controls", items: ["Circuit breakers", "Semantic caching"] },
  { title: "Compliance Logs", items: ["Step-by-step audit", "Policy gateways"] },
];

export default function LandingPage() {
  return (
    <div className="space-y-24 py-8">
      {/* Hero */}
      <section className="text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-sm border border-hairline bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_#00ff66]" />
          Enterprise infrastructure for autonomous AI
        </div>
        <h1 className="mx-auto max-w-4xl font-display text-3xl uppercase leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
          If you wouldn&apos;t hire a human without a budget, a manager, and an
          audit trail&hellip;
          <span className="mt-2 block text-accent">
            don&apos;t deploy an autonomous AI agent without a harness.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          The enterprise infrastructure layer for autonomous AI. Secure your
          workflows, bring predictable unit economics to LLMs, and stop rogue
          agents before they break production.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/hire"
            className="rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-base hover:bg-accent-press"
          >
            Deploy the harness
          </Link>
          <a
            href={CONTACT}
            className="rounded-sm border border-hairline px-5 py-2.5 text-sm font-medium uppercase tracking-wide hover:bg-inset"
          >
            Talk to an architect
          </a>
        </div>
      </section>

      {/* Problem matrix */}
      <section>
        <h2 className="text-center font-display text-2xl uppercase tracking-tight">
          Autonomous agents are brilliant.
          <span className="block text-muted">
            Unmanaged software agents are liabilities.
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted">
          Building enterprise-grade agents means fighting infrastructure
          bottlenecks, not just model logic.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {risks.map((r) => (
            <div
              key={r.title}
              className="rounded-md border border-hairline bg-surface p-6"
            >
              <div
                className={`text-[11px] font-bold uppercase tracking-[0.1em] ${
                  r.tone === "fault"
                    ? "text-fault"
                    : r.tone === "pending"
                      ? "text-pending"
                      : "text-muted"
                }`}
              >
                {r.tag}
              </div>
              <h3 className="mt-3 font-display text-base uppercase tracking-tight text-ink">
                {r.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — the harness */}
      <section>
        <h2 className="text-center font-display text-2xl uppercase tracking-tight">
          Meet the Agent Harness
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted">
          The dedicated operating system for the digital workforce.
        </p>

        {/* Harness diagram */}
        <div className="mx-auto mt-8 max-w-3xl rounded-md border border-hairline bg-surface p-6">
          <div className="mb-5 flex items-center justify-center gap-2 rounded-sm border border-accent/30 bg-ghost py-3 font-display text-xs uppercase tracking-[0.15em] text-accent">
            <span>(!)</span> The Harness
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {harness.map((col) => (
              <div
                key={col.title}
                className="rounded-sm border border-hairline bg-inset/50 p-4"
              >
                <div className="text-[11px] font-bold uppercase tracking-wide text-ink">
                  {col.title}
                </div>
                <ul className="mt-2 space-y-1">
                  {col.items.map((i) => (
                    <li
                      key={i}
                      className="flex items-center gap-1.5 text-xs text-muted"
                    >
                      <span className="h-1 w-1 rounded-full bg-accent" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-md border border-hairline bg-surface p-6"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{f.icon}</span>
                <h3 className="font-display text-sm uppercase tracking-tight text-ink">
                  {f.title}
                </h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Strategic value */}
      <section className="rounded-md border border-hairline border-l-2 border-l-accent bg-surface p-8">
        <h2 className="font-display text-2xl uppercase tracking-tight">
          Future-proof your infrastructure
        </h2>
        <p className="mt-2 text-sm font-medium text-ink/80">
          Models change every month. Your infrastructure guardrails
          shouldn&apos;t have to.
        </p>
        <div className="mt-4 grid gap-4 text-sm leading-6 text-muted md:grid-cols-2">
          <p>
            When you build application-level security, cost tracking, and
            prompt-logging directly into code tied to a specific LLM vendor, you
            lock your enterprise into legacy contracts.
          </p>
          <p>
            (not)Human Resources decouples your compliance layer from the
            frontier-model race. Swap models with a single config line as
            faster, cheaper chips hit the market — while keeping your security
            postures and human-in-the-loop policies fully intact.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center">
        <h2 className="mx-auto max-w-2xl font-display text-2xl uppercase tracking-tight">
          Stop building custom cages around your AI models.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted">
          Offload the infrastructure layer so your engineers spend 100% of their
          cycles shipping core business logic and product features.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={CONTACT}
            className="rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-base hover:bg-accent-press"
          >
            Book a 10-minute technical demo
          </a>
          <Link
            href="/hire"
            className="rounded-sm border border-hairline px-5 py-2.5 text-sm font-medium uppercase tracking-wide hover:bg-inset"
          >
            Deploy the harness
          </Link>
        </div>
      </section>
    </div>
  );
}
