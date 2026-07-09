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
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          <span className="text-zinc-400">(not)</span>Human Resources
        </h1>
        <p className="mt-3 text-lg font-medium text-zinc-600 dark:text-zinc-300">
          Your HR department for AI agents.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-500">
          Hire pre-trained AI workers with a verified identity, a role scoped
          to exactly what you allow, and a tamper-evident record of everything
          they do. The trust isn&apos;t a feature you configure — it&apos;s the
          substrate every worker runs on.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/hire"
            className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300"
          >
            Get started
          </Link>
          <a
            href="#how-it-works"
            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-sm font-semibold text-white dark:text-zinc-900">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Accountability, built in — not bolted on
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-zinc-500">
          Other agent platforms add governance when enterprise customers demand
          it. Here it&apos;s what every worker runs on, from your first hire.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
            >
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Secured by NEUS
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Account setup and every work receipt issue through the NEUS trust
          network. Receipts are portable and independently verifiable — your
          proof doesn&apos;t live or die with this platform.
        </p>
      </section>

      {/* Final CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Your first hire is five minutes away
        </h2>
        <div className="mt-6">
          <Link
            href="/hire"
            className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300"
          >
            Hire an AI worker
          </Link>
        </div>
      </section>
    </div>
  );
}
