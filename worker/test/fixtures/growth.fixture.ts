import type { GrowthEntry } from "../../types";

let growthIdCounter = 1;

const DEFAULT_NOW = "2026-01-01T00:00:00Z";

function nextIdWithOverride(overrideId?: number): number {
  if (overrideId !== undefined) {
    if (overrideId >= growthIdCounter) {
      growthIdCounter = overrideId + 1;
    }
    return overrideId;
  }
  return growthIdCounter++;
}

export function createGrowthEntry(
  overrides: Partial<GrowthEntry> = {},
): GrowthEntry {
  const id = nextIdWithOverride(overrides.id);
  return {
    id,
    weight_grams: overrides.weight_grams ?? 3500,
    height_mm: overrides.height_mm ?? null,
    measured_at: overrides.measured_at ?? DEFAULT_NOW,
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? DEFAULT_NOW,
    ...overrides,
  };
}

export function resetGrowthIdCounter(): void {
  growthIdCounter = 1;
}
