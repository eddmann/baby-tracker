import { Hono } from "hono";
import type { AppBindings } from "../types";
import { createD1SleepRepository } from "../repositories/d1/sleep.d1";
import { createD1FeedRepository } from "../repositories/d1/feed.d1";
import { createD1NappyRepository } from "../repositories/d1/nappy.d1";
import { createD1PumpRepository } from "../repositories/d1/pump.d1";
import { createD1DailyTaskRepository } from "../repositories/d1/dailyTask.d1";
import { localDateToUtcRange } from "../lib/timezone";

const dashboard = new Hono<AppBindings>();

dashboard.get("/", async (c) => {
  const sleepRepo = createD1SleepRepository(c.env);
  const feedRepo = createD1FeedRepository(c.env);
  const nappyRepo = createD1NappyRepository(c.env);
  const pumpRepo = createD1PumpRepository(c.env);

  const tz = parseInt(c.req.query("tz") ?? "0", 10);
  const now = new Date();
  const localNow = new Date(now.getTime() + tz * 60_000);
  const localToday = localNow.toISOString().slice(0, 10);
  const { start, end } = localDateToUtcRange(localToday, tz);

  const dailyTaskRepo = createD1DailyTaskRepository(c.env);

  const [
    activeSleep,
    activeBreastFeed,
    activePump,
    lastSleep,
    lastFeed,
    lastNappy,
    lastPump,
    todayNappyCount,
    todayFeedCount,
    allTasks,
    todayTaskCompletions,
  ] = await Promise.all([
    sleepRepo.getActive(),
    feedRepo.getActive(),
    pumpRepo.getActive(),
    sleepRepo.getLatestCompleted(),
    feedRepo.getLatestCompleted(),
    nappyRepo.getLatest(),
    pumpRepo.getLatestCompleted(),
    nappyRepo.countByDate(start, end),
    feedRepo.countByDate(start, end),
    dailyTaskRepo.listAll(),
    dailyTaskRepo.getCompletionsForDateRange(start, end),
  ]);

  const activeTimers = [];
  if (activeSleep)
    activeTimers.push({ type: "sleep" as const, entry: activeSleep });
  if (activeBreastFeed)
    activeTimers.push({ type: "feed" as const, entry: activeBreastFeed });
  if (activePump)
    activeTimers.push({ type: "pump" as const, entry: activePump });

  // Daily tasks summary
  const todayCompletedTaskIds = new Set(
    todayTaskCompletions.map((c) => c.task_id),
  );
  let lastCompletionMap: Map<number, string> | null = null;
  if (allTasks.length > 0) {
    const lastCompletions = await dailyTaskRepo.getLastCompletionPerTask();
    lastCompletionMap = new Map(
      lastCompletions.map((r) => [r.task_id, r.last_completed_at]),
    );
  }
  let dueCount = 0;
  for (const task of allTasks) {
    const lastCompletedAt = lastCompletionMap?.get(task.id) ?? null;
    let isDue: boolean;
    if (!lastCompletedAt) {
      const nextDueDate = task.start_date ?? localToday;
      isDue = nextDueDate <= localToday;
    } else {
      const lastLocal = new Date(
        new Date(lastCompletedAt).getTime() + tz * 60_000,
      );
      const lastDate = lastLocal.toISOString().slice(0, 10);
      const nextDue = new Date(`${lastDate}T00:00:00.000Z`);
      nextDue.setDate(nextDue.getDate() + task.frequency_days);
      isDue = nextDue.toISOString().slice(0, 10) <= localToday;
    }
    if (isDue || todayCompletedTaskIds.has(task.id)) dueCount++;
  }

  // Calculate hours since last feed
  let hoursSinceLastFeed: number | null = null;
  if (lastFeed) {
    const lastFeedTime = lastFeed.started_at;
    hoursSinceLastFeed =
      Math.round(
        ((Date.now() - new Date(lastFeedTime).getTime()) / 3600000) * 10,
      ) / 10;
  }

  return c.json({
    data: {
      active_timers: activeTimers,
      last_sleep: lastSleep,
      last_feed: lastFeed,
      last_nappy: lastNappy,
      last_pump: lastPump,
      today: {
        nappy_count: todayNappyCount,
        nappy_target: 12,
        feed_count: todayFeedCount,
        hours_since_last_feed: hoursSinceLastFeed,
        feed_interval_target: 4,
      },
      daily_tasks: {
        total_count: allTasks.length,
        due_count: dueCount,
        completed_count: todayCompletedTaskIds.size,
      },
    },
  });
});

export default dashboard;
