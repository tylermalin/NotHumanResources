"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InstallButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function install() {
    setBusy(true);
    const res = await fetch("/api/harnesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setBusy(false);
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/harnesses/${id}`);
      router.refresh();
    }
  }

  return (
    <button
      onClick={install}
      disabled={busy}
      className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50"
    >
      {busy ? "Onboarding…" : "Hire"}
    </button>
  );
}
