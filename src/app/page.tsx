import Link from "next/link";

const steps = [
  {
    n: "1",
    title: "Set up trust once",
    body: "Create your account through NEUS — one verification, no new passwords. Your account is a portable trust receipt you can prove anywhere, and every worker you hire is accountable to it.",
  },
  {
    n: "2",
    title: "Hire an AI worker",
    body: "Pick from a curated directory of pre-trained workers — legal intake, meeting prep, client reporting. Each hire gets an employee ID and a role scoped to exactly what you allow, on the job in under five minutes.",
  },
  {
    n: "3",
    title: "Everything on the record",
    body: "Every action — including the ones a worker was blocked from taking — is receipted, cryptographically chained, and independently verifiable. Approve sensitive steps with one click. Offboard instantly.",
  },
];

const features = [
  {
    title: "Employee ID",
    body: "Every worker has its own verifiable identity from the moment it's hired. Not a label — a credential that can be independently revoked.",
  },
  {
    title: "Role & permissions",
    body: "Workers can only do what their role allows: scoped actions, a spend budget, an expiry date. Enforced before execution, not reviewed after.",
  },
  {
    title: "Work record",
    body: "A tamper-evident receipt for every action, allowed or blocked. Verifiable outside this platform — your audit trail doesn't depend on our uptime.",
  },
  {
    title: "One-click offboarding",
    body: "Revoke a worker's identity and permissions instantly. It stops acting at the gate; its work record stays intact and checkable.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-24 py-8">
      {/* Hero */}
      <section className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-hairline bg-surface px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_#00ff66]" />
          Trust by construction
        </div>
        <h1 className="mx-auto max-w-3xl font-display text-4xl uppercase leading-none tracking-tight sm:text-5xl">
          <span className="text-accent">(not)</span>Human Resources
        </h1>
        <p className="mt-4 text-lg font-medium text-ink/80">
          Your HR department for AI agents.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted">
          Hire pre-trained AI workers with a verified identity, a role scoped
          to exactly what you allow, and a tamper-evident record of everything
          they do. The trust isn&apos;t a feature you configure — it&apos;s the
          substrate every worker runs on.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/hire"
            className="rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-base hover:bg-accent-press"
          >
            Get started
          </Link>
          <a
            href="#how-it-works"
            className="rounded-sm border border-hairline px-5 py-2.5 text-sm font-medium uppercase tracking-wide hover:bg-inset"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works">
        <h2 className="text-center font-display text-2xl uppercase tracking-tight">
          How it works
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-md border border-hairline bg-surface p-6"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-accent/30 bg-ghost font-display text-sm text-accent">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-center font-display text-2xl uppercase tracking-tight">
          Accountability, built in — not bolted on
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted">
          Other agent platforms add governance when enterprise customers demand
          it. Here it&apos;s what every worker runs on, from your first hire.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-md border border-hairline bg-surface p-6"
            >
              <h3 className="font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="rounded-md border border-hairline border-l-2 border-l-accent bg-surface p-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
          Secured by NEUS
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted">
          Account setup and every work receipt issue through the NEUS trust
          network. Receipts are portable and independently verifiable — your
          proof doesn&apos;t live or die with this platform.
        </p>
      </section>

      {/* Final CTA */}
      <section className="text-center">
        <h2 className="font-display text-2xl uppercase tracking-tight">
          Your first hire is five minutes away
        </h2>
        <div className="mt-6">
          <Link
            href="/hire"
            className="rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-base hover:bg-accent-press"
          >
            Hire an AI worker
          </Link>
        </div>
      </section>
    </div>
  );
}
