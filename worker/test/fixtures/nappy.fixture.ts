import type { NappyEntry } from "../../types";

let nappyIdCounter = 1;

const DEFAULT_NOW = "2026-01-01T00:00:00Z";

function nextIdWithOverride(overrideId?: number): number {
  if (overrideId !== undefined) {
    if (overrideId >= nappyIdCounter) {
      nappyIdCounter = overrideId + 1;
    }
    return overrideId;
  }
  return nappyIdCounter++;
}

export function createNappyEntry(
  overrides: Partial<NappyEntry> = {},
): NappyEntry {
  const id = nextIdWithOverride(overrides.id);
  return {
    id,
    type: overrides.type ?? "wet",
    occurred_at: overrides.occurred_at ?? DEFAULT_NOW,
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? DEFAULT_NOW,
    ...overrides,
  };
}

export function resetNappyIdCounter(): void {
  nappyIdCounter = 1;
}
