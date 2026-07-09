import { NextRequest, NextResponse } from "next/server";
import { installHarness } from "@/lib/engine";

// POST /api/harnesses  { slug } — install a harness from the curated library.
// Identity issuance and delegation grant happen inside installHarness;
// there is no code path that creates a harness without them.
export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    const harness = installHarness(slug);
    return NextResponse.json({ id: harness.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Install failed" },
      { status: 400 }
    );
  }
}
