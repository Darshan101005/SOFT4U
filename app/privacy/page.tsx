import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/app/_store/legal-page';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: `Privacy Policy | ${siteConfig.name}` },
  description: `How ${siteConfig.name} collects, uses and protects your personal information when you buy digital subscriptions and software in Pakistan.`,
  alternates: { canonical: '/privacy' },
};

const sections: LegalSection[] = [
  {
    heading: 'Who we are',
    paragraphs: [
      `${siteConfig.legalName} ("${siteConfig.name}", "we", "us") operates the online store at ${siteConfig.domain}, selling OTT subscriptions, streaming access and digital software to customers in Pakistan. This policy explains what personal information we collect and how we use it.`,
    ],
  },
  {
    heading: 'Information we collect',
    bullets: [
      'Contact details you provide at checkout or through our contact form: name, email address, mobile number and WhatsApp number.',
      'Order details: products purchased, plan duration, order amount, order number and order date.',
      'Payment confirmation details returned by our payment partner (transaction reference and status). We never see or store your full card number, CVV or banking password.',
      'Technical information such as IP address, browser type and pages visited, used to keep the website secure and working properly.',
    ],
  },
  {
    heading: 'How we use your information',
    bullets: [
      'To process your order and deliver your subscription or licence to your email or WhatsApp.',
      'To send order confirmations, renewal reminders and replies to support requests.',
      'To verify payments and prevent fraud or misuse of our services.',
      'To meet legal, tax and accounting obligations in Pakistan.',
    ],
  },
  {
    heading: 'Payments',
    paragraphs: [
      'Card and bank payments are processed by a licensed Pakistani payment gateway on its own secure, PCI-DSS compliant pages. Card details are entered directly with the payment provider and are not transmitted to or stored on our servers.',
    ],
  },
  {
    heading: 'Sharing of information',
    paragraphs: [
      'We do not sell or rent your personal information. We share only what is necessary with trusted service providers who help us run the store, such as our payment gateway, hosting provider and email/WhatsApp messaging services, and only for the purpose of completing your order. We may disclose information where required by Pakistani law or a lawful request from authorities.',
    ],
  },
  {
    heading: 'Data security and retention',
    paragraphs: [
      'Our website is served over encrypted HTTPS connections and access to customer data is limited to authorised staff. We keep order records for as long as needed to provide support, handle warranty claims and meet legal requirements, after which they are deleted or anonymised.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      `You may ask us to access, correct or delete the personal information we hold about you, or to stop sending you promotional messages. Email ${siteConfig.email} and we will respond within 7 working days.`,
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'We use a small number of cookies and similar browser storage to keep your cart and improve your experience. See our Cookie Policy for details.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'We may update this policy from time to time. The latest version will always be available on this page with the updated date shown above.',
    ],
  },
  {
    heading: 'Contact us',
    paragraphs: [
      `For any privacy question, contact ${siteConfig.name} at ${siteConfig.email} or ${siteConfig.phone}. Address: ${siteConfig.address}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      title="Privacy Policy"
      intro={`Your privacy matters to us. This policy describes how ${siteConfig.name} handles the information you share when you browse our store or place an order.`}
      sections={sections}
    />
  );
}
