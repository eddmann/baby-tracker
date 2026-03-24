import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings, Pause } from "../types";
import { createD1FeedRepository } from "../repositories/d1/feed.d1";
import { calculateElapsedSeconds } from "../utils/timer";

const feed = new Hono<AppBindings>();

const breastStartSchema = z.object({
  side: z.enum(["left", "right"]),
});

feed.post("/breast/start", zValidator("json", breastStartSchema), async (c) => {
  const body = c.req.valid("json");
  const repo = createD1FeedRepository(c.env);

  const active = await repo.getActive();
  if (active) {
    return c.json({ error: "A feed timer is already running" }, 409);
  }

  const entry = await repo.createBreast(body.side);
  return c.json({ data: { entry } });
});

const formulaSchema = z.object({
  amount_ml: z.number().positive(),
  notes: z.string().optional(),
});

feed.post("/formula", zValidator("json", formulaSchema), async (c) => {
  const body = c.req.valid("json");
  const repo = createD1FeedRepository(c.env);
  const entry = await repo.createInstant("formula", body.amount_ml, body.notes);
  return c.json({ data: { entry } });
});

feed.post("/expressed", zValidator("json", formulaSchema), async (c) => {
  const body = c.req.valid("json");
  const repo = createD1FeedRepository(c.env);
  const entry = await repo.createInstant(
    "expressed",
    body.amount_ml,
    body.notes,
  );
  return c.json({ data: { entry } });
});

feed.post("/:id/pause", async (c) => {
  const id = parseInt(c.req.param("id"));
  const repo = createD1FeedRepository(c.env);

  const entry = await repo.getById(id);
  if (!entry) return c.json({ error: "Not found" }, 404);
  if (entry.status !== "active")
    return c.json({ error: "Feed is not active" }, 400);

  const pauses: Pause[] = JSON.parse(entry.pauses);
  pauses.push({ paused_at: new Date().toISOString(), resumed_at: null });

  await repo.update(id, { status: "paused", pauses: JSON.stringify(pauses) });

  const updated = await repo.getById(id);
  return c.json({ data: { entry: updated } });
});

feed.post("/:id/resume", async (c) => {
  const id = parseInt(c.req.param("id"));
  const repo = createD1FeedRepository(c.env);

  const entry = await repo.getById(id);
  if (!entry) return c.json({ error: "Not found" }, 404);
  if (entry.status !== "paused")
    return c.json({ error: "Feed is not paused" }, 400);

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
  notes: z.string().optional(),
});

feed.post("/:id/stop", zValidator("json", stopSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  const repo = createD1FeedRepository(c.env);

  const entry = await repo.getById(id);
  if (!entry) return c.json({ error: "Not found" }, 404);
  if (entry.status === "completed")
    return c.json({ error: "Feed already stopped" }, 400);

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
    notes: body.notes ?? entry.notes,
  });

  const updated = await repo.getById(id);
  return c.json({ data: { entry: updated } });
});

feed.get("/", async (c) => {
  const repo = createD1FeedRepository(c.env);
  const entries = await repo.listRecent(50);
  return c.json({ data: { entries } });
});

feed.get("/active", async (c) => {
  const repo = createD1FeedRepository(c.env);
  const entry = await repo.getActive();
  return c.json({ data: { entry } });
});

const editSchema = z.object({
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().optional(),
  side: z.enum(["left", "right"]).optional(),
  amount_ml: z.number().positive().optional(),
  notes: z.string().nullable().optional(),
});

feed.put("/:id", zValidator("json", editSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  const repo = createD1FeedRepository(c.env);

  const entry = await repo.getById(id);
  if (!entry) return c.json({ error: "Not found" }, 404);
  if (entry.status !== "completed")
    return c.json({ error: "Can only edit completed entries" }, 400);

  const isBreast = entry.type === "breast";
  const updates: Record<string, unknown> = {
    ...body,
    // For instant feeds, keep ended_at in sync and duration null
    ...(!isBreast &&
      body.started_at && {
        ended_at: body.started_at,
        duration_seconds: null,
      }),
  };

  // Recalculate duration if times changed (breast feeds only)
  if (isBreast && (body.started_at || body.ended_at)) {
    const endedAt = (updates.ended_at as string) ?? entry.ended_at;
    if (endedAt) {
      updates.duration_seconds = calculateElapsedSeconds(
        (updates.started_at as string) ?? entry.started_at,
        JSON.parse(entry.pauses),
        endedAt,
      );
    }
  }

  await repo.update(id, updates);
  const updated = await repo.getById(id);
  return c.json({ data: { entry: updated } });
});

feed.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const repo = createD1FeedRepository(c.env);
  await repo.delete(id);
  return c.json({ data: { success: true } });
});

export default feed;
