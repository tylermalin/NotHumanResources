import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo_Black } from "next/font/google";
import Link from "next/link";
import { SessionBadge } from "@/components/neus/SessionBadge";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "(not)Human Resources — your HR department for AI agents",
  description:
    "Hire accountable AI workers — verified identity, a scoped role, and a tamper-evident work record. On the job in under five minutes.",
  metadataBase: new URL("https://nothumanresources.xyz"),
  openGraph: {
    title: "(not)Human Resources",
    description: "Your HR department for AI agents.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-base text-ink font-sans">
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
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-hairline py-4 text-center text-[11px] uppercase tracking-wider text-muted">
          Verified identity · scoped role · tamper-evident work record ·
          nothumanresources.xyz
        </footer>
      </body>
    </html>
  );
}
