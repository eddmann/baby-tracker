import { describe, test, expect } from "bun:test";
import {
  createHttpEnv,
  requestJson,
  authenticateWithPin,
  insertNappyEntry,
} from "./helpers";

describe("HTTP /api/nappy", () => {
  test("returns 401 when not authenticated", async () => {
    const env = await createHttpEnv();

    const { res } = await requestJson(env, "/api/nappy");
    expect(res.status).toBe(401);
  });

  test("logs a wet nappy", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { entry: { type: string; notes: null } };
    }>(env, "/api/nappy", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "wet" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.type).toBe("wet");
  });

  test("logs a dirty nappy with notes", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { entry: { type: string; notes: string } };
    }>(env, "/api/nappy", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "dirty", notes: "after feed" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.type).toBe("dirty");
    expect(body.data.entry.notes).toBe("after feed");
  });

  test("logs a both nappy", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { entry: { type: string } };
    }>(env, "/api/nappy", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "both" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.type).toBe("both");
  });

  test("lists nappy entries", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    await insertNappyEntry(env, { type: "wet" });
    await insertNappyEntry(env, { type: "dirty" });
    await insertNappyEntry(env, { type: "both" });

    const { res, body } = await requestJson<{
      data: { entries: { id: number }[] };
    }>(env, "/api/nappy", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.entries).toHaveLength(3);
  });

  test("edits a nappy entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertNappyEntry(env, { type: "wet" });

    const { res, body } = await requestJson<{
      data: { entry: { type: string; notes: string } };
    }>(env, `/api/nappy/${entry.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "dirty", notes: "edited" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.entry.type).toBe("dirty");
    expect(body.data.entry.notes).toBe("edited");
  });

  test("returns 404 for editing non-existent nappy entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res } = await requestJson(env, "/api/nappy/9999", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "wet" }),
    });

    expect(res.status).toBe(404);
  });

  test("deletes a nappy entry", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const entry = await insertNappyEntry(env);

    const { res } = await requestJson(env, `/api/nappy/${entry.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
  });
});
