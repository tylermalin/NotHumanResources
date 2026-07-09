import { NextRequest, NextResponse } from "next/server";
import { approveStep } from "@/lib/engine";
import { requireEligibility } from "@/lib/neus";

// POST /api/runs/:id/approve  { stepIndex } — one-time human approval for a
// step the delegation gate denied.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireEligibility(req);
    if (!gate.ok) return gate.response;
    const { id } = await ctx.params;
    const { stepIndex } = await req.json();
    const run = await approveStep(id, stepIndex);
    return NextResponse.json({ runId: run.id, status: run.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Approval failed" },
      { status: 400 }
    );
  }
}
