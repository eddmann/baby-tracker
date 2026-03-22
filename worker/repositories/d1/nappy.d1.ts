import type { Env, NappyEntry, NappyType } from "../../types";
import type { NappyRepository } from "../interfaces/nappy.repository";

export function createD1NappyRepository(env: Env): NappyRepository {
  return {
    async create(type: NappyType, notes?: string | null): Promise<NappyEntry> {
      const now = new Date().toISOString();
      const row = await env.DB.prepare(
        "INSERT INTO nappy_entries (type, notes, occurred_at, created_at) VALUES (?, ?, ?, ?) RETURNING *",
      )
        .bind(type, notes ?? null, now, now)
        .first<NappyEntry>();
      return row!;
    },

    async getById(id: number): Promise<NappyEntry | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM nappy_entries WHERE id = ?",
      )
        .bind(id)
        .first<NappyEntry>();
      return row ?? null;
    },

    async listRecent(limit: number): Promise<NappyEntry[]> {
      const { results } = await env.DB.prepare(
        "SELECT * FROM nappy_entries ORDER BY occurred_at DESC LIMIT ?",
      )
        .bind(limit)
        .all<NappyEntry>();
      return results;
    },

    async getLatest(): Promise<NappyEntry | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM nappy_entries ORDER BY occurred_at DESC LIMIT 1",
      ).first<NappyEntry>();
      return row ?? null;
    },

    async countByDate(start: string, end: string): Promise<number> {
      const row = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM nappy_entries WHERE occurred_at >= ? AND occurred_at < ?",
      )
        .bind(start, end)
        .first<{ count: number }>();
      return row?.count ?? 0;
    },

    async listByDate(start: string, end: string): Promise<NappyEntry[]> {
      const { results } = await env.DB.prepare(
        "SELECT * FROM nappy_entries WHERE occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC",
      )
        .bind(start, end)
        .all<NappyEntry>();
      return results;
    },

    async update(id: number, updates: Partial<NappyEntry>): Promise<void> {
      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.type !== undefined) {
        fields.push("type = ?");
        values.push(updates.type);
      }
      if (updates.occurred_at !== undefined) {
        fields.push("occurred_at = ?");
        values.push(updates.occurred_at);
      }
      if (updates.notes !== undefined) {
        fields.push("notes = ?");
        values.push(updates.notes);
      }

      if (fields.length === 0) return;

      values.push(id);
      await env.DB.prepare(
        `UPDATE nappy_entries SET ${fields.join(", ")} WHERE id = ?`,
      )
        .bind(...values)
        .run();
    },

    async delete(id: number): Promise<void> {
      await env.DB.prepare("DELETE FROM nappy_entries WHERE id = ?")
        .bind(id)
        .run();
    },
  };
}
