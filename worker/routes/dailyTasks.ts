import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings, DailyTask, DailyTaskWithStatus } from "../types";
import { createD1DailyTaskRepository } from "../repositories/d1/dailyTask.d1";
import { localDateToUtcRange } from "../lib/timezone";

const dailyTasks = new Hono<AppBindings>();

function computeTaskStatuses(
  tasks: DailyTask[],
  lastCompletions: Map<number, string>,
  todayCompletedTaskIds: Set<number>,
  localToday: string,
  tz: number,
): DailyTaskWithStatus[] {
  return tasks.map((task) => {
    const isCompletedToday = todayCompletedTaskIds.has(task.id);
    const lastCompletedAt = lastCompletions.get(task.id) ?? null;

    let isDue: boolean;
    let nextDueDate: string | null;

    if (!lastCompletedAt) {
      nextDueDate = task.start_date ?? localToday;
      isDue = nextDueDate <= localToday;
    } else {
      const lastLocal = new Date(
        new Date(lastCompletedAt).getTime() + tz * 60_000,
      );
      const lastDate = lastLocal.toISOString().slice(0, 10);

      const nextDue = new Date(`${lastDate}T00:00:00.000Z`);
      nextDue.setDate(nextDue.getDate() + task.frequency_days);
      nextDueDate = nextDue.toISOString().slice(0, 10);

      isDue = nextDueDate <= localToday;
    }

    return {
      ...task,
      is_due: isDue,
      is_completed_today: isCompletedToday,
      last_completed_at: lastCompletedAt,
      next_due_date: nextDueDate,
    };
  });
}

// List all tasks with status
dailyTasks.get("/", async (c) => {
  const repo = createD1DailyTaskRepository(c.env);
  const tz = parseInt(c.req.query("tz") ?? "0", 10);
  const now = new Date();
  const localNow = new Date(now.getTime() + tz * 60_000);
  const localToday = localNow.toISOString().slice(0, 10);
  const { start, end } = localDateToUtcRange(localToday, tz);

  const [tasks, lastCompletionsRaw, todayCompletions] = await Promise.all([
    repo.listAll(),
    repo.getLastCompletionPerTask(),
    repo.getCompletionsForDateRange(start, end),
  ]);

  const lastCompletions = new Map(
    lastCompletionsRaw.map((r) => [r.task_id, r.last_completed_at]),
  );
  const todayCompletedTaskIds = new Set(
    todayCompletions.map((c) => c.task_id),
  );

  const tasksWithStatus = computeTaskStatuses(
    tasks,
    lastCompletions,
    todayCompletedTaskIds,
    localToday,
    tz,
  );

  // Sort: due+uncompleted first, then completed today, then upcoming
  tasksWithStatus.sort((a, b) => {
    const order = (t: DailyTaskWithStatus) => {
      if (t.is_due && !t.is_completed_today) return 0;
      if (t.is_completed_today) return 1;
      return 2;
    };
    return order(a) - order(b);
  });

  return c.json({ data: { tasks: tasksWithStatus } });
});

const createSchema = z.object({
  name: z.string().min(1).max(200),
  frequency_days: z.number().int().min(1).max(365),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

dailyTasks.post("/", zValidator("json", createSchema), async (c) => {
  const body = c.req.valid("json");
  const repo = createD1DailyTaskRepository(c.env);
  const task = await repo.create(body.name, body.frequency_days, body.start_date);
  return c.json({ data: { task } });
});

const editSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  frequency_days: z.number().int().min(1).max(365).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

dailyTasks.put("/:id", zValidator("json", editSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  const repo = createD1DailyTaskRepository(c.env);

  const task = await repo.getById(id);
  if (!task) return c.json({ error: "Not found" }, 404);

  await repo.update(id, body);
  const updated = await repo.getById(id);
  return c.json({ data: { task: updated } });
});

dailyTasks.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const repo = createD1DailyTaskRepository(c.env);
  await repo.delete(id);
  return c.json({ data: { success: true } });
});

// Mark task complete for today
dailyTasks.post("/:id/complete", async (c) => {
  const id = parseInt(c.req.param("id"));
  const repo = createD1DailyTaskRepository(c.env);

  const task = await repo.getById(id);
  if (!task) return c.json({ error: "Not found" }, 404);

  const completion = await repo.addCompletion(id);
  return c.json({ data: { completion } });
});

// Unmark task for today
dailyTasks.delete("/:id/complete", async (c) => {
  const id = parseInt(c.req.param("id"));
  const tz = parseInt(c.req.query("tz") ?? "0", 10);
  const now = new Date();
  const localNow = new Date(now.getTime() + tz * 60_000);
  const localToday = localNow.toISOString().slice(0, 10);
  const { start, end } = localDateToUtcRange(localToday, tz);

  const repo = createD1DailyTaskRepository(c.env);
  await repo.removeCompletionForDate(id, start, end);
  return c.json({ data: { success: true } });
});

export default dailyTasks;
