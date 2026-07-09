"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trustedFetch } from "./neus/session";

/**
 * Drives the hosted NEUS agent-setup fallback: opens the hosted verify URL for
 * the controller to sign identity + delegation, then syncs the finished agent
 * back into the harness.
 */
export function FinishNeusSetup({
  harnessId,
  hostedVerifyUrl,
}: {
  harnessId: string;
  hostedVerifyUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function openHosted() {
    const url = new URL(hostedVerifyUrl);
    url.searchParams.set("returnUrl", window.location.href);
    window.open(url.toString(), "_blank", "noopener");
    setNote("Finish signing on NEUS, then Sync.");
  }

  async function sync() {
    setBusy(true);
    setNote(null);
    const res = await trustedFetch(`/api/harnesses/${harnessId}/sync-agent`, {
      method: "POST",
    });
    const body = (await res.json().catch(() => ({}))) as { ready?: boolean };
    setBusy(false);
    if (body.ready) router.refresh();
    else setNote("Not on NEUS yet — finish signing, then Sync again.");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={openHosted}
        className="rounded-sm border border-accent/40 bg-ghost px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-accent hover:bg-accent/20"
      >
        Finish setup on NEUS →
      </button>
      <button
        onClick={sync}
        disabled={busy}
        className="rounded-sm border border-hairline px-2.5 py-1 text-xs font-medium uppercase tracking-wide hover:bg-inset disabled:opacity-40"
      >
        {busy ? "Syncing…" : "Sync"}
      </button>
      {note && <span className="text-[11px] text-muted">{note}</span>}
    </div>
  );
}

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
        className="rounded-sm bg-accent px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-base hover:bg-accent-press disabled:opacity-40"
      >
        {busy ? "On it…" : `Assign: ${taskLabel}`}
      </button>
      {error && <span className="text-sm text-fault">{error}</span>}
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
      className="rounded-sm border border-pending/40 bg-pending/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-pending hover:bg-pending/20 disabled:opacity-40"
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
      className="rounded-sm border border-fault/40 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-fault hover:bg-fault/10 disabled:opacity-40"
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
        className="rounded-sm border border-hairline px-3 py-1.5 text-xs font-medium uppercase tracking-wide hover:bg-inset disabled:opacity-40"
      >
        {busy ? "Verifying…" : "Verify work record"}
      </button>
      {result && (
        <span
          className={`text-sm ${valid ? "text-accent" : "text-fault"}`}
        >
          {valid ? "✓ " : "✗ "}
          {result}
        </span>
      )}
    </div>
  );
}
