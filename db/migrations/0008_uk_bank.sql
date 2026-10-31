-- UK bank account (Monzo, receives GBP).
-- payment_methods.pay_currency is the currency the account receives; the
-- existing accounts receive PKR. sort_code is for UK bank accounts.
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS sort_code TEXT NOT NULL DEFAULT '';
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS pay_currency TEXT NOT NULL DEFAULT 'PKR';

-- Amount the customer sends when the account currency differs from the order
-- currency (GBP for Monzo), locked when the payment proof is submitted.
-- pay_fx_rate = units of pay_currency per 1 unit of the order currency.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pay_currency TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pay_amount NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pay_fx_rate NUMERIC(18,8);

INSERT INTO payment_methods (id, key, name, type, description, account_title, account_number, iban, bank_name, branch, sort_code, pay_currency, instructions, logo, currencies, enabled, display_order)
VALUES (
  'pm_monzo_uk',
  'monzo_uk',
  'UK Bank Transfer (Monzo)',
  'bank',
  'Pay by UK bank transfer in GBP, then upload your payment proof.',
  'INAYAT TRADERS LIMITED',
  '36913516',
  '',
  'Monzo Bank',
  '',
  '04-00-03',
  'GBP',
  'Send the amount shown in GBP by UK bank transfer (Faster Payments) to the account below, then upload a screenshot and enter the payment reference.',
  '/assets/payments/monzo.png',
  '["PKR","USD"]'::jsonb,
  true,
  4
)
ON CONFLICT (key) DO NOTHING;
