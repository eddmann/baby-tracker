import { describe, test, expect } from "bun:test";
import { localDateToUtcRange } from "../../lib/timezone";

describe("localDateToUtcRange", () => {
  test("offset 0 (UTC) returns midnight to midnight UTC", () => {
    const { start, end } = localDateToUtcRange("2026-03-22", 0);
    expect(start).toBe("2026-03-22T00:00:00.000Z");
    expect(end).toBe("2026-03-23T00:00:00.000Z");
  });

  test("positive offset (UTC+10) shifts range earlier", () => {
    const { start, end } = localDateToUtcRange("2026-03-22", 600);
    expect(start).toBe("2026-03-21T14:00:00.000Z");
    expect(end).toBe("2026-03-22T14:00:00.000Z");
  });

  test("negative offset (UTC-5) shifts range later", () => {
    const { start, end } = localDateToUtcRange("2026-03-22", -300);
    expect(start).toBe("2026-03-22T05:00:00.000Z");
    expect(end).toBe("2026-03-23T05:00:00.000Z");
  });

  test("offset +5:30 (India) handles non-hour offsets", () => {
    const { start, end } = localDateToUtcRange("2026-03-22", 330);
    expect(start).toBe("2026-03-21T18:30:00.000Z");
    expect(end).toBe("2026-03-22T18:30:00.000Z");
  });

  test("range spans exactly 24 hours", () => {
    const { start, end } = localDateToUtcRange("2026-06-15", 600);
    const diff = new Date(end).getTime() - new Date(start).getTime();
    expect(diff).toBe(86_400_000);
  });
});
