import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  authenticateWithPin,
  insertPumpEntry,
} from "./helpers";

describe("HTTP /api/pump", () => {
  test("returns 401 when not authenticated", async () => {
    const env = await createHttpEnv();

    const { res } = await requestJson(env, "/api/pump");
    expect(res.status).toBe(401);
  });

  test("starts a pump timer", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { entry: { status: string } };
    }>(env, "/api/pump/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.status).toBe("active");
  });

  test("returns 409 when starting with active pump", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await requestJson(env, "/api/pump/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const { res } = await requestJson(env, "/api/pump/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(409);
  });

  test("stops pump with amount", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const start = await requestJson<{
      data: { entry: { id: number } };
    }>(env, "/api/pump/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const { res, body } = await requestJson<{
      data: {
        entry: {
          status: string;
          amount_ml: number;
          duration_seconds: number;
        };
      };
    }>(env, `/api/pump/${start.body.data.entry.id}/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount_ml: 75, notes: "good session" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.status).toBe("completed");
    expect(body.data.entry.amount_ml).toBe(75);
    expect(body.data.entry.duration_seconds).toBeGreaterThanOrEqual(0);
  });

  test("pauses and resumes pump", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const start = await requestJson<{
      data: { entry: { id: number } };
    }>(env, "/api/pump/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const id = start.body.data.entry.id;

    const pause = await requestJson<{
      data: { entry: { status: string } };
    }>(env, `/api/pump/${id}/pause`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(pause.body.data.entry.status).toBe("paused");

    const resume = await requestJson<{
      data: { entry: { status: string } };
    }>(env, `/api/pump/${id}/resume`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resume.body.data.entry.status).toBe("active");
  });

  test("lists pump entries", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await insertPumpEntry(env);
    await insertPumpEntry(env);

    const { res, body } = await requestJson<{
      data: { entries: { id: number }[] };
    }>(env, "/api/pump", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.entries).toHaveLength(2);
  });

  test("edits a completed pump entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertPumpEntry(env);

    const { res, body } = await requestJson<{
      data: { entry: { amount_ml: number; notes: string } };
    }>(env, `/api/pump/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount_ml: 80, notes: "edited" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.amount_ml).toBe(80);
    expect(body.data.entry.notes).toBe("edited");
  });

  test("rejects edit of active pump entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertPumpEntry(env, {
      status: "active",
      ended_at: null,
    });

    const { res } = await requestJson(env, `/api/pump/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: "test" }),
    });

    expect(res.status).toBe(400);
  });

  test("deletes a pump entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertPumpEntry(env);

    const { res } = await requestJson(env, `/api/pump/${entry.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
  });
});
