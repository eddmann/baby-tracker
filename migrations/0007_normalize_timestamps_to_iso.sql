-- Normalize all existing timestamps from SQLite space-separated format
-- ("YYYY-MM-DD HH:MM:SS") to ISO 8601 format ("YYYY-MM-DDTHH:MM:SS.sssZ")

-- sleep_entries
UPDATE sleep_entries SET started_at = strftime('%Y-%m-%dT%H:%M:%fZ', started_at) WHERE started_at NOT LIKE '%T%';
UPDATE sleep_entries SET ended_at = strftime('%Y-%m-%dT%H:%M:%fZ', ended_at) WHERE ended_at IS NOT NULL AND ended_at NOT LIKE '%T%';
UPDATE sleep_entries SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE sleep_entries SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at NOT LIKE '%T%';

-- feed_entries
UPDATE feed_entries SET started_at = strftime('%Y-%m-%dT%H:%M:%fZ', started_at) WHERE started_at NOT LIKE '%T%';
UPDATE feed_entries SET ended_at = strftime('%Y-%m-%dT%H:%M:%fZ', ended_at) WHERE ended_at IS NOT NULL AND ended_at NOT LIKE '%T%';
UPDATE feed_entries SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE feed_entries SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at NOT LIKE '%T%';

-- nappy_entries
UPDATE nappy_entries SET occurred_at = strftime('%Y-%m-%dT%H:%M:%fZ', occurred_at) WHERE occurred_at NOT LIKE '%T%';
UPDATE nappy_entries SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';

-- pump_entries
UPDATE pump_entries SET started_at = strftime('%Y-%m-%dT%H:%M:%fZ', started_at) WHERE started_at NOT LIKE '%T%';
UPDATE pump_entries SET ended_at = strftime('%Y-%m-%dT%H:%M:%fZ', ended_at) WHERE ended_at IS NOT NULL AND ended_at NOT LIKE '%T%';
UPDATE pump_entries SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE pump_entries SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at NOT LIKE '%T%';

-- sessions
UPDATE sessions SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';

-- config
UPDATE config SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at) WHERE created_at NOT LIKE '%T%';
UPDATE config SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) WHERE updated_at NOT LIKE '%T%';
