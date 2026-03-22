import { describe, test, beforeEach, expect } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1SessionRepository } from "../../repositories/d1/session.d1";

describe("D1 SessionRepository", () => {
  let env: Awaited<ReturnType<typeof createTestD1Env>>;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
  });

  test("creates a session and fetches by token", async () => {
    const repo = createD1SessionRepository(env);
    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    await repo.create("test-token", expiresAt);

    const session = await repo.getByToken("test-token");
    expect(session).not.toBeNull();
    expect(session?.token).toBe("test-token");
  });

  test("returns null for expired session", async () => {
    const repo = createD1SessionRepository(env);
    const expiredAt = new Date(Date.now() - 86400000).toISOString();
    await repo.create("expired-token", expiredAt);

    const session = await repo.getByToken("expired-token");
    expect(session).toBeNull();
  });

  test("returns null for non-existent token", async () => {
    const repo = createD1SessionRepository(env);
    const session = await repo.getByToken("missing");
    expect(session).toBeNull();
  });

  test("deletes a session", async () => {
    const repo = createD1SessionRepository(env);
    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    await repo.create("del-token", expiresAt);

    await repo.delete("del-token");
    const session = await repo.getByToken("del-token");
    expect(session).toBeNull();
  });
});
