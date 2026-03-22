import type { FeedEntry } from "../../types";

let feedIdCounter = 1;

const DEFAULT_NOW = "2026-01-01T00:00:00Z";

function nextIdWithOverride(overrideId?: number): number {
  if (overrideId !== undefined) {
    if (overrideId >= feedIdCounter) {
      feedIdCounter = overrideId + 1;
    }
    return overrideId;
  }
  return feedIdCounter++;
}

export function createFeedEntry(
  overrides: Partial<FeedEntry> = {},
): FeedEntry {
  const id = nextIdWithOverride(overrides.id);
  return {
    id,
    type: overrides.type ?? "breast",
    status: overrides.status ?? "completed",
    side: overrides.side ?? "left",
    started_at: overrides.started_at ?? DEFAULT_NOW,
    ended_at: overrides.ended_at ?? DEFAULT_NOW,
    pauses: overrides.pauses ?? "[]",
    duration_seconds: overrides.duration_seconds ?? 900,
    amount_ml: overrides.amount_ml ?? null,
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? DEFAULT_NOW,
    updated_at: overrides.updated_at ?? DEFAULT_NOW,
    ...overrides,
  };
}

export function resetFeedIdCounter(): void {
  feedIdCounter = 1;
}
