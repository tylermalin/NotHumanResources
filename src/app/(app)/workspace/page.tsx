import Link from "next/link";
import { readDB } from "@/lib/store";
import { formatCents } from "@/lib/trust";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const db = await readDB();
  const active = db.harnesses.filter((h) => h.status === "active");
  const revoked = db.harnesses.filter((h) => h.status === "revoked");
  const allowed = db.receipts.filter((r) => r.decision === "allowed").length;
  const denied = db.receipts.filter((r) => r.decision === "denied").length;

  // Network-level metrics from the PRD — the numbers that make the trust
  // infrastructure story real: identities issued, delegations live,
  // receipts allowed vs denied. Rendered in HR vocabulary.
  const stats = [
    { label: "Workers onboarded", value: db.harnesses.length },
    { label: "Active on the team", value: active.length },
    { label: "Actions done & verified", value: allowed },
    { label: "Actions blocked at the gate", value: denied },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Your team</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The AI workers on your payroll, and the verified record behind
          everything they&apos;ve done.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
          >
            <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {active.length === 0 && revoked.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center text-sm text-zinc-500">
          Nobody on the team yet.{" "}
          <Link href="/" className="font-medium underline">
            Browse the directory
          </Link>{" "}
          to make your first hire.
        </div>
      ) : (
        <div className="space-y-3">
          {[...active, ...revoked].map((h) => {
            const receipts = db.receipts.filter(
              (r) => r.harnessId === h.id
            ).length;
            return (
              <Link
                key={h.id}
                href={`/harnesses/${h.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-400 dark:hover:border-zinc-600"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{h.name}</span>
                    {h.status === "revoked" && (
                      <span className="rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-xs text-red-700 dark:text-red-400">
                        Offboarded
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {h.category} · {receipts} recorded actions ·{" "}
                    {formatCents(h.delegation.spentCents)} of{" "}
                    {formatCents(h.delegation.maxSpendCents)} budget used
                  </div>
                </div>
                <span className="text-sm text-zinc-400">→</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
