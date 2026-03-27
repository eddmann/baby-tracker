import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  authenticateWithPin,
  insertGrowthEntry,
} from "./helpers";

describe("HTTP /api/growth", () => {
  test("returns 401 when not authenticated", async () => {
    const env = await createHttpEnv();

    const { res } = await requestJson(env, "/api/growth");
    expect(res.status).toBe(401);
  });

  test("creates a weight-only entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { entry: { weight_grams: number; height_mm: null } };
    }>(env, "/api/growth", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ weight_grams: 3500 }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.weight_grams).toBe(3500);
    expect(body.data.entry.height_mm).toBeNull();
  });

  test("creates a height-only entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { entry: { weight_grams: null; height_mm: number } };
    }>(env, "/api/growth", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ height_mm: 520 }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.weight_grams).toBeNull();
    expect(body.data.entry.height_mm).toBe(520);
  });

  test("creates an entry with both weight, height, and notes", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: {
        entry: {
          weight_grams: number;
          height_mm: number;
          notes: string;
        };
      };
    }>(env, "/api/growth", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        weight_grams: 4300,
        height_mm: 550,
        notes: "Day 36 weigh-in",
      }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.weight_grams).toBe(4300);
    expect(body.data.entry.height_mm).toBe(550);
    expect(body.data.entry.notes).toBe("Day 36 weigh-in");
  });

  test("rejects entry with neither weight nor height", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res } = await requestJson(env, "/api/growth", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "no measurements" }),
    });

    expect(res.status).toBe(400);
  });

  test("lists growth entries", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await insertGrowthEntry(env, { weight_grams: 3500 });
    await insertGrowthEntry(env, { weight_grams: 3800 });
    await insertGrowthEntry(env, { height_mm: 520 });

    const { res, body } = await requestJson<{
      data: { entries: { id: number }[] };
    }>(env, "/api/growth", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.entries).toHaveLength(3);
  });

  test("edits a growth entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertGrowthEntry(env, { weight_grams: 3500 });

    const { res, body } = await requestJson<{
      data: {
        entry: { weight_grams: number; height_mm: number; notes: string };
      };
    }>(env, `/api/growth/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        weight_grams: 3600,
        height_mm: 510,
        notes: "corrected",
      }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.weight_grams).toBe(3600);
    expect(body.data.entry.height_mm).toBe(510);
    expect(body.data.entry.notes).toBe("corrected");
  });

  test("returns 404 for editing non-existent growth entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res } = await requestJson(env, "/api/growth/9999", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ weight_grams: 3500 }),
    });

    expect(res.status).toBe(404);
  });

  test("deletes a growth entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertGrowthEntry(env);

    const { res } = await requestJson(env, `/api/growth/${entry.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
  });
});
