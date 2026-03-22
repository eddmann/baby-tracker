import type { Env, SleepEntry } from "../../types";
import type { SleepRepository } from "../interfaces/sleep.repository";

export function createD1SleepRepository(env: Env): SleepRepository {
  return {
    async create(): Promise<SleepEntry> {
      const now = new Date().toISOString();
      const row = await env.DB.prepare(
        "INSERT INTO sleep_entries (status, started_at, created_at, updated_at) VALUES ('active', ?, ?, ?) RETURNING *",
      )
        .bind(now, now, now)
        .first<SleepEntry>();
      return row!;
    },

    async getById(id: number): Promise<SleepEntry | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM sleep_entries WHERE id = ?",
      )
        .bind(id)
        .first<SleepEntry>();
      return row ?? null;
    },

    async getActive(): Promise<SleepEntry | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM sleep_entries WHERE status IN ('active', 'paused') ORDER BY started_at DESC LIMIT 1",
      ).first<SleepEntry>();
      return row ?? null;
    },

    async update(id: number, updates: Partial<SleepEntry>): Promise<void> {
      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.started_at !== undefined) {
        fields.push("started_at = ?");
        values.push(updates.started_at);
      }
      if (updates.status !== undefined) {
        fields.push("status = ?");
        values.push(updates.status);
      }
      if (updates.ended_at !== undefined) {
        fields.push("ended_at = ?");
        values.push(updates.ended_at);
      }
      if (updates.pauses !== undefined) {
        fields.push("pauses = ?");
        values.push(updates.pauses);
      }
      if (updates.duration_seconds !== undefined) {
        fields.push("duration_seconds = ?");
        values.push(updates.duration_seconds);
      }
      if (updates.notes !== undefined) {
        fields.push("notes = ?");
        values.push(updates.notes);
      }

      fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
      values.push(id);

      await env.DB.prepare(
        `UPDATE sleep_entries SET ${fields.join(", ")} WHERE id = ?`,
      )
        .bind(...values)
        .run();
    },

    async listRecent(limit: number): Promise<SleepEntry[]> {
      const { results } = await env.DB.prepare(
        "SELECT * FROM sleep_entries ORDER BY started_at DESC LIMIT ?",
      )
        .bind(limit)
        .all<SleepEntry>();
      return results;
    },

    async getLatestCompleted(): Promise<SleepEntry | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM sleep_entries WHERE status = 'completed' ORDER BY ended_at DESC LIMIT 1",
      ).first<SleepEntry>();
      return row ?? null;
    },

    async listByDate(start: string, end: string): Promise<SleepEntry[]> {
      const { results } = await env.DB.prepare(
        "SELECT * FROM sleep_entries WHERE started_at >= ? AND started_at < ? ORDER BY started_at DESC",
      )
        .bind(start, end)
        .all<SleepEntry>();
      return results;
    },

    async delete(id: number): Promise<void> {
      await env.DB.prepare("DELETE FROM sleep_entries WHERE id = ?")
        .bind(id)
        .run();
    },
  };
}
