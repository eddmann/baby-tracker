-- Daily recurring tasks and their completions
CREATE TABLE IF NOT EXISTS daily_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  frequency_days INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_task_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  completed_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_task_completions_task_id ON daily_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_daily_task_completions_completed_at ON daily_task_completions(completed_at);
