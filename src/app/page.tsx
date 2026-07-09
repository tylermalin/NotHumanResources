import Link from "next/link";

const CONTACT =
  "mailto:tyler@malamaproject.org?subject=(not)Human%20Resources%20%E2%80%94%20Technical%20Demo";

const risks = [
  {
    tag: "Operational risk",
    title: "Data privileges",
    body: "Handing an autonomous agent root API tokens or direct database access invites unintended deletion, privilege escalation, and quiet security holes.",
    accent: "rose",
  },
  {
    tag: "Financial leak",
    title: "Infinite loops",
    body: "A minor bug or unhandled edge case sends an agent looping recursively, running up a $10,000 token bill overnight while your team sleeps.",
    accent: "amber",
  },
  {
    tag: "Compliance black box",
    title: "Untraceable logic",
    body: "When an agent sends the wrong invoice or drops a critical lead, standard application logs never show you why the model made that choice.",
    accent: "sky",
  },
];

const features = [
  {
    title: "Zero-trust token sandboxing",
    body: "The harness sits between your APIs and the model. Agents act through temporary, strictly scoped tokens with no root access. Reach for a tool it wasn't cleared for and the action is dropped instantly.",
    meter: 0.15,
  },
  {
    title: "Execution circuit breakers",
    body: "Assign hard budgets down to the session, user, or workflow. If an agent gets stuck in a loop, the breaker trips automatically and freezes the process before costs balloon.",
    meter: 0.4,
  },
  {
    title: "The flight recorder",
    body: "Every prompt, intermediate thought, tool call, and raw payload is preserved in a lookback-ready trail. When an agent acts, you have the precise forensic path for why.",
    meter: 1,
  },
  {
    title: "Multi-model routing & caching",
    body: "Repetitive queries resolve locally via semantic caching to save 40 to 80 percent, and simpler steps route to cheap open models, reserving frontier models for real reasoning.",
    meter: 0.7,
  },
];

const layers = [
  { title: "Security", items: ["Token sandboxing", "Scoped privileges"] },
  { title: "FinOps", items: ["Circuit breakers", "Semantic caching"] },
  { title: "Compliance", items: ["Step-by-step audit", "Policy gateways"] },
  { title: "NEUS trust", items: ["Identity", "Delegation"] },
];

const glass =
  "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl";

function Node({
  label,
  className,
  up,
}: {
  label: string;
  className: string;
  up?: boolean;
}) {
  const dot = (
    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
  );
  const line = (
    <span
      className={`my-1 h-16 w-px bg-gradient-to-b ${
        up ? "from-transparent to-white/40" : "from-white/40 to-transparent"
      }`}
    />
  );
  const text = (
    <span className="text-[10px] uppercase tracking-[0.2em] text-white/55">
      {label}
    </span>
  );
  return (
    <div
      className={`pointer-events-none absolute hidden flex-col items-center opacity-70 lg:flex ${className}`}
    >
      {up ? (
        <>
          {text}
          {line}
          {dot}
        </>
      ) : (
        <>
          {dot}
          {line}
          {text}
        </>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Full-bleed ethereal canvas + ambient glows */}
      <div className="fixed inset-0 -z-10 bg-[#040406]" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[28%] h-[620px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-200/[0.09] blur-[150px]" />
        <div className="absolute right-[18%] top-[14%] h-[480px] w-[480px] rounded-full bg-emerald-300/[0.07] blur-[130px]" />
        <div className="absolute bottom-[6%] left-[20%] h-[440px] w-[620px] rounded-full bg-slate-300/[0.05] blur-[150px]" />
      </div>

      <div className="relative z-10 space-y-28 py-6 text-white">
        {/* Hero */}
        <section className="relative pt-10 text-center">
          <Node label="Guardrails" className="left-[6%] top-2" />
          <Node label="Delegation" className="right-[8%] top-6" up />
          <Node label="Audit trail" className="bottom-6 left-[10%]" up />

          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_rgba(110,231,183,0.7)]" />
            <span className="text-xs font-medium uppercase tracking-wider text-white/70">
              Enterprise infrastructure for autonomous AI
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-4xl font-semibold leading-[1.1] tracking-tight text-transparent sm:text-6xl md:text-7xl">
            Don&apos;t deploy an autonomous AI agent without a harness.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/75 md:text-xl">
            If you wouldn&apos;t hire a human without a budget, a manager, and an
            audit trail, don&apos;t let unmanaged software agents become your
            biggest liability.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/hire"
              className="w-full rounded-full bg-white px-8 py-3.5 font-medium tracking-wide text-[#040406] shadow-[0_0_24px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_34px_rgba(255,255,255,0.3)] sm:w-auto"
            >
              Deploy the harness
            </Link>
            <a
              href={CONTACT}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3.5 font-medium tracking-wide text-white backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 sm:w-auto"
            >
              Talk to an architect
              <svg
                className="h-4 w-4 text-white/70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </section>

        {/* Problem matrix */}
        <section>
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Autonomous agents are brilliant.
            <span className="block text-white/65">
              Unmanaged software agents are liabilities.
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/70 sm:text-base">
            Building enterprise-grade agents means fighting infrastructure, not
            just model logic.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {risks.map((r) => (
              <div key={r.title} className={`${glass} p-6`}>
                <div
                  className={`text-xs font-medium uppercase tracking-wider ${
                    r.accent === "rose"
                      ? "text-rose-300/80"
                      : r.accent === "amber"
                        ? "text-amber-300/80"
                        : "text-sky-300/80"
                  }`}
                >
                  {r.tag}
                </div>
                <h3 className="mt-3 text-lg font-medium text-white">
                  {r.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  {r.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* The harness */}
        <section>
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Meet the Agent Harness
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/70 sm:text-base">
            The dedicated operating system for your digital workforce.
          </p>
          <div className={`mx-auto mt-10 max-w-4xl ${glass} p-6 sm:p-8`}>
            <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] py-3 text-sm font-medium tracking-wide text-emerald-200/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_rgba(110,231,183,0.7)]" />
              The Harness
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {layers.map((col) => (
                <div
                  key={col.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="text-sm font-medium text-white">
                    {col.title}
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {col.items.map((i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-xs text-white/70"
                      >
                        <span className="h-1 w-1 rounded-full bg-emerald-300/70" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-6 grid max-w-4xl gap-5 md:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className={`${glass} p-6`}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-medium text-white">
                    {f.title}
                  </h3>
                  <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-300/70 to-white/70"
                      style={{ width: `${Math.round(f.meter * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Strategic value */}
        <section className={`${glass} mx-auto max-w-4xl p-8 sm:p-10`}>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Future-proof your infrastructure
          </h2>
          <p className="mt-3 text-base font-light text-white/70">
            Models change every month. Your guardrails shouldn&apos;t have to.
          </p>
          <div className="mt-5 grid gap-5 text-sm leading-relaxed text-white/75 md:grid-cols-2">
            <p>
              When you build security, cost tracking, and prompt-logging into
              code tied to one LLM vendor, you lock your enterprise into legacy
              contracts.
            </p>
            <p>
              (not)Human Resources decouples the compliance layer from the
              frontier-model race. Swap models with a config line as faster,
              cheaper chips arrive, while your security posture and
              human-in-the-loop policies stay intact.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative text-center">
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Stop building custom cages around your AI models.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            Offload the infrastructure layer so your engineers spend every cycle
            shipping product, not guardrails.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={CONTACT}
              className="w-full rounded-full bg-white px-8 py-3.5 font-medium tracking-wide text-[#040406] shadow-[0_0_24px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_34px_rgba(255,255,255,0.3)] sm:w-auto"
            >
              Book a 10-minute demo
            </a>
            <Link
              href="/how-it-works"
              className="w-full rounded-full border border-white/10 bg-white/5 px-8 py-3.5 font-medium tracking-wide text-white backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 sm:w-auto"
            >
              See how it works
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
