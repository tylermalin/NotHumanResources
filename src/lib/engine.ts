// Execution engine: install, run, approve, revoke.
//
// The invariant everything else depends on: no tool executes without
// passing checkDelegation() first, and every decision — allowed or denied —
// issues a signed receipt. "Trust before action", enforced in one place.
import { getCatalogHarness } from "./catalog";
import { readDB, uid, writeDB } from "./store";
import {
  checkDelegation,
  grantDelegation,
  issueIdentity,
  issueReceipt,
} from "./trust";
import { getAction } from "./tools";
import type { InstalledHarness, Run, RunStep } from "./types";

export function installHarness(slug: string): InstalledHarness {
  const spec = getCatalogHarness(slug);
  if (!spec) throw new Error(`Unknown harness: ${slug}`);
  const db = readDB();
  const existing = db.harnesses.find(
    (h) => h.slug === slug && h.status === "active"
  );
  if (existing) return existing;

  const { identity, privateKeyPem } = issueIdentity();
  const harness: InstalledHarness = {
    id: uid("hrn"),
    slug: spec.slug,
    name: spec.name,
    category: spec.category,
    description: spec.description,
    workspaceId: db.workspace.id,
    installedAt: new Date().toISOString(),
    status: "active",
    identity,
    privateKeyPem,
    delegation: grantDelegation(identity.agentId, spec.delegationPreset),
  };
  db.harnesses.push(harness);
  writeDB(db);
  return harness;
}

export function runTask(harnessId: string, taskId: string): Run {
  const db = readDB();
  const harness = db.harnesses.find((h) => h.id === harnessId);
  if (!harness) throw new Error("Harness not installed");
  if (harness.status !== "active") {
    throw new Error(
      "This harness has been deactivated — its identity and permissions were revoked"
    );
  }
  const spec = getCatalogHarness(harness.slug);
  const task = spec?.exampleTasks.find((t) => t.id === taskId);
  if (!task) throw new Error("Unknown task");

  const run: Run = {
    id: uid("run"),
    harnessId,
    taskId,
    taskLabel: task.label,
    startedAt: new Date().toISOString(),
    status: "completed",
    steps: [],
  };

  for (const [index, planned] of task.plan.entries()) {
    const tool = getAction(planned.action);
    const gate = checkDelegation(harness, planned.action, tool.costCents);

    let resultSummary: string | null = null;
    if (gate.allowed) {
      resultSummary = tool.simulate(planned.params);
      harness.delegation.spentCents += tool.costCents;
    } else {
      run.status = "completed_with_denials";
    }

    const receipt = issueReceipt(db, harness, {
      runId: run.id,
      action: planned.action,
      paramsSummary: JSON.stringify(planned.params),
      decision: gate.allowed ? "allowed" : "denied",
      reason: gate.reason,
      resultSummary,
      costCents: gate.allowed ? tool.costCents : 0,
    });

    const step: RunStep = {
      index,
      action: planned.action,
      params: planned.params,
      decision: gate.allowed ? "allowed" : "denied",
      reason: gate.reason,
      resultSummary,
      receiptId: receipt.id,
      approvedByHuman: false,
    };
    run.steps.push(step);
  }

  db.runs.push(run);
  writeDB(db);
  return run;
}

/**
 * One-time human approval for a denied step: executes it under an explicit
 * grant and issues a fresh receipt recording the human in the loop. The
 * original denial receipt stays in the chain — approvals never rewrite
 * history.
 */
export function approveStep(runId: string, stepIndex: number): Run {
  const db = readDB();
  const run = db.runs.find((r) => r.id === runId);
  if (!run) throw new Error("Run not found");
  const step = run.steps[stepIndex];
  if (!step || step.decision !== "denied") {
    throw new Error("Step is not awaiting approval");
  }
  const harness = db.harnesses.find((h) => h.id === run.harnessId);
  if (!harness || harness.status === "revoked") {
    throw new Error("Harness is not active");
  }

  const tool = getAction(step.action);
  const resultSummary = tool.simulate(step.params);
  harness.delegation.spentCents += tool.costCents;

  const receipt = issueReceipt(db, harness, {
    runId: run.id,
    action: step.action,
    paramsSummary: JSON.stringify(step.params),
    decision: "allowed",
    reason: "One-time human approval by workspace owner",
    resultSummary,
    costCents: tool.costCents,
  });

  step.decision = "allowed";
  step.reason = "Approved by you";
  step.resultSummary = resultSummary;
  step.receiptId = receipt.id;
  step.approvedByHuman = true;

  if (run.steps.every((s) => s.decision === "allowed")) {
    run.status = "completed";
  }
  writeDB(db);
  return run;
}

/** Revoke this harness's identity and delegation. Other harnesses are unaffected. */
export function revokeHarness(harnessId: string): void {
  const db = readDB();
  const harness = db.harnesses.find((h) => h.id === harnessId);
  if (!harness) throw new Error("Harness not installed");
  harness.status = "revoked";
  harness.identity.status = "revoked";
  harness.delegation.status = "revoked";
  issueReceipt(db, harness, {
    runId: null,
    action: "platform.revoke",
    paramsSummary: "{}",
    decision: "allowed",
    reason: "Identity and delegation revoked by workspace owner",
    resultSummary: "Harness deactivated. It can no longer act.",
    costCents: 0,
  });
  writeDB(db);
}
