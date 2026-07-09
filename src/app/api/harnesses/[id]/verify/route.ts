import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/store";
import { verifyChain } from "@/lib/trust";

// GET /api/harnesses/:id/verify — recompute the full receipt chain:
// hashes, chain links, and ed25519 signatures against the harness's
// public identity key.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const db = await readDB();
  const harness = db.harnesses.find((h) => h.id === id);
  if (!harness) {
    return NextResponse.json({ error: "Harness not found" }, { status: 404 });
  }
  return NextResponse.json(verifyChain(db, harness));
}
