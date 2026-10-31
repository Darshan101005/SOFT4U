-- Neutral payment wording in general copy. Only the exact seeded sentences are
-- rewritten, so text an admin has edited stays as it is. Checkout, order
-- payment details, order emails and admin keep the payment method names.

UPDATE products
SET long_description = replace(long_description,
  'Pay by bank transfer, Easypaisa or JazzCash, upload your payment screenshot',
  'Pay with any of our available payment methods, upload your payment screenshot')
WHERE long_description LIKE '%Pay by bank transfer, Easypaisa or JazzCash, upload your payment screenshot%';

UPDATE faqs
SET answer = 'We accept several bank and mobile wallet payment methods. At checkout you see the account details for the method you choose. Send the exact total, then upload your payment screenshot and transaction ID on the order page.'
WHERE answer = 'We accept bank transfer, Easypaisa and JazzCash. At checkout you see our account details. Send the exact amount, then upload your payment screenshot and transaction ID on the order page.';

UPDATE legal_pages
SET content = replace(replace(replace(content,
  '- Prices are shown in PKR or USD. You pay exactly the order total in the currency shown at checkout.',
  '- Prices are shown in the currency displayed on the site; you pay exactly the order total shown at checkout.'),
  '- Payment is made by bank transfer, Easypaisa or JazzCash to the account shown at checkout.',
  '- Payment is made using the payment methods shown at checkout, to the account shown there.'),
  'Approved refunds are sent back by bank transfer, Easypaisa or JazzCash, normally',
  'Approved refunds are sent back to the original payment method or another method agreed with you, normally')
WHERE content LIKE '%Prices are shown in PKR or USD. You pay exactly the order total in the currency shown at checkout.%'
   OR content LIKE '%Payment is made by bank transfer, Easypaisa or JazzCash to the account shown at checkout.%'
   OR content LIKE '%Approved refunds are sent back by bank transfer, Easypaisa or JazzCash, normally%';

UPDATE homepage_sections
SET settings = replace(replace(replace(replace(settings::text,
  'OTT, streaming, AI tools, VPN and software in PKR or USD. Pay by bank, Easypaisa or JazzCash and get private delivery after verification.',
  'OTT, streaming, AI tools, VPN and software at the best prices. Pay with any of our payment methods and get fast, private delivery after verification.'),
  'OTT, streaming, AI tools, VPN and software at the best prices, with fast and private delivery.',
  'OTT, streaming, AI tools, VPN and software at the best prices. Pay with any of our payment methods and get fast, private delivery after verification.'),
  'Send the amount by bank, Easypaisa or JazzCash and upload the screenshot and transaction ID.',
  'Send the payment using any of our payment methods and upload the screenshot and transaction ID.'),
  '"desc": "Clear prices with no hidden charges.", "icon": "Wallet", "title": "PKR and USD prices"',
  '"desc": "No hidden charges. You pay exactly the total shown at checkout.", "icon": "Wallet", "title": "Clear prices"')::jsonb
WHERE settings::text LIKE '%Easypaisa or JazzCash%'
   OR settings::text LIKE '%in PKR or USD%'
   OR settings::text LIKE '%PKR and USD prices%'
   OR settings::text LIKE '%with fast and private delivery.%';
