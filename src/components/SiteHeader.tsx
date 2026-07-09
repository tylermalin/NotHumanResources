"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionBadge } from "@/components/neus/SessionBadge";

// Route-aware chrome: the marketing landing gets the ethereal glass treatment;
// the product console keeps the terminal system.
export function SiteHeader() {
  const marketing = usePathname() === "/";

  if (marketing) {
    return (
      <header className="border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white"
          >
            <span className="text-emerald-300/90">(!)</span>
            <span>(not)Human Resources</span>
          </Link>
          <div className="flex flex-1 items-center gap-6 text-sm text-white/50">
            <Link href="/how-it-works" className="hover:text-white">
              How it works
            </Link>
            <Link href="/hire" className="hover:text-white">
              Hire
            </Link>
            <Link href="/workspace" className="hover:text-white">
              Roster
            </Link>
            <span className="ml-auto">
              <SessionBadge />
            </span>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="border-b border-hairline bg-surface">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.12em]"
        >
          <span className="text-accent">(!)</span>
          <span>
            <span className="text-accent">(not)</span>Human Resources
          </span>
        </Link>
        <div className="flex flex-1 items-center gap-5 text-xs uppercase tracking-wider text-muted">
          <Link href="/how-it-works" className="hover:text-ink">
            How it works
          </Link>
          <Link href="/hire" className="hover:text-ink">
            Hire
          </Link>
          <Link href="/workspace" className="hover:text-ink">
            Roster
          </Link>
          <span className="ml-auto normal-case tracking-normal">
            <SessionBadge />
          </span>
        </div>
      </nav>
    </header>
  );
}
