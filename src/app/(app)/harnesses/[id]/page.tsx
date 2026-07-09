import { notFound } from "next/navigation";
import { getCatalogHarness } from "@/lib/catalog";
import { readDB } from "@/lib/store";
import { getAction } from "@/lib/tools";
import { AgentIdCard } from "@/components/AgentIdCard";
import {
  ApproveStepButton,
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
    <span className="rounded-sm border border-accent/25 bg-ghost px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent">
      done
    </span>
  ) : (
    <span className="rounded-sm border border-pending/25 bg-pending/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-pending">
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
  const db = await readDB();
  const harness = db.harnesses.find((h) => h.id === id);
  if (!harness) notFound();
  const spec = getCatalogHarness(harness.slug);
  const runs = db.runs
    .filter((r) => r.harnessId === id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const receipts = db.receipts
    .filter((r) => r.harnessId === id)
    .sort((a, b) => b.seq - a.seq);
  const active = harness.status === "active";

  return (
    <div className="space-y-10">
      {/* Verifiable identity card */}
      <AgentIdCard
        harness={harness}
        latestReceiptHash={receipts[0]?.hash ?? null}
        receiptCount={receipts.length}
      />
      <p className="-mt-4 max-w-2xl text-sm text-muted">
        {harness.description}
      </p>

      {/* Run a task */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">
          Assign work
        </h2>
        <div className="space-y-3 rounded-md border border-hairline bg-surface p-5">
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
            <p className="text-sm text-muted">
              This worker has been offboarded and can no longer act. Their
              work record below stays verifiable.
            </p>
          )}
        </div>
      </section>

      {/* Runs */}
      {runs.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Recent work
          </h2>
          <div className="space-y-4">
            {runs.map((run) => (
              <div
                key={run.id}
                className="rounded-md border border-hairline bg-surface p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-medium text-ink">{run.taskLabel}</div>
                  <div className="font-mono text-xs text-muted">
                    {new Date(run.startedAt).toLocaleString()}
                  </div>
                </div>
                <ol className="space-y-2">
                  {run.steps.map((s) => {
                    const tool = getAction(s.action);
                    return (
                      <li
                        key={s.index}
                        className="flex items-start justify-between gap-4 rounded-sm border border-hairline bg-inset/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-ink">
                              {tool.integration}: {tool.label}
                            </span>
                            <DecisionBadge decision={s.decision} />
                            {s.decision === "allowed" && !s.simulated && (
                              <span className="rounded-sm border border-accent/25 bg-ghost px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                                Live
                              </span>
                            )}
                            {s.approvedByHuman && (
                              <span className="text-xs text-muted">
                                approved by you
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-muted">
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

      {/* Activity */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Work record
          </h2>
          <VerifyChainButton harnessId={harness.id} />
        </div>
        {receipts.length === 0 ? (
          <p className="text-sm text-muted">
            No work on record yet. Assign a task above.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-hairline text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                  <th className="px-4 py-2.5 font-medium">Outcome</th>
                  <th className="px-4 py-2.5 font-medium">Detail</th>
                  <th className="px-4 py-2.5 font-medium">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-muted">
                      {r.seq}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink/80">
                      {r.action}
                    </td>
                    <td className="px-4 py-2.5">
                      <DecisionBadge decision={r.decision} historical />
                    </td>
                    <td className="max-w-xs px-4 py-2.5 text-xs text-muted">
                      {r.decision === "allowed"
                        ? (r.reason ? `${r.reason} — ` : "") +
                          (r.resultSummary ?? "")
                        : r.reason}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted">
                      {r.hash.slice(0, 10)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          Every action — including the ones this worker wasn&apos;t allowed to
          take — is recorded, cryptographically linked to the one before it,
          and verifiable even outside this platform.
        </p>
      </section>
    </div>
  );
}
