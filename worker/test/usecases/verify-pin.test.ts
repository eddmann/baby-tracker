import { describe, test, expect } from "bun:test";
import { verifyPinUseCase } from "../../usecases/verify-pin.usecase";
import type { ConfigRepository } from "../../repositories/interfaces/config.repository";
import type { SessionRepository } from "../../repositories/interfaces/session.repository";
import type { Session } from "../../types";

function createMemoryConfigRepo(): ConfigRepository & {
  store: Map<string, string>;
} {
  const store = new Map<string, string>();
  return {
    store,
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function createMemorySessionRepo(): SessionRepository & {
  sessions: Session[];
} {
  const sessions: Session[] = [];
  let idCounter = 1;
  return {
    sessions,
    async create(token: string, expiresAt: string) {
      sessions.push({
        id: idCounter++,
        token,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });
    },
    async getByToken(token: string) {
      return sessions.find((s) => s.token === token) ?? null;
    },
    async delete(token: string) {
      const idx = sessions.findIndex((s) => s.token === token);
      if (idx !== -1) sessions.splice(idx, 1);
    },
  };
}

describe("verifyPinUseCase", () => {
  test("sets PIN on first use and returns token", async () => {
    const configRepo = createMemoryConfigRepo();
    const sessionRepo = createMemorySessionRepo();

    const result = await verifyPinUseCase(
      { configRepository: configRepo, sessionRepository: sessionRepo },
      { pin: "1234" },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.token.length).toBeGreaterThan(0);
    }
    expect(configRepo.store.has("pin_hash")).toBe(true);
    expect(sessionRepo.sessions).toHaveLength(1);
  });

  test("accepts correct PIN on subsequent use", async () => {
    const configRepo = createMemoryConfigRepo();
    const sessionRepo = createMemorySessionRepo();

    // First call sets the PIN
    await verifyPinUseCase(
      { configRepository: configRepo, sessionRepository: sessionRepo },
      { pin: "5678" },
    );

    // Second call with same PIN
    const result = await verifyPinUseCase(
      { configRepository: configRepo, sessionRepository: sessionRepo },
      { pin: "5678" },
    );

    expect(result.ok).toBe(true);
    expect(sessionRepo.sessions).toHaveLength(2);
  });

  test("rejects incorrect PIN", async () => {
    const configRepo = createMemoryConfigRepo();
    const sessionRepo = createMemorySessionRepo();

    // Set PIN
    await verifyPinUseCase(
      { configRepository: configRepo, sessionRepository: sessionRepo },
      { pin: "1234" },
    );

    // Wrong PIN
    const result = await verifyPinUseCase(
      { configRepository: configRepo, sessionRepository: sessionRepo },
      { pin: "0000" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
      expect(result.error.message).toBe("Invalid PIN");
    }
    // Should not have created a third session
    expect(sessionRepo.sessions).toHaveLength(1);
  });
});
