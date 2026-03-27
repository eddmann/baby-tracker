import type { Env, GrowthEntry } from "../../types";
import type { GrowthRepository } from "../interfaces/growth.repository";

export function createD1GrowthRepository(env: Env): GrowthRepository {
  return {
    async create(
      weightGrams: number | null,
      heightMm: number | null,
      measuredAt?: string,
      notes?: string | null,
    ): Promise<GrowthEntry> {
      const now = new Date().toISOString();
      const row = await env.DB.prepare(
        "INSERT INTO growth_entries (weight_grams, height_mm, measured_at, notes, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *",
      )
        .bind(weightGrams, heightMm, measuredAt ?? now, notes ?? null, now)
        .first<GrowthEntry>();
      return row!;
    },

    async getById(id: number): Promise<GrowthEntry | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM growth_entries WHERE id = ?",
      )
        .bind(id)
        .first<GrowthEntry>();
      return row ?? null;
    },

    async listRecent(limit: number): Promise<GrowthEntry[]> {
      const { results } = await env.DB.prepare(
        "SELECT * FROM growth_entries ORDER BY measured_at DESC LIMIT ?",
      )
        .bind(limit)
        .all<GrowthEntry>();
      return results;
    },

    async getLatest(): Promise<GrowthEntry | null> {
      const row = await env.DB.prepare(
        "SELECT * FROM growth_entries ORDER BY measured_at DESC LIMIT 1",
      ).first<GrowthEntry>();
      return row ?? null;
    },

    async update(id: number, updates: Partial<GrowthEntry>): Promise<void> {
      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.weight_grams !== undefined) {
        fields.push("weight_grams = ?");
        values.push(updates.weight_grams);
      }
      if (updates.height_mm !== undefined) {
        fields.push("height_mm = ?");
        values.push(updates.height_mm);
      }
      if (updates.measured_at !== undefined) {
        fields.push("measured_at = ?");
        values.push(updates.measured_at);
      }
      if (updates.notes !== undefined) {
        fields.push("notes = ?");
        values.push(updates.notes);
      }

      if (fields.length === 0) return;

      values.push(id);
      await env.DB.prepare(
        `UPDATE growth_entries SET ${fields.join(", ")} WHERE id = ?`,
      )
        .bind(...values)
        .run();
    },

    async delete(id: number): Promise<void> {
      await env.DB.prepare("DELETE FROM growth_entries WHERE id = ?")
        .bind(id)
        .run();
    },
  };
}
