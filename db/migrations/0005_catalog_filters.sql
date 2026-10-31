-- Brand filter + indexes for server-side catalogue filtering.
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
CREATE INDEX IF NOT EXISTS products_brand_idx ON products (brand) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_created_idx ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS product_variants_active_idx ON product_variants (product_id, status, price);
CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items (product_id);
