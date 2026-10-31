-- Soft4u initial schema (Neon Postgres).
-- Applied by `bun run db:migrate`, tracked in schema_migrations.

-- ------------------------------------------------------------------
-- Customers + customer auth
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  suspended_reason TEXT,
  phone TEXT,
  whatsapp TEXT,
  telegram_username TEXT,
  avatar TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  totp_secret TEXT,
  totp_pending_secret TEXT,
  signup_ip TEXT,
  last_login_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_created_idx ON users (created_at DESC);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  pending_2fa BOOLEAN NOT NULL DEFAULT false,
  ip TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_idx ON user_sessions (expires_at);

-- One row per code sent. purpose: signup | password_reset
CREATE TABLE IF NOT EXISTS email_otps (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  link_token_hash TEXT,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_otps_lookup_idx ON email_otps (lower(email), purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS email_otps_link_idx ON email_otps (link_token_hash) WHERE link_token_hash IS NOT NULL;

-- Failed-login / abuse counters (key = 'login:<email>', 'admin-login:<email>', ...)
CREATE TABLE IF NOT EXISTS auth_attempts (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_attempts_key_idx ON auth_attempts (key, created_at DESC);

-- ------------------------------------------------------------------
-- Admins
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  totp_secret TEXT,
  totp_pending_secret TEXT,
  token_version INT NOT NULL DEFAULT 1,
  last_login_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower_key ON admin_users (lower(email));

-- ------------------------------------------------------------------
-- Catalogue
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  icon TEXT,
  banner TEXT,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  display_order INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS categories_status_idx ON categories (status, display_order);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  long_description TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  logo TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(12,2),
  discount INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'disabled', 'archived')),
  featured BOOLEAN NOT NULL DEFAULT false,
  bestseller BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  trending BOOLEAN NOT NULL DEFAULT false,
  badge TEXT,
  delivery_time TEXT NOT NULL DEFAULT '',
  delivery_method TEXT NOT NULL DEFAULT '',
  product_type TEXT NOT NULL DEFAULT 'Digital Subscription',
  inventory_model TEXT NOT NULL DEFAULT 'manual',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  usage_instructions TEXT NOT NULL DEFAULT '',
  refund_info TEXT NOT NULL DEFAULT '',
  seo_title TEXT,
  seo_description TEXT,
  related_product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_status_idx ON products (status, display_order);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_id);

-- stock_mode: vault (count of available vault items) | manual (admin-set stock) | preorder (manual delivery, always orderable)
-- usd_pricing_mode: auto (PKR / rate) | percent (auto + %) | amount (auto + $) | fixed (explicit USD price)
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  compare_at_price NUMERIC(12,2),
  sku TEXT NOT NULL DEFAULT '',
  stock INT NOT NULL DEFAULT 0,
  stock_mode TEXT NOT NULL DEFAULT 'preorder' CHECK (stock_mode IN ('vault', 'manual', 'preorder')),
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_method TEXT,
  delivery_time TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  expiry_days INT,
  usd_pricing_mode TEXT NOT NULL DEFAULT 'auto' CHECK (usd_pricing_mode IN ('auto', 'percent', 'amount', 'fixed')),
  usd_price NUMERIC(12,2),
  usd_markup_percent NUMERIC(8,2),
  usd_markup_amount NUMERIC(12,2),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants (product_id, display_order);

-- Vault: pre-stocked credentials / keys the admin can hand out on delivery.
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'credential',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'disabled', 'expired')),
  order_id TEXT,
  order_item_id TEXT,
  sold_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_items_lookup_idx ON inventory_items (product_id, variant_id, status);
CREATE INDEX IF NOT EXISTS inventory_items_order_idx ON inventory_items (order_id);

-- ------------------------------------------------------------------
-- Payments + orders
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('bank', 'easypaisa', 'jazzcash', 'other')),
  description TEXT NOT NULL DEFAULT '',
  account_title TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL DEFAULT '',
  iban TEXT NOT NULL DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  logo TEXT,
  currencies JSONB NOT NULL DEFAULT '["PKR"]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(12,2) NOT NULL,
  min_order_amount NUMERIC(12,2),
  max_discount NUMERIC(12,2),
  usage_limit INT,
  usage_count INT NOT NULL DEFAULT 0,
  per_user_limit INT,
  start_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT true,
  product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_upper_key ON coupons (upper(code));

-- order_status: pending (awaiting payment proof) | under_review | processing (approved, awaiting delivery)
--               | completed (delivered) | rejected | cancelled | expired | refunded
-- payment_status: pending | submitted | paid | rejected | refunded
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_whatsapp TEXT,
  customer_telegram TEXT,
  currency TEXT NOT NULL DEFAULT 'PKR' CHECK (currency IN ('PKR', 'USD')),
  fx_rate NUMERIC(14,6),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_pkr NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT '',
  payment_method_name TEXT NOT NULL DEFAULT '',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
  order_status TEXT NOT NULL DEFAULT 'pending',
  status_reason TEXT,
  delivery_channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_note TEXT,
  admin_note TEXT,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  ip TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  rejected_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivered_by TEXT,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_pending_expiry_idx ON orders (expires_at) WHERE order_status = 'pending';

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  variant_id TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  expiry_days INT,
  fulfillment_data JSONB,
  delivered_at TIMESTAMPTZ,
  position INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id, position);

CREATE TABLE IF NOT EXISTS payment_proofs (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method_key TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  sender_name TEXT,
  sender_account TEXT,
  amount NUMERIC(12,2),
  image_public_id TEXT,
  image_format TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected')),
  reject_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_proofs_order_idx ON payment_proofs (order_id, created_at DESC);
-- The same transaction id cannot be used for two live proofs (re-use fraud guard).
CREATE UNIQUE INDEX IF NOT EXISTS payment_proofs_txn_key ON payment_proofs (method_key, lower(transaction_id)) WHERE status <> 'rejected';

-- ------------------------------------------------------------------
-- Support + reviews
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  order_id TEXT,
  product_id TEXT,
  category TEXT NOT NULL DEFAULT 'General Support',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_customer_idx ON support_tickets (customer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_email_idx ON support_tickets (lower(customer_email));
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_idx ON ticket_messages (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  order_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'hidden', 'rejected')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_id, status);

-- ------------------------------------------------------------------
-- Content / CMS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  link TEXT,
  cta_text TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  priority INT NOT NULL DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT NOT NULL,
  mobile_image TEXT,
  cta_text TEXT,
  url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  priority INT NOT NULL DEFAULT 1,
  position TEXT NOT NULL DEFAULT 'home',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  display_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  product_id TEXT,
  category_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role_or_company TEXT,
  avatar TEXT,
  rating INT NOT NULL DEFAULT 5,
  content TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS navigation_items (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  parent_id TEXT,
  display_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  target_blank BOOLEAN NOT NULL DEFAULT false,
  position TEXT NOT NULL CHECK (position IN ('header', 'footer', 'mobile'))
);

CREATE TABLE IF NOT EXISTS legal_pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  draft_content TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  last_published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS homepage_sections (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Single-row settings document.
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reusable image library (Cloudinary assets, already preprocessed).
CREATE TABLE IF NOT EXISTS media_library (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL DEFAULT 'upload',
  width INT,
  height INT,
  format TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_library_name_idx ON media_library (lower(name));

-- ------------------------------------------------------------------
-- Activity / IP log (7-day sliding window, pruned opportunistically)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  actor_type TEXT NOT NULL DEFAULT 'customer',
  event_type TEXT NOT NULL,
  ipv4 TEXT,
  ipv6 TEXT,
  continent TEXT,
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  postal TEXT,
  calling_code TEXT,
  flag_img TEXT,
  flag_emoji TEXT,
  currency_code TEXT,
  timezone_id TEXT,
  timezone_utc TEXT,
  isp TEXT,
  org TEXT,
  is_vpn BOOLEAN NOT NULL DEFAULT false,
  vpn_service TEXT,
  vpn_url TEXT,
  is_proxy BOOLEAN NOT NULL DEFAULT false,
  is_tor BOOLEAN NOT NULL DEFAULT false,
  is_datacenter BOOLEAN NOT NULL DEFAULT false,
  is_mobile BOOLEAN NOT NULL DEFAULT false,
  is_crawler BOOLEAN NOT NULL DEFAULT false,
  is_abuser BOOLEAN NOT NULL DEFAULT false,
  user_agent TEXT,
  device TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_log_user_idx ON activity_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_created_idx ON activity_log (created_at);

-- ------------------------------------------------------------------
-- Email delivery log (sends are fire-and-forget; failures are recorded here)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_log (
  id BIGSERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  provider_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_log_created_idx ON email_log (created_at DESC);

-- Last good FX rate, so a cold start can fall back when the FX APIs are down.
CREATE TABLE IF NOT EXISTS fx_rates (
  base TEXT NOT NULL,
  quote TEXT NOT NULL,
  rate NUMERIC(14,6) NOT NULL,
  source TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (base, quote)
);

-- ------------------------------------------------------------------
-- Telegram bot
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_users (
  chat_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT,
  first_name TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS telegram_users_user_idx ON telegram_users (user_id);

CREATE TABLE IF NOT EXISTS telegram_admins (
  chat_id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  username TEXT,
  first_name TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS telegram_admins_admin_idx ON telegram_admins (admin_id);

-- 6-char single-use codes; exactly one of user_id / admin_id is set.
CREATE TABLE IF NOT EXISTS telegram_link_codes (
  code TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  admin_id TEXT REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((user_id IS NULL) <> (admin_id IS NULL))
);

CREATE TABLE IF NOT EXISTS telegram_state (
  chat_id TEXT PRIMARY KEY,
  mode TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
