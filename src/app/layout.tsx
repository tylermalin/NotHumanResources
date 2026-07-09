import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo_Black } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
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
  icons: { icon: "/icon.svg" },
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
      <body className="min-h-full flex flex-col bg-void text-ink font-sans">
        <SiteHeader />
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
