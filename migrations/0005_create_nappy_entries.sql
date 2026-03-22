CREATE TABLE IF NOT EXISTS nappy_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('wet', 'dirty', 'both')),
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_nappy_entries_occurred_at ON nappy_entries(occurred_at);
