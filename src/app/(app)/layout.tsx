import { AccountGate } from "@/components/neus/AccountGate";

// Everything inside this group — hiring, the team roster, worker profiles —
// sits behind NEUS account setup. The landing page at "/" stays public.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountGate>{children}</AccountGate>;
}
