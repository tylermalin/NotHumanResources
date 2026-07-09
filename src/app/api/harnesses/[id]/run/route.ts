import { NextRequest, NextResponse } from "next/server";
import { runTask } from "@/lib/engine";

// POST /api/harnesses/:id/run  { taskId }
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const { taskId } = await req.json();
    const run = runTask(id, taskId);
    return NextResponse.json({ runId: run.id, status: run.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Run failed" },
      { status: 400 }
    );
  }
}
