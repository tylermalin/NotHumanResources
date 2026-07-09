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
import { providerForAction, resolveCredential } from "./connections";
import { createAgent } from "./neus-agents";
import type { DB, InstalledHarness, Run, RunStep } from "./types";

/**
 * Hire an agent. The authorizing receipt is the user's site sign-in credential,
 * already server-confirmed by the route guard; we bind it to the agent here so
 * every hire records which verified account stood behind it.
 */
export async function installHarness(
  slug: string,
  auth: { qHash: string | null; walletAddress: string | null }
): Promise<InstalledHarness> {
  const spec = getCatalogHarness(slug);
  if (!spec) throw new Error(`Unknown harness: ${slug}`);
  const db = await readDB();
  const existing = db.harnesses.find(
    (h) => h.slug === slug && h.status === "active"
  );
  if (existing) return existing;

  const { identity, privateKeyPem } = issueIdentity();
  const delegation = grantDelegation(identity.agentId, spec.delegationPreset);
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
    delegation,
    authorization: {
      qHash: auth.qHash,
      walletAddress: auth.walletAddress,
      authorizedAt: new Date().toISOString(),
    },
  };

  // Register the real NEUS Trusted Agent — writes agent-identity +
  // agent-delegation proofs to the controller's profile, so the scoped actions
  // are an enforceable NEUS delegation. Non-fatal: if NEUS can't complete it
  // (no controller wallet, or a step the session can't sign), we still install
  // with the local identity and log it.
  if (auth.walletAddress) {
    try {
      harness.neusAgent = await createAgent({
        agentId: `nhr-${spec.slug}`,
        controllerWallet: auth.walletAddress,
        agentLabel: spec.name,
        description: spec.description,
        instructions: spec.systemPrompt,
        preset: spec.delegationPreset,
        expiresAt: delegation.expiresAt,
      });
    } catch (err) {
      console.error("[NHR] neus_agent_create failed:", err);
    }
  }

  db.harnesses.push(harness);
  await writeDB(db);
  return harness;
}

/** Resolve the live credential (if any) for an action's provider. */
function credentialFor(db: DB, workspaceId: string, action: string) {
  const provider = providerForAction(action);
  return provider ? resolveCredential(db, workspaceId, provider) : null;
}

export async function runTask(harnessId: string, taskId: string): Promise<Run> {
  const db = await readDB();
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
    // The gate runs BEFORE any execution — always, for every action.
    const gate = checkDelegation(harness, planned.action, tool.costCents);

    let resultSummary: string | null = null;
    let simulated = false;
    if (gate.allowed) {
      const credential = credentialFor(db, harness.workspaceId, planned.action);
      const result = await tool.execute(planned.params, { credential });
      resultSummary = result.summary;
      simulated = result.simulated;
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
      simulated,
    };
    run.steps.push(step);
  }

  db.runs.push(run);
  await writeDB(db);
  return run;
}

/**
 * One-time human approval for a denied step: executes it under an explicit
 * grant and issues a fresh receipt recording the human in the loop. The
 * original denial receipt stays in the chain — approvals never rewrite
 * history.
 */
export async function approveStep(
  runId: string,
  stepIndex: number
): Promise<Run> {
  const db = await readDB();
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
  const credential = credentialFor(db, harness.workspaceId, step.action);
  const result = await tool.execute(step.params, { credential });
  const resultSummary = result.summary;
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
  step.simulated = result.simulated;

  if (run.steps.every((s) => s.decision === "allowed")) {
    run.status = "completed";
  }
  await writeDB(db);
  return run;
}

/** Revoke this harness's identity and delegation. Other harnesses are unaffected. */
export async function revokeHarness(harnessId: string): Promise<void> {
  const db = await readDB();
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
  await writeDB(db);
}
