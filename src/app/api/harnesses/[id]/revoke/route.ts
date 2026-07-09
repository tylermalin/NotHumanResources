import { NextRequest, NextResponse } from "next/server";
import { revokeHarness } from "@/lib/engine";
import { requireEligibility } from "@/lib/neus";

// POST /api/harnesses/:id/revoke
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireEligibility(req);
    if (!gate.ok) return gate.response;
    const { id } = await ctx.params;
    await revokeHarness(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Revoke failed" },
      { status: 400 }
    );
  }
}
