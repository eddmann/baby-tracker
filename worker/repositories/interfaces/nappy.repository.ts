import type { NappyEntry, NappyType } from "../../types";

export interface NappyRepository {
  create(type: NappyType, notes?: string | null): Promise<NappyEntry>;
  getById(id: number): Promise<NappyEntry | null>;
  listRecent(limit: number): Promise<NappyEntry[]>;
  getLatest(): Promise<NappyEntry | null>;
  countByDate(start: string, end: string): Promise<number>;
  listByDate(start: string, end: string): Promise<NappyEntry[]>;
  update(id: number, updates: Partial<NappyEntry>): Promise<void>;
  delete(id: number): Promise<void>;
}
