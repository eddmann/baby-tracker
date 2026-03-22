import { describe, test, expect } from "bun:test";
import { calculateElapsedSeconds } from "../../utils/timer";

describe("calculateElapsedSeconds", () => {
  test("calculates simple elapsed time with no pauses", () => {
    const startedAt = "2026-01-01T00:00:00Z";
    const endedAt = "2026-01-01T01:00:00Z";

    const elapsed = calculateElapsedSeconds(startedAt, [], endedAt);
    expect(elapsed).toBe(3600);
  });

  test("subtracts pause duration", () => {
    const startedAt = "2026-01-01T00:00:00Z";
    const endedAt = "2026-01-01T01:00:00Z";
    const pauses = [
      {
        paused_at: "2026-01-01T00:20:00Z",
        resumed_at: "2026-01-01T00:30:00Z",
      },
    ];

    const elapsed = calculateElapsedSeconds(startedAt, pauses, endedAt);
    // 3600 - 600 = 3000
    expect(elapsed).toBe(3000);
  });

  test("handles multiple pauses", () => {
    const startedAt = "2026-01-01T00:00:00Z";
    const endedAt = "2026-01-01T01:00:00Z";
    const pauses = [
      {
        paused_at: "2026-01-01T00:10:00Z",
        resumed_at: "2026-01-01T00:15:00Z",
      },
      {
        paused_at: "2026-01-01T00:30:00Z",
        resumed_at: "2026-01-01T00:40:00Z",
      },
    ];

    const elapsed = calculateElapsedSeconds(startedAt, pauses, endedAt);
    // 3600 - 300 - 600 = 2700
    expect(elapsed).toBe(2700);
  });

  test("handles open pause (currently paused) using end time", () => {
    const startedAt = "2026-01-01T00:00:00Z";
    const endedAt = "2026-01-01T01:00:00Z";
    const pauses = [
      {
        paused_at: "2026-01-01T00:30:00Z",
        resumed_at: null,
      },
    ];

    const elapsed = calculateElapsedSeconds(startedAt, pauses, endedAt);
    // 3600 - 1800 = 1800
    expect(elapsed).toBe(1800);
  });

  test("returns 0 for negative elapsed", () => {
    const startedAt = "2026-01-01T01:00:00Z";
    const endedAt = "2026-01-01T00:00:00Z";

    const elapsed = calculateElapsedSeconds(startedAt, [], endedAt);
    expect(elapsed).toBe(0);
  });
});
