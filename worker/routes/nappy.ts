import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings } from "../types";
import { createD1NappyRepository } from "../repositories/d1/nappy.d1";

const nappy = new Hono<AppBindings>();

const createSchema = z.object({
  type: z.enum(["wet", "dirty", "both"]),
  notes: z.string().optional(),
});

nappy.post("/", zValidator("json", createSchema), async (c) => {
  const body = c.req.valid("json");
  const repo = createD1NappyRepository(c.env);
  const entry = await repo.create(body.type, body.notes);
  return c.json({ data: { entry } });
});

nappy.get("/", async (c) => {
  const repo = createD1NappyRepository(c.env);
  const entries = await repo.listRecent(50);
  return c.json({ data: { entries } });
});

const editSchema = z.object({
  type: z.enum(["wet", "dirty", "both"]).optional(),
  occurred_at: z.string().datetime().optional(),
  notes: z.string().nullable().optional(),
});

nappy.put("/:id", zValidator("json", editSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  const repo = createD1NappyRepository(c.env);

  const entry = await repo.getById(id);
  if (!entry) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (body.type !== undefined) updates.type = body.type;
  if (body.occurred_at !== undefined) updates.occurred_at = body.occurred_at;
  if (body.notes !== undefined) updates.notes = body.notes;

  await repo.update(id, updates);
  const updated = await repo.getById(id);
  return c.json({ data: { entry: updated } });
});

nappy.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const repo = createD1NappyRepository(c.env);
  await repo.delete(id);
  return c.json({ data: { success: true } });
});

export default nappy;
