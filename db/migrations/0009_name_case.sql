-- People's names in proper name case ("muhammad amir inayat" -> "Muhammad Amir Inayat"),
-- matching lib/format-name.ts for rows saved before names were normalised.
-- Emails, payment account titles, product and brand names are not touched.
UPDATE users SET name = initcap(regexp_replace(btrim(name), '\s+', ' ', 'g'))
  WHERE name IS DISTINCT FROM initcap(regexp_replace(btrim(name), '\s+', ' ', 'g'));

UPDATE admin_users SET name = initcap(regexp_replace(btrim(name), '\s+', ' ', 'g'))
  WHERE name IS DISTINCT FROM initcap(regexp_replace(btrim(name), '\s+', ' ', 'g'));

UPDATE orders SET customer_name = initcap(regexp_replace(btrim(customer_name), '\s+', ' ', 'g'))
  WHERE customer_name IS DISTINCT FROM initcap(regexp_replace(btrim(customer_name), '\s+', ' ', 'g'));

UPDATE telegram_users SET first_name = initcap(regexp_replace(btrim(first_name), '\s+', ' ', 'g'))
  WHERE first_name IS NOT NULL AND first_name IS DISTINCT FROM initcap(regexp_replace(btrim(first_name), '\s+', ' ', 'g'));

UPDATE telegram_admins SET first_name = initcap(regexp_replace(btrim(first_name), '\s+', ' ', 'g'))
  WHERE first_name IS NOT NULL AND first_name IS DISTINCT FROM initcap(regexp_replace(btrim(first_name), '\s+', ' ', 'g'));
