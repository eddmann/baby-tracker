export interface Env {
  DB: import("@cloudflare/workers-types").D1Database;
  ASSETS?: import("@cloudflare/workers-types").Fetcher;
  PIN_HASH?: string;
}

export interface Session {
  id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export type TimerStatus = "active" | "paused" | "completed";

export interface Pause {
  paused_at: string;
  resumed_at: string | null;
}

export interface SleepEntry {
  id: number;
  status: TimerStatus;
  started_at: string;
  ended_at: string | null;
  pauses: string;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FeedType = "breast" | "formula" | "expressed";
export type BreastSide = "left" | "right";

export interface FeedEntry {
  id: number;
  type: FeedType;
  status: TimerStatus;
  side: BreastSide | null;
  started_at: string;
  ended_at: string | null;
  pauses: string;
  duration_seconds: number | null;
  amount_ml: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NappyType = "wet" | "dirty" | "both";

export interface NappyEntry {
  id: number;
  type: NappyType;
  occurred_at: string;
  notes: string | null;
  created_at: string;
}

export interface PumpEntry {
  id: number;
  status: TimerStatus;
  started_at: string;
  ended_at: string | null;
  pauses: string;
  duration_seconds: number | null;
  amount_ml: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyTask {
  id: number;
  name: string;
  frequency_days: number;
  start_date: string | null;
  created_at: string;
}

export interface DailyTaskCompletion {
  id: number;
  task_id: number;
  completed_at: string;
  created_at: string;
}

export interface DailyTaskWithStatus extends DailyTask {
  is_due: boolean;
  is_completed_today: boolean;
  last_completed_at: string | null;
  next_due_date: string | null;
}

export type AppBindings = {
  Bindings: Env;
};
