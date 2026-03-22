import type { PumpEntry } from "../../types";

export interface PumpRepository {
  create(): Promise<PumpEntry>;
  getById(id: number): Promise<PumpEntry | null>;
  getActive(): Promise<PumpEntry | null>;
  update(id: number, updates: Partial<PumpEntry>): Promise<void>;
  listRecent(limit: number): Promise<PumpEntry[]>;
  getLatestCompleted(): Promise<PumpEntry | null>;
  listByDate(start: string, end: string): Promise<PumpEntry[]>;
  delete(id: number): Promise<void>;
}
