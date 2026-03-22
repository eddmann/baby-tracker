import { describe, test, beforeEach, expect } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1ConfigRepository } from "../../repositories/d1/config.d1";

describe("D1 ConfigRepository", () => {
  let env: Awaited<ReturnType<typeof createTestD1Env>>;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
  });

  test("returns null for missing key", async () => {
    const repo = createD1ConfigRepository(env);
    const value = await repo.get("nonexistent");
    expect(value).toBeNull();
  });

  test("sets and gets a value", async () => {
    const repo = createD1ConfigRepository(env);
    await repo.set("pin_hash", "abc123");

    const value = await repo.get("pin_hash");
    expect(value).toBe("abc123");
  });

  test("updates existing value on conflict", async () => {
    const repo = createD1ConfigRepository(env);
    await repo.set("pin_hash", "first");
    await repo.set("pin_hash", "second");

    const value = await repo.get("pin_hash");
    expect(value).toBe("second");
  });
});
