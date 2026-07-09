import { NextRequest, NextResponse } from "next/server";
import { revokeHarness } from "@/lib/engine";

// POST /api/harnesses/:id/revoke
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    revokeHarness(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Revoke failed" },
      { status: 400 }
    );
  }
}
