import { describe, test, beforeEach, expect } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1FeedRepository } from "../../repositories/d1/feed.d1";

describe("D1 FeedRepository", () => {
  let env: Awaited<ReturnType<typeof createTestD1Env>>;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
  });

  test("creates a breast feed with active status", async () => {
    const repo = createD1FeedRepository(env);
    const entry = await repo.createBreast("left");

    expect(entry.type).toBe("breast");
    expect(entry.status).toBe("active");
    expect(entry.side).toBe("left");
    expect(entry.amount_ml).toBeNull();
  });

  test("creates an instant formula feed as completed", async () => {
    const repo = createD1FeedRepository(env);
    const entry = await repo.createInstant("formula", 120, "test note");

    expect(entry.type).toBe("formula");
    expect(entry.status).toBe("completed");
    expect(entry.amount_ml).toBe(120);
    expect(entry.notes).toBe("test note");
    expect(entry.side).toBeNull();
  });

  test("creates an instant expressed feed", async () => {
    const repo = createD1FeedRepository(env);
    const entry = await repo.createInstant("expressed", 80);

    expect(entry.type).toBe("expressed");
    expect(entry.status).toBe("completed");
    expect(entry.amount_ml).toBe(80);
  });

  test("fetches by id", async () => {
    const repo = createD1FeedRepository(env);
    const created = await repo.createBreast("right");

    const fetched = await repo.getById(created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.side).toBe("right");
  });

  test("gets active feed", async () => {
    const repo = createD1FeedRepository(env);
    await repo.createBreast("left");

    const active = await repo.getActive();
    expect(active).not.toBeNull();
    expect(active?.type).toBe("breast");
  });

  test("returns null when no active feed", async () => {
    const repo = createD1FeedRepository(env);
    const active = await repo.getActive();
    expect(active).toBeNull();
  });

  test("does not return completed feeds as active", async () => {
    const repo = createD1FeedRepository(env);
    await repo.createInstant("formula", 100);

    const active = await repo.getActive();
    expect(active).toBeNull();
  });

  test("updates feed entry", async () => {
    const repo = createD1FeedRepository(env);
    const entry = await repo.createBreast("left");

    const endedAt = new Date().toISOString();
    await repo.update(entry.id, {
      status: "completed",
      ended_at: endedAt,
      duration_seconds: 600,
      notes: "fed well",
    });

    const updated = await repo.getById(entry.id);
    expect(updated?.status).toBe("completed");
    expect(updated?.duration_seconds).toBe(600);
    expect(updated?.notes).toBe("fed well");
  });

  test("lists recent entries", async () => {
    const repo = createD1FeedRepository(env);
    await repo.createInstant("formula", 100);
    await repo.createInstant("expressed", 80);
    await repo.createBreast("left");

    const entries = await repo.listRecent(10);
    expect(entries).toHaveLength(3);
  });

  test("gets latest completed", async () => {
    const repo = createD1FeedRepository(env);
    await repo.createInstant("formula", 100);

    const latest = await repo.getLatestCompleted();
    expect(latest).not.toBeNull();
    expect(latest?.type).toBe("formula");
  });

  test("deletes an entry", async () => {
    const repo = createD1FeedRepository(env);
    const entry = await repo.createBreast("left");

    await repo.delete(entry.id);
    const fetched = await repo.getById(entry.id);
    expect(fetched).toBeNull();
  });
});
