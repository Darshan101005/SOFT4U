/**
 * Soft4u starting catalogue: the source for `bun run db:seed` (lib/db/seed-data.ts).
 * Live pages read products from Postgres through `db`; edit products in the admin panel.
 *
 * Prices are in PKR. Brand logos are self-hosted copies of the official logos
 * from Wikimedia Commons (public/brands/*); `bun run db:seed --images` moves them to Cloudinary.
 */
import type { Product, ProductVariant, InventoryType } from '@/lib/db/types';
import { siteConfig } from '@/lib/site-config';

const CREATED = '2026-01-05T00:00:00Z';

type PlanKey = '1m' | '3m' | '1y';

const PLAN_META: Record<PlanKey, { name: string; days: number; sku: string }> = {
  '1m': { name: '1 Month', days: 30, sku: '1M' },
  '3m': { name: '3 Months', days: 90, sku: '3M' },
  '1y': { name: '12 Months', days: 365, sku: '12M' },
};

interface PlanInput {
  key: PlanKey;
  price: number;
  compareAtPrice: number;
  stock: number;
}

interface ProductInput {
  id: string;
  /** Prefix for variant ids, e.g. `var_nflx` -> `var_nflx_1m`. */
  variantPrefix: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  categoryId: string;
  image: string;
  shortDescription: string;
  features: string[];
  requirements?: string[];
  tags: string[];
  plans: PlanInput[];
  deliveryTime?: string;
  productType?: string;
  inventoryModel?: InventoryType;
  featured?: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  trending?: boolean;
  badge?: string;
  relatedProductIds?: string[];
}

const DELIVERY_METHOD = 'Email & WhatsApp';
const DEFAULT_DELIVERY_TIME = 'Instant (5–15 min)';

function makeProduct(input: ProductInput): Product {
  const deliveryTime = input.deliveryTime ?? DEFAULT_DELIVERY_TIME;

  const variants: ProductVariant[] = input.plans.map(plan => {
    const meta = PLAN_META[plan.key];
    return {
      id: `${input.variantPrefix}_${plan.key}`,
      productId: input.id,
      name: meta.name,
      price: plan.price,
      compareAtPrice: plan.compareAtPrice,
      sku: `${input.sku}-${meta.sku}`,
      // Seed rows start as pre-order / manual delivery; real stock comes from the admin vault.
      stock: 0,
      stockMode: 'preorder',
      usdPricingMode: 'auto',
      description: `${input.brand} access for ${meta.name.toLowerCase()} (${meta.days} days).`,
      deliveryMethod: DELIVERY_METHOD,
      deliveryTime,
      status: 'active',
      expiryDays: meta.days,
    };
  });

  const first = variants[0];
  const discount = first.compareAtPrice
    ? Math.round(((first.compareAtPrice - first.price) / first.compareAtPrice) * 100)
    : 0;

  return {
    id: input.id,
    name: input.name,
    brand: input.brand,
    slug: input.slug,
    sku: input.sku,
    shortDescription: input.shortDescription,
    longDescription: `${input.name} with clear plan options, protected checkout and convenient digital delivery. ${input.shortDescription} After payment, your access details are sent to your email and WhatsApp, and our support team is available if you need help with activation.`,
    images: [input.image],
    logo: input.image,
    categoryId: input.categoryId,
    tags: input.tags,
    price: first.price,
    compareAtPrice: first.compareAtPrice,
    discount,
    status: 'active',
    featured: input.featured ?? false,
    bestseller: input.bestseller ?? false,
    isNew: input.isNew ?? false,
    trending: input.trending ?? false,
    badge: input.badge,
    deliveryTime,
    deliveryMethod: DELIVERY_METHOD,
    productType: input.productType ?? 'Digital Subscription',
    inventoryModel: input.inventoryModel ?? 'credential',
    features: input.features,
    requirements: input.requirements ?? [
      'A valid email address and WhatsApp number for delivery',
      'Stable internet connection',
    ],
    usageInstructions: `After payment you receive your ${input.brand} access details by email and WhatsApp. Follow the activation steps in the message, or contact ${siteConfig.name} support for help.`,
    refundInfo:
      'If your access does not work and we cannot fix or replace it, you are eligible for a refund as per our Refund Policy.',
    seoTitle: `Buy ${input.name} | ${siteConfig.name}`,
    seoDescription: `${input.name} with private delivery by email, WhatsApp or Telegram. ${input.shortDescription}`,
    relatedProductIds: input.relatedProductIds ?? [],
    variants,
    createdAt: CREATED,
    updatedAt: CREATED,
  };
}

export const products: Product[] = [
  // Movies & Streaming
  makeProduct({
    id: 'prod_netflix_uhd',
    variantPrefix: 'var_nflx',
    name: 'Netflix Premium 4K',
    slug: 'netflix-premium-4k',
    sku: 'S4U-NFLX',
    brand: 'Netflix',
    categoryId: 'cat_streaming',
    image: '/brands/netflix.svg',
    shortDescription: 'Private Netflix profile with Ultra HD 4K streaming on TV, mobile and laptop.',
    features: ['Private profile with your own PIN', 'Ultra HD 4K + HDR', 'Works on TV, mobile and laptop', 'Replacement support for the full plan'],
    tags: ['Netflix', 'Streaming', 'Movies', 'Dramas'],
    plans: [
      { key: '1m', price: 699, compareAtPrice: 1100, stock: 48 },
      { key: '3m', price: 1899, compareAtPrice: 3300, stock: 31 },
      { key: '1y', price: 6999, compareAtPrice: 13200, stock: 12 },
    ],
    featured: true,
    bestseller: true,
    trending: true,
    badge: 'Most popular',
    relatedProductIds: ['prod_prime_video', 'prod_disney_plus'],
  }),
  makeProduct({
    id: 'prod_prime_video',
    variantPrefix: 'var_prime',
    name: 'Amazon Prime Video',
    slug: 'amazon-prime-video',
    sku: 'S4U-PRIME',
    brand: 'Prime Video',
    categoryId: 'cat_streaming',
    image: '/brands/prime-video.svg',
    shortDescription: 'Prime Video originals, movies and live sports in HD on any device.',
    features: ['Private profile', 'HD and 4K titles', 'Download to watch offline', 'Works on Smart TV and mobile'],
    tags: ['Prime Video', 'Amazon', 'Streaming', 'Movies'],
    plans: [
      { key: '1m', price: 399, compareAtPrice: 700, stock: 64 },
      { key: '3m', price: 1099, compareAtPrice: 2100, stock: 40 },
      { key: '1y', price: 3999, compareAtPrice: 8400, stock: 18 },
    ],
    featured: true,
    relatedProductIds: ['prod_netflix_uhd', 'prod_hbo_max'],
  }),
  makeProduct({
    id: 'prod_disney_plus',
    variantPrefix: 'var_dsny',
    name: 'Disney+ Premium',
    slug: 'disney-plus-premium',
    sku: 'S4U-DSNY',
    brand: 'Disney+',
    categoryId: 'cat_streaming',
    image: '/brands/disney-plus.svg',
    shortDescription: 'Disney, Pixar, Marvel, Star Wars and National Geographic in one plan.',
    features: ['Private profile', '4K Ultra HD where available', 'Kids-friendly profiles', 'Replacement support'],
    tags: ['Disney+', 'Marvel', 'Pixar', 'Streaming'],
    plans: [
      { key: '1m', price: 599, compareAtPrice: 1000, stock: 27 },
      { key: '3m', price: 1599, compareAtPrice: 3000, stock: 19 },
      { key: '1y', price: 5999, compareAtPrice: 12000, stock: 8 },
    ],
    isNew: true,
    relatedProductIds: ['prod_netflix_uhd', 'prod_prime_video'],
  }),
  makeProduct({
    id: 'prod_hbo_max',
    variantPrefix: 'var_hbo',
    name: 'HBO Max',
    slug: 'hbo-max',
    sku: 'S4U-HBO',
    brand: 'HBO Max',
    categoryId: 'cat_streaming',
    image: '/brands/hbo-max.svg',
    shortDescription: 'HBO originals, Warner Bros. movies and blockbuster series.',
    features: ['Private profile', 'Full HD streaming', 'HBO originals and new releases', 'Replacement support'],
    tags: ['HBO Max', 'Max', 'Streaming', 'Series'],
    plans: [
      { key: '1m', price: 699, compareAtPrice: 1500, stock: 15 },
      { key: '3m', price: 1899, compareAtPrice: 4500, stock: 9 },
      { key: '1y', price: 6999, compareAtPrice: 18000, stock: 4 },
    ],
    deliveryTime: '15–30 min',
    isNew: true,
    relatedProductIds: ['prod_netflix_uhd', 'prod_disney_plus'],
  }),

  // Music & Video
  makeProduct({
    id: 'prod_youtube_premium',
    variantPrefix: 'var_yt',
    name: 'YouTube Premium',
    slug: 'youtube-premium',
    sku: 'S4U-YT',
    brand: 'YouTube Premium',
    categoryId: 'cat_music',
    image: '/brands/youtube-premium.svg',
    shortDescription: 'Ad-free YouTube, background play, downloads and YouTube Music on your own account.',
    features: ['No ads on YouTube', 'Background play on mobile', 'Offline downloads', 'YouTube Music Premium included'],
    tags: ['YouTube', 'Music', 'Video', 'Ad-free'],
    plans: [
      { key: '1m', price: 349, compareAtPrice: 600, stock: 29 },
      { key: '3m', price: 949, compareAtPrice: 1800, stock: 22 },
      { key: '1y', price: 3499, compareAtPrice: 7200, stock: 10 },
    ],
    featured: true,
    bestseller: true,
    badge: 'Fast delivery',
    relatedProductIds: ['prod_spotify_premium'],
  }),
  makeProduct({
    id: 'prod_spotify_premium',
    variantPrefix: 'var_spot',
    name: 'Spotify Premium',
    slug: 'spotify-premium',
    sku: 'S4U-SPOT',
    brand: 'Spotify',
    categoryId: 'cat_music',
    image: '/brands/spotify.svg',
    shortDescription: 'Ad-free music, offline listening and unlimited skips on your own Spotify account.',
    features: ['Ad-free listening', 'Download songs and podcasts', 'Unlimited skips', 'High-quality audio'],
    tags: ['Spotify', 'Music', 'Podcasts'],
    plans: [
      { key: '1m', price: 299, compareAtPrice: 500, stock: 73 },
      { key: '3m', price: 799, compareAtPrice: 1500, stock: 44 },
      { key: '1y', price: 2999, compareAtPrice: 6000, stock: 21 },
    ],
    bestseller: true,
    relatedProductIds: ['prod_youtube_premium'],
  }),

  // AI Tools
  makeProduct({
    id: 'prod_chatgpt_plus',
    variantPrefix: 'var_cgpt',
    name: 'ChatGPT Plus',
    slug: 'chatgpt-plus',
    sku: 'S4U-CGPT',
    brand: 'ChatGPT Plus',
    categoryId: 'cat_ai',
    image: '/brands/chatgpt.svg',
    shortDescription: 'Private ChatGPT Plus with the latest OpenAI models, image generation and file uploads.',
    features: ['Latest GPT models', 'Image generation and analysis', 'File and data uploads', 'Private account access'],
    tags: ['ChatGPT', 'OpenAI', 'AI'],
    plans: [
      { key: '1m', price: 2499, compareAtPrice: 5600, stock: 36 },
      { key: '3m', price: 6999, compareAtPrice: 16800, stock: 20 },
      { key: '1y', price: 26999, compareAtPrice: 67200, stock: 6 },
    ],
    featured: true,
    bestseller: true,
    trending: true,
    badge: 'Most popular',
    relatedProductIds: ['prod_gemini_pro', 'prod_grammarly_premium'],
  }),
  makeProduct({
    id: 'prod_gemini_pro',
    variantPrefix: 'var_gem',
    name: 'Gemini AI Pro',
    slug: 'gemini-ai-pro',
    sku: 'S4U-GEM',
    brand: 'Gemini AI Pro',
    categoryId: 'cat_ai',
    image: '/brands/gemini.svg',
    shortDescription: 'Google Gemini AI Pro with advanced models, Gemini in Gmail and Docs, plus 2 TB storage.',
    features: ['Advanced Gemini models', 'Gemini in Gmail, Docs and Sheets', '2 TB Google storage', 'Activated on your Google account'],
    tags: ['Gemini', 'Google', 'AI'],
    plans: [
      { key: '1m', price: 999, compareAtPrice: 5000, stock: 52 },
      { key: '3m', price: 2699, compareAtPrice: 15000, stock: 30 },
      { key: '1y', price: 8999, compareAtPrice: 60000, stock: 14 },
    ],
    isNew: true,
    trending: true,
    relatedProductIds: ['prod_chatgpt_plus'],
  }),

  // VPN & Security
  makeProduct({
    id: 'prod_nordvpn_ultimate',
    variantPrefix: 'var_nvpn',
    name: 'NordVPN',
    slug: 'nordvpn',
    sku: 'S4U-NVPN',
    brand: 'NordVPN',
    categoryId: 'cat_vpn',
    image: '/brands/nordvpn.svg',
    shortDescription: 'Private browsing with global servers and threat protection on up to 10 devices.',
    features: ['Servers in 100+ countries', 'Threat protection', 'Up to 10 devices', 'No-logs policy'],
    tags: ['NordVPN', 'VPN', 'Privacy', 'Security'],
    plans: [
      { key: '1m', price: 599, compareAtPrice: 1200, stock: 41 },
      { key: '3m', price: 1599, compareAtPrice: 3600, stock: 25 },
      { key: '1y', price: 4999, compareAtPrice: 14400, stock: 11 },
    ],
    featured: true,
    bestseller: true,
    badge: 'Protected',
    relatedProductIds: ['prod_expressvpn', 'prod_surfshark'],
  }),
  makeProduct({
    id: 'prod_expressvpn',
    variantPrefix: 'var_xvpn',
    name: 'ExpressVPN',
    slug: 'expressvpn',
    sku: 'S4U-XVPN',
    brand: 'ExpressVPN',
    categoryId: 'cat_vpn',
    image: '/brands/expressvpn.svg',
    shortDescription: 'Fast, reliable VPN for streaming and secure browsing on all your devices.',
    features: ['High-speed servers worldwide', 'Works with streaming apps', '8 simultaneous devices', 'Kill switch'],
    tags: ['ExpressVPN', 'VPN', 'Privacy'],
    plans: [
      { key: '1m', price: 899, compareAtPrice: 1800, stock: 6 },
      { key: '3m', price: 2399, compareAtPrice: 5400, stock: 4 },
      { key: '1y', price: 7999, compareAtPrice: 21600, stock: 2 },
    ],
    relatedProductIds: ['prod_nordvpn_ultimate', 'prod_proton_vpn'],
  }),
  makeProduct({
    id: 'prod_surfshark',
    variantPrefix: 'var_surf',
    name: 'Surfshark VPN',
    slug: 'surfshark-vpn',
    sku: 'S4U-SURF',
    brand: 'Surfshark',
    categoryId: 'cat_vpn',
    image: '/brands/surfshark.svg',
    shortDescription: 'Unlimited devices on one plan with ad blocking and secure Wi-Fi protection.',
    features: ['Unlimited devices', 'CleanWeb ad blocker', 'Global servers', 'No-logs policy'],
    tags: ['Surfshark', 'VPN', 'Privacy'],
    plans: [
      { key: '1m', price: 499, compareAtPrice: 700, stock: 167 },
      { key: '3m', price: 1299, compareAtPrice: 2100, stock: 90 },
      { key: '1y', price: 3999, compareAtPrice: 8400, stock: 35 },
    ],
    relatedProductIds: ['prod_nordvpn_ultimate', 'prod_expressvpn'],
  }),
  makeProduct({
    id: 'prod_proton_vpn',
    variantPrefix: 'var_proton',
    name: 'Proton VPN Plus',
    slug: 'proton-vpn-plus',
    sku: 'S4U-PRTN',
    brand: 'Proton VPN',
    categoryId: 'cat_vpn',
    image: '/brands/proton-vpn.svg',
    shortDescription: 'Swiss-based VPN with Secure Core servers and strong privacy protection.',
    features: ['Secure Core servers', 'Streaming support', 'Up to 10 devices', 'Swiss privacy laws'],
    tags: ['Proton VPN', 'VPN', 'Privacy'],
    plans: [
      { key: '1m', price: 599, compareAtPrice: 2000, stock: 8 },
      { key: '3m', price: 1599, compareAtPrice: 6000, stock: 5 },
      { key: '1y', price: 4999, compareAtPrice: 24000, stock: 3 },
    ],
    isNew: true,
    relatedProductIds: ['prod_nordvpn_ultimate', 'prod_surfshark'],
  }),

  // Antivirus
  makeProduct({
    id: 'prod_kaspersky_premium',
    variantPrefix: 'var_kav',
    name: 'Kaspersky Premium',
    slug: 'kaspersky-premium',
    sku: 'S4U-KAV',
    brand: 'Kaspersky',
    categoryId: 'cat_antivirus',
    image: '/brands/kaspersky.svg',
    shortDescription: 'Complete antivirus, anti-ransomware and safe browsing protection for 1 device.',
    features: ['Real-time antivirus', 'Ransomware protection', 'Safe online payments', 'Genuine licence key'],
    requirements: ['Windows, macOS or Android device', 'A valid email address for the licence'],
    tags: ['Kaspersky', 'Antivirus', 'Security'],
    plans: [
      { key: '1m', price: 299, compareAtPrice: 600, stock: 120 },
      { key: '3m', price: 799, compareAtPrice: 1800, stock: 80 },
      { key: '1y', price: 2499, compareAtPrice: 7200, stock: 45 },
    ],
    productType: 'Software Licence',
    inventoryModel: 'license_key',
    relatedProductIds: ['prod_norton_360'],
  }),
  makeProduct({
    id: 'prod_norton_360',
    variantPrefix: 'var_norton',
    name: 'Norton 360 Deluxe',
    slug: 'norton-360-deluxe',
    sku: 'S4U-NRTN',
    brand: 'Norton 360',
    categoryId: 'cat_antivirus',
    image: '/brands/norton.svg',
    shortDescription: 'Antivirus, secure VPN and password manager for up to 5 devices.',
    features: ['Device security for 5 devices', 'Secure VPN included', 'Password manager', 'Genuine licence key'],
    requirements: ['Windows, macOS, Android or iOS device', 'A valid email address for the licence'],
    tags: ['Norton', 'Antivirus', 'Security'],
    plans: [
      { key: '1m', price: 349, compareAtPrice: 700, stock: 60 },
      { key: '3m', price: 899, compareAtPrice: 2100, stock: 38 },
      { key: '1y', price: 2799, compareAtPrice: 8400, stock: 20 },
    ],
    productType: 'Software Licence',
    inventoryModel: 'license_key',
    relatedProductIds: ['prod_kaspersky_premium'],
  }),

  // Creative & Productivity
  makeProduct({
    id: 'prod_canva_pro_lifetime',
    variantPrefix: 'var_canva',
    name: 'Canva Pro',
    slug: 'canva-pro',
    sku: 'S4U-CNVA',
    brand: 'Canva Pro',
    categoryId: 'cat_productivity',
    image: '/brands/canva.jpg',
    shortDescription: 'Premium templates, Magic Studio AI tools and background remover on your own email.',
    features: ['100M+ premium photos and templates', 'Magic Studio AI tools', 'Background remover', 'Activated on your email'],
    tags: ['Canva', 'Design', 'Creative'],
    plans: [
      { key: '1m', price: 349, compareAtPrice: 900, stock: 58 },
      { key: '3m', price: 899, compareAtPrice: 2700, stock: 40 },
      { key: '1y', price: 2999, compareAtPrice: 10800, stock: 25 },
    ],
    featured: true,
    bestseller: true,
    relatedProductIds: ['prod_capcut_pro', 'prod_adobe_creative_cloud'],
  }),
  makeProduct({
    id: 'prod_microsoft_365',
    variantPrefix: 'var_m365',
    name: 'Microsoft 365',
    slug: 'microsoft-365',
    sku: 'S4U-M365',
    brand: 'Microsoft 365',
    categoryId: 'cat_productivity',
    image: '/brands/microsoft-365.svg',
    shortDescription: 'Word, Excel, PowerPoint, Outlook and 1 TB OneDrive storage on PC, Mac and mobile.',
    features: ['Word, Excel, PowerPoint, Outlook', '1 TB OneDrive storage', 'Install on PC, Mac and mobile', 'Activated on your account'],
    tags: ['Microsoft', 'Office', 'Productivity'],
    plans: [
      { key: '1m', price: 499, compareAtPrice: 1100, stock: 70 },
      { key: '3m', price: 1299, compareAtPrice: 3300, stock: 42 },
      { key: '1y', price: 4499, compareAtPrice: 13200, stock: 24 },
    ],
    featured: true,
    trending: true,
    productType: 'Software Subscription',
    relatedProductIds: ['prod_grammarly_premium', 'prod_zoom_pro'],
  }),
  makeProduct({
    id: 'prod_adobe_creative_cloud',
    variantPrefix: 'var_adobe',
    name: 'Adobe Creative Cloud',
    slug: 'adobe-creative-cloud',
    sku: 'S4U-ADBE',
    brand: 'Adobe Creative Cloud',
    categoryId: 'cat_productivity',
    image: '/brands/adobe-creative-cloud.svg',
    shortDescription: 'Photoshop, Illustrator, Premiere Pro and 20+ Adobe apps on one plan.',
    features: ['All Creative Cloud apps', 'Photoshop, Illustrator, Premiere Pro', '100 GB cloud storage', 'Adobe Fonts included'],
    tags: ['Adobe', 'Photoshop', 'Creative'],
    plans: [
      { key: '1m', price: 1499, compareAtPrice: 6000, stock: 14 },
      { key: '3m', price: 3999, compareAtPrice: 18000, stock: 9 },
      { key: '1y', price: 13999, compareAtPrice: 72000, stock: 5 },
    ],
    deliveryTime: '15–30 min',
    productType: 'Software Subscription',
    relatedProductIds: ['prod_canva_pro_lifetime', 'prod_capcut_pro'],
  }),
  makeProduct({
    id: 'prod_capcut_pro',
    variantPrefix: 'var_capcut',
    name: 'CapCut Pro',
    slug: 'capcut-pro',
    sku: 'S4U-CAPC',
    brand: 'CapCut Pro',
    categoryId: 'cat_productivity',
    image: '/brands/capcut.svg',
    shortDescription: 'Pro video effects, AI editing tools and watermark-free exports.',
    features: ['Pro effects and transitions', 'AI editing tools', 'No watermark on export', 'Cloud storage'],
    tags: ['CapCut', 'Video', 'Creative'],
    plans: [
      { key: '1m', price: 399, compareAtPrice: 900, stock: 8 },
      { key: '3m', price: 1099, compareAtPrice: 2700, stock: 6 },
      { key: '1y', price: 3499, compareAtPrice: 10800, stock: 3 },
    ],
    isNew: true,
    relatedProductIds: ['prod_canva_pro_lifetime'],
  }),
  makeProduct({
    id: 'prod_zoom_pro',
    variantPrefix: 'var_zoom',
    name: 'Zoom Pro',
    slug: 'zoom-pro',
    sku: 'S4U-ZOOM',
    brand: 'Zoom Pro',
    categoryId: 'cat_productivity',
    image: '/brands/zoom.svg',
    shortDescription: 'Meetings up to 30 hours with 100 participants and cloud recording.',
    features: ['Meetings up to 30 hours', 'Up to 100 participants', 'Cloud recording', 'Private account'],
    tags: ['Zoom', 'Meetings', 'Productivity'],
    plans: [
      { key: '1m', price: 799, compareAtPrice: 1350, stock: 32 },
      { key: '3m', price: 2199, compareAtPrice: 4050, stock: 20 },
      { key: '1y', price: 7499, compareAtPrice: 16200, stock: 9 },
    ],
    productType: 'Software Subscription',
    relatedProductIds: ['prod_microsoft_365'],
  }),
  makeProduct({
    id: 'prod_grammarly_premium',
    variantPrefix: 'var_gram',
    name: 'Grammarly Premium',
    slug: 'grammarly-premium',
    sku: 'S4U-GRAM',
    brand: 'Grammarly Premium',
    categoryId: 'cat_productivity',
    image: '/brands/grammarly.svg',
    shortDescription: 'Advanced grammar, tone and clarity suggestions plus plagiarism checks.',
    features: ['Advanced grammar and clarity', 'Tone suggestions', 'Plagiarism checker', 'Works in browser and Word'],
    tags: ['Grammarly', 'Writing', 'Productivity'],
    plans: [
      { key: '1m', price: 599, compareAtPrice: 3500, stock: 26 },
      { key: '3m', price: 1599, compareAtPrice: 10500, stock: 15 },
      { key: '1y', price: 4999, compareAtPrice: 42000, stock: 7 },
    ],
    relatedProductIds: ['prod_chatgpt_plus', 'prod_microsoft_365'],
  }),
];

/** Format a PKR amount, e.g. `PKR 1,899`. */
export function formatPKR(amount: number): string {
  return `${siteConfig.currencySymbol} ${Math.round(amount).toLocaleString('en-US')}`;
}

/** Total units available across all plans (shown as "N available"). */
export function getProductStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + (v.status === 'active' ? v.stock : 0), 0);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug);
}

export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter(p => p.categoryId === categoryId && p.status === 'active');
}
