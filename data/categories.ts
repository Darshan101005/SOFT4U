/**
 * Soft4u starter categories, used only by `bun run db:seed`.
 * Shape matches `Category` in lib/db/types.ts. The live site reads categories from Postgres.
 */
import type { Category } from '@/lib/db/types';

const CREATED = '2026-01-01T00:00:00Z';

export const categories: Category[] = [
  {
    id: 'cat_streaming',
    name: 'Movies & Streaming',
    slug: 'streaming-media',
    description: 'Netflix, Prime Video, Disney+ and HBO Max plans for movies, dramas and series.',
    image: '/brands/netflix.svg',
    icon: 'Tv',
    status: 'active',
    displayOrder: 1,
    featured: true,
    seoTitle: 'Buy Netflix, Prime Video & Streaming Subscriptions',
    seoDescription: 'Streaming subscriptions with instant delivery on email and WhatsApp.',
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'cat_music',
    name: 'Music & Video',
    slug: 'music-video',
    description: 'Ad-free music and video with Spotify Premium and YouTube Premium.',
    image: '/brands/spotify.svg',
    icon: 'Music',
    status: 'active',
    displayOrder: 2,
    featured: true,
    seoTitle: 'Spotify Premium & YouTube Premium',
    seoDescription: 'Ad-free music and video plans with instant digital delivery.',
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'cat_ai',
    name: 'AI Tools',
    slug: 'ai-developer-tools',
    description: 'ChatGPT Plus, Gemini AI Pro and other AI assistants for work and study.',
    image: '/brands/chatgpt.svg',
    icon: 'Bot',
    status: 'active',
    displayOrder: 3,
    featured: true,
    seoTitle: 'Buy ChatGPT Plus & AI Tools',
    seoDescription: 'AI subscriptions with protected checkout and private delivery.',
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'cat_vpn',
    name: 'VPN & Security',
    slug: 'vpn-security',
    description: 'NordVPN, ExpressVPN, Surfshark and Proton VPN for private, secure browsing.',
    image: '/brands/nordvpn.svg',
    icon: 'ShieldCheck',
    status: 'active',
    displayOrder: 4,
    featured: true,
    seoTitle: 'Buy NordVPN, ExpressVPN & Surfshark',
    seoDescription: 'VPN accounts with instant delivery and replacement support.',
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'cat_antivirus',
    name: 'Antivirus',
    slug: 'antivirus',
    description: 'Kaspersky and Norton protection for your PC, laptop and phone.',
    image: '/brands/kaspersky.svg',
    icon: 'Shield',
    status: 'active',
    displayOrder: 5,
    featured: true,
    seoTitle: 'Buy Kaspersky & Norton Antivirus',
    seoDescription: 'Genuine antivirus licences delivered by email and WhatsApp.',
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'cat_productivity',
    name: 'Creative & Productivity',
    slug: 'productivity-creative',
    description: 'Canva Pro, Microsoft 365, Adobe Creative Cloud, CapCut, Zoom and Grammarly.',
    image: '/brands/canva.jpg',
    icon: 'Sparkles',
    status: 'active',
    displayOrder: 6,
    featured: true,
    seoTitle: 'Buy Canva Pro, Microsoft 365 & Creative Software',
    seoDescription: 'Creative and office software plans with instant delivery.',
    createdAt: CREATED,
    updatedAt: CREATED,
  },
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find(c => c.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}
