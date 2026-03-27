import type { GrowthEntry } from "../../types";

export interface GrowthRepository {
  create(
    weightGrams: number | null,
    heightMm: number | null,
    measuredAt?: string,
    notes?: string | null,
  ): Promise<GrowthEntry>;
  getById(id: number): Promise<GrowthEntry | null>;
  listRecent(limit: number): Promise<GrowthEntry[]>;
  getLatest(): Promise<GrowthEntry | null>;
  update(id: number, updates: Partial<GrowthEntry>): Promise<void>;
  delete(id: number): Promise<void>;
}
