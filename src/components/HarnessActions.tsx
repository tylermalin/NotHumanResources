"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trustedFetch } from "./neus/session";

export function RunTaskButton({
  harnessId,
  taskId,
  taskLabel,
  disabled,
}: {
  harnessId: string;
  taskId: string;
  taskLabel: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const res = await trustedFetch(`/api/harnesses/${harnessId}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Run failed");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={busy || disabled}
        className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50"
      >
        {busy ? "On it…" : `Assign: ${taskLabel}`}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}

export function ApproveStepButton({
  runId,
  stepIndex,
}: {
  runId: string;
  stepIndex: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    await trustedFetch(`/api/runs/${runId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepIndex }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={approve}
      disabled={busy}
      className="rounded-md border border-amber-400 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 disabled:opacity-50"
    >
      {busy ? "Approving…" : "Approve & run"}
    </button>
  );
}

export function RevokeButton({ harnessId }: { harnessId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function revoke() {
    if (
      !window.confirm(
        "Offboard this worker? They immediately lose all permissions and can no longer act. Their work record is preserved."
      )
    ) {
      return;
    }
    setBusy(true);
    await trustedFetch(`/api/harnesses/${harnessId}/revoke`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={revoke}
      disabled={busy}
      className="rounded-md border border-red-300 dark:border-red-900 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
    >
      {busy ? "Offboarding…" : "Offboard"}
    </button>
  );
}

export function VerifyChainButton({ harnessId }: { harnessId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  async function verifyAll() {
    setBusy(true);
    const res = await fetch(`/api/harnesses/${harnessId}/verify`);
    const v = await res.json();
    setBusy(false);
    setValid(v.valid);
    setResult(
      v.valid
        ? `All ${v.checked} records verified — signatures and chain intact`
        : `Verification FAILED at record #${v.firstInvalidSeq}: ${v.error}`
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={verifyAll}
        disabled={busy}
        className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
      >
        {busy ? "Verifying…" : "Verify work record"}
      </button>
      {result && (
        <span
          className={`text-sm ${valid ? "text-emerald-600" : "text-red-600"}`}
        >
          {valid ? "✓ " : "✗ "}
          {result}
        </span>
      )}
    </div>
  );
}
