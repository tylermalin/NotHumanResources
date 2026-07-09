import { notFound } from "next/navigation";
import { getCatalogHarness } from "@/lib/catalog";
import { readDB } from "@/lib/store";
import { formatCents } from "@/lib/trust";
import { getAction } from "@/lib/tools";
import {
  ApproveStepButton,
  RevokeButton,
  RunTaskButton,
  VerifyChainButton,
} from "@/components/HarnessActions";

export const dynamic = "force-dynamic";

function DecisionBadge({
  decision,
  historical = false,
}: {
  decision: "allowed" | "denied";
  historical?: boolean;
}) {
  return decision === "allowed" ? (
    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      done
    </span>
  ) : (
    <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-400">
      {historical ? "blocked at the gate" : "needs your approval"}
    </span>
  );
}

export default async function HarnessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = readDB();
  const harness = db.harnesses.find((h) => h.id === id);
  if (!harness) notFound();
  const spec = getCatalogHarness(harness.slug);
  const runs = db.runs
    .filter((r) => r.harnessId === id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const receipts = db.receipts
    .filter((r) => r.harnessId === id)
    .sort((a, b) => b.seq - a.seq);
  const d = harness.delegation;
  const active = harness.status === "active";
  const budgetPct = Math.min(
    100,
    Math.round((d.spentCents / d.maxSpendCents) * 100)
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {harness.category}
          </div>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold tracking-tight">
            {harness.name}
            {!active && (
              <span className="rounded-full bg-red-100 dark:bg-red-950 px-2.5 py-0.5 text-sm font-medium text-red-700 dark:text-red-400">
                Offboarded
              </span>
            )}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            {harness.description}
          </p>
          <p className="mt-2 font-mono text-xs text-zinc-400">
            Employee ID: {harness.identity.agentId} · hired{" "}
            {new Date(harness.installedAt).toLocaleDateString()}
          </p>
        </div>
        {active && <RevokeButton harnessId={harness.id} />}
      </div>

      {/* Run a task */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Assign work</h2>
        <div className="space-y-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          {spec?.exampleTasks.map((t) => (
            <RunTaskButton
              key={t.id}
              harnessId={harness.id}
              taskId={t.id}
              taskLabel={t.label}
              disabled={!active}
            />
          ))}
          {!active && (
            <p className="text-sm text-zinc-500">
              This worker has been offboarded and can no longer act. Their
              work record below stays verifiable.
            </p>
          )}
        </div>
      </section>

      {/* Runs */}
      {runs.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent work</h2>
          <div className="space-y-4">
            {runs.map((run) => (
              <div
                key={run.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-medium">{run.taskLabel}</div>
                  <div className="text-xs text-zinc-400">
                    {new Date(run.startedAt).toLocaleString()}
                  </div>
                </div>
                <ol className="space-y-2">
                  {run.steps.map((s) => {
                    const tool = getAction(s.action);
                    return (
                      <li
                        key={s.index}
                        className="flex items-start justify-between gap-4 rounded-md bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">
                              {tool.integration}: {tool.label}
                            </span>
                            <DecisionBadge decision={s.decision} />
                            {s.approvedByHuman && (
                              <span className="text-xs text-zinc-400">
                                approved by you
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-500">
                            {s.decision === "allowed" ? s.resultSummary : s.reason}
                          </div>
                        </div>
                        {s.decision === "denied" && active && (
                          <ApproveStepButton
                            runId={run.id}
                            stepIndex={s.index}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Permissions */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Role &amp; permissions</h2>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                Can do on its own
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.allowedActions.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 font-mono text-xs text-emerald-700 dark:text-emerald-400"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                Always asks you first
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.deniedActions.length === 0 ? (
                  <span className="text-xs text-zinc-400">None</span>
                ) : (
                  d.deniedActions.map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-amber-50 dark:bg-amber-950 px-2 py-0.5 font-mono text-xs text-amber-800 dark:text-amber-400"
                    >
                      {a}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>Monthly budget</span>
              <span>
                {formatCents(d.spentCents)} of {formatCents(d.maxSpendCents)}{" "}
                used
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-zinc-400">
              Permissions expire {new Date(d.expiresAt).toLocaleDateString()}{" "}
              and renew on your approval.
            </div>
          </div>
        </div>
      </section>

      {/* Activity */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Work record</h2>
          <VerifyChainButton harnessId={harness.id} />
        </div>
        {receipts.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No work on record yet. Assign a task above.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                  <th className="px-4 py-2.5 font-medium">Outcome</th>
                  <th className="px-4 py-2.5 font-medium">Detail</th>
                  <th className="px-4 py-2.5 font-medium">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 tabular-nums text-zinc-400">
                      {r.seq}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {r.action}
                    </td>
                    <td className="px-4 py-2.5">
                      <DecisionBadge decision={r.decision} historical />
                    </td>
                    <td className="max-w-xs px-4 py-2.5 text-xs text-zinc-500">
                      {r.decision === "allowed"
                        ? (r.reason ? `${r.reason} — ` : "") +
                          (r.resultSummary ?? "")
                        : r.reason}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {r.hash.slice(0, 10)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-zinc-400">
          Every action — including the ones this worker wasn&apos;t allowed to
          take — is recorded, cryptographically linked to the one before it,
          and verifiable even outside this platform.
        </p>
      </section>
    </div>
  );
}
