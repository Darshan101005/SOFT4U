import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/app/_store/legal-page';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: `Refund & Return Policy | ${siteConfig.name}` },
  description: `Refund, replacement and return rules for digital subscriptions and software bought from ${siteConfig.name} in Pakistan.`,
  alternates: { canonical: '/refund-policy' },
};

const sections: LegalSection[] = [
  {
    heading: 'Digital products',
    paragraphs: [
      `Because ${siteConfig.name} sells digital goods that are delivered instantly, products cannot be physically returned. Instead, we offer replacements and refunds in the situations listed below.`,
    ],
  },
  {
    heading: 'When you are eligible for a full refund',
    bullets: [
      'We are unable to deliver your order within 24 hours of successful payment.',
      'The product delivered does not match the product or plan you ordered and we cannot correct it.',
      'The delivered account or code does not work at the time of delivery and we cannot provide a working replacement within 24 hours.',
      'You were charged twice for the same order.',
    ],
  },
  {
    heading: 'Replacement warranty',
    paragraphs: [
      'If your subscription stops working during the plan duration you paid for, contact us and we will replace it free of charge. If a replacement is not possible, we will refund the unused portion of your plan on a pro-rata basis.',
    ],
  },
  {
    heading: 'When refunds are not possible',
    bullets: [
      'You changed your mind after the account or code was delivered and used.',
      'The account password, email, profile or settings were changed by you.',
      'The product was used on more screens or devices than the plan allows, or the fair-use rules on the product page were broken.',
      'The issue is caused by your own device, internet connection or regional restrictions mentioned on the product page.',
    ],
  },
  {
    heading: 'How to request a refund or replacement',
    bullets: [
      `Email ${siteConfig.email} or WhatsApp ${siteConfig.whatsapp} with your order number.`,
      'Briefly describe the problem and attach a screenshot of any error message.',
      'Our team will reply within 24 hours and resolve most issues the same day.',
    ],
  },
  {
    heading: 'Refund method and timeline',
    paragraphs: [
      'Approved refunds are returned to the original payment method. Card and bank refunds are initiated within 3 working days of approval; the time for the amount to appear in your account depends on your bank and is usually 7 to 14 working days.',
    ],
  },
  {
    heading: 'Order cancellation',
    paragraphs: [
      'You can cancel an order for a full refund any time before it is delivered. Once the product has been delivered, the replacement and refund rules above apply.',
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      path="/refund-policy"
      title="Refund & Return Policy"
      intro={`We want every ${siteConfig.name} customer to be happy with their purchase. This policy explains when you can get a replacement or a refund for a digital product.`}
      sections={sections}
    />
  );
}
