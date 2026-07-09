import { NextRequest, NextResponse } from "next/server";
import { runTask } from "@/lib/engine";
import { requireEligibility } from "@/lib/neus";

// POST /api/harnesses/:id/run  { taskId }
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireEligibility(req);
    if (!gate.ok) return gate.response;
    const { id } = await ctx.params;
    const { taskId } = await req.json();
    const run = await runTask(id, taskId);
    return NextResponse.json({ runId: run.id, status: run.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Run failed" },
      { status: 400 }
    );
  }
}
