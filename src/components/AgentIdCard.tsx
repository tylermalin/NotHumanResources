// Per-agent verifiable identity card — the credential a worker carries.
//
// Styled as a self-contained dark ID card (always dark, like a physical badge)
// regardless of page theme, following the identity-card style guide. Speaks HR,
// not crypto: Employee ID (not DID), Work record (not sha256) — per the PRD's
// no-crypto-vocabulary-in-the-UI rule. The RevocationStatus/offboard control is
// the one interactive element and is wired through the existing gate.
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
    <div className="overflow-hidden rounded-2xl border border-[#1f293d] bg-[#141b2d] text-[#f3f4f6] shadow-[0_20px_40px_rgba(0,0,0,0.45),0_0_50px_rgba(34,211,238,0.05)]">
      {/* Security header banner */}
      <div className="flex items-center justify-between border-b border-[#1f293d] bg-gradient-to-r from-[#1e293b] to-[#0f172a] px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rotate-45 bg-[#22d3ee]" />
          <span className="text-xs font-extrabold uppercase tracking-[0.15em]">
            (not)Human Resources
          </span>
        </div>
        {active ? (
          <span className="flex items-center gap-1.5 rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
            Active Identity
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full border border-[#ef4444]/30 bg-[#ef4444]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#ef4444]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
            Offboarded
          </span>
        )}
      </div>

      <div className="p-6">
        {/* Profile: avatar + name + Employee ID */}
        <div className="mb-6 flex items-center gap-5">
          <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-2xl border border-[#22d3ee]/30 bg-[radial-gradient(circle,#1e293b_0%,#0f172a_100%)] shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]">
            <div className="relative h-11 w-11 rounded-full border-2 border-[#22d3ee]">
              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22d3ee]" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[#9ca3af]">
              {harness.category}
            </div>
            <h2 className="mt-0.5 text-xl font-bold leading-tight tracking-tight">
              {harness.name}
            </h2>
            <div className="mt-2 inline-block rounded-md border border-[#22d3ee]/15 bg-[#22d3ee]/5 px-2 py-1 font-mono text-xs text-[#22d3ee]">
              {harness.identity.agentId}
            </div>
          </div>
        </div>

        {/* Governance guardrails */}
        <section className="mb-4 rounded-xl border border-[#1f293d] bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
              Role &amp; permissions
            </span>
            <span className="text-[10px] text-[#22d3ee]">
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
              valueClass="text-[#fbbf24]"
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
              valueClass={active ? "text-[#10b981]" : "text-[#ef4444]"}
            />
          </div>

          {/* Budget usage */}
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-[#9ca3af]">
              <span>Budget used</span>
              <span className="text-[#f3f4f6]">
                {formatCents(d.spentCents)} of {formatCents(d.maxSpendCents)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-[#22d3ee]"
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>

          {/* Scoped actions */}
          <div className="mt-4">
            <div className="mb-1.5 text-[10px] uppercase tracking-wide text-[#9ca3af]">
              Scoped actions
            </div>
            <div className="flex flex-wrap gap-1.5">
              {d.allowedActions.map((a) => (
                <span
                  key={a}
                  className="rounded-md border border-[#334155] bg-[#1e293b] px-2 py-1 font-mono text-[11px] text-[#cbd5e1]"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* Human-approval boundary */}
          {d.deniedActions.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-[10px] uppercase tracking-wide text-[#9ca3af]">
                Always asks you first
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.deniedActions.map((a) => (
                  <span
                    key={a}
                    className="rounded-md border border-[#fbbf24]/20 bg-[#fbbf24]/10 px-2 py-1 font-mono text-[11px] text-[#fbbf24]"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Work record ledger reference */}
        <section className="flex items-center justify-between rounded-xl border border-[#1f293d] border-l-[3px] border-l-[#22d3ee] bg-[linear-gradient(90deg,rgba(34,211,238,0.03)_0%,rgba(0,0,0,0)_100%)] p-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-[#9ca3af]">
              Work record
            </div>
            <div className="mt-1 truncate font-mono text-[11px] text-[#9ca3af]">
              {latestReceiptHash
                ? `${receiptCount} entries · latest ${latestReceiptHash.slice(0, 10)}…`
                : "No work on record yet"}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] uppercase tracking-wide text-[#9ca3af]">
              Audit
            </div>
            <div className="mt-1 text-[11px] font-semibold text-[#22d3ee]">
              Independently verifiable
            </div>
          </div>
        </section>
      </div>

      {/* Offboarding gate footer */}
      <div className="flex items-center justify-between border-t border-[#1f293d] bg-black/25 px-6 py-3.5 text-[11px] text-[#9ca3af]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee]" />
          <span>
            Authorized under account{" "}
            <span className="font-mono text-[#cbd5e1]">
              {shortAccount(harness.authorization)}
            </span>
          </span>
        </div>
        {active ? (
          <RevokeButton harnessId={harness.id} />
        ) : (
          <span>Offboarded · gate closed</span>
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
      <span className="text-[10px] uppercase tracking-wide text-[#9ca3af]">
        {label}
      </span>
      <span className={`text-[13px] font-semibold text-[#f3f4f6] ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
