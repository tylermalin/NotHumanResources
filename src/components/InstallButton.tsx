"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trustedFetch } from "./neus/session";

export function InstallButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function install() {
    setBusy(true);
    const res = await trustedFetch("/api/harnesses", {
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
      className="rounded-sm bg-accent px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-base hover:bg-accent-press disabled:opacity-40"
    >
      {busy ? "Onboarding…" : "Hire"}
    </button>
  );
}
