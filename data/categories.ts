/**
 * Soft4u category catalogue — mock data until integration.
 * Shape matches `Category` in lib/db/types.ts and the Prisma `Category` model,
 * so this can be seeded straight into Neon later.
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
    seoTitle: 'Buy Netflix, Prime Video & Streaming Subscriptions in Pakistan',
    seoDescription: 'Streaming subscriptions in PKR with instant delivery on email and WhatsApp.',
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
    seoTitle: 'Spotify Premium & YouTube Premium in Pakistan',
    seoDescription: 'Ad-free music and video plans in PKR with instant digital delivery.',
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
    seoTitle: 'Buy ChatGPT Plus & AI Tools in Pakistan',
    seoDescription: 'AI subscriptions in PKR with protected checkout and private delivery.',
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
    seoTitle: 'Buy NordVPN, ExpressVPN & Surfshark in Pakistan',
    seoDescription: 'VPN accounts in PKR with instant delivery and replacement support.',
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
    seoTitle: 'Buy Kaspersky & Norton Antivirus in Pakistan',
    seoDescription: 'Genuine antivirus licences in PKR delivered by email and WhatsApp.',
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
    seoTitle: 'Buy Canva Pro, Microsoft 365 & Creative Software in Pakistan',
    seoDescription: 'Creative and office software plans in PKR with instant delivery.',
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
