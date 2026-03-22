CREATE TABLE IF NOT EXISTS sleep_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  pauses TEXT NOT NULL DEFAULT '[]',
  duration_seconds INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sleep_entries_status ON sleep_entries(status);
CREATE INDEX IF NOT EXISTS idx_sleep_entries_started_at ON sleep_entries(started_at);
