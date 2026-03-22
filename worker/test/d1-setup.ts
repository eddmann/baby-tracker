import { getPlatformProxy } from "wrangler/wrangler-dist/cli.js";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Env } from "../types";

let proxy: Awaited<ReturnType<typeof getPlatformProxy<Env>>> | null = null;
let migrationsApplied = false;

async function applyMigrations(env: Env): Promise<void> {
  const migrationsDir = join(process.cwd(), "migrations");
  const migrations = readdirSync(migrationsDir)
    .filter((f: string) => f.endsWith(".sql") && !f.includes("seed"))
    .sort();

  for (const file of migrations) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    const statements = sql
      .split(";")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    for (const stmt of statements) {
      try {
        await env.DB.prepare(stmt).run();
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const isIgnorable =
          message.includes("already exists") ||
          message.includes("duplicate column name") ||
          message.includes("duplicate index name");
        if (!isIgnorable) {
          throw e;
        }
      }
    }
  }
}

export async function createTestD1Env(): Promise<Env> {
  if (!proxy) {
    proxy = await getPlatformProxy<Env>();
  }

  if (!migrationsApplied) {
    await applyMigrations(proxy.env);
    migrationsApplied = true;
  }

  return proxy.env;
}

export async function clearD1Tables(env: Env): Promise<void> {
  const tables = [
    "daily_task_completions",
    "daily_tasks",
    "pump_entries",
    "nappy_entries",
    "feed_entries",
    "sleep_entries",
    "sessions",
    "config",
  ];

  for (const table of tables) {
    await env.DB.prepare(`DELETE FROM ${table}`).run();
  }
}

export async function execSQL(env: Env, sql: string): Promise<void> {
  const statements = sql
    .split(";")
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);

  for (const stmt of statements) {
    await env.DB.prepare(stmt).run();
  }
}

export async function cleanupProxy(): Promise<void> {
  if (proxy) {
    await proxy.dispose();
    proxy = null;
    migrationsApplied = false;
  }
}
