CREATE TABLE IF NOT EXISTS feed_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('breast', 'formula', 'expressed')),
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'completed')) DEFAULT 'completed',
  side TEXT CHECK(side IN ('left', 'right', NULL)),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  pauses TEXT NOT NULL DEFAULT '[]',
  duration_seconds INTEGER,
  amount_ml INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feed_entries_status ON feed_entries(status);
CREATE INDEX IF NOT EXISTS idx_feed_entries_type ON feed_entries(type);
CREATE INDEX IF NOT EXISTS idx_feed_entries_started_at ON feed_entries(started_at);
