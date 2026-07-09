import { NextRequest, NextResponse } from "next/server";
import { approveStep } from "@/lib/engine";

// POST /api/runs/:id/approve  { stepIndex } — one-time human approval for a
// step the delegation gate denied.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const { stepIndex } = await req.json();
    const run = approveStep(id, stepIndex);
    return NextResponse.json({ runId: run.id, status: run.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Approval failed" },
      { status: 400 }
    );
  }
}
