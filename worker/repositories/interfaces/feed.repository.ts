import type { FeedEntry, FeedType, BreastSide } from "../../types";

export interface FeedRepository {
  createBreast(side: BreastSide): Promise<FeedEntry>;
  createInstant(type: FeedType, amountMl: number, notes?: string | null): Promise<FeedEntry>;
  getById(id: number): Promise<FeedEntry | null>;
  getActive(): Promise<FeedEntry | null>;
  update(id: number, updates: Partial<FeedEntry>): Promise<void>;
  listRecent(limit: number): Promise<FeedEntry[]>;
  getLatestCompleted(): Promise<FeedEntry | null>;
  countByDate(start: string, end: string): Promise<number>;
  listByDate(start: string, end: string): Promise<FeedEntry[]>;
  delete(id: number): Promise<void>;
}
