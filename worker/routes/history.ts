import { Hono } from "hono";
import type { AppBindings } from "../types";
import { createD1SleepRepository } from "../repositories/d1/sleep.d1";
import { createD1FeedRepository } from "../repositories/d1/feed.d1";
import { createD1NappyRepository } from "../repositories/d1/nappy.d1";
import { createD1PumpRepository } from "../repositories/d1/pump.d1";
import { localDateToUtcRange } from "../lib/timezone";

const history = new Hono<AppBindings>();

history.get("/", async (c) => {
  const date = c.req.query("date");
  if (!date) {
    return c.json({ error: "date query parameter required" }, 400);
  }

  const tz = parseInt(c.req.query("tz") ?? "0", 10);
  const { start, end } = localDateToUtcRange(date, tz);

  const sleepRepo = createD1SleepRepository(c.env);
  const feedRepo = createD1FeedRepository(c.env);
  const nappyRepo = createD1NappyRepository(c.env);
  const pumpRepo = createD1PumpRepository(c.env);

  const [sleeps, feeds, nappies, pumps] = await Promise.all([
    sleepRepo.listByDate(start, end),
    feedRepo.listByDate(start, end),
    nappyRepo.listByDate(start, end),
    pumpRepo.listByDate(start, end),
  ]);

  // Build unified timeline
  type TimelineEvent =
    | { type: "sleep"; time: string; entry: typeof sleeps[0] }
    | { type: "feed"; time: string; entry: typeof feeds[0] }
    | { type: "nappy"; time: string; entry: typeof nappies[0] }
    | { type: "pump"; time: string; entry: typeof pumps[0] };

  const events: TimelineEvent[] = [
    ...sleeps.map((e) => ({ type: "sleep" as const, time: e.started_at, entry: e })),
    ...feeds.map((e) => ({ type: "feed" as const, time: e.started_at, entry: e })),
    ...nappies.map((e) => ({ type: "nappy" as const, time: e.occurred_at, entry: e })),
    ...pumps.map((e) => ({ type: "pump" as const, time: e.started_at, entry: e })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return c.json({ data: { date, events } });
});

history.get("/summary", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");

  if (!from || !to) {
    return c.json({ error: "from and to query parameters required" }, 400);
  }

  const tz = parseInt(c.req.query("tz") ?? "0", 10);
  const rangeStart = localDateToUtcRange(from, tz).start;
  const rangeEnd = localDateToUtcRange(to, tz).end;

  const sleepRepo = createD1SleepRepository(c.env);
  const feedRepo = createD1FeedRepository(c.env);
  const nappyRepo = createD1NappyRepository(c.env);
  const pumpRepo = createD1PumpRepository(c.env);

  const [sleeps, feeds, nappies, pumps] = await Promise.all([
    sleepRepo.listByDate(rangeStart, rangeEnd),
    feedRepo.listByDate(rangeStart, rangeEnd),
    nappyRepo.listByDate(rangeStart, rangeEnd),
    pumpRepo.listByDate(rangeStart, rangeEnd),
  ]);

  const completedSleeps = sleeps.filter((s) => s.status === "completed");
  const totalSleepSeconds = completedSleeps.reduce(
    (sum, s) => sum + (s.duration_seconds ?? 0),
    0,
  );

  const breastFeeds = feeds.filter((f) => f.type === "breast");
  const formulaFeeds = feeds.filter((f) => f.type === "formula");
  const expressedFeeds = feeds.filter((f) => f.type === "expressed");

  return c.json({
    data: {
      from,
      to,
      sleep: {
        count: completedSleeps.length,
        total_hours: Math.round((totalSleepSeconds / 3600) * 10) / 10,
      },
      feeds: {
        breast_count: breastFeeds.length,
        formula_count: formulaFeeds.length,
        expressed_count: expressedFeeds.length,
        total_formula_ml: formulaFeeds.reduce(
          (sum, f) => sum + (f.amount_ml ?? 0),
          0,
        ),
        total_expressed_ml: expressedFeeds.reduce(
          (sum, f) => sum + (f.amount_ml ?? 0),
          0,
        ),
      },
      nappies: {
        wet: nappies.filter((n) => n.type === "wet").length,
        dirty: nappies.filter((n) => n.type === "dirty").length,
        both: nappies.filter((n) => n.type === "both").length,
        total: nappies.length,
      },
      pumps: {
        count: pumps.filter((p) => p.status === "completed").length,
        total_ml: pumps.reduce((sum, p) => sum + (p.amount_ml ?? 0), 0),
      },
    },
  });
});

export default history;
