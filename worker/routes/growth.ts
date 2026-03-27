import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings } from "../types";
import { createD1GrowthRepository } from "../repositories/d1/growth.d1";

const growth = new Hono<AppBindings>();

const createSchema = z
  .object({
    weight_grams: z.number().int().positive().nullable().optional(),
    height_mm: z.number().int().positive().nullable().optional(),
    measured_at: z.string().datetime().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.weight_grams || data.height_mm, {
    message: "At least one of weight_grams or height_mm is required",
  });

growth.post("/", zValidator("json", createSchema), async (c) => {
  const body = c.req.valid("json");
  const repo = createD1GrowthRepository(c.env);
  const entry = await repo.create(
    body.weight_grams ?? null,
    body.height_mm ?? null,
    body.measured_at,
    body.notes,
  );
  return c.json({ data: { entry } });
});

growth.get("/", async (c) => {
  const repo = createD1GrowthRepository(c.env);
  const entries = await repo.listRecent(50);
  return c.json({ data: { entries } });
});

const editSchema = z.object({
  weight_grams: z.number().int().positive().nullable().optional(),
  height_mm: z.number().int().positive().nullable().optional(),
  measured_at: z.string().datetime().optional(),
  notes: z.string().nullable().optional(),
});

growth.put("/:id", zValidator("json", editSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  const repo = createD1GrowthRepository(c.env);

  const entry = await repo.getById(id);
  if (!entry) return c.json({ error: "Not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (body.weight_grams !== undefined) updates.weight_grams = body.weight_grams;
  if (body.height_mm !== undefined) updates.height_mm = body.height_mm;
  if (body.measured_at !== undefined) updates.measured_at = body.measured_at;
  if (body.notes !== undefined) updates.notes = body.notes;

  await repo.update(id, updates);
  const updated = await repo.getById(id);
  return c.json({ data: { entry: updated } });
});

growth.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const repo = createD1GrowthRepository(c.env);
  await repo.delete(id);
  return c.json({ data: { success: true } });
});

export default growth;
