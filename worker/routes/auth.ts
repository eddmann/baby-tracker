import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings } from "../types";
import { createD1ConfigRepository } from "../repositories/d1/config.d1";
import { createD1SessionRepository } from "../repositories/d1/session.d1";
import { verifyPinUseCase } from "../usecases/verify-pin.usecase";
import { errorToHttpStatus, errorToMessage } from "../usecases/errors";

const auth = new Hono<AppBindings>();

const verifySchema = z.object({
  pin: z.string().min(1, "PIN is required"),
});

auth.post("/verify", zValidator("json", verifySchema), async (c) => {
  const body = c.req.valid("json");

  const configRepository = createD1ConfigRepository(c.env);
  const sessionRepository = createD1SessionRepository(c.env);

  const result = await verifyPinUseCase(
    { configRepository, sessionRepository },
    { pin: body.pin },
  );

  if (!result.ok) {
    return c.json(
      { error: errorToMessage(result.error) },
      errorToHttpStatus(result.error),
    );
  }

  return c.json({ data: { token: result.value.token } });
});

auth.get("/check", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  const sessionRepository = createD1SessionRepository(c.env);
  const session = await sessionRepository.getByToken(token);

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ data: { valid: true } });
});

export default auth;
