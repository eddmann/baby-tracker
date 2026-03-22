import { describe, test, beforeEach, expect } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1PumpRepository } from "../../repositories/d1/pump.d1";

describe("D1 PumpRepository", () => {
  let env: Awaited<ReturnType<typeof createTestD1Env>>;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
  });

  test("creates a pump entry with active status", async () => {
    const repo = createD1PumpRepository(env);
    const entry = await repo.create();

    expect(entry.id).toBeGreaterThan(0);
    expect(entry.status).toBe("active");
    expect(entry.ended_at).toBeNull();
    expect(entry.amount_ml).toBeNull();
  });

  test("fetches by id", async () => {
    const repo = createD1PumpRepository(env);
    const created = await repo.create();

    const fetched = await repo.getById(created.id);
    expect(fetched?.id).toBe(created.id);
  });

  test("gets active pump entry", async () => {
    const repo = createD1PumpRepository(env);
    await repo.create();

    const active = await repo.getActive();
    expect(active).not.toBeNull();
    expect(active?.status).toBe("active");
  });

  test("returns null when no active pump", async () => {
    const repo = createD1PumpRepository(env);
    const active = await repo.getActive();
    expect(active).toBeNull();
  });

  test("updates status and fields", async () => {
    const repo = createD1PumpRepository(env);
    const entry = await repo.create();

    const endedAt = new Date().toISOString();
    await repo.update(entry.id, {
      status: "completed",
      ended_at: endedAt,
      duration_seconds: 900,
      amount_ml: 75,
      notes: "good session",
    });

    const updated = await repo.getById(entry.id);
    expect(updated?.status).toBe("completed");
    expect(updated?.duration_seconds).toBe(900);
    expect(updated?.amount_ml).toBe(75);
    expect(updated?.notes).toBe("good session");
  });

  test("lists recent entries", async () => {
    const repo = createD1PumpRepository(env);
    await repo.create();
    await repo.create();

    const entries = await repo.listRecent(10);
    expect(entries).toHaveLength(2);
  });

  test("gets latest completed", async () => {
    const repo = createD1PumpRepository(env);
    const entry = await repo.create();
    const endedAt = new Date().toISOString();
    await repo.update(entry.id, {
      status: "completed",
      ended_at: endedAt,
      duration_seconds: 600,
      amount_ml: 50,
    });

    const latest = await repo.getLatestCompleted();
    expect(latest).not.toBeNull();
    expect(latest?.amount_ml).toBe(50);
  });

  test("deletes an entry", async () => {
    const repo = createD1PumpRepository(env);
    const entry = await repo.create();

    await repo.delete(entry.id);
    const fetched = await repo.getById(entry.id);
    expect(fetched).toBeNull();
  });
});
