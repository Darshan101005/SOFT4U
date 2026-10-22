import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/app/_store/legal-page';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: `Delivery & Service Policy | ${siteConfig.name}` },
  description: `How ${siteConfig.name} delivers digital subscriptions and software instantly by email and WhatsApp, delivery times and what you receive.`,
  alternates: { canonical: '/delivery-policy' },
};

const sections: LegalSection[] = [
  {
    heading: 'Digital delivery only',
    paragraphs: [
      `${siteConfig.name} sells digital products only. Nothing is shipped to a physical address and there are no shipping or delivery charges. Every order is delivered online to the email address and/or WhatsApp number you provide at checkout.`,
    ],
  },
  {
    heading: 'Delivery time',
    bullets: [
      'Instant delivery: most products are delivered within a few minutes of successful payment.',
      'Standard delivery: some products that need manual activation are delivered within 15 minutes to 2 hours.',
      'Maximum delivery time: 24 hours. If your order is not delivered in this time, you are entitled to a full refund.',
      `Orders placed outside support hours (${siteConfig.hours}) that need manual activation are delivered at the start of the next working period.`,
    ],
  },
  {
    heading: 'What you receive',
    bullets: [
      'An order confirmation with your order number, product, plan duration and amount paid.',
      'Your access details, depending on the product: account login (email and password), a private profile and PIN, an activation or redeem code, a licence key, or an invitation link sent to your own email.',
      'Simple step-by-step instructions on how to log in or activate your product.',
      'Warranty information showing the plan start date and expiry date.',
    ],
  },
  {
    heading: 'Delivery channels',
    paragraphs: [
      `Access details are sent by email from ${siteConfig.email} and, where you provide a number, by WhatsApp from ${siteConfig.whatsapp}. Please check your spam or promotions folder if you do not see our email.`,
    ],
  },
  {
    heading: 'Correct contact details',
    paragraphs: [
      'Please enter your email and WhatsApp number carefully at checkout. We are not responsible for delays caused by incorrect contact details, but our support team will help you correct them as quickly as possible.',
    ],
  },
  {
    heading: 'Service period and support',
    paragraphs: [
      'Your service period starts on the delivery date and runs for the plan duration you purchased. During this time you are covered by our replacement warranty and can contact support for any access problem.',
    ],
  },
  {
    heading: 'Need help with a delivery?',
    paragraphs: [
      `Contact us at ${siteConfig.email}, call ${siteConfig.phone} or WhatsApp ${siteConfig.whatsapp} with your order number and we will resolve it quickly.`,
    ],
  },
];

export default function DeliveryPolicyPage() {
  return (
    <LegalPage
      path="/delivery-policy"
      title="Delivery & Service Policy"
      intro={`${siteConfig.name} delivers every order digitally by email and WhatsApp, usually within minutes. Here is exactly how delivery works and what you will receive.`}
      sections={sections}
    />
  );
}
