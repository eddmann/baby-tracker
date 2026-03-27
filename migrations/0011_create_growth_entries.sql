CREATE TABLE IF NOT EXISTS growth_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weight_grams INTEGER,
  height_mm INTEGER,
  measured_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_growth_entries_measured_at ON growth_entries(measured_at);
