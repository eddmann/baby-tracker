import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  authenticateWithPin,
  insertFeedEntry,
} from "./helpers";

describe("HTTP /api/feed", () => {
  test("returns 401 when not authenticated", async () => {
    const env = await createHttpEnv();

    const { res } = await requestJson(env, "/api/feed");
    expect(res.status).toBe(401);
  });

  test("starts a breast feed with side", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { entry: { type: string; status: string; side: string } };
    }>(env, "/api/feed/breast/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ side: "left" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.type).toBe("breast");
    expect(body.data.entry.status).toBe("active");
    expect(body.data.entry.side).toBe("left");
  });

  test("returns 409 when starting breast with active feed", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await requestJson(env, "/api/feed/breast/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ side: "left" }),
    });

    const { res } = await requestJson(env, "/api/feed/breast/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ side: "right" }),
    });

    expect(res.status).toBe(409);
  });

  test("logs a formula feed", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: {
        entry: { type: string; status: string; amount_ml: number; side: null };
      };
    }>(env, "/api/feed/formula", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount_ml: 120, notes: "warm" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.type).toBe("formula");
    expect(body.data.entry.status).toBe("completed");
    expect(body.data.entry.amount_ml).toBe(120);
    expect(body.data.entry.side).toBeNull();
  });

  test("logs an expressed feed", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { entry: { type: string; amount_ml: number } };
    }>(env, "/api/feed/expressed", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount_ml: 80 }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.type).toBe("expressed");
    expect(body.data.entry.amount_ml).toBe(80);
  });

  test("pauses, resumes, and stops a breast feed", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const start = await requestJson<{
      data: { entry: { id: number } };
    }>(env, "/api/feed/breast/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ side: "right" }),
    });

    const id = start.body.data.entry.id;

    // Pause
    const pause = await requestJson<{
      data: { entry: { status: string } };
    }>(env, `/api/feed/${id}/pause`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(pause.body.data.entry.status).toBe("paused");

    // Resume
    const resume = await requestJson<{
      data: { entry: { status: string } };
    }>(env, `/api/feed/${id}/resume`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resume.body.data.entry.status).toBe("active");

    // Stop
    const stop = await requestJson<{
      data: {
        entry: { status: string; duration_seconds: number; ended_at: string };
      };
    }>(env, `/api/feed/${id}/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "fed well" }),
    });
    expect(stop.body.data.entry.status).toBe("completed");
    expect(stop.body.data.entry.duration_seconds).toBeGreaterThanOrEqual(0);
  });

  test("lists feed entries", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await insertFeedEntry(env, { type: "formula", amount_ml: 100 });
    await insertFeedEntry(env, { type: "breast" });

    const { res, body } = await requestJson<{
      data: { entries: { id: number }[] };
    }>(env, "/api/feed", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.entries).toHaveLength(2);
  });

  test("edits a completed feed entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertFeedEntry(env, {
      type: "formula",
      amount_ml: 100,
    });

    const { res, body } = await requestJson<{
      data: { entry: { amount_ml: number; notes: string } };
    }>(env, `/api/feed/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount_ml: 150, notes: "edited" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.amount_ml).toBe(150);
    expect(body.data.entry.notes).toBe("edited");
  });

  test("edits a breast feed side", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertFeedEntry(env, { type: "breast", side: "left" });

    const { res, body } = await requestJson<{
      data: { entry: { side: string } };
    }>(env, `/api/feed/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ side: "right" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.side).toBe("right");
  });

  test("editing formula feed started_at also updates ended_at", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertFeedEntry(env, {
      type: "formula",
      amount_ml: 120,
    });

    const newTime = "2026-01-01T08:00:00.000Z";
    const { body } = await requestJson<{
      data: {
        entry: {
          started_at: string;
          ended_at: string;
          duration_seconds: number | null;
        };
      };
    }>(env, `/api/feed/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ started_at: newTime }),
    });

    expect(body.data.entry.started_at).toBe(newTime);
    expect(body.data.entry.ended_at).toBe(newTime);
    expect(body.data.entry.duration_seconds).toBeNull();
  });

  test("editing expressed feed started_at also updates ended_at", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertFeedEntry(env, {
      type: "expressed",
      amount_ml: 80,
    });

    const newTime = "2026-01-01T10:00:00.000Z";
    const { body } = await requestJson<{
      data: {
        entry: {
          started_at: string;
          ended_at: string;
          duration_seconds: number | null;
        };
      };
    }>(env, `/api/feed/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ started_at: newTime }),
    });

    expect(body.data.entry.started_at).toBe(newTime);
    expect(body.data.entry.ended_at).toBe(newTime);
    expect(body.data.entry.duration_seconds).toBeNull();
  });

  test("editing breast feed started_at does not sync ended_at", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertFeedEntry(env, {
      type: "breast",
      side: "left",
      started_at: "2026-01-01T00:00:00.000Z",
      ended_at: "2026-01-01T00:20:00.000Z",
      duration_seconds: 1200,
    });

    const newStart = "2026-01-01T00:05:00.000Z";
    const { body } = await requestJson<{
      data: {
        entry: {
          started_at: string;
          ended_at: string;
          duration_seconds: number;
        };
      };
    }>(env, `/api/feed/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ started_at: newStart }),
    });

    expect(body.data.entry.started_at).toBe(newStart);
    expect(body.data.entry.ended_at).toBe("2026-01-01T00:20:00.000Z");
    expect(body.data.entry.duration_seconds).toBe(900);
  });

  test("editing a formula feed with is_tracked preserves tracked status", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    // Create a formula feed (is_tracked defaults to true in the DB)
    const create = await requestJson<{
      data: { entry: { id: number; is_tracked: boolean } };
    }>(env, "/api/feed/formula", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount_ml: 120 }),
    });

    const entry = create.body.data.entry;

    const { res, body } = await requestJson<{
      data: { entry: { amount_ml: number; is_tracked: boolean } };
    }>(env, `/api/feed/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount_ml: 150, is_tracked: entry.is_tracked }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.amount_ml).toBe(150);
    expect(body.data.entry.is_tracked).toBe(true);
  });

  test("deletes a feed entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertFeedEntry(env);

    const { res } = await requestJson(env, `/api/feed/${entry.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
  });
});
