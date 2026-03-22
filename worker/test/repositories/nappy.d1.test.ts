import { describe, test, beforeEach, expect } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1NappyRepository } from "../../repositories/d1/nappy.d1";

describe("D1 NappyRepository", () => {
  let env: Awaited<ReturnType<typeof createTestD1Env>>;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
  });

  test("creates a wet nappy entry", async () => {
    const repo = createD1NappyRepository(env);
    const entry = await repo.create("wet");

    expect(entry.id).toBeGreaterThan(0);
    expect(entry.type).toBe("wet");
    expect(entry.notes).toBeNull();
  });

  test("creates a dirty nappy with notes", async () => {
    const repo = createD1NappyRepository(env);
    const entry = await repo.create("dirty", "after feed");

    expect(entry.type).toBe("dirty");
    expect(entry.notes).toBe("after feed");
  });

  test("creates a both nappy", async () => {
    const repo = createD1NappyRepository(env);
    const entry = await repo.create("both");

    expect(entry.type).toBe("both");
  });

  test("fetches by id", async () => {
    const repo = createD1NappyRepository(env);
    const created = await repo.create("wet");

    const fetched = await repo.getById(created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.type).toBe("wet");
  });

  test("returns null for non-existent id", async () => {
    const repo = createD1NappyRepository(env);
    const fetched = await repo.getById(999);
    expect(fetched).toBeNull();
  });

  test("lists recent entries ordered by occurred_at desc", async () => {
    const repo = createD1NappyRepository(env);
    await repo.create("wet");
    await repo.create("dirty");
    await repo.create("both");

    const entries = await repo.listRecent(2);
    expect(entries).toHaveLength(2);
  });

  test("gets latest entry", async () => {
    const repo = createD1NappyRepository(env);
    await repo.create("wet");
    await repo.create("dirty");

    const latest = await repo.getLatest();
    expect(latest).not.toBeNull();
    expect(latest?.type).toBe("dirty");
  });

  test("returns null for latest when empty", async () => {
    const repo = createD1NappyRepository(env);
    const latest = await repo.getLatest();
    expect(latest).toBeNull();
  });

  test("deletes an entry", async () => {
    const repo = createD1NappyRepository(env);
    const entry = await repo.create("wet");

    await repo.delete(entry.id);
    const fetched = await repo.getById(entry.id);
    expect(fetched).toBeNull();
  });
});
