import { NextRequest, NextResponse } from "next/server";
import { resolveHarnessAgent } from "@/lib/engine";
import { requireEligibility } from "@/lib/neus";

// POST /api/harnesses/:id/sync-agent — after the controller finished the hosted
// NEUS agent setup, resolve the agent and move it from pending to live.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireEligibility(req);
    if (!gate.ok) return gate.response;
    const { id } = await ctx.params;
    const harness = await resolveHarnessAgent(id);
    return NextResponse.json({ ready: Boolean(harness.neusAgent) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 400 }
    );
  }
}
