"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SessionBadge } from "@/components/neus/SessionBadge";

// Route-aware chrome: the marketing landing gets the ethereal glass treatment;
// the product console keeps the terminal system.
export function SiteHeader() {
  const marketing = usePathname() === "/";

  if (marketing) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0b10]/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-white/90">
            <Logo iconClassName="h-6 w-6" />
          </Link>
          <div className="flex flex-1 items-center gap-6 text-sm text-white/70">
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
    <header className="relative z-50 border-b border-hairline bg-surface">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3.5">
        <Link href="/" className="text-sm font-semibold tracking-tight text-ink">
          <Logo iconClassName="h-5 w-5" />
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
