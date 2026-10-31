-- Admin sign-out revokes that one session token (other devices stay signed in).
CREATE TABLE IF NOT EXISTS admin_revoked_tokens (
  jti TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_revoked_tokens_expires_idx ON admin_revoked_tokens (expires_at);
