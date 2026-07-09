import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "(not)Human Resources — your HR department for AI agents",
  description:
    "Hire accountable AI workers — verified identity, a scoped role, and a tamper-evident work record. On the job in under five minutes.",
  metadataBase: new URL("https://nothumanresources.xyz"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              <span className="text-zinc-400">(not)</span>Human Resources
            </Link>
            <div className="flex flex-1 items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <Link
                href="/hire"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Hire
              </Link>
              <Link
                href="/workspace"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Your team
              </Link>
              <span className="ml-auto">
                <SessionBadge />
              </span>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 text-center text-xs text-zinc-400">
          Every worker has a verified identity, a scoped role, and a
          tamper-evident work record. · nothumanresources.xyz
        </footer>
      </body>
    </html>
  );
}
