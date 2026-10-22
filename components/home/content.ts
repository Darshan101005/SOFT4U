/**
 * Homepage copy — mock data until integration (moves to the CMS / Neon later).
 */
import { siteConfig } from '@/lib/site-config';

/** Average rating shown on product cards until real reviews are connected. */
export const MOCK_RATING = 4.9;

export const heroHighlights = ['Store live', 'Protected checkout', 'Private delivery'];

export const howItWorks = [
  {
    step: '01',
    title: 'Choose your plan',
    desc: 'Pick a subscription or software and select 1, 3 or 12 months.',
  },
  {
    step: '02',
    title: 'Pay securely',
    desc: `Complete checkout in ${siteConfig.currency} through our protected payment page.`,
  },
  {
    step: '03',
    title: 'Get instant delivery',
    desc: 'Your access details arrive on email and WhatsApp, usually within minutes.',
  },
  {
    step: '04',
    title: 'Enjoy with support',
    desc: 'Start using your plan. Our team helps with activation and replacements.',
  },
];

export const whyChooseUs = [
  {
    icon: 'Zap',
    title: 'Instant delivery',
    desc: 'Most orders are delivered within 5–15 minutes on email and WhatsApp.',
  },
  {
    icon: 'BadgeCheck',
    title: 'Genuine access',
    desc: 'Official subscriptions and licence keys from trusted sources.',
  },
  {
    icon: 'Wallet',
    title: 'Prices in PKR',
    desc: 'Clear local pricing with no hidden charges or currency surprises.',
  },
  {
    icon: 'RefreshCw',
    title: 'Replacement support',
    desc: 'If your access stops working during the plan, we fix or replace it.',
  },
  {
    icon: 'Lock',
    title: 'Protected checkout',
    desc: 'Secure payments and private delivery of your account details.',
  },
  {
    icon: 'MessageCircle',
    title: 'Local WhatsApp support',
    desc: `Talk to a real person on WhatsApp at ${siteConfig.whatsapp}.`,
  },
];

export const reviews = [
  {
    name: 'Ahmed R.',
    city: 'Lahore',
    product: 'Netflix Premium 4K',
    rating: 5,
    text: 'Got my Netflix details on WhatsApp in under 10 minutes. Works perfectly on my TV.',
  },
  {
    name: 'Sana K.',
    city: 'Karachi',
    product: 'Canva Pro',
    rating: 5,
    text: 'Canva Pro was activated on my own email. Very smooth and the price is fair.',
  },
  {
    name: 'Bilal M.',
    city: 'Islamabad',
    product: 'ChatGPT Plus',
    rating: 5,
    text: 'Support helped me log in step by step. ChatGPT Plus has been working all month.',
  },
  {
    name: 'Hira A.',
    city: 'Faisalabad',
    product: 'Spotify Premium',
    rating: 5,
    text: 'Ad-free Spotify at a good price. Delivery was quick and the team replied fast.',
  },
  {
    name: 'Usman T.',
    city: 'Rawalpindi',
    product: 'NordVPN',
    rating: 4,
    text: 'NordVPN account works on my phone and laptop. Good service overall.',
  },
  {
    name: 'Ayesha N.',
    city: 'Multan',
    product: 'Microsoft 365',
    rating: 5,
    text: 'Microsoft 365 with OneDrive storage, delivered by email. Recommended.',
  },
];

export const homeFaqs = [
  {
    q: 'How will I receive my subscription?',
    a: 'After payment, your access details are sent to the email and WhatsApp number you enter at checkout. Most orders arrive within 5–15 minutes.',
  },
  {
    q: 'Which plans can I buy?',
    a: 'Most products are available as 1 month, 3 months or 12 months. Choose the plan on the product page before checkout.',
  },
  {
    q: 'What if my account stops working?',
    a: 'Contact our support team during your plan. We will fix the issue or replace your access. If we cannot, you are covered by our Refund Policy.',
  },
  {
    q: 'Are prices in Pakistani Rupees?',
    a: `Yes. All prices are shown and charged in ${siteConfig.currency} (${siteConfig.currencySymbol}).`,
  },
  {
    q: 'Can I track my order?',
    a: 'Yes. Use the Track Order page with your order number and email to see the latest status.',
  },
  {
    q: 'How do I contact support?',
    a: `Email ${siteConfig.email}, call ${siteConfig.phone} or message us on WhatsApp. Hours: ${siteConfig.hours}.`,
  },
];
