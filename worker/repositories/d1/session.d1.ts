import type { Env, Session } from "../../types";
import type { SessionRepository } from "../interfaces/session.repository";

export function createD1SessionRepository(env: Env): SessionRepository {
  return {
    async create(token: string, expiresAt: string): Promise<void> {
      await env.DB.prepare(
        "INSERT INTO sessions (token, expires_at) VALUES (?, ?)",
      )
        .bind(token, expiresAt)
        .run();
    },

    async getByToken(token: string): Promise<Session | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM sessions WHERE token = ? AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')",
      )
        .bind(token)
        .first<Session>();
      return row ?? null;
    },

    async delete(token: string): Promise<void> {
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?")
        .bind(token)
        .run();
    },
  };
}
