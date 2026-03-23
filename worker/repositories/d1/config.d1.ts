import type { Env } from "../../types";
import type { ConfigRepository } from "../interfaces/config.repository";

export function createD1ConfigRepository(env: Env): ConfigRepository {
  return {
    async get(key: string): Promise<string | null> {
      const row = await env.DB.prepare("SELECT value FROM config WHERE key = ?")
        .bind(key)
        .first<{ value: string }>();
      return row?.value ?? null;
    },

    async set(key: string, value: string): Promise<void> {
      await env.DB.prepare(
        "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')",
      )
        .bind(key, value, value)
        .run();
    },
  };
}
