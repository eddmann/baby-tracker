import worker from "../../index";
import type { ExecutionContext } from "@cloudflare/workers-types";
import type {
  Env,
  SleepEntry,
  FeedEntry,
  NappyEntry,
  PumpEntry,
  DailyTask,
  DailyTaskCompletion,
} from "../../types";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import {
  createSleepEntry,
  createFeedEntry,
  createNappyEntry,
  createPumpEntry,
  createDailyTask,
  createDailyTaskCompletion,
  resetAllFixtureCounters,
} from "../fixtures";

export async function createHttpEnv(): Promise<Env> {
  resetAllFixtureCounters();
  const env = await createTestD1Env();
  await clearD1Tables(env);

  if (!env.ASSETS) {
    env.ASSETS = {
      fetch: async () => new Response("Not found", { status: 404 }),
    };
  }

  return env;
}

export async function request(
  env: Env,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = new URL(path, "http://localhost");
  const req = new Request(url, init);
  const ctx: ExecutionContext = {
    waitUntil(_promise: Promise<unknown>) {
      void _promise;
    },
    passThroughOnException() {},
  };
  return worker.fetch(req, env, ctx);
}

export async function requestJson<T = unknown>(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<{ res: Response; body: T }> {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }
  const res = await request(env, path, { ...init, headers });
  const body = (await res.json()) as T;
  return { res, body };
}

export async function authenticateWithPin(
  env: Env,
  pin = "1234",
): Promise<string> {
  const { body } = await requestJson<{ data: { token: string } }>(
    env,
    "/api/auth/verify",
    {
      method: "POST",
      body: JSON.stringify({ pin }),
    },
  );
  return body.data.token;
}

export async function insertSleepEntry(
  env: Env,
  options?: Parameters<typeof createSleepEntry>[0],
): Promise<SleepEntry> {
  const entry = createSleepEntry(options);
  await env.DB.prepare(
    `INSERT INTO sleep_entries (id, status, started_at, ended_at, pauses, duration_seconds, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      entry.id,
      entry.status,
      entry.started_at,
      entry.ended_at,
      entry.pauses,
      entry.duration_seconds,
      entry.notes,
      entry.created_at,
      entry.updated_at,
    )
    .run();
  return entry;
}

export async function insertFeedEntry(
  env: Env,
  options?: Parameters<typeof createFeedEntry>[0],
): Promise<FeedEntry> {
  const entry = createFeedEntry(options);
  await env.DB.prepare(
    `INSERT INTO feed_entries (id, type, status, side, started_at, ended_at, pauses, duration_seconds, amount_ml, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      entry.id,
      entry.type,
      entry.status,
      entry.side,
      entry.started_at,
      entry.ended_at,
      entry.pauses,
      entry.duration_seconds,
      entry.amount_ml,
      entry.notes,
      entry.created_at,
      entry.updated_at,
    )
    .run();
  return entry;
}

export async function insertNappyEntry(
  env: Env,
  options?: Parameters<typeof createNappyEntry>[0],
): Promise<NappyEntry> {
  const entry = createNappyEntry(options);
  await env.DB.prepare(
    `INSERT INTO nappy_entries (id, type, occurred_at, notes, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      entry.id,
      entry.type,
      entry.occurred_at,
      entry.notes,
      entry.created_at,
    )
    .run();
  return entry;
}

export async function insertPumpEntry(
  env: Env,
  options?: Parameters<typeof createPumpEntry>[0],
): Promise<PumpEntry> {
  const entry = createPumpEntry(options);
  await env.DB.prepare(
    `INSERT INTO pump_entries (id, status, started_at, ended_at, pauses, duration_seconds, amount_ml, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      entry.id,
      entry.status,
      entry.started_at,
      entry.ended_at,
      entry.pauses,
      entry.duration_seconds,
      entry.amount_ml,
      entry.notes,
      entry.created_at,
      entry.updated_at,
    )
    .run();
  return entry;
}

export async function insertDailyTask(
  env: Env,
  options?: Parameters<typeof createDailyTask>[0],
): Promise<DailyTask> {
  const task = createDailyTask(options);
  await env.DB.prepare(
    `INSERT INTO daily_tasks (id, name, frequency_days, start_date, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      task.id,
      task.name,
      task.frequency_days,
      task.start_date,
      task.created_at,
    )
    .run();
  return task;
}

export async function insertDailyTaskCompletion(
  env: Env,
  options?: Parameters<typeof createDailyTaskCompletion>[0],
): Promise<DailyTaskCompletion> {
  const completion = createDailyTaskCompletion(options);
  await env.DB.prepare(
    `INSERT INTO daily_task_completions (id, task_id, completed_at, created_at)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(
      completion.id,
      completion.task_id,
      completion.completed_at,
      completion.created_at,
    )
    .run();
  return completion;
}
