-- Add start_date to daily_tasks so tasks can be deferred to a future date
ALTER TABLE daily_tasks ADD COLUMN start_date TEXT;
