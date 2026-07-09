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
        <h1 className="font-display text-2xl uppercase tracking-tight">
          Your team
        </h1>
        <p className="mt-1 text-sm text-muted">
          The AI workers on your payroll, and the verified record behind
          everything they&apos;ve done.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-md border border-hairline bg-surface p-4"
          >
            <div className="font-display text-2xl tabular-nums text-accent">
              {s.value}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-muted">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {active.length === 0 && revoked.length === 0 ? (
        <div className="rounded-md border border-dashed border-hairline p-10 text-center text-sm text-muted">
          Nobody on the team yet.{" "}
          <Link href="/hire" className="font-medium text-accent hover:underline">
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
            const revoked = h.status === "revoked";
            return (
              <Link
                key={h.id}
                href={`/harnesses/${h.id}`}
                className="flex items-center justify-between rounded-md border border-hairline bg-surface p-4 transition-colors hover:border-accent/40"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${revoked ? "bg-fault" : "bg-accent"}`}
                    />
                    <span className="font-medium text-ink">{h.name}</span>
                    {revoked && (
                      <span className="rounded-sm border border-fault/30 bg-fault/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-fault">
                        Offboarded
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-muted">
                    {h.category} · {receipts} recorded actions ·{" "}
                    {formatCents(h.delegation.spentCents)} of{" "}
                    {formatCents(h.delegation.maxSpendCents)} budget used
                  </div>
                </div>
                <span className="text-sm text-muted">→</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
