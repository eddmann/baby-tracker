CREATE TABLE IF NOT EXISTS pump_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  pauses TEXT NOT NULL DEFAULT '[]',
  duration_seconds INTEGER,
  amount_ml INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pump_entries_status ON pump_entries(status);
CREATE INDEX IF NOT EXISTS idx_pump_entries_started_at ON pump_entries(started_at);
