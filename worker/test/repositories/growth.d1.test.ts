import { describe, test, beforeEach, expect } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1GrowthRepository } from "../../repositories/d1/growth.d1";

describe("D1 GrowthRepository", () => {
  let env: Awaited<ReturnType<typeof createTestD1Env>>;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
  });

  test("creates a weight-only entry", async () => {
    const repo = createD1GrowthRepository(env);
    const entry = await repo.create(3500, null);

    expect(entry.id).toBeGreaterThan(0);
    expect(entry.weight_grams).toBe(3500);
    expect(entry.height_mm).toBeNull();
    expect(entry.notes).toBeNull();
  });

  test("creates a height-only entry", async () => {
    const repo = createD1GrowthRepository(env);
    const entry = await repo.create(null, 520);

    expect(entry.weight_grams).toBeNull();
    expect(entry.height_mm).toBe(520);
  });

  test("creates an entry with both weight and height", async () => {
    const repo = createD1GrowthRepository(env);
    const entry = await repo.create(4300, 550, undefined, "Day 36 weigh-in");

    expect(entry.weight_grams).toBe(4300);
    expect(entry.height_mm).toBe(550);
    expect(entry.notes).toBe("Day 36 weigh-in");
  });

  test("creates an entry with custom measured_at", async () => {
    const repo = createD1GrowthRepository(env);
    const measuredAt = "2026-03-01T10:00:00.000Z";
    const entry = await repo.create(3500, null, measuredAt);

    expect(entry.measured_at).toBe(measuredAt);
  });

  test("fetches by id", async () => {
    const repo = createD1GrowthRepository(env);
    const created = await repo.create(3500, null);

    const fetched = await repo.getById(created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.weight_grams).toBe(3500);
  });

  test("returns null for non-existent id", async () => {
    const repo = createD1GrowthRepository(env);
    const fetched = await repo.getById(999);
    expect(fetched).toBeNull();
  });

  test("lists recent entries ordered by measured_at desc", async () => {
    const repo = createD1GrowthRepository(env);
    await repo.create(3500, null, "2026-01-01T00:00:00.000Z");
    await repo.create(3800, null, "2026-01-08T00:00:00.000Z");
    await repo.create(4000, null, "2026-01-15T00:00:00.000Z");

    const entries = await repo.listRecent(2);
    expect(entries).toHaveLength(2);
    expect(entries[0].weight_grams).toBe(4000);
    expect(entries[1].weight_grams).toBe(3800);
  });

  test("gets latest entry", async () => {
    const repo = createD1GrowthRepository(env);
    await repo.create(3500, null, "2026-01-01T00:00:00.000Z");
    await repo.create(3800, null, "2026-01-08T00:00:00.000Z");

    const latest = await repo.getLatest();
    expect(latest).not.toBeNull();
    expect(latest?.weight_grams).toBe(3800);
  });

  test("returns null for latest when empty", async () => {
    const repo = createD1GrowthRepository(env);
    const latest = await repo.getLatest();
    expect(latest).toBeNull();
  });

  test("updates an entry", async () => {
    const repo = createD1GrowthRepository(env);
    const entry = await repo.create(3500, null);

    await repo.update(entry.id, { weight_grams: 3600, notes: "updated" });
    const fetched = await repo.getById(entry.id);
    expect(fetched?.weight_grams).toBe(3600);
    expect(fetched?.notes).toBe("updated");
  });

  test("deletes an entry", async () => {
    const repo = createD1GrowthRepository(env);
    const entry = await repo.create(3500, null);

    await repo.delete(entry.id);
    const fetched = await repo.getById(entry.id);
    expect(fetched).toBeNull();
  });
});
