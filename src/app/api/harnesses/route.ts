import { NextRequest, NextResponse } from "next/server";
import { installHarness } from "@/lib/engine";
import { requireEligibility } from "@/lib/neus";

// POST /api/harnesses  { slug } — install a harness from the curated library.
// Identity issuance and delegation grant happen inside installHarness;
// there is no code path that creates a harness without them.
export async function POST(req: NextRequest) {
  try {
    const gate = await requireEligibility(req);
    if (!gate.ok) return gate.response;
    const { slug } = await req.json();
    const harness = await installHarness(slug, {
      qHash: gate.qHash,
      walletAddress: gate.walletAddress,
    });
    return NextResponse.json({ id: harness.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Install failed" },
      { status: 400 }
    );
  }
}
