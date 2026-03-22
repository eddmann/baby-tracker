import type { PumpEntry } from "../../types";

let pumpIdCounter = 1;

const DEFAULT_NOW = "2026-01-01T00:00:00Z";

function nextIdWithOverride(overrideId?: number): number {
  if (overrideId !== undefined) {
    if (overrideId >= pumpIdCounter) {
      pumpIdCounter = overrideId + 1;
    }
    return overrideId;
  }
  return pumpIdCounter++;
}

export function createPumpEntry(
  overrides: Partial<PumpEntry> = {},
): PumpEntry {
  const id = nextIdWithOverride(overrides.id);
  return {
    id,
    status: overrides.status ?? "completed",
    started_at: overrides.started_at ?? DEFAULT_NOW,
    ended_at: overrides.ended_at ?? DEFAULT_NOW,
    pauses: overrides.pauses ?? "[]",
    duration_seconds: overrides.duration_seconds ?? 1200,
    amount_ml: overrides.amount_ml ?? 60,
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? DEFAULT_NOW,
    updated_at: overrides.updated_at ?? DEFAULT_NOW,
    ...overrides,
  };
}

export function resetPumpIdCounter(): void {
  pumpIdCounter = 1;
}
