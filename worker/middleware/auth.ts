import { createMiddleware } from "hono/factory";
import type { Env, AppBindings } from "../types";
import { createD1SessionRepository } from "../repositories/d1/session.d1";

const BEARER_PREFIX = "Bearer ";

export async function getSessionFromRequest(
  request: Request,
  env: Env,
): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith(BEARER_PREFIX)) {
    return false;
  }

  const token = authHeader.slice(BEARER_PREFIX.length);
  if (!token) {
    return false;
  }

  const sessionRepository = createD1SessionRepository(env);
  const session = await sessionRepository.getByToken(token);

  return !!session;
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 256;

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    HASH_LENGTH,
  );

  return toHex(salt) + ":" + toHex(new Uint8Array(hash));
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }

  const salt = fromHex(saltHex);
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    HASH_LENGTH,
  );

  return toHex(new Uint8Array(hash)) === hashHex;
}

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const isValid = await getSessionFromRequest(c.req.raw, c.env);
  if (!isValid) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});
