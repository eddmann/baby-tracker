import { describe, test, expect } from "bun:test";
import { createHttpEnv, requestJson, authenticateWithPin } from "./helpers";

describe("HTTP /api/auth", () => {
  test("verifies PIN and returns token", async () => {
    const env = await createHttpEnv();

    const { res, body } = await requestJson<{
      data: { token: string };
    }>(env, "/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ pin: "1234" }),
    });

    expect(res.status).toBe(200);
    expect(body.data.token.length).toBeGreaterThan(0);
  });

  test("first PIN sets the PIN, subsequent must match", async () => {
    const env = await createHttpEnv();

    // First call sets the PIN
    const first = await requestJson<{ data: { token: string } }>(
      env,
      "/api/auth/verify",
      {
        method: "POST",
        body: JSON.stringify({ pin: "5678" }),
      },
    );
    expect(first.res.status).toBe(200);

    // Same PIN works
    const second = await requestJson<{ data: { token: string } }>(
      env,
      "/api/auth/verify",
      {
        method: "POST",
        body: JSON.stringify({ pin: "5678" }),
      },
    );
    expect(second.res.status).toBe(200);

    // Wrong PIN fails
    const wrong = await requestJson<{ error: string }>(
      env,
      "/api/auth/verify",
      {
        method: "POST",
        body: JSON.stringify({ pin: "0000" }),
      },
    );
    expect(wrong.res.status).toBe(401);
  });

  test("check returns valid for authenticated session", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);

    const { res, body } = await requestJson<{
      data: { valid: boolean };
    }>(env, "/api/auth/check", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(body.data.valid).toBe(true);
  });

  test("check returns 401 without token", async () => {
    const env = await createHttpEnv();

    const { res } = await requestJson<{ error: string }>(
      env,
      "/api/auth/check",
    );

    expect(res.status).toBe(401);
  });
});
