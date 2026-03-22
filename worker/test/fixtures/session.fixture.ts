import type { Session } from "../../types";

let sessionIdCounter = 1;

const DEFAULT_NOW = "2026-01-01T00:00:00Z";

function nextIdWithOverride(overrideId?: number): number {
  if (overrideId !== undefined) {
    if (overrideId >= sessionIdCounter) {
      sessionIdCounter = overrideId + 1;
    }
    return overrideId;
  }
  return sessionIdCounter++;
}

export function createSessionFixture(
  overrides: Partial<Session> = {},
): Session {
  const id = nextIdWithOverride(overrides.id);
  return {
    id,
    token: overrides.token ?? `token-${id}`,
    expires_at:
      overrides.expires_at ??
      new Date(Date.now() + 30 * 86400000).toISOString(),
    created_at: overrides.created_at ?? DEFAULT_NOW,
    ...overrides,
  };
}

export function resetSessionIdCounter(): void {
  sessionIdCounter = 1;
}
