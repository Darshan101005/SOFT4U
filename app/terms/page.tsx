import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/app/_store/legal-page';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: `Terms & Conditions | ${siteConfig.name}` },
  description: `Terms and conditions for buying digital subscriptions, OTT access and software licences from ${siteConfig.name}.`,
  alternates: { canonical: '/terms' },
};

const sections: LegalSection[] = [
  {
    heading: 'Acceptance of terms',
    paragraphs: [
      `These Terms & Conditions apply to every visit and purchase on ${siteConfig.domain}, operated by ${siteConfig.legalName} ("${siteConfig.name}"). By placing an order you confirm that you have read and agree to these terms, our Privacy Policy, Refund & Return Policy and Delivery & Service Policy.`,
    ],
  },
  {
    heading: 'Our products',
    paragraphs: [
      `${siteConfig.name} sells digital goods only: OTT and streaming subscriptions, shared or private account access, activation codes and software licences. No physical item is shipped. Product pages describe the plan duration, number of screens or devices, and any usage rules for each product.`,
    ],
  },
  {
    heading: 'Eligibility and account information',
    bullets: [
      'You must be at least 18 years old, or purchase with the consent of a parent or guardian.',
      'You must provide a correct email address and mobile/WhatsApp number so we can deliver your order.',
      'You are responsible for keeping delivered login details private and must not change passwords, profile settings or account emails unless the product page allows it.',
    ],
  },
  {
    heading: 'Prices and payment',
    bullets: [
      `All prices are shown in Pakistani Rupees (${siteConfig.currency}) and include any applicable charges unless stated otherwise.`,
      'Prices and availability may change without notice; the price shown at checkout is the price you pay.',
      'Payments are processed securely by our licensed payment partner. An order is confirmed only after payment is successfully received.',
      'We may cancel and fully refund any order if a pricing error occurs or if fraud is suspected.',
    ],
  },
  {
    heading: 'Delivery',
    paragraphs: [
      'Orders are delivered digitally to your email and/or WhatsApp. Most orders are delivered instantly or within a few minutes; some products may take up to 24 hours. Full details are in our Delivery & Service Policy.',
    ],
  },
  {
    heading: 'Fair use',
    bullets: [
      'Products are for personal use only and may not be resold, shared publicly or used for illegal purposes.',
      'Using more screens or devices than your plan allows, or breaking the rules shown on the product page, may void the warranty without refund.',
    ],
  },
  {
    heading: 'Warranty and refunds',
    paragraphs: [
      'Each subscription comes with a replacement warranty for the purchased plan duration as described on the product page. Refunds and replacements are handled under our Refund & Return Policy.',
    ],
  },
  {
    heading: 'Limitation of liability',
    paragraphs: [
      `${siteConfig.name} is a reseller of digital access and is not affiliated with the brands whose services we sell. Our total liability for any order is limited to the amount paid for that order. We are not responsible for service changes, outages or content decisions made by the original service provider.`,
    ],
  },
  {
    heading: 'Governing law',
    paragraphs: [
      'These terms are governed by the laws of the Islamic Republic of Pakistan. Any dispute will be handled by the competent courts of Pakistan.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      `Questions about these terms? Email ${siteConfig.email}, call ${siteConfig.phone} or message us on WhatsApp at ${siteConfig.whatsapp}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Terms & Conditions"
      intro={`Please read these terms carefully before purchasing from ${siteConfig.name}. They explain your rights and responsibilities when you buy digital products from our store.`}
      sections={sections}
    />
  );
}
