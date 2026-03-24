let idCounter = 1;
const nextId = () => idCounter++;

function nextIdWithOverride(overrideId?: number) {
  if (overrideId !== undefined) {
    if (overrideId >= idCounter) {
      idCounter = overrideId + 1;
    }
    return overrideId;
  }
  return nextId();
}

export function resetIdCounter() {
  idCounter = 1;
}

const DEFAULT_NOW = "2026-01-01T12:00:00Z";

interface SleepEntry {
  id: number;
  started_at: string;
  ended_at: string | null;
  status: "active" | "paused" | "completed";
  pauses: string;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

interface FeedEntry {
  id: number;
  type: "breast" | "formula" | "expressed";
  side: "left" | "right" | null;
  started_at: string;
  ended_at: string | null;
  status: "active" | "paused" | "completed";
  pauses: string;
  amount_ml: number | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

interface NappyEntry {
  id: number;
  type: "wet" | "dirty" | "both";
  occurred_at: string;
  notes: string | null;
  created_at: string;
}

interface PumpEntry {
  id: number;
  started_at: string;
  ended_at: string | null;
  status: "active" | "paused" | "completed";
  pauses: string;
  amount_ml: number | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

interface DailyTask {
  id: number;
  name: string;
  frequency_days: number;
  start_date: string | null;
  completed_today: boolean;
  last_completed_at: string | null;
  created_at: string;
}

interface DashboardData {
  active_timers: {
    type: "sleep" | "feed" | "pump";
    entry: Record<string, unknown>;
  }[];
  last_sleep: Record<string, unknown> | null;
  last_feed: Record<string, unknown> | null;
  last_nappy: Record<string, unknown> | null;
  last_pump: Record<string, unknown> | null;
  today: {
    nappy_count: number;
    nappy_target: number;
    feed_count: number;
    hours_since_last_feed: number | null;
    feed_interval_target: number;
  };
  daily_tasks: {
    total_count: number;
    due_count: number;
    completed_count: number;
  } | null;
}

export function createSleepEntry(overrides?: Partial<SleepEntry>): SleepEntry {
  const id = nextIdWithOverride(overrides?.id);
  return {
    id,
    started_at: DEFAULT_NOW,
    ended_at: "2026-01-01T14:00:00Z",
    status: "completed",
    pauses: "[]",
    duration_seconds: 7200,
    notes: null,
    created_at: DEFAULT_NOW,
    ...overrides,
  };
}

export function createFeedEntry(overrides?: Partial<FeedEntry>): FeedEntry {
  const id = nextIdWithOverride(overrides?.id);
  return {
    id,
    type: "breast",
    side: "left",
    started_at: DEFAULT_NOW,
    ended_at: "2026-01-01T12:30:00Z",
    status: "completed",
    pauses: "[]",
    amount_ml: null,
    duration_seconds: 1800,
    notes: null,
    created_at: DEFAULT_NOW,
    ...overrides,
  };
}

export function createNappyEntry(overrides?: Partial<NappyEntry>): NappyEntry {
  const id = nextIdWithOverride(overrides?.id);
  return {
    id,
    type: "wet",
    occurred_at: DEFAULT_NOW,
    notes: null,
    created_at: DEFAULT_NOW,
    ...overrides,
  };
}

export function createPumpEntry(overrides?: Partial<PumpEntry>): PumpEntry {
  const id = nextIdWithOverride(overrides?.id);
  return {
    id,
    started_at: DEFAULT_NOW,
    ended_at: "2026-01-01T12:20:00Z",
    status: "completed",
    pauses: "[]",
    amount_ml: 120,
    duration_seconds: 1200,
    notes: null,
    created_at: DEFAULT_NOW,
    ...overrides,
  };
}

export function createDailyTask(overrides?: Partial<DailyTask>): DailyTask {
  const id = nextIdWithOverride(overrides?.id);
  return {
    id,
    name: `Task ${id}`,
    frequency_days: 1,
    start_date: null,
    completed_today: false,
    last_completed_at: null,
    created_at: DEFAULT_NOW,
    ...overrides,
  };
}

export function createDashboardData(
  overrides?: Partial<DashboardData>,
): DashboardData {
  return {
    active_timers: [],
    last_sleep: createSleepEntry() as unknown as Record<string, unknown>,
    last_feed: createFeedEntry() as unknown as Record<string, unknown>,
    last_nappy: createNappyEntry() as unknown as Record<string, unknown>,
    last_pump: null,
    today: {
      nappy_count: 4,
      nappy_target: 6,
      feed_count: 3,
      hours_since_last_feed: 1.5,
      feed_interval_target: 3,
    },
    daily_tasks: {
      total_count: 3,
      due_count: 2,
      completed_count: 1,
    },
    ...overrides,
  };
}
