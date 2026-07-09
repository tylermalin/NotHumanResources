// Per-agent verifiable identity card — the credential a worker carries.
//
// Styled to the "Agent Console" design system: terminal black surfaces, kinetic
// green accent, hairline borders, near-square corners, Archivo Black display.
// Speaks HR, not crypto: Employee ID (not DID), Work record (not sha256) — per
// the PRD's no-crypto-vocabulary rule.
import { formatCents } from "@/lib/trust";
import type { InstalledHarness } from "@/lib/types";
import { RevokeButton } from "@/components/HarnessActions";

function shortAccount(auth: InstalledHarness["authorization"]): string {
  if (!auth) return "—";
  if (auth.walletAddress) {
    return `${auth.walletAddress.slice(0, 6)}…${auth.walletAddress.slice(-4)}`;
  }
  if (auth.qHash) return `${auth.qHash.slice(0, 10)}…`;
  return "local demo";
}

export function AgentIdCard({
  harness,
  latestReceiptHash,
  receiptCount,
}: {
  harness: InstalledHarness;
  latestReceiptHash: string | null;
  receiptCount: number;
}) {
  const active = harness.status === "active";
  const d = harness.delegation;
  const budgetPct = Math.min(
    100,
    Math.round((d.spentCents / d.maxSpendCents) * 100)
  );
  const expires = new Date(d.expiresAt);

  return (
    <div className="overflow-hidden rounded-md border border-hairline bg-surface shadow-[0_20px_40px_rgba(0,0,0,0.45),0_0_40px_rgba(0,255,102,0.05)]">
      {/* Console header banner */}
      <div className="flex items-center justify-between border-b border-hairline bg-raise px-6 py-3.5">
        <div className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.15em]">
          <span className="text-accent">(!)</span>
          <span className="text-accent">(not)</span>
          <span>Human Resources</span>
        </div>
        {active ? (
          <span className="flex items-center gap-1.5 rounded-sm border border-accent/30 bg-ghost px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_#00ff66]" />
            Active Identity
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-sm border border-fault/30 bg-fault/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-fault">
            <span className="h-1.5 w-1.5 rounded-full bg-fault" />
            Offboarded
          </span>
        )}
      </div>

      <div className="p-6">
        {/* Profile: avatar + name + Employee ID */}
        <div className="mb-6 flex items-center gap-5">
          <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-md border border-accent/30 bg-[radial-gradient(circle,#26272e_0%,#111215_100%)] shadow-[inset_0_0_15px_rgba(0,255,102,0.15)]">
            <div className="relative h-11 w-11 rounded-full border-2 border-accent">
              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_10px_#00ff66]" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {harness.category}
            </div>
            <h2 className="mt-1 font-display text-lg uppercase leading-tight tracking-tight text-ink">
              {harness.name}
            </h2>
            <div className="mt-2 inline-block rounded-sm border border-accent/20 bg-ghost px-2 py-1 font-mono text-xs text-accent">
              {harness.identity.agentId}
            </div>
            {harness.neusAgent && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_#00ff66]" />
                NEUS Trusted Agent · delegation{" "}
                <span className="font-mono normal-case text-accent">
                  {harness.neusAgent.delegationQHash.slice(0, 10)}…
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Governance guardrails */}
        <section className="mb-4 rounded-md border border-hairline bg-inset/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              Role &amp; permissions
            </span>
            <span className="text-[10px] uppercase tracking-wide text-accent">
              Enforced before it acts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
            <Field
              label="Hired"
              value={new Date(harness.installedAt).toLocaleDateString(
                undefined,
                { year: "numeric", month: "short", day: "numeric" }
              )}
            />
            <Field
              label="Spend budget"
              value={`${formatCents(d.maxSpendCents)} / mo`}
              valueClass="text-pending"
            />
            <Field
              label="Expiry"
              value={expires.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
              valueClass="font-mono"
            />
            <Field
              label="Revocation"
              value={active ? "One-click revocable" : "Revoked"}
              valueClass={active ? "text-accent" : "text-fault"}
            />
          </div>

          {/* Budget usage */}
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-muted">
              <span>Budget used</span>
              <span className="text-ink">
                {formatCents(d.spentCents)} of {formatCents(d.maxSpendCents)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full rounded-full bg-accent shadow-[0_0_8px_rgba(0,255,102,0.5)]"
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>

          {/* Scoped actions */}
          <div className="mt-4">
            <div className="mb-1.5 text-[10px] uppercase tracking-wide text-muted">
              Scoped actions
            </div>
            <div className="flex flex-wrap gap-1.5">
              {d.allowedActions.map((a) => (
                <span
                  key={a}
                  className="rounded-sm border border-log bg-inset px-2 py-1 font-mono text-[11px] text-ink/80"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* Human-approval boundary */}
          {d.deniedActions.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-[10px] uppercase tracking-wide text-muted">
                Always asks you first
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.deniedActions.map((a) => (
                  <span
                    key={a}
                    className="rounded-sm border border-pending/25 bg-pending/10 px-2 py-1 font-mono text-[11px] text-pending"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Work record ledger reference */}
        <section className="flex items-center justify-between rounded-md border border-hairline border-l-2 border-l-accent bg-[linear-gradient(90deg,rgba(0,255,102,0.05)_0%,rgba(0,0,0,0)_60%)] p-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted">
              Work record
            </div>
            <div className="mt-1 truncate font-mono text-[11px] text-muted">
              {latestReceiptHash
                ? `${receiptCount} entries · latest ${latestReceiptHash.slice(0, 10)}…`
                : "No work on record yet"}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted">
              Audit
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
              Independently verifiable
            </div>
          </div>
        </section>
      </div>

      {/* Offboarding gate footer */}
      <div className="flex items-center justify-between border-t border-hairline bg-raise px-6 py-3.5 text-[11px] text-muted">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="uppercase tracking-wide">
            Authorized under{" "}
            <span className="font-mono normal-case text-ink/80">
              {shortAccount(harness.authorization)}
            </span>
          </span>
        </div>
        {active ? (
          <RevokeButton harnessId={harness.id} />
        ) : (
          <span className="uppercase tracking-wide">
            Offboarded · gate closed
          </span>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className={`text-[13px] font-semibold text-ink ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
