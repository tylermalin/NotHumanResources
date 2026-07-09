import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { readDB } from "@/lib/store";
import { InstallButton } from "@/components/InstallButton";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const db = await readDB();
  const installedBySlug = new Map(
    db.harnesses.filter((h) => h.status === "active").map((h) => [h.slug, h.id])
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl uppercase tracking-tight">
          Hire an AI worker
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pre-trained, ready on day one. Every hire comes with a verified
          identity, a role scoped to exactly what you allow, and a work record
          you can audit — doing real work in under five minutes.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {catalog.map((h) => {
          const installedId = installedBySlug.get(h.slug);
          return (
            <div
              key={h.slug}
              className="flex flex-col rounded-md border border-hairline bg-surface p-5 transition-colors hover:border-accent/40"
            >
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
                {h.category}
              </div>
              <h2 className="mt-1 font-display text-base uppercase tracking-tight text-ink">
                {h.name}
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted">{h.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {h.integrations.map((i) => (
                  <span
                    key={i}
                    className="rounded-sm border border-log bg-inset px-2 py-0.5 text-[11px] text-ink/70"
                  >
                    {i}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                {installedId ? (
                  <Link
                    href={`/harnesses/${installedId}`}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-accent/30 bg-ghost px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-accent hover:bg-accent/20"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    On your team — open →
                  </Link>
                ) : (
                  <InstallButton slug={h.slug} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
