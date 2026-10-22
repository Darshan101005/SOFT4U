import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/app/_store/legal-page';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: `Cookie Policy | ${siteConfig.name}` },
  description: `Information about the cookies and browser storage used on the ${siteConfig.name} website.`,
  alternates: { canonical: '/cookie-policy' },
};

const sections: LegalSection[] = [
  {
    heading: 'What are cookies?',
    paragraphs: [
      'Cookies are small text files stored on your device when you visit a website. Similar technologies, such as local storage in your browser, work in the same way. They help a website remember your actions and preferences.',
    ],
  },
  {
    heading: 'How we use cookies',
    bullets: [
      'Essential: to keep the items in your cart and remember your checkout details while you shop.',
      'Security: to protect the website and the checkout process from fraud and misuse.',
      'Performance: to understand, in aggregate, which pages are visited so we can improve the store.',
    ],
  },
  {
    heading: 'Payment partner cookies',
    paragraphs: [
      'When you pay by card or bank, you may be redirected to our payment partner, which may set its own cookies to process the payment securely. These are governed by the payment partner’s own policies.',
    ],
  },
  {
    heading: 'Managing cookies',
    paragraphs: [
      'You can block or delete cookies in your browser settings. If you disable essential cookies or browser storage, parts of the store such as the cart and checkout may not work correctly.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      `If you have any question about our use of cookies, email ${siteConfig.email}.`,
    ],
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPage
      path="/cookie-policy"
      title="Cookie Policy"
      intro={`This policy explains how ${siteConfig.name} uses cookies and similar technologies on ${siteConfig.domain}.`}
      sections={sections}
    />
  );
}
