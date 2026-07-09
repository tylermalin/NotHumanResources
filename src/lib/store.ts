// Persistence behind a two-function interface (readDB/writeDB) so it can be
// swapped without touching the trust layer or the engine.
//
// Dual-mode by environment:
//   • Local dev (no BLOB_READ_WRITE_TOKEN): a JSON file under .data/. Fast,
//     no network, survives restarts.
//   • Vercel (token present): a single PRIVATE Vercel Blob. Serverless
//     filesystems are read-only, so the file store can't persist there.
//
// The blob is PRIVATE on purpose: the DB holds each harness's private signing
// key, so a public URL would let anyone forge receipts. Reads use get() with
// access:"private"; the token authenticates them.
import fs from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
import type { DB } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const BLOB_PATH = "nhr/db.json";
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function defaultDB(): DB {
  return {
    workspace: {
      id: "ws_demo",
      name: "Demo Workspace",
      plan: "team",
      createdAt: new Date().toISOString(),
    },
    harnesses: [],
    receipts: [],
    runs: [],
    connections: [],
  };
}

// Backfill fields added after a store was first written, so older data keeps
// working without a migration step.
function normalize(db: DB): DB {
  db.connections ??= [];
  return db;
}

export async function readDB(): Promise<DB> {
  if (useBlob) {
    const res = await get(BLOB_PATH, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return defaultDB();
    const text = await new Response(res.stream).text();
    return normalize(JSON.parse(text) as DB);
  }
  if (!fs.existsSync(DB_PATH)) return defaultDB();
  return normalize(JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as DB);
}

export async function writeDB(db: DB): Promise<void> {
  if (useBlob) {
    await put(BLOB_PATH, JSON.stringify(db, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

export function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
