import { describe, test, expect } from "bun:test";
import {
  cn,
  formatDuration,
  formatTimerDisplay,
  formatTimeSince,
  formatRelativeDay,
  formatTime,
  formatDate,
  formatFrequency,
  getGreeting,
} from "./utils";

describe("cn", () => {
  test("joins class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  test("filters falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  test("returns empty string for no classes", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDuration", () => {
  test("formats seconds only", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  test("formats minutes and seconds", () => {
    expect(formatDuration(125)).toBe("2m 5s");
  });

  test("formats hours and minutes", () => {
    expect(formatDuration(3725)).toBe("1h 2m");
  });

  test("formats zero", () => {
    expect(formatDuration(0)).toBe("0s");
  });
});

describe("formatTimerDisplay", () => {
  test("formats with minutes and seconds", () => {
    expect(formatTimerDisplay(65)).toBe("01:05");
  });

  test("formats with hours", () => {
    expect(formatTimerDisplay(3661)).toBe("01:01:01");
  });

  test("formats zero", () => {
    expect(formatTimerDisplay(0)).toBe("00:00");
  });
});

describe("formatTimeSince", () => {
  test("returns 'Just now' for recent times", () => {
    const now = new Date().toISOString();
    expect(formatTimeSince(now)).toBe("Just now");
  });

  test("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatTimeSince(fiveMinAgo)).toBe("5m ago");
  });

  test("returns hours and minutes ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatTimeSince(twoHoursAgo)).toBe("2h 0m ago");
  });
});

describe("formatRelativeDay", () => {
  test("returns empty string for today", () => {
    const now = new Date().toISOString();
    expect(formatRelativeDay(now)).toBe("");
  });

  test("returns 'Yesterday' for yesterday", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(formatRelativeDay(yesterday)).toBe("Yesterday");
  });

  test("returns days ago for older dates", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(formatRelativeDay(threeDaysAgo)).toBe("3d ago");
  });
});

describe("formatTime", () => {
  test("formats ISO string to HH:MM", () => {
    const result = formatTime("2026-01-15T14:30:00Z");
    // Result depends on timezone, just check format
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("formatDate", () => {
  test("formats date string", () => {
    const result = formatDate("2026-03-23");
    expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
    expect(result).toContain("23");
    expect(result).toContain("Mar");
  });
});

describe("formatFrequency", () => {
  test("returns 'Daily' for 1 day", () => {
    expect(formatFrequency(1)).toBe("Daily");
  });

  test("returns 'Weekly' for 7 days", () => {
    expect(formatFrequency(7)).toBe("Weekly");
  });

  test("returns 'Every N days' for other values", () => {
    expect(formatFrequency(3)).toBe("Every 3 days");
  });
});

describe("getGreeting", () => {
  test("returns a greeting string", () => {
    const result = getGreeting();
    expect(
      ["Good morning", "Good afternoon", "Good evening"].includes(result),
    ).toBe(true);
  });
});
