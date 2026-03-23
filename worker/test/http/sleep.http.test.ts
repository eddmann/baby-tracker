import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  authenticateWithPin,
  insertSleepEntry,
} from "./helpers";

describe("HTTP /api/sleep", () => {
  test("returns 401 when not authenticated", async () => {
    const env = await createHttpEnv();

    const { res } = await requestJson(env, "/api/sleep");
    expect(res.status).toBe(401);
  });

  test("starts a sleep timer", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { entry: { id: number; status: string } };
    }>(env, "/api/sleep/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.status).toBe("active");
  });

  test("returns 409 when starting with active timer", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await requestJson(env, "/api/sleep/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const { res } = await requestJson(env, "/api/sleep/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(409);
  });

  test("pauses an active timer", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const start = await requestJson<{
      data: { entry: { id: number } };
    }>(env, "/api/sleep/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const { res, body } = await requestJson<{
      data: { entry: { id: number; status: string; pauses: string } };
    }>(env, `/api/sleep/${start.body.data.entry.id}/pause`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.status).toBe("paused");
    const pauses = JSON.parse(body.data.entry.pauses);
    expect(pauses).toHaveLength(1);
    expect(pauses[0].resumed_at).toBeNull();
  });

  test("resumes a paused timer", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const start = await requestJson<{
      data: { entry: { id: number } };
    }>(env, "/api/sleep/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const id = start.body.data.entry.id;
    await requestJson(env, `/api/sleep/${id}/pause`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const { res, body } = await requestJson<{
      data: { entry: { status: string; pauses: string } };
    }>(env, `/api/sleep/${id}/resume`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.status).toBe("active");
    const pauses = JSON.parse(body.data.entry.pauses);
    expect(pauses[0].resumed_at).not.toBeNull();
  });

  test("stops a timer with notes", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const start = await requestJson<{
      data: { entry: { id: number } };
    }>(env, "/api/sleep/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const { res, body } = await requestJson<{
      data: {
        entry: {
          status: string;
          duration_seconds: number;
          notes: string;
          ended_at: string;
        };
      };
    }>(env, `/api/sleep/${start.body.data.entry.id}/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "good nap" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.status).toBe("completed");
    expect(body.data.entry.notes).toBe("good nap");
    expect(body.data.entry.ended_at).toBeTruthy();
    expect(body.data.entry.duration_seconds).toBeGreaterThanOrEqual(0);
  });

  test("lists sleep entries", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await insertSleepEntry(env);
    await insertSleepEntry(env);

    const { res, body } = await requestJson<{
      data: { entries: { id: number }[] };
    }>(env, "/api/sleep", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.entries).toHaveLength(2);
  });

  test("gets active sleep", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await insertSleepEntry(env, { status: "active", ended_at: null });

    const { res, body } = await requestJson<{
      data: { entry: { status: string } | null };
    }>(env, "/api/sleep/active", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.entry).not.toBeNull();
    expect(body.data.entry?.status).toBe("active");
  });

  test("edits a completed sleep entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertSleepEntry(env);

    const newStart = "2025-01-01T10:00:00.000Z";
    const newEnd = "2025-01-01T11:30:00.000Z";

    const { res, body } = await requestJson<{
      data: {
        entry: {
          started_at: string;
          ended_at: string;
          notes: string;
          duration_seconds: number;
        };
      };
    }>(env, `/api/sleep/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        started_at: newStart,
        ended_at: newEnd,
        notes: "edited",
      }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.started_at).toBe(newStart);
    expect(body.data.entry.ended_at).toBe(newEnd);
    expect(body.data.entry.notes).toBe("edited");
    expect(body.data.entry.duration_seconds).toBe(5400);
  });

  test("rejects edit of active sleep entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertSleepEntry(env, {
      status: "active",
      ended_at: null,
    });

    const { res } = await requestJson(env, `/api/sleep/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "test" }),
    });

    expect(res.status).toBe(400);
  });

  test("returns 404 for editing non-existent sleep entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res } = await requestJson(env, "/api/sleep/9999", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "test" }),
    });

    expect(res.status).toBe(404);
  });

  test("deletes a sleep entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertSleepEntry(env);

    const { res } = await requestJson(env, `/api/sleep/${entry.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
  });
});
