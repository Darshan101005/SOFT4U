-- Last-active-admin invariant at the database level: an UPDATE or DELETE that
-- would leave zero active admins is rejected, whatever code path issued it.
CREATE OR REPLACE FUNCTION soft4u_keep_one_active_admin() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE status = 'active') THEN
    RAISE EXCEPTION 'LAST_ACTIVE_ADMIN: at least one active admin must remain' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_users_keep_one_active ON admin_users;
CREATE TRIGGER admin_users_keep_one_active
  AFTER UPDATE OR DELETE ON admin_users
  FOR EACH STATEMENT EXECUTE FUNCTION soft4u_keep_one_active_admin();
