-- Time zones. Timestamps stay timestamptz (UTC); these only control display.
-- users.timezone: IANA zone from the latest geo lookup, used for emails and
-- Telegram messages (no browser there). Filled by lib/activity on each event.
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Backfill from each customer's latest activity row that has a zone.
UPDATE users u
SET timezone = a.timezone_id
FROM (
  SELECT DISTINCT ON (user_id) user_id, timezone_id
  FROM activity_log
  WHERE user_id IS NOT NULL AND timezone_id IS NOT NULL AND actor_type <> 'admin'
  ORDER BY user_id, created_at DESC
) a
WHERE a.user_id = u.id AND u.timezone IS NULL;

-- Store time zone for reports (dashboard months, revenue graph). Admin-editable.
UPDATE site_settings
SET data = data || '{"storeTimezone": "Asia/Karachi"}'::jsonb
WHERE id = 1 AND NOT (data ? 'storeTimezone');
