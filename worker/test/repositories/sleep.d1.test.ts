import { describe, test, beforeEach, expect } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1SleepRepository } from "../../repositories/d1/sleep.d1";

describe("D1 SleepRepository", () => {
  let env: Awaited<ReturnType<typeof createTestD1Env>>;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
  });

  test("creates a sleep entry with active status", async () => {
    const repo = createD1SleepRepository(env);
    const entry = await repo.create();

    expect(entry.id).toBeGreaterThan(0);
    expect(entry.status).toBe("active");
    expect(entry.ended_at).toBeNull();
    expect(entry.pauses).toBe("[]");
  });

  test("fetches by id", async () => {
    const repo = createD1SleepRepository(env);
    const created = await repo.create();

    const fetched = await repo.getById(created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.status).toBe("active");
  });

  test("returns null for non-existent id", async () => {
    const repo = createD1SleepRepository(env);
    const fetched = await repo.getById(999);
    expect(fetched).toBeNull();
  });

  test("gets active sleep entry", async () => {
    const repo = createD1SleepRepository(env);
    await repo.create();

    const active = await repo.getActive();
    expect(active).not.toBeNull();
    expect(active?.status).toBe("active");
  });

  test("returns null when no active sleep", async () => {
    const repo = createD1SleepRepository(env);
    const active = await repo.getActive();
    expect(active).toBeNull();
  });

  test("gets paused entry as active", async () => {
    const repo = createD1SleepRepository(env);
    const entry = await repo.create();
    await repo.update(entry.id, { status: "paused" });

    const active = await repo.getActive();
    expect(active).not.toBeNull();
    expect(active?.status).toBe("paused");
  });

  test("updates status and fields", async () => {
    const repo = createD1SleepRepository(env);
    const entry = await repo.create();

    const endedAt = new Date().toISOString();
    await repo.update(entry.id, {
      status: "completed",
      ended_at: endedAt,
      duration_seconds: 3600,
      notes: "good nap",
    });

    const updated = await repo.getById(entry.id);
    expect(updated?.status).toBe("completed");
    expect(updated?.ended_at).toBe(endedAt);
    expect(updated?.duration_seconds).toBe(3600);
    expect(updated?.notes).toBe("good nap");
  });

  test("lists recent entries ordered by started_at desc", async () => {
    const repo = createD1SleepRepository(env);
    await repo.create();
    await repo.create();
    await repo.create();

    const entries = await repo.listRecent(2);
    expect(entries).toHaveLength(2);
  });

  test("gets latest completed entry", async () => {
    const repo = createD1SleepRepository(env);
    const entry = await repo.create();
    const endedAt = new Date().toISOString();
    await repo.update(entry.id, {
      status: "completed",
      ended_at: endedAt,
      duration_seconds: 1800,
    });

    const latest = await repo.getLatestCompleted();
    expect(latest).not.toBeNull();
    expect(latest?.id).toBe(entry.id);
    expect(latest?.status).toBe("completed");
  });

  test("deletes an entry", async () => {
    const repo = createD1SleepRepository(env);
    const entry = await repo.create();

    await repo.delete(entry.id);
    const fetched = await repo.getById(entry.id);
    expect(fetched).toBeNull();
  });
});
