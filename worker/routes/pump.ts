import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings, Pause } from "../types";
import { createD1PumpRepository } from "../repositories/d1/pump.d1";
import { calculateElapsedSeconds } from "../utils/timer";

const pump = new Hono<AppBindings>();

pump.post("/start", async (c) => {
  const repo = createD1PumpRepository(c.env);

  const active = await repo.getActive();
  if (active) {
    return c.json({ error: "A pump timer is already running" }, 409);
  }

  const entry = await repo.create();
  return c.json({ data: { entry } });
});

pump.post("/:id/pause", async (c) => {
  const id = parseInt(c.req.param("id"));
  const repo = createD1PumpRepository(c.env);

  const entry = await repo.getById(id);
  if (!entry) return c.json({ error: "Not found" }, 404);
  if (entry.status !== "active")
    return c.json({ error: "Timer is not active" }, 400);

  const pauses: Pause[] = JSON.parse(entry.pauses);
  pauses.push({ paused_at: new Date().toISOString(), resumed_at: null });

  await repo.update(id, { status: "paused", pauses: JSON.stringify(pauses) });

  const updated = await repo.getById(id);
  return c.json({ data: { entry: updated } });
});

pump.post("/:id/resume", async (c) => {
  const id = parseInt(c.req.param("id"));
  const repo = createD1PumpRepository(c.env);

  const entry = await repo.getById(id);
  if (!entry) return c.json({ error: "Not found" }, 404);
  if (entry.status !== "paused")
    return c.json({ error: "Timer is not paused" }, 400);

  const pauses: Pause[] = JSON.parse(entry.pauses);
  const lastPause = pauses[pauses.length - 1];
  if (lastPause) {
    lastPause.resumed_at = new Date().toISOString();
  }

  await repo.update(id, { status: "active", pauses: JSON.stringify(pauses) });

  const updated = await repo.getById(id);
  return c.json({ data: { entry: updated } });
});

const stopSchema = z.object({
  amount_ml: z.number().positive().optional(),
  notes: z.string().optional(),
});

pump.post("/:id/stop", zValidator("json", stopSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  const repo = createD1PumpRepository(c.env);

  const entry = await repo.getById(id);
  if (!entry) return c.json({ error: "Not found" }, 404);
  if (entry.status === "completed")
    return c.json({ error: "Timer already stopped" }, 400);

  const pauses: Pause[] = JSON.parse(entry.pauses);
  const lastPause = pauses[pauses.length - 1];
  if (lastPause && !lastPause.resumed_at) {
    lastPause.resumed_at = new Date().toISOString();
  }

  const endedAt = new Date().toISOString();
  const duration = calculateElapsedSeconds(entry.started_at, pauses, endedAt);

  await repo.update(id, {
    status: "completed",
    ended_at: endedAt,
    pauses: JSON.stringify(pauses),
    duration_seconds: duration,
    amount_ml: body.amount_ml ?? entry.amount_ml,
    notes: body.notes ?? entry.notes,
  });

  const updated = await repo.getById(id);
  return c.json({ data: { entry: updated } });
});

pump.get("/", async (c) => {
  const repo = createD1PumpRepository(c.env);
  const entries = await repo.listRecent(50);
  return c.json({ data: { entries } });
});

pump.get("/active", async (c) => {
  const repo = createD1PumpRepository(c.env);
  const entry = await repo.getActive();
  return c.json({ data: { entry } });
});

const editSchema = z.object({
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().optional(),
  amount_ml: z.number().positive().optional(),
  notes: z.string().nullable().optional(),
});

pump.put("/:id", zValidator("json", editSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  const repo = createD1PumpRepository(c.env);

  const entry = await repo.getById(id);
  if (!entry) return c.json({ error: "Not found" }, 404);
  if (entry.status !== "completed")
    return c.json({ error: "Can only edit completed entries" }, 400);

  const updates: Record<string, unknown> = {};
  if (body.started_at !== undefined) updates.started_at = body.started_at;
  if (body.ended_at !== undefined) updates.ended_at = body.ended_at;
  if (body.amount_ml !== undefined) updates.amount_ml = body.amount_ml;
  if (body.notes !== undefined) updates.notes = body.notes;

  // Recalculate duration if times changed
  const startedAt = (updates.started_at as string) ?? entry.started_at;
  const endedAt = (updates.ended_at as string) ?? entry.ended_at;
  if (
    (body.started_at !== undefined || body.ended_at !== undefined) &&
    endedAt
  ) {
    const pauses: Pause[] = JSON.parse(entry.pauses);
    updates.duration_seconds = calculateElapsedSeconds(
      startedAt,
      pauses,
      endedAt,
    );
  }

  await repo.update(id, updates);
  const updated = await repo.getById(id);
  return c.json({ data: { entry: updated } });
});

pump.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const repo = createD1PumpRepository(c.env);
  await repo.delete(id);
  return c.json({ data: { success: true } });
});

export default pump;
