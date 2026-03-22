import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  authenticateWithPin,
  insertSleepEntry,
  insertFeedEntry,
  insertNappyEntry,
  insertPumpEntry,
} from "./helpers";

describe("HTTP /api/history", () => {
  test("returns 401 when not authenticated", async () => {
    const env = await createHttpEnv();

    const { res } = await requestJson(env, "/api/history?date=2026-01-01");
    expect(res.status).toBe(401);
  });

  test("returns 400 without date parameter", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res } = await requestJson(env, "/api/history", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(400);
  });

  test("returns events for a given date", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await insertSleepEntry(env, {
      started_at: "2026-01-01T02:00:00Z",
      ended_at: "2026-01-01T04:00:00Z",
    });
    await insertFeedEntry(env, {
      started_at: "2026-01-01T06:00:00Z",
      ended_at: "2026-01-01T06:30:00Z",
    });
    await insertNappyEntry(env, {
      occurred_at: "2026-01-01T07:00:00Z",
    });
    await insertPumpEntry(env, {
      started_at: "2026-01-01T08:00:00Z",
      ended_at: "2026-01-01T08:20:00Z",
    });

    const { res, body } = await requestJson<{
      data: {
        date: string;
        events: { type: string; time: string }[];
      };
    }>(env, "/api/history?date=2026-01-01", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.date).toBe("2026-01-01");
    expect(body.data.events).toHaveLength(4);

    // Should be sorted descending by time
    const times = body.data.events.map((e) => e.time);
    for (let i = 1; i < times.length; i++) {
      expect(new Date(times[i]).getTime()).toBeLessThanOrEqual(
        new Date(times[i - 1]).getTime(),
      );
    }
  });

  test("returns empty events for date with no data", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { events: unknown[] };
    }>(env, "/api/history?date=2026-06-15", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.events).toHaveLength(0);
  });

  test("tz offset filters by local date, not UTC date", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    // UTC time is 2025-12-31T15:00:00Z, but in UTC+10 that's 2026-01-01T01:00:00
    // So for a user in UTC+10, this event belongs to 2026-01-01
    await insertSleepEntry(env, {
      started_at: "2025-12-31T15:00:00Z",
      ended_at: "2025-12-31T17:00:00Z",
    });

    // This event is on 2026-01-01 UTC and 2026-01-01 local (UTC+10 = 11:00)
    await insertFeedEntry(env, {
      started_at: "2026-01-01T01:00:00Z",
      ended_at: "2026-01-01T01:30:00Z",
    });

    // This event is on 2026-01-01 UTC but 2026-01-02 in UTC+10 (= 00:30 local)
    await insertNappyEntry(env, {
      occurred_at: "2026-01-01T14:30:00Z",
    });

    // Query for 2026-01-01 with tz=600 (UTC+10)
    // Local day range: 2025-12-31T14:00:00Z to 2026-01-01T14:00:00Z
    const { body } = await requestJson<{
      data: { events: { type: string; time: string }[] };
    }>(env, "/api/history?date=2026-01-01&tz=600", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(body.data.events).toHaveLength(2);
    const types = body.data.events.map((e) => e.type);
    expect(types).toContain("sleep"); // 15:00Z is within range
    expect(types).toContain("feed"); // 01:00Z is within range
    // nappy at 14:30Z is outside range (it's 2026-01-02 local)
  });

  test("tz offset excludes events from adjacent UTC date", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    // In UTC-5, local midnight Jan 1 = 05:00Z Jan 1
    // This event at 04:00Z is still Dec 31 in UTC-5 (23:00 local)
    await insertSleepEntry(env, {
      started_at: "2026-01-01T04:00:00Z",
      ended_at: "2026-01-01T04:30:00Z",
    });

    // This event at 06:00Z is Jan 1 in UTC-5 (01:00 local)
    await insertFeedEntry(env, {
      started_at: "2026-01-01T06:00:00Z",
      ended_at: "2026-01-01T06:30:00Z",
    });

    // Query for 2026-01-01 with tz=-300 (UTC-5)
    // Local day range: 2026-01-01T05:00:00Z to 2026-01-02T05:00:00Z
    const { body } = await requestJson<{
      data: { events: { type: string; time: string }[] };
    }>(env, "/api/history?date=2026-01-01&tz=-300", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(body.data.events).toHaveLength(1);
    expect(body.data.events[0].type).toBe("feed");
  });

  test("summary respects tz offset across date range", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    // In UTC+10: this is Jan 2 at 01:00 local
    await insertNappyEntry(env, {
      type: "wet",
      occurred_at: "2026-01-01T15:00:00Z",
    });

    // In UTC+10: this is Jan 1 at 23:00 local
    await insertNappyEntry(env, {
      type: "dirty",
      occurred_at: "2026-01-01T13:00:00Z",
    });

    // Query Jan 1 only in UTC+10
    // Range: 2025-12-31T14:00:00Z to 2026-01-01T14:00:00Z
    const { body } = await requestJson<{
      data: { nappies: { total: number; wet: number; dirty: number } };
    }>(env, "/api/history/summary?from=2026-01-01&to=2026-01-01&tz=600", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Only the dirty one (13:00Z) falls within the local Jan 1 range
    expect(body.data.nappies.total).toBe(1);
    expect(body.data.nappies.dirty).toBe(1);
  });

  test("returns summary for date range", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await insertSleepEntry(env, {
      started_at: "2026-01-01T02:00:00Z",
      ended_at: "2026-01-01T04:00:00Z",
      duration_seconds: 7200,
    });
    await insertFeedEntry(env, {
      type: "formula",
      started_at: "2026-01-01T06:00:00Z",
      amount_ml: 120,
    });
    await insertFeedEntry(env, {
      type: "breast",
      started_at: "2026-01-01T10:00:00Z",
      duration_seconds: 600,
    });
    await insertNappyEntry(env, {
      type: "wet",
      occurred_at: "2026-01-01T07:00:00Z",
    });
    await insertNappyEntry(env, {
      type: "dirty",
      occurred_at: "2026-01-01T09:00:00Z",
    });
    await insertPumpEntry(env, {
      started_at: "2026-01-01T08:00:00Z",
      ended_at: "2026-01-01T08:20:00Z",
      amount_ml: 60,
    });

    const { res, body } = await requestJson<{
      data: {
        from: string;
        to: string;
        sleep: { count: number; total_hours: number };
        feeds: {
          breast_count: number;
          formula_count: number;
          total_formula_ml: number;
        };
        nappies: { wet: number; dirty: number; total: number };
        pumps: { count: number; total_ml: number };
      };
    }>(env, "/api/history/summary?from=2026-01-01&to=2026-01-01", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.sleep.count).toBe(1);
    expect(body.data.sleep.total_hours).toBe(2);
    expect(body.data.feeds.formula_count).toBe(1);
    expect(body.data.feeds.breast_count).toBe(1);
    expect(body.data.feeds.total_formula_ml).toBe(120);
    expect(body.data.nappies.wet).toBe(1);
    expect(body.data.nappies.dirty).toBe(1);
    expect(body.data.nappies.total).toBe(2);
    expect(body.data.pumps.count).toBe(1);
    expect(body.data.pumps.total_ml).toBe(60);
  });
});
