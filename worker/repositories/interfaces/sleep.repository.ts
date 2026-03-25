import type { SleepEntry } from "../../types";

export interface SleepRepository {
  create(): Promise<SleepEntry>;
  getById(id: number): Promise<SleepEntry | null>;
  getActive(): Promise<SleepEntry | null>;
  update(id: number, updates: Partial<SleepEntry>): Promise<void>;
  listRecent(limit: number): Promise<SleepEntry[]>;
  getLatestCompleted(): Promise<SleepEntry | null>;
  listByDate(start: string, end: string): Promise<SleepEntry[]>;
  countByDate(start: string, end: string): Promise<number>;
  delete(id: number): Promise<void>;
}
