-- Binds an unverified signup to the browser that started it, so a code sent to
-- the inbox owner can only activate the password set in that same browser.
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_token_hash TEXT;
