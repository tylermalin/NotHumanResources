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
        <h1 className="text-2xl font-semibold tracking-tight">
          Hire an AI worker
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
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
              className="flex flex-col rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {h.category}
              </div>
              <h2 className="mt-1 font-semibold">{h.name}</h2>
              <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                {h.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {h.integrations.map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400"
                  >
                    {i}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                {installedId ? (
                  <Link
                    href={`/harnesses/${installedId}`}
                    className="inline-block rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
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
