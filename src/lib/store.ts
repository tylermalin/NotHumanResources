// File-backed JSON store. Deliberately boring: v1 prototype persistence
// behind a two-function interface (readDB/writeDB) so it can be swapped for
// Postgres without touching the trust layer or the engine.
import fs from "node:fs";
import path from "node:path";
import type { DB } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

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
  };
}

export function readDB(): DB {
  if (!fs.existsSync(DB_PATH)) {
    return defaultDB();
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as DB;
}

export function writeDB(db: DB): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

export function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
