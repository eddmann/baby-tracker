import type { SleepEntry } from "../../types";

let sleepIdCounter = 1;

const DEFAULT_NOW = "2026-01-01T00:00:00Z";

function nextIdWithOverride(overrideId?: number): number {
  if (overrideId !== undefined) {
    if (overrideId >= sleepIdCounter) {
      sleepIdCounter = overrideId + 1;
    }
    return overrideId;
  }
  return sleepIdCounter++;
}

export function createSleepEntry(
  overrides: Partial<SleepEntry> = {},
): SleepEntry {
  const id = nextIdWithOverride(overrides.id);
  return {
    id,
    status: overrides.status ?? "completed",
    started_at: overrides.started_at ?? DEFAULT_NOW,
    ended_at: overrides.ended_at ?? DEFAULT_NOW,
    pauses: overrides.pauses ?? "[]",
    duration_seconds: overrides.duration_seconds ?? 3600,
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? DEFAULT_NOW,
    updated_at: overrides.updated_at ?? DEFAULT_NOW,
    ...overrides,
  };
}

export function resetSleepIdCounter(): void {
  sleepIdCounter = 1;
}
