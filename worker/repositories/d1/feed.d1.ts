import type { Env, FeedEntry, FeedType, BreastSide } from "../../types";
import type { FeedRepository } from "../interfaces/feed.repository";

function normalizeRow<T extends FeedEntry | null>(row: T): T {
  if (!row) return row;
  return { ...row, is_tracked: Boolean(row.is_tracked) };
}

export function createD1FeedRepository(env: Env): FeedRepository {
  return {
    async createBreast(side: BreastSide): Promise<FeedEntry> {
      const now = new Date().toISOString();
      const row = await env.DB.prepare(
        "INSERT INTO feed_entries (type, status, side, started_at, created_at, updated_at) VALUES ('breast', 'active', ?, ?, ?, ?) RETURNING *",
      )
        .bind(side, now, now, now)
        .first<FeedEntry>();
      return normalizeRow(row!);
    },

    async createInstant(
      type: FeedType,
      amountMl: number,
      notes?: string | null,
    ): Promise<FeedEntry> {
      const now = new Date().toISOString();
      const row = await env.DB.prepare(
        "INSERT INTO feed_entries (type, status, amount_ml, notes, started_at, ended_at, created_at, updated_at) VALUES (?, 'completed', ?, ?, ?, ?, ?, ?) RETURNING *",
      )
        .bind(type, amountMl, notes ?? null, now, now, now, now)
        .first<FeedEntry>();
      return normalizeRow(row!);
    },

    async getById(id: number): Promise<FeedEntry | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM feed_entries WHERE id = ?",
      )
        .bind(id)
        .first<FeedEntry>();
      return normalizeRow(row ?? null);
    },

    async getActive(): Promise<FeedEntry | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM feed_entries WHERE status IN ('active', 'paused') ORDER BY started_at DESC LIMIT 1",
      ).first<FeedEntry>();
      return normalizeRow(row ?? null);
    },

    async update(id: number, updates: Partial<FeedEntry>): Promise<void> {
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
      if (updates.side !== undefined) {
        fields.push("side = ?");
        values.push(updates.side);
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
      if (updates.amount_ml !== undefined) {
        fields.push("amount_ml = ?");
        values.push(updates.amount_ml);
      }
      if (updates.is_tracked !== undefined) {
        fields.push("is_tracked = ?");
        values.push(updates.is_tracked ? 1 : 0);
      }
      if (updates.notes !== undefined) {
        fields.push("notes = ?");
        values.push(updates.notes);
      }

      fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
      values.push(id);

      await env.DB.prepare(
        `UPDATE feed_entries SET ${fields.join(", ")} WHERE id = ?`,
      )
        .bind(...values)
        .run();
    },

    async listRecent(limit: number): Promise<FeedEntry[]> {
      const { results } = await env.DB.prepare(
        "SELECT * FROM feed_entries ORDER BY started_at DESC LIMIT ?",
      )
        .bind(limit)
        .all<FeedEntry>();
      return results.map(normalizeRow);
    },

    async getLatestCompleted(): Promise<FeedEntry | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM feed_entries WHERE status = 'completed' ORDER BY COALESCE(ended_at, started_at) DESC LIMIT 1",
      ).first<FeedEntry>();
      return normalizeRow(row ?? null);
    },

    async countByDate(start: string, end: string): Promise<number> {
      const row = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM feed_entries WHERE started_at >= ? AND started_at < ? AND status = 'completed' AND is_tracked = 1",
      )
        .bind(start, end)
        .first<{ count: number }>();
      return row?.count ?? 0;
    },

    async listByDate(start: string, end: string): Promise<FeedEntry[]> {
      const { results } = await env.DB.prepare(
        "SELECT * FROM feed_entries WHERE started_at >= ? AND started_at < ? ORDER BY started_at DESC",
      )
        .bind(start, end)
        .all<FeedEntry>();
      return results.map(normalizeRow);
    },

    async delete(id: number): Promise<void> {
      await env.DB.prepare("DELETE FROM feed_entries WHERE id = ?")
        .bind(id)
        .run();
    },
  };
}
