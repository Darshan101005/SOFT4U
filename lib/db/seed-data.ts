/**
 * Seed content for a fresh database (used by scripts/db-seed.ts).
 * Real store content only: categories, the current product catalogue,
 * FAQs, legal pages, homepage layout, navigation, payment-method rows and
 * default settings. No customers, orders, reviews, testimonials or stats.
 */
import type { Category, FAQ, HomepageSection, LegalPage, NavigationItem, PaymentMethod } from './types';
import type { ProductInput } from './index';
import { categories } from '@/data/categories';
import { products } from '@/data/products';
import { siteConfig } from '@/lib/site-config';

export const seedCategories: Array<Omit<Category, 'createdAt' | 'updatedAt'>> = categories.map(({ createdAt, updatedAt, ...c }) => c);

/** Catalogue rows; variants start as "pre-order / manual delivery" until the admin stocks the vault or sets a stock count. */
export const seedProducts: ProductInput[] = products.map((p, index) => {
  const { createdAt, updatedAt, variants, price, discount, ...rest } = p;
  return {
    ...rest,
    displayOrder: index,
    variants: variants.map((v, i) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      sku: v.sku,
      stock: 0,
      stockMode: 'preorder' as const,
      description: v.description,
      features: v.features,
      deliveryMethod: 'Email, WhatsApp or Telegram',
      deliveryTime: v.deliveryTime,
      status: v.status,
      expiryDays: v.expiryDays,
      usdPricingMode: 'auto' as const,
      displayOrder: i,
    })),
    deliveryMethod: 'Email, WhatsApp or Telegram',
    usageInstructions: `After your payment is verified, your access details are delivered to your ${siteConfig.name} account and sent by email, plus WhatsApp or Telegram if you add them. Follow the steps in the message, or contact ${siteConfig.name} support for help.`,
    longDescription: `${p.name} with clear plan options and protected ordering. ${p.shortDescription} Pay by bank transfer, Easypaisa or JazzCash, upload your payment screenshot, and receive your access as soon as the payment is verified. Our support team is available on WhatsApp if you need help with activation.`,
  };
});

const T = '2026-01-01T00:00:00Z';

export const seedFaqs: Array<Omit<FAQ, 'createdAt'>> = [
  {
    id: 'faq_payment_methods',
    question: 'How can I pay?',
    answer: 'We accept bank transfer, Easypaisa and JazzCash. At checkout you see our account details. Send the exact amount, then upload your payment screenshot and transaction ID on the order page.',
    category: 'Payments',
    displayOrder: 1,
    status: 'active',
  },
  {
    id: 'faq_payment_verify',
    question: 'How long does payment verification take?',
    answer: `Our team checks every payment by hand, usually within 5 to 30 minutes during business hours (${siteConfig.hours}). You get an email as soon as your payment is approved.`,
    category: 'Payments',
    displayOrder: 2,
    status: 'active',
  },
  {
    id: 'faq_delivery',
    question: 'How will I receive my subscription?',
    answer: 'After approval, your access details appear on your order page and in your account, and are sent to your email. If you add WhatsApp or connect our Telegram bot, we can send them there too.',
    category: 'Delivery',
    displayOrder: 3,
    status: 'active',
  },
  {
    id: 'faq_preorder',
    question: 'What does "Pre-order / manual delivery" mean?',
    answer: 'The product is prepared for you after your payment is approved instead of coming from ready stock. Delivery usually takes 15 minutes to a few hours and never more than 24 hours.',
    category: 'Delivery',
    displayOrder: 4,
    status: 'active',
  },
  {
    id: 'faq_track',
    question: 'How do I track my order?',
    answer: 'Open Track Order and enter your Order ID (it looks like S4U-XXXXXXXXXX). If you have an account, all your orders are also listed under My Orders. Keep your Order ID private.',
    category: 'Orders',
    displayOrder: 5,
    status: 'active',
  },
  {
    id: 'faq_rejected',
    question: 'My payment was rejected. What now?',
    answer: 'The rejection email tells you why. If you did pay, upload a clear screenshot and the correct transaction ID again from the order page, or message us on WhatsApp with your Order ID.',
    category: 'Payments',
    displayOrder: 6,
    status: 'active',
  },
  {
    id: 'faq_warranty',
    question: 'What if my account stops working?',
    answer: 'Contact support during your plan. We fix or replace the access. If we cannot, you are covered by our Refund Policy.',
    category: 'Warranty',
    displayOrder: 7,
    status: 'active',
  },
  {
    id: 'faq_currency',
    question: 'Can I pay in US dollars?',
    answer: 'Yes. Switch the currency to USD at the top of the page. Prices are then shown in USD and you pay exactly the USD total shown at checkout.',
    category: 'Payments',
    displayOrder: 8,
    status: 'active',
  },
  {
    id: 'faq_account',
    question: 'Do I need an account to order?',
    answer: 'No, guest checkout works with your email and WhatsApp number. An account keeps all your orders, delivered access and support in one place, and lets you connect the Telegram bot.',
    category: 'Orders',
    displayOrder: 9,
    status: 'active',
  },
  {
    id: 'faq_support',
    question: 'How do I contact support?',
    answer: `Message us on WhatsApp at ${siteConfig.whatsapp}, email ${siteConfig.email}, or use the Contact page. Hours: ${siteConfig.hours}.`,
    category: 'Support',
    displayOrder: 10,
    status: 'active',
  },
].map(f => ({ ...f, status: f.status as FAQ['status'] }));

const updated = '**Last updated: 1 January 2026**';

export const seedLegalPages: Array<Omit<LegalPage, 'lastPublishedAt' | 'updatedAt' | 'revisions'>> = [
  {
    id: 'leg_terms',
    slug: 'terms',
    title: 'Terms & Conditions',
    status: 'published',
    content: `# Terms & Conditions

${updated}

These Terms & Conditions apply to every visit and purchase on ${siteConfig.domain}, operated by ${siteConfig.legalName} ("${siteConfig.name}"). By placing an order you agree to these terms, our Privacy Policy, Refund Policy and Delivery Policy.

## Our products
${siteConfig.name} sells digital goods only: OTT and streaming subscriptions, account access, activation codes and software licences. Nothing physical is shipped. Each product page shows the plan duration, screens or devices and any usage rules.

## Eligibility and account information
- You must be at least 18 years old, or buy with the consent of a parent or guardian.
- Give a correct email address and WhatsApp number so we can deliver your order.
- Keep delivered login details private. Do not change passwords, profiles or account emails unless the product page allows it.

## Prices and payment
- Prices are shown in PKR or USD. You pay exactly the order total in the currency shown at checkout.
- Payment is made by bank transfer, Easypaisa or JazzCash to the account shown at checkout. There is no automatic card gateway.
- After paying, upload your payment screenshot and transaction ID. Every payment is verified manually. An order is confirmed only after we approve the payment.
- An order stays awaiting payment until you upload the payment proof or cancel it.
- We may reject a payment proof that cannot be matched, and may cancel and refund any order if a pricing error occurs or fraud is suspected.

## Delivery
Approved orders are delivered digitally to your order page, your account and your email, and by WhatsApp or Telegram where you choose. Most orders are delivered within minutes of approval; some products take up to 24 hours. See the Delivery Policy.

## Fair use
- Products are for personal use and may not be resold or shared publicly.
- Using more screens or devices than your plan allows, or breaking the product rules, may void the warranty without refund.

## Warranty and refunds
Each subscription has a replacement warranty for the purchased plan duration. Refunds and replacements follow our Refund Policy.

## Limitation of liability
${siteConfig.name} resells digital access and is not affiliated with the brands whose services we sell. Our total liability for an order is limited to the amount paid for it. We are not responsible for service changes or outages by the original provider.

## Governing law
These terms are governed by the laws of the Islamic Republic of Pakistan.

## Contact
Email ${siteConfig.email}, call ${siteConfig.phone} or WhatsApp ${siteConfig.whatsapp}.`,
  },
  {
    id: 'leg_privacy',
    slug: 'privacy',
    title: 'Privacy Policy',
    status: 'published',
    content: `# Privacy Policy

${updated}

${siteConfig.legalName} ("${siteConfig.name}") operates ${siteConfig.domain}. This policy explains what we collect and how we use it.

## Information we collect
- Contact details: name, email address, mobile, WhatsApp number and Telegram username if you add them.
- Account details: your password is stored only as a secure hash. If you turn on two-factor authentication we store the secret needed to check your codes.
- Order details: products, plan, amount, Order ID and dates.
- Payment proof: the screenshot, transaction ID and sender details you upload. Screenshots are stored privately and only our staff can view them.
- Security information: IP address, approximate location derived from it, browser and device, recorded for sign-ins and orders to prevent fraud. These records are deleted after 7 days.

## How we use your information
- To verify payments, deliver your order and provide support.
- To send order and account emails (verification codes, payment updates, delivery).
- To send messages through our Telegram bot if you connect it.
- To prevent fraud and misuse.

## Sharing
We do not sell your data. We share only what is needed with services that run the store: hosting, database, email delivery (Resend), image storage (Cloudinary), Telegram for bot messages and IP lookup services for fraud checks. We may disclose information where Pakistani law requires it.

## Security and retention
The site is served over HTTPS. Access to customer data is limited to authorised staff. Order records are kept as long as needed for support, warranty and legal requirements.

## Your rights
You can ask us to access, correct or delete your data. Email ${siteConfig.email}; we reply within 7 working days.

## Contact
${siteConfig.email} · ${siteConfig.phone} · ${siteConfig.address}`,
  },
  {
    id: 'leg_refund',
    slug: 'refund-policy',
    title: 'Refund & Return Policy',
    status: 'published',
    content: `# Refund & Return Policy

${updated}

Digital products cannot be physically returned. Instead we offer replacements and refunds in the cases below.

## Full refund
- We cannot deliver your order within 24 hours of approving your payment.
- The product delivered does not match what you ordered and we cannot correct it.
- The delivered access does not work at delivery and we cannot replace it within 24 hours.
- You paid twice for the same order.

## Replacement warranty
If your subscription stops working during the plan you paid for, contact us and we replace it free. If a replacement is not possible, we refund the unused part of your plan.

## When refunds are not possible
- You changed your mind after the access was delivered and used.
- You changed the account password, email, profile or settings.
- The plan's screen or device limit or the product rules were broken.
- The problem comes from your device, connection or regional limits stated on the product page.

## How to request
Email ${siteConfig.email} or WhatsApp ${siteConfig.whatsapp} with your Order ID, a short description and a screenshot of any error. We reply within 24 hours.

## Refund method
Approved refunds are sent back by bank transfer, Easypaisa or JazzCash, normally within 3 working days of approval.

## Cancellation
You can cancel an order any time before it is delivered. If you already paid, the payment is refunded in full.`,
  },
  {
    id: 'leg_delivery',
    slug: 'delivery-policy',
    title: 'Delivery & Service Policy',
    status: 'published',
    content: `# Delivery & Service Policy

${updated}

## Digital delivery only
Nothing is shipped. Every order is delivered online with no delivery charge.

## When delivery starts
Delivery starts after we verify your payment proof. Verification usually takes 5 to 30 minutes during business hours (${siteConfig.hours}).

## Delivery time
- In-stock products: within minutes of approval.
- Pre-order / manual delivery products: usually 15 minutes to a few hours.
- Maximum: 24 hours after approval, or you are entitled to a full refund.

## What you receive
Your access details (for example email and password, profile and PIN, activation code or licence key), simple instructions, and your plan start date.

## Delivery channels
Your order page and your account always show the delivered details. We also send them by email from ${siteConfig.email}, and by WhatsApp (${siteConfig.whatsapp}) or our Telegram bot if you choose. Check your spam folder if you do not see our email.

## Correct contact details
Please enter your email and WhatsApp number carefully. Our team will help you correct them if needed.

## Help
Contact ${siteConfig.email} or WhatsApp ${siteConfig.whatsapp} with your Order ID.`,
  },
  {
    id: 'leg_cookies',
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    status: 'published',
    content: `# Cookie Policy

${updated}

${siteConfig.name} uses a small number of essential cookies and browser storage:

- **Sign-in session**: keeps you signed in to your account (httpOnly, secure cookie).
- **Cart and currency**: remembers your cart and your PKR / USD choice.
- **Security**: protects sign-in and checkout from abuse.

We do not use advertising or cross-site tracking cookies. You can clear cookies in your browser at any time; you will then need to sign in again.`,
  },
];

export const seedHomepageSections: Array<HomepageSection> = [
  {
    id: 'sec_hero',
    type: 'hero',
    name: 'Hero',
    enabled: true,
    order: 1,
    settings: {
      kicker: `${siteConfig.name.toUpperCase()} DIGITAL STORE`,
      headline: 'All your subscriptions in one place',
      subheadline: 'OTT, streaming, AI tools, VPN and software in PKR or USD. Pay by bank, Easypaisa or JazzCash and get private delivery after verification.',
      primaryCtaText: 'Browse products',
      primaryCtaUrl: '/shop',
      secondaryCtaText: 'Track an order',
      secondaryCtaUrl: '/track-order',
      highlights: ['Store live', 'Verified payments', 'Private delivery'],
    },
  },
  {
    id: 'sec_trust',
    type: 'trust_bar',
    name: 'Trust bar',
    enabled: true,
    order: 2,
    settings: {
      items: [
        { icon: 'BadgeCheck', title: 'Manually verified payments', desc: 'Every payment is checked by our team' },
        { icon: 'Lock', title: 'Private delivery', desc: 'Access shown only on your order and account' },
        { icon: 'RefreshCw', title: 'Replacement warranty', desc: 'Covered for your full plan' },
        { icon: 'MessageCircle', title: 'WhatsApp support', desc: siteConfig.whatsapp },
      ],
    },
  },
  { id: 'sec_categories', type: 'categories', name: 'Categories', enabled: true, order: 3, settings: { title: 'Shop by category', subtitle: 'Streaming, music, AI, VPN, antivirus and creative tools.' } },
  { id: 'sec_new', type: 'new_arrivals', name: 'Newly added', enabled: true, order: 4, settings: { title: 'Newly added', subtitle: 'Fresh access this week.', limit: 8 } },
  { id: 'sec_featured', type: 'featured_products', name: 'Featured products', enabled: true, order: 5, settings: { title: 'Featured', subtitle: 'Our most requested subscriptions.', limit: 8 } },
  { id: 'sec_bestsellers', type: 'bestsellers', name: 'Best sellers', enabled: true, order: 6, settings: { title: 'Best sellers', subtitle: 'What customers order most.', limit: 8 } },
  { id: 'sec_all', type: 'all_products', name: 'All digital access', enabled: true, order: 7, settings: { title: 'All digital access', subtitle: 'Explore the complete collection.' } },
  {
    id: 'sec_how',
    type: 'how_it_works',
    name: 'How it works',
    enabled: true,
    order: 8,
    settings: {
      title: 'How ordering works',
      subtitle: 'Four simple steps.',
      steps: [
        { step: '01', title: 'Choose your plan', desc: 'Pick a product and plan, then sign in and check out.' },
        { step: '02', title: 'Pay and upload proof', desc: 'Send the amount by bank, Easypaisa or JazzCash and upload the screenshot and transaction ID.' },
        { step: '03', title: 'We verify', desc: 'Our team checks your payment, usually within 5 to 30 minutes.' },
        { step: '04', title: 'Get your access', desc: 'Delivered to your order page, email, and WhatsApp or Telegram.' },
      ],
    },
  },
  {
    id: 'sec_benefits',
    type: 'benefits',
    name: 'Why choose us',
    enabled: true,
    order: 9,
    settings: {
      title: `Why ${siteConfig.name}`,
      subtitle: 'Clear prices, real people, private delivery.',
      items: [
        { icon: 'Wallet', title: 'PKR and USD prices', desc: 'Clear prices with no hidden charges.' },
        { icon: 'BadgeCheck', title: 'Checked by a person', desc: 'Every payment and delivery is handled by our team.' },
        { icon: 'Lock', title: 'Private access', desc: 'Your details are visible only to you.' },
        { icon: 'RefreshCw', title: 'Replacement support', desc: 'If access stops working during your plan, we fix it.' },
      ],
    },
  },
  { id: 'sec_reviews', type: 'reviews', name: 'Customer reviews', enabled: true, order: 10, settings: { title: 'What customers say', subtitle: 'Verified reviews from real orders.', limit: 6, hideWhenEmpty: true } },
  { id: 'sec_faq', type: 'faq', name: 'FAQ', enabled: true, order: 11, settings: { title: 'Frequently asked questions', subtitle: 'Payments, delivery and support.', limit: 6 } },
  {
    id: 'sec_cta',
    type: 'cta',
    name: 'Call to action',
    enabled: true,
    order: 12,
    settings: { title: 'Ready to order?', subtitle: 'Browse the catalogue and get your access today.', ctaText: 'Browse products', ctaUrl: '/shop' },
  },
];

export const seedNavigation: Array<NavigationItem> = [
  { id: 'nav_h_home', label: 'Home', url: '/', displayOrder: 1, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h_shop', label: 'Shop', url: '/shop', displayOrder: 2, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h_categories', label: 'Categories', url: '/categories', displayOrder: 3, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h_track', label: 'Track Order', url: '/track-order', displayOrder: 4, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h_faq', label: 'FAQ', url: '/faq', displayOrder: 5, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h_contact', label: 'Contact', url: '/contact', displayOrder: 6, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_f_shop', label: 'Shop', url: '/shop', displayOrder: 1, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f_categories', label: 'Categories', url: '/categories', displayOrder: 2, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f_track', label: 'Track Order', url: '/track-order', displayOrder: 3, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f_about', label: 'About', url: '/about', displayOrder: 4, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f_contact', label: 'Contact', url: '/contact', displayOrder: 5, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f_terms', label: 'Terms & Conditions', url: '/terms', displayOrder: 6, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f_privacy', label: 'Privacy Policy', url: '/privacy', displayOrder: 7, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f_refund', label: 'Refund Policy', url: '/refund-policy', displayOrder: 8, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f_delivery', label: 'Delivery Policy', url: '/delivery-policy', displayOrder: 9, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f_cookies', label: 'Cookie Policy', url: '/cookie-policy', displayOrder: 10, visible: true, targetBlank: false, position: 'footer' },
];

/**
 * The store's real receiving accounts (enabled). The customer transfers exactly the
 * order total in the order currency.
 * Editable in the admin panel (details, logo, order, enable/disable).
 */
export const seedPaymentMethods: Array<Omit<PaymentMethod, 'createdAt' | 'updatedAt'>> = [
  {
    id: 'pm_bank',
    key: 'bank_transfer',
    name: 'Bank Transfer (Meezan Bank)',
    type: 'bank',
    description: 'Pay by bank transfer, then upload your payment proof.',
    accountTitle: 'MUHAMMAD AMIR INAYAT',
    accountNumber: '23020110737530',
    iban: 'PK56MEZN0023020110737530',
    bankName: 'Meezan Bank',
    branch: 'KATCHERY RD BR-MBD (Katchery Road Branch, Mandi Bahauddin)',
    sortCode: '',
    payCurrency: 'PKR',
    instructions: 'Transfer the exact total to the account above, then upload a screenshot of the payment and enter the transaction ID.',
    logo: '/assets/payments/meezan.png',
    currencies: ['PKR', 'USD'],
    enabled: true,
    displayOrder: 1,
  },
  {
    id: 'pm_easypaisa',
    key: 'easypaisa',
    name: 'Easypaisa',
    type: 'easypaisa',
    description: 'Send the payment to our Easypaisa account, then upload your payment proof.',
    accountTitle: 'MUHAMMAD AMIR INAYAT',
    accountNumber: '03239539487',
    iban: 'PK68TMFB0000000069193578',
    bankName: 'Easypaisa',
    branch: '',
    sortCode: '',
    payCurrency: 'PKR',
    instructions: 'Transfer the exact total to the account above, then upload a screenshot of the payment and enter the transaction ID.',
    logo: '/assets/payments/easypaisa.png',
    currencies: ['PKR', 'USD'],
    enabled: true,
    displayOrder: 2,
  },
  {
    id: 'pm_jazzcash',
    key: 'jazzcash',
    name: 'JazzCash',
    type: 'jazzcash',
    description: 'Send the payment to our JazzCash account, then upload your payment proof.',
    accountTitle: 'MUHAMMAD AMIR INAYAT',
    accountNumber: '03239539487',
    iban: 'PK14JCMA2905923239539487',
    bankName: 'JazzCash',
    branch: '',
    sortCode: '',
    payCurrency: 'PKR',
    instructions: 'Transfer the exact total to the account above, then upload a screenshot of the payment and enter the transaction ID.',
    logo: '/assets/payments/jazzcash.png',
    currencies: ['PKR', 'USD'],
    enabled: true,
    displayOrder: 3,
  },
  {
    id: 'pm_monzo_uk',
    key: 'monzo_uk',
    name: 'UK Bank Transfer (Monzo)',
    type: 'bank',
    description: 'Pay by UK bank transfer in GBP, then upload your payment proof.',
    accountTitle: 'INAYAT TRADERS LIMITED',
    accountNumber: '36913516',
    iban: '',
    bankName: 'Monzo Bank',
    branch: '',
    sortCode: '04-00-03',
    payCurrency: 'GBP',
    instructions: 'Send the amount shown in GBP by UK bank transfer (Faster Payments) to the account below, then upload a screenshot and enter the payment reference.',
    logo: '/assets/payments/monzo.png',
    currencies: ['PKR', 'USD'],
    enabled: true,
    displayOrder: 4,
  },
];

export const SEED_TIMESTAMP = T;
