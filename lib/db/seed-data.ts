import {
  User,
  Category,
  Product,
  InventoryItem,
  Order,
  Coupon,
  SupportTicket,
  Review,
  Announcement,
  Banner,
  FAQ,
  Testimonial,
  NavigationItem,
  LegalPage,
  HomepageSection,
  PaymentGateway,
  SiteSettings,
  AuditLog
} from './types';
import { siteConfig } from '@/lib/site-config';

export const initialUsers: User[] = [
  {
    id: 'usr_superadmin',
    name: 'Alex Vance',
    email: 'admin@soft4u.top',
    passwordHash: 'admin123', // In real production we use secure argon2/bcrypt; here plain for test sign-in
    role: 'ADMIN',
    phone: '+92 300 1111111',
    whatsapp: '+923001111111',
    telegram: '@alexvance_pk',
    status: 'active',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'usr_prod_mgr',
    name: 'Morgan Chen',
    email: 'products@soft4u.top',
    passwordHash: 'manager123',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 'usr_order_mgr',
    name: 'Devon Miller',
    email: 'orders@soft4u.top',
    passwordHash: 'manager123',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2026-01-16T12:00:00Z',
    updatedAt: '2026-01-16T12:00:00Z',
  },
  {
    id: 'usr_support',
    name: 'Samira Patel',
    email: 'support@soft4u.top',
    passwordHash: 'agent123',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2026-01-18T09:00:00Z',
    updatedAt: '2026-01-18T09:00:00Z',
  },
  {
    id: 'usr_customer_demo',
    name: 'Demo Customer',
    email: 'customer@example.com',
    passwordHash: 'customer123',
    role: 'CUSTOMER',
    phone: '+92 300 0000000',
    whatsapp: '+923000000000',
    status: 'active',
    createdAt: '2026-02-01T14:30:00Z',
    updatedAt: '2026-02-01T14:30:00Z',
  },
];

export const initialCategories: Category[] = [
  {
    id: 'cat_ai',
    name: 'AI & Developer Tools',
    slug: 'ai-developer-tools',
    description: 'High-performance AI modeling, coding assistants, and machine intelligence subscriptions.',
    icon: 'Bot',
    status: 'active',
    displayOrder: 1,
    featured: true,
    seoTitle: 'Buy AI & Developer Tools Subscriptions | Soft4u',
    seoDescription: 'Discounted official access to ChatGPT Plus, Claude Pro, Midjourney, and developer copilots.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_streaming',
    name: 'Streaming & Media',
    slug: 'streaming-media',
    description: 'Ultra HD 4K streaming accounts, ad-free music passes, and global entertainment licenses.',
    icon: 'Tv',
    status: 'active',
    displayOrder: 2,
    featured: true,
    seoTitle: 'Premium Streaming Accounts & Entertainment Subscriptions',
    seoDescription: 'Genuine private profiles for Netflix 4K UHD, YouTube Premium, Spotify Duo, and Disney+.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_vpn',
    name: 'VPN & Privacy Security',
    slug: 'vpn-security',
    description: 'Enterprise encryption, zero-log tunnels, and ultra-fast global privacy networks.',
    icon: 'ShieldCheck',
    status: 'active',
    displayOrder: 3,
    featured: true,
    seoTitle: 'Secure VPN Licenses & Cybersecurity Tools | Instant Delivery',
    seoDescription: 'Verified multi-device license keys for NordVPN, ExpressVPN, and Surfshark with replacement warranty.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_productivity',
    name: 'Productivity & Creative',
    slug: 'productivity-creative',
    description: 'Industry-standard creative suites, cloud design workspaces, and office productivity suites.',
    icon: 'Sparkles',
    status: 'active',
    displayOrder: 4,
    featured: true,
    seoTitle: 'Productivity & Creative Software Licenses | Soft4u',
    seoDescription: 'Canva Pro Lifetime invites, Adobe Creative Cloud 1-Year subscriptions, and Microsoft 365.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cat_gaming',
    name: 'Gaming & Digital Passes',
    slug: 'gaming-digital-passes',
    description: 'Global cloud gaming subscriptions, digital gift cards, and VIP platform perks.',
    icon: 'Gamepad2',
    status: 'active',
    displayOrder: 5,
    featured: false,
    seoTitle: 'Gaming Passes & Digital Game Subscriptions',
    seoDescription: 'Instant codes for Xbox Game Pass Ultimate, Discord Nitro, and Steam Digital keys.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod_chatgpt_plus',
    name: 'ChatGPT Plus Private Access',
    slug: 'chatgpt-plus-private-access',
    sku: 'PK-AI-CGPT-01',
    shortDescription: 'Full access to GPT-4o, o1 reasoning models, DALL-E 3 image generation, and custom GPT workspace.',
    longDescription: 'Enjoy uninterrupted high-speed access to OpenAI\'s ChatGPT Plus. Works seamlessly across desktop, web, iOS, and Android with private credentials or direct email invitation. Features dedicated compute allocation, advanced voice mode, web browsing, data analysis, and document parsing without artificial token rate bottlenecks.',
    images: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80'
    ],
    logo: 'Bot',
    categoryId: 'cat_ai',
    tags: ['AI', 'OpenAI', 'GPT-4o', 'Coding', 'Productivity'],
    price: 11.99,
    compareAtPrice: 20.00,
    discount: 40,
    status: 'active',
    featured: true,
    bestseller: true,
    isNew: false,
    trending: true,
    badge: 'BEST SELLER',
    deliveryTime: 'Instant (2 - 5 mins)',
    deliveryMethod: 'Automated Account Credentials via Email & Dashboard',
    productType: 'Digital Subscription Account',
    inventoryModel: 'credential',
    features: [
      'Access to GPT-4o, o1, and advanced reasoning engines',
      'High-speed response priority during peak hours',
      'DALL-E 3 ultra HD image generation',
      'Code Interpreter, CSV spreadsheet analysis & Python execution',
      'Full replacement guarantee for the entire subscription tenure'
    ],
    requirements: [
      'Compatible with modern browsers (Chrome, Brave, Safari, Edge)',
      'Official ChatGPT iOS & Android mobile apps supported',
      'No VPN required in supported countries'
    ],
    usageInstructions: 'After purchase, you will receive login credentials or an activation link in your customer dashboard and order email. Log in at chatgpt.com, verify the Plus badge in the bottom left corner, and start chatting.',
    refundInfo: 'Full 100% replacement warranty throughout the active term. If your account encounters any access issue, our automated support agent or team will swap credentials within minutes.',
    seoTitle: 'Buy ChatGPT Plus Subscription Discount | Instant Delivery',
    seoDescription: 'Save 40% on ChatGPT Plus. Instant automated delivery with 24/7 warranty and full GPT-4o model access.',
    relatedProductIds: ['prod_claude_pro', 'prod_midjourney_pro'],
    variants: [
      {
        id: 'var_cgpt_1m',
        productId: 'prod_chatgpt_plus',
        name: '1 Month Access (30 Days)',
        price: 11.99,
        compareAtPrice: 20.00,
        sku: 'PK-AI-CGPT-1M',
        stock: 45,
        description: '30 days uninterrupted GPT-4o access with full warranty.',
        status: 'active',
        expiryDays: 30
      },
      {
        id: 'var_cgpt_3m',
        productId: 'prod_chatgpt_plus',
        name: '3 Months VIP Pass (90 Days)',
        price: 29.99,
        compareAtPrice: 60.00,
        sku: 'PK-AI-CGPT-3M',
        stock: 32,
        description: '90 days continuous subscription with priority support.',
        status: 'active',
        expiryDays: 90
      },
      {
        id: 'var_cgpt_1y',
        productId: 'prod_chatgpt_plus',
        name: '12 Months Annual Pass (365 Days)',
        price: 99.00,
        compareAtPrice: 240.00,
        sku: 'PK-AI-CGPT-1Y',
        stock: 18,
        description: 'Complete 1-year coverage with auto-renewal guarantee.',
        status: 'active',
        expiryDays: 365
      }
    ],
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'prod_claude_pro',
    name: 'Claude Pro (Anthropic Sonnet 3.7)',
    slug: 'claude-pro-anthropic',
    sku: 'PK-AI-CLAUDE-01',
    shortDescription: 'Unmatched coding prowess, 200k token context window, artifacts visualization, and Claude 3.7 Sonnet.',
    longDescription: 'Claude Pro gives you 5x more usage than free tiers, peak-hours priority, early access to new Anthropic capabilities, and full access to Sonnet 3.7 and Claude Artifacts. The absolute gold-standard AI platform for software engineers, researchers, and long-form document architects.',
    images: [
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80'
    ],
    logo: 'Sparkles',
    categoryId: 'cat_ai',
    tags: ['AI', 'Anthropic', 'Coding', 'Sonnet', 'Artifacts'],
    price: 12.50,
    compareAtPrice: 20.00,
    discount: 37,
    status: 'active',
    featured: true,
    bestseller: false,
    isNew: true,
    trending: true,
    badge: 'NEW',
    deliveryTime: 'Instant (under 3 mins)',
    deliveryMethod: 'Direct Email Credential Delivery',
    productType: 'Digital Account Pass',
    inventoryModel: 'credential',
    features: [
      'Claude 3.7 Sonnet with extended thinking capabilities',
      'Massive 200,000 token context window',
      'Claude Artifacts live code and web previews',
      'Priority compute during high-traffic intervals',
      'Full replacement assurance'
    ],
    requirements: ['Web browser or Claude iOS/Android app.'],
    usageInstructions: 'Sign in to claude.ai with the provided dedicated credentials. Enjoy full Pro privileges.',
    refundInfo: 'Guaranteed working warranty for the complete purchased duration.',
    seoTitle: 'Claude Pro Subscription – 5x Usage & Extended Thinking',
    seoDescription: 'Get genuine Claude Pro access with Anthropic Sonnet 3.7 model. Instant digital delivery.',
    relatedProductIds: ['prod_chatgpt_plus', 'prod_midjourney_pro'],
    variants: [
      {
        id: 'var_claude_1m',
        productId: 'prod_claude_pro',
        name: '1 Month Pro Pass',
        price: 12.50,
        compareAtPrice: 20.00,
        sku: 'PK-AI-CLAUDE-1M',
        stock: 28,
        status: 'active',
        expiryDays: 30
      },
      {
        id: 'var_claude_3m',
        productId: 'prod_claude_pro',
        name: '3 Months Pro Pass',
        price: 32.00,
        compareAtPrice: 60.00,
        sku: 'PK-AI-CLAUDE-3M',
        stock: 14,
        status: 'active',
        expiryDays: 90
      }
    ],
    createdAt: '2026-01-08T00:00:00Z',
    updatedAt: '2026-01-08T00:00:00Z',
  },
  {
    id: 'prod_midjourney_pro',
    name: 'Midjourney Standard / Pro Tier',
    slug: 'midjourney-fast-hours',
    sku: 'PK-AI-MJ-01',
    shortDescription: 'Photorealistic AI generative art, 15+ Fast GPU hours per month, stealth mode, and web generator access.',
    longDescription: 'Create award-winning digital artwork, concept designs, photography, and brand visuals with Midjourney. Includes fast generation hours, unlimited relax generations, commercial usage rights, and web alpha portal authorization.',
    images: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
    ],
    logo: 'Palette',
    categoryId: 'cat_ai',
    tags: ['AI', 'Art', 'Midjourney', 'Design', 'Discord'],
    price: 14.99,
    compareAtPrice: 30.00,
    discount: 50,
    status: 'active',
    featured: false,
    bestseller: true,
    isNew: false,
    trending: true,
    badge: 'POPULAR',
    deliveryTime: 'Instant (1 - 5 mins)',
    deliveryMethod: 'Discord Authorization & Credentials',
    productType: 'Digital Account Pass',
    inventoryModel: 'credential',
    features: [
      '15+ Fast GPU hours per month',
      'Unlimited Relax Mode image generation',
      'Full commercial usage rights on all outputs',
      'Midjourney Web Alpha platform access',
      'Private stealth mode generation option'
    ],
    requirements: ['Discord account or Web browser.'],
    usageInstructions: 'Login details delivered immediately to your order receipt. Follow the guide to link to your Discord server or work directly on midjourney.com.',
    refundInfo: 'Instant replacement warranty if access is interrupted.',
    seoTitle: 'Buy Midjourney Pro Fast GPU Hours Discount',
    seoDescription: 'Save 50% on Midjourney subscriptions with instant account delivery and full commercial license.',
    variants: [
      {
        id: 'var_mj_1m',
        productId: 'prod_midjourney_pro',
        name: 'Standard 1 Month (15 Fast Hrs)',
        price: 14.99,
        compareAtPrice: 30.00,
        sku: 'PK-AI-MJ-1M',
        stock: 22,
        status: 'active',
        expiryDays: 30
      },
      {
        id: 'var_mj_pro_1m',
        productId: 'prod_midjourney_pro',
        name: 'Pro 1 Month (30 Fast Hrs + Stealth)',
        price: 28.00,
        compareAtPrice: 60.00,
        sku: 'PK-AI-MJ-PRO-1M',
        stock: 12,
        status: 'active',
        expiryDays: 30
      }
    ],
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'prod_netflix_uhd',
    name: 'Netflix 4K Ultra HD Private Profile',
    slug: 'netflix-4k-uhd-private-profile',
    sku: 'PK-MED-NFLX-01',
    shortDescription: 'Dedicated private profile with your own PIN lock, 4K HDR, Dolby Atmos audio, and zero household errors.',
    longDescription: 'Stream your favorite movies, series, and documentaries in pristine 4K HDR. You receive a dedicated, personal profile secured with your custom 4-digit PIN on a stable premium account. Fully bypasses geographic household connection restrictions, guaranteed no boot-offs or simultaneous screen conflicts.',
    images: [
      'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80'
    ],
    logo: 'Tv',
    categoryId: 'cat_streaming',
    tags: ['Netflix', '4K UHD', 'Movies', 'Entertainment', 'Streaming'],
    price: 4.99,
    compareAtPrice: 15.99,
    discount: 68,
    status: 'active',
    featured: true,
    bestseller: true,
    isNew: false,
    trending: true,
    badge: 'BEST SELLER',
    deliveryTime: 'Instant (under 2 mins)',
    deliveryMethod: 'Email & Dashboard with Profile Number & PIN',
    productType: 'Streaming Private Profile',
    inventoryModel: 'credential',
    features: [
      'Ultra HD 4K resolution with Dolby Vision & Atmos',
      'Private profile with personal 4-digit PIN lock',
      'Separate watchlist, history, and tailored recommendations',
      'Works on Smart TVs, Apple TV, Chromecast, iOS, Android, PC',
      'Guaranteed replacement warranty against any household issues'
    ],
    requirements: ['Netflix app or browser.'],
    usageInstructions: 'Log in with the provided master email and password, click on your designated Profile (e.g. Profile 2 - Alex), and enter your personal PIN.',
    refundInfo: 'Full replacement guarantee for the purchased term duration.',
    seoTitle: 'Netflix 4K UHD Private Profile – Cheap & Instant Delivery',
    seoDescription: 'Save 68% on Netflix 4K UHD. Dedicated PIN-protected profile with instant activation.',
    variants: [
      {
        id: 'var_nflx_1m',
        productId: 'prod_netflix_uhd',
        name: '1 Month Private Profile',
        price: 4.99,
        compareAtPrice: 15.99,
        sku: 'PK-MED-NFLX-1M',
        stock: 50,
        status: 'active',
        expiryDays: 30
      },
      {
        id: 'var_nflx_3m',
        productId: 'prod_netflix_uhd',
        name: '3 Months Private Profile',
        price: 12.99,
        compareAtPrice: 47.97,
        sku: 'PK-MED-NFLX-3M',
        stock: 35,
        status: 'active',
        expiryDays: 90
      },
      {
        id: 'var_nflx_6m',
        productId: 'prod_netflix_uhd',
        name: '6 Months Private Profile',
        price: 23.99,
        compareAtPrice: 95.94,
        sku: 'PK-MED-NFLX-6M',
        stock: 20,
        status: 'active',
        expiryDays: 180
      }
    ],
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'prod_youtube_premium',
    name: 'YouTube Premium & Music 12-Month',
    slug: 'youtube-premium-12-months',
    sku: 'PK-MED-YTP-01',
    shortDescription: 'Ad-free YouTube playback on all devices, background video playback, offline downloads, and YouTube Music Premium.',
    longDescription: 'Activate YouTube Premium directly on your own personal Google Account! No need to switch accounts or lose your playlists, subscribers, or viewing history. Seamlessly enjoy zero ads across your Smart TV, mobile phone, tablet, and PC.',
    images: [
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80'
    ],
    logo: 'Play',
    categoryId: 'cat_streaming',
    tags: ['YouTube', 'Music', 'Ad-Free', 'Streaming', 'Google'],
    price: 24.99,
    compareAtPrice: 139.99,
    discount: 82,
    status: 'active',
    featured: true,
    bestseller: false,
    isNew: false,
    trending: true,
    badge: 'FAST DELIVERY',
    deliveryTime: 'Within 5 - 15 minutes',
    deliveryMethod: 'Direct Google Family Group Invite Link',
    productType: 'Digital Invite Pass',
    inventoryModel: 'license_key',
    features: [
      'Works directly on your existing Google account',
      'No ads on web, mobile, and smart TVs',
      'Background video playback with screen locked',
      'Offline video downloads on mobile devices',
      'Full YouTube Music Premium streaming app included'
    ],
    requirements: ['Existing Google / Gmail address not in another family group within 12 months.'],
    usageInstructions: 'Click the unique invite link generated in your dashboard, accept the invitation with your personal Gmail, and YouTube Premium activates instantly.',
    refundInfo: '1-Year active term warranty with dedicated support.',
    seoTitle: 'YouTube Premium 12 Months Discount – On Your Own Account',
    seoDescription: 'Save 80%+ on YouTube Premium 1-Year. Ad-free streaming directly on your personal Gmail account.',
    variants: [
      {
        id: 'var_yt_6m',
        productId: 'prod_youtube_premium',
        name: '6 Months Pass',
        price: 14.99,
        compareAtPrice: 70.00,
        sku: 'PK-MED-YT-6M',
        stock: 30,
        status: 'active',
        expiryDays: 180
      },
      {
        id: 'var_yt_12m',
        productId: 'prod_youtube_premium',
        name: '12 Months Annual Pass',
        price: 24.99,
        compareAtPrice: 139.99,
        sku: 'PK-MED-YT-12M',
        stock: 45,
        status: 'active',
        expiryDays: 365
      }
    ],
    createdAt: '2026-01-04T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },
  {
    id: 'prod_nordvpn_ultimate',
    name: 'NordVPN Ultimate Multi-Device License',
    slug: 'nordvpn-ultimate-license',
    sku: 'PK-SEC-NVPN-01',
    shortDescription: 'High-speed encrypted VPN across 10 devices, Threat Protection anti-malware, and 6,000+ servers.',
    longDescription: 'Safeguard your entire digital footprint with industry-leading NordVPN. Stream region-restricted media, secure public Wi-Fi hotspots, block trackers, and shield passwords. Compatible with Windows, macOS, Linux, Android, iOS, and router firmware.',
    images: [
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80'
    ],
    logo: 'ShieldCheck',
    categoryId: 'cat_vpn',
    tags: ['VPN', 'Security', 'Privacy', 'NordVPN', 'Encryption'],
    price: 18.50,
    compareAtPrice: 79.00,
    discount: 76,
    status: 'active',
    featured: false,
    bestseller: false,
    isNew: false,
    trending: false,
    badge: 'INSTANT',
    deliveryTime: 'Instant (under 1 min)',
    deliveryMethod: 'Automated License Key or Dedicated Account',
    productType: 'Software License',
    inventoryModel: 'license_key',
    features: [
      'Connect up to 10 devices simultaneously',
      'NordLynx revolutionary WireGuard protocol',
      'Built-in Threat Protection Pro against phishing and malware',
      '6,000+ ultra-fast servers across 111 countries',
      'Strict audited zero-log guarantee'
    ],
    requirements: ['Compatible with any desktop or mobile operating system.'],
    usageInstructions: 'Download the NordVPN client from nordvpn.com/download. Enter the license key or log in with the provided details.',
    refundInfo: 'Full replacement warranty for 12 or 24 months.',
    seoTitle: 'Buy NordVPN License Key Discount – Instant Activation',
    seoDescription: '76% Off NordVPN multi-device subscription. Instant digital license key delivery.',
    variants: [
      {
        id: 'var_nvpn_1y',
        productId: 'prod_nordvpn_ultimate',
        name: '1 Year License (10 Devices)',
        price: 18.50,
        compareAtPrice: 79.00,
        sku: 'PK-SEC-NVPN-1Y',
        stock: 40,
        status: 'active',
        expiryDays: 365
      },
      {
        id: 'var_nvpn_2y',
        productId: 'prod_nordvpn_ultimate',
        name: '2 Years License (10 Devices)',
        price: 32.00,
        compareAtPrice: 140.00,
        sku: 'PK-SEC-NVPN-2Y',
        stock: 25,
        status: 'active',
        expiryDays: 730
      }
    ],
    createdAt: '2026-01-07T00:00:00Z',
    updatedAt: '2026-01-07T00:00:00Z',
  },
  {
    id: 'prod_canva_pro_lifetime',
    name: 'Canva Pro Designer Team Pass (Lifetime)',
    slug: 'canva-pro-lifetime-designer',
    sku: 'PK-DES-CANVA-01',
    shortDescription: '100+ million stock photos, Brand Kit, background remover, magic resize, and unlimited design cloud storage.',
    longDescription: 'Supercharge your graphics, marketing collateral, social posts, presentations, and video thumbnails. Activated directly on your existing personal Canva email address. Retain all your existing designs with permanent Pro features.',
    images: [
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80'
    ],
    logo: 'Sparkles',
    categoryId: 'cat_productivity',
    tags: ['Design', 'Canva', 'Graphics', 'Social Media', 'Marketing'],
    price: 9.99,
    compareAtPrice: 59.99,
    discount: 83,
    status: 'active',
    featured: true,
    bestseller: true,
    isNew: false,
    trending: true,
    badge: 'BEST SELLER',
    deliveryTime: 'Instant (under 2 mins)',
    deliveryMethod: 'Automated Team Join Invite Link',
    productType: 'Digital Invite Pass',
    inventoryModel: 'license_key',
    features: [
      '100M+ premium stock photos, videos, and graphics',
      'One-click Instant Background Remover for images and video',
      'Magic Resize for multi-platform distribution',
      'Brand Kit font uploads and color palettes',
      'Unlimited 1TB cloud design storage'
    ],
    requirements: ['Any free Canva registered email address.'],
    usageInstructions: 'Click the automated invitation link delivered upon checkout. Accept the invite to join the Pro team and your account is instantly elevated.',
    refundInfo: 'Full lifetime replacement guarantee.',
    seoTitle: 'Canva Pro Lifetime Access – Upgrade Your Own Account',
    seoDescription: 'Unlock Canva Pro features on your own email. 100M+ assets, background remover, and brand kit.',
    variants: [
      {
        id: 'var_canva_1y',
        productId: 'prod_canva_pro_lifetime',
        name: '1 Year Pro Team Pass',
        price: 5.99,
        compareAtPrice: 29.99,
        sku: 'PK-DES-CANVA-1Y',
        stock: 80,
        status: 'active',
        expiryDays: 365
      },
      {
        id: 'var_canva_life',
        productId: 'prod_canva_pro_lifetime',
        name: 'Lifetime VIP Team Pass',
        price: 9.99,
        compareAtPrice: 59.99,
        sku: 'PK-DES-CANVA-LT',
        stock: 65,
        status: 'active',
        expiryDays: 1825
      }
    ],
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-03T00:00:00Z',
  },
  {
    id: 'prod_adobe_creative_cloud',
    name: 'Adobe Creative Cloud All Apps (1 Year)',
    slug: 'adobe-creative-cloud-all-apps',
    sku: 'PK-DES-ADOBE-01',
    shortDescription: 'Photoshop, Premiere Pro, Illustrator, After Effects, Lightroom, 100GB cloud storage, and Adobe Fonts.',
    longDescription: 'The comprehensive gold standard for creative professionals. Access 20+ desktop applications, mobile tools, Adobe Firefly generative credits, and enterprise font libraries. Activated directly onto your Adobe ID.',
    images: [
      'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80'
    ],
    logo: 'Layers',
    categoryId: 'cat_productivity',
    tags: ['Adobe', 'Photoshop', 'Video Editing', 'Illustrator', 'Design'],
    price: 89.00,
    compareAtPrice: 359.00,
    discount: 75,
    status: 'active',
    featured: false,
    bestseller: false,
    isNew: true,
    trending: false,
    badge: 'LIMITED',
    deliveryTime: 'Within 15 - 30 minutes',
    deliveryMethod: 'Direct Adobe ID Enterprise Invitation',
    productType: 'Software License',
    inventoryModel: 'manual',
    features: [
      'Photoshop, Illustrator, Premiere Pro, After Effects, InDesign',
      'Adobe Firefly Generative AI monthly credits',
      '100GB secure Creative Cloud storage',
      '20,000+ Adobe Fonts licensing for commercial works',
      'Works on 2 computers concurrently (Mac & Windows)'
    ],
    requirements: ['Personal Adobe ID (email address).'],
    usageInstructions: 'Provide your Adobe email during checkout. Our enterprise license manager adds your account to the enterprise portal within 30 minutes.',
    refundInfo: 'Full 1-year replacement guarantee.',
    seoTitle: 'Adobe Creative Cloud All Apps 1-Year Subscription Discount',
    seoDescription: '75% off Adobe Creative Cloud All Apps. Legitimate redemption on your own Adobe ID.',
    variants: [
      {
        id: 'var_adobe_1y',
        productId: 'prod_adobe_creative_cloud',
        name: '12 Months All Apps Access',
        price: 89.00,
        compareAtPrice: 359.00,
        sku: 'PK-DES-ADOBE-1Y',
        stock: 15,
        status: 'active',
        expiryDays: 365
      }
    ],
    createdAt: '2026-01-09T00:00:00Z',
    updatedAt: '2026-01-09T00:00:00Z',
  }
];

export const initialInventory: InventoryItem[] = [
  {
    id: 'inv_cgpt_01',
    productId: 'prod_chatgpt_plus',
    variantId: 'var_cgpt_1m',
    type: 'credential',
    data: {
      email: 'vault.account01@example.com',
      password: 'SecureKey$2026OpenAI',
      notes: 'Private account. Log in directly at chatgpt.com'
    },
    status: 'available',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'inv_cgpt_02',
    productId: 'prod_chatgpt_plus',
    variantId: 'var_cgpt_1m',
    type: 'credential',
    data: {
      email: 'vault.account02@example.com',
      password: 'PassKey#2026ChatGPT',
      notes: 'Private account. Dedicated subscription.'
    },
    status: 'available',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'inv_nflx_01',
    productId: 'prod_netflix_uhd',
    variantId: 'var_nflx_1m',
    type: 'credential',
    data: {
      email: 'vault.account03@example.com',
      password: 'Stream$2026Soft4u',
      profileName: 'Profile 3 (VIP)',
      pin: '8492',
      notes: 'Stream strictly on Profile 3 with PIN 8492'
    },
    status: 'available',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'inv_nvpn_01',
    productId: 'prod_nordvpn_ultimate',
    variantId: 'var_nvpn_1y',
    type: 'license_key',
    data: {
      licenseKey: 'NVPN-89X4-2KM9-L9Q1-7B8A',
      notes: 'Redeem at nordvpn.com/order/activate or inside app'
    },
    status: 'available',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'inv_canva_01',
    productId: 'prod_canva_pro_lifetime',
    variantId: 'var_canva_life',
    type: 'license_key',
    data: {
      licenseKey: 'https://canva.com/brand/join?token=pk_invite_92819f8a9e',
      notes: 'Click the link to join the official Canva Pro team workspace'
    },
    status: 'available',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z'
  }
];

export const initialOrders: Order[] = [
  {
    id: 'ord_101',
    orderNumber: 'PK-84912',
    customerId: 'usr_customer_demo',
    customerName: 'Demo Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '+923000000000',
    items: [
      {
        id: 'item_101_1',
        orderId: 'ord_101',
        productId: 'prod_chatgpt_plus',
        productName: 'ChatGPT Plus Private Access',
        productImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        variantId: 'var_cgpt_1m',
        variantName: '1 Month Access (30 Days)',
        price: 11.99,
        quantity: 1,
        expiryDays: 30,
        fulfillmentData: {
          credentials: [
            {
              email: 'vault.demo@example.com',
              password: 'Soft4uDemo#2026',
              profile: 'Dedicated Plus Account'
            }
          ],
          instructions: 'Visit chatgpt.com and sign in with the credentials above. Do not alter billing parameters.'
        }
      }
    ],
    subtotal: 11.99,
    discount: 0,
    tax: 0,
    total: 11.99,
    paymentMethod: 'Credit / Debit Card (Stripe)',
    paymentStatus: 'paid',
    fulfillmentStatus: 'fulfilled',
    orderStatus: 'completed',
    timeline: [
      { status: 'Order Created', note: 'Customer completed checkout successfully', timestamp: '2026-02-14T09:20:00Z' },
      { status: 'Payment Confirmed', note: 'Card transaction authorized $11.99', timestamp: '2026-02-14T09:20:15Z' },
      { status: 'Automated Fulfillment', note: 'Digital inventory credentials dispatched to dashboard & email', timestamp: '2026-02-14T09:20:25Z' }
    ],
    createdAt: '2026-02-14T09:20:00Z',
    updatedAt: '2026-02-14T09:20:25Z'
  },
  {
    id: 'ord_102',
    orderNumber: 'PK-84913',
    customerName: 'Elena Rostova',
    customerEmail: 'elena@example.com',
    customerPhone: '+923002222222',
    items: [
      {
        id: 'item_102_1',
        orderId: 'ord_102',
        productId: 'prod_canva_pro_lifetime',
        productName: 'Canva Pro Designer Team Pass (Lifetime)',
        variantId: 'var_canva_life',
        variantName: 'Lifetime VIP Team Pass',
        price: 9.99,
        quantity: 1,
        fulfillmentData: {
          licenseKeys: ['https://canva.com/brand/join?token=pk_canva_vip_elena94'],
          instructions: 'Accept the invite on your Canva profile.'
        }
      }
    ],
    subtotal: 9.99,
    discount: 0,
    tax: 0,
    total: 9.99,
    paymentMethod: 'USDT Crypto',
    paymentStatus: 'paid',
    fulfillmentStatus: 'fulfilled',
    orderStatus: 'completed',
    timeline: [
      { status: 'Order Created', note: 'Order placed via crypto gateway', timestamp: '2026-02-15T14:10:00Z' },
      { status: 'Payment Confirmed', note: 'USDT (TRC20) confirmed on blockchain', timestamp: '2026-02-15T14:12:00Z' },
      { status: 'Fulfilled', note: 'Invite link delivered', timestamp: '2026-02-15T14:12:05Z' }
    ],
    createdAt: '2026-02-15T14:10:00Z',
    updatedAt: '2026-02-15T14:12:05Z'
  },
  {
    id: 'ord_103',
    orderNumber: 'PK-84914',
    customerName: 'Marcus Wright',
    customerEmail: 'm.wright@example.com',
    items: [
      {
        id: 'item_103_1',
        orderId: 'ord_103',
        productId: 'prod_netflix_uhd',
        productName: 'Netflix 4K Ultra HD Private Profile',
        variantId: 'var_nflx_3m',
        variantName: '3 Months Private Profile',
        price: 12.99,
        quantity: 1
      }
    ],
    subtotal: 12.99,
    discount: 2.00,
    couponCode: 'SOFT20',
    tax: 0,
    total: 10.99,
    paymentMethod: 'Credit / Debit Card',
    paymentStatus: 'pending',
    fulfillmentStatus: 'unfulfilled',
    orderStatus: 'pending',
    timeline: [
      { status: 'Order Created', note: 'Customer awaiting 3D Secure verification', timestamp: '2026-02-16T11:00:00Z' }
    ],
    createdAt: '2026-02-16T11:00:00Z',
    updatedAt: '2026-02-16T11:00:00Z'
  }
];

export const initialCoupons: Coupon[] = [
  {
    id: 'coup_soft20',
    code: 'SOFT20',
    description: '20% off your entire digital order',
    type: 'percentage',
    value: 20,
    minOrderAmount: 10.00,
    maxDiscount: 25.00,
    usageLimit: 500,
    usageCount: 42,
    perUserLimit: 1,
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'coup_welcome10',
    code: 'WELCOME10',
    description: '10% discount on first-time digital subscription purchases',
    type: 'percentage',
    value: 10,
    minOrderAmount: 5.00,
    usageCount: 118,
    perUserLimit: 1,
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'coup_save5',
    code: 'SAVE5',
    description: '$5 flat savings on orders $30+',
    type: 'fixed',
    value: 5,
    minOrderAmount: 30.00,
    usageCount: 19,
    perUserLimit: 2,
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const initialTickets: SupportTicket[] = [
  {
    id: 'tkt_01',
    ticketNumber: 'TKT-9201',
    customerId: 'usr_customer_demo',
    customerName: 'Demo Customer',
    customerEmail: 'customer@example.com',
    subject: 'Question regarding renewal on ChatGPT Plus',
    orderId: 'ord_101',
    productId: 'prod_chatgpt_plus',
    category: 'Subscription Extension',
    status: 'waiting_customer',
    priority: 'medium',
    messages: [
      {
        id: 'msg_01_1',
        senderId: 'usr_customer_demo',
        senderName: 'Demo Customer',
        senderRole: 'CUSTOMER',
        message: 'Hello team, if I want to extend my 1-month pass to a 12-month pass, do I keep the same email or receive a new one?',
        isInternalNote: false,
        timestamp: '2026-02-14T10:00:00Z'
      },
      {
        id: 'msg_01_2',
        senderId: 'usr_support',
        senderName: 'Samira Patel (Support)',
        senderRole: 'ADMIN',
        message: 'Hi there! You can seamlessly extend the exact same credentials without losing your chats. Just submit your current order ID during checkout or reply here and our automated system will renew it directly.',
        isInternalNote: false,
        timestamp: '2026-02-14T10:15:00Z'
      }
    ],
    createdAt: '2026-02-14T10:00:00Z',
    updatedAt: '2026-02-14T10:15:00Z'
  }
];

export const initialReviews: Review[] = [
  {
    id: 'rev_01',
    productId: 'prod_chatgpt_plus',
    customerId: 'usr_customer_demo',
    customerName: 'Demo C.',
    customerEmail: 'customer@example.com',
    rating: 5,
    title: 'Instant delivery and works flawlessly!',
    comment: 'Credentials arrived in my inbox in literally 2 minutes after checkout. GPT-4o voice and reasoning models work perfectly. Excellent support.',
    verifiedPurchase: true,
    status: 'approved',
    isFeatured: true,
    createdAt: '2026-02-14T11:00:00Z'
  },
  {
    id: 'rev_02',
    productId: 'prod_netflix_uhd',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah@example.com',
    rating: 5,
    title: 'No household error! True 4K HDR quality',
    comment: 'Was skeptical after Netflix cracked down on sharing, but this private profile has its own PIN and works on my LG OLED without any issues.',
    verifiedPurchase: true,
    status: 'approved',
    isFeatured: true,
    createdAt: '2026-02-10T16:20:00Z'
  },
  {
    id: 'rev_03',
    productId: 'prod_canva_pro_lifetime',
    customerName: 'Liam Chen',
    customerEmail: 'liam@example.com',
    rating: 5,
    title: 'Upgraded my own existing account instantly',
    comment: 'Clicked the invite link and my existing account upgraded to Pro immediately. Saved hundreds compared to annual Canva pricing.',
    verifiedPurchase: true,
    status: 'approved',
    isFeatured: true,
    createdAt: '2026-02-08T14:10:00Z'
  }
];

export const initialAnnouncements: Announcement[] = [
  {
    id: 'ann_01',
    text: 'SPRING SALE: Use code SOFT20 for 20% OFF all AI & Streaming subscriptions',
    link: '/shop',
    ctaText: 'Claim Discount',
    priority: 1,
    enabled: true,
    createdAt: '2026-02-01T00:00:00Z'
  }
];

export const initialBanners: Banner[] = [
  {
    id: 'ban_01',
    title: 'Enterprise AI & Creative Software at Fraction of Retail Cost',
    subtitle: '100% Guaranteed automated fulfillment with 24/7 dedicated replacement warranty.',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    ctaText: 'Explore Catalog',
    url: '/shop',
    priority: 1,
    position: 'hero_bottom',
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z'
  }
];

export const initialFAQs: FAQ[] = [
  {
    id: 'faq_01',
    question: 'How quickly will I receive my digital subscription after payment?',
    answer: 'Delivery is automated and near-instantaneous. For digital credentials and license keys, fulfillment details are immediately displayed on your Order Confirmation screen and securely emailed to you within 2 to 5 minutes.',
    category: 'Fulfillment & Delivery',
    displayOrder: 1,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'faq_02',
    question: 'What happens if an account or key stops working?',
    answer: 'Every product on Soft4u includes our Full Term Replacement Warranty. If you encounter any access difficulty, open a support ticket or track your order; our system or agent will swap your credentials promptly at zero cost.',
    category: 'Warranty & Replacement',
    displayOrder: 2,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'faq_03',
    question: 'Can I use these services globally without restrictions?',
    answer: 'Yes! All accounts and license keys provided by Soft4u are global licenses unless explicitly indicated in the product specifications. They work without geographic region locks.',
    category: 'Product Compatibility',
    displayOrder: 3,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'faq_04',
    question: 'What payment methods do you accept?',
    answer: 'We support Visa, MasterCard, American Express, Apple Pay, Google Pay, PayPal, major cryptocurrencies (USDT, BTC, ETH), and direct wire transfer.',
    category: 'Payments',
    displayOrder: 4,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const initialTestimonials: Testimonial[] = [
  {
    id: 'test_01',
    name: 'David K.',
    roleOrCompany: 'Fullstack Software Engineer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    content: 'Soft4u is easily the most reliable digital software store I have ever used. Fast delivery, working ChatGPT Plus credentials, and zero downtime.',
    featured: true,
    displayOrder: 1,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'test_02',
    name: 'Rebecca M.',
    roleOrCompany: 'Creative Agency Lead',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    content: 'Our design team relies on Canva and Midjourney daily. Getting verified access at these price points with immediate delivery saved us thousands.',
    featured: true,
    displayOrder: 2,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'test_03',
    name: 'Tariq Al-Mansoor',
    roleOrCompany: 'Media Producer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    content: 'I was hesitant about Netflix household locks, but Soft4u provides a true private profile with custom PIN. Flawless experience.',
    featured: true,
    displayOrder: 3,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const initialNavigation: NavigationItem[] = [
  { id: 'nav_h1', label: 'Home', url: '/', displayOrder: 1, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h2', label: 'All Products', url: '/shop', displayOrder: 2, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h3', label: 'Categories', url: '/categories', displayOrder: 3, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h4', label: 'Track Order', url: '/track-order', displayOrder: 4, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h5', label: 'FAQ', url: '/faq', displayOrder: 5, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h6', label: 'About', url: '/about', displayOrder: 6, visible: true, targetBlank: false, position: 'header' },
  { id: 'nav_h7', label: 'Contact', url: '/contact', displayOrder: 7, visible: true, targetBlank: false, position: 'header' },

  { id: 'nav_f1', label: 'Shop Catalog', url: '/shop', displayOrder: 1, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f2', label: 'Categories', url: '/categories', displayOrder: 2, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f3', label: 'Order Tracking', url: '/track-order', displayOrder: 3, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f4', label: 'Support & Helpdesk', url: '/account/support', displayOrder: 4, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f5', label: 'Terms & Conditions', url: '/terms', displayOrder: 5, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f6', label: 'Privacy Policy', url: '/privacy', displayOrder: 6, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f7', label: 'Refund Policy', url: '/refund-policy', displayOrder: 7, visible: true, targetBlank: false, position: 'footer' },
  { id: 'nav_f8', label: 'Cookie Policy', url: '/cookie-policy', displayOrder: 8, visible: true, targetBlank: false, position: 'footer' }
];

export const initialLegalPages: LegalPage[] = [
  {
    id: 'leg_terms',
    slug: 'terms',
    title: 'Terms & Conditions',
    content: `# Terms and Conditions of Service

**Last Revised: February 2026**

Welcome to **Soft4u**. By accessing our storefront, ordering digital subscriptions, license keys, or using any associated services, you agree to be bound by these Terms and Conditions.

### 1. Digital Services & Licensing
Soft4u provides legitimate digital credentials, invitation links, and software license keys for leading productivity, artificial intelligence, security, and media services. All accounts and access privileges are supplied strictly for the purchased duration and specifications stated on the product page.

### 2. Automated Delivery
Upon successful settlement of payment:
- Digital license keys and account credentials will be issued to your customer dashboard and emailed to the address provided during checkout.
- Delivery typically completes within 2 to 5 minutes.
- Customers are responsible for verifying their credentials upon receipt and safeguarding login details.

### 3. Usage & Fair Play
Users agree not to:
- Attempt unauthorized modifications to master account passwords, billing parameters, or recovery credentials unless explicitly authorized.
- Resell or redistribute credentials outside the permitted scope.
- Violate the platform rules of the respective underlying service providers.

### 4. Warranty & Account Replacement
Every digital product is protected by our Full-Term Warranty:
- If a purchased subscription suffers premature interruption or invalidation, Soft4u will verify and replace the access within 24 hours.
- Warranty is void if the customer deliberately modified account security questions, master recovery emails, or attempted chargeback fraud.

### 5. Contact Information
For legal inquiries or terms clarification, please contact our compliance desk at **${siteConfig.email}**.`,
    status: 'published',
    lastPublishedAt: '2026-02-01T00:00:00Z',
    revisions: [
      {
        version: 1,
        content: 'Initial Terms and Conditions published.',
        publishedAt: '2026-02-01T00:00:00Z',
        note: 'Initial official publication'
      }
    ],
    updatedAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'leg_privacy',
    slug: 'privacy',
    title: 'Privacy Policy',
    content: `# Privacy & Data Protection Policy

**Last Updated: February 2026**

At Soft4u, we uphold the strictest principles of digital privacy and data confidentiality.

### 1. Data We Collect
We collect only the bare minimum information necessary to execute transactions and deliver your digital items:
- Customer name and email address for order fulfillment and dashboard access.
- Optional communication identifiers (WhatsApp or Telegram) if requested by customer for instant dispatch.
- Transaction identifiers generated by payment processors. We NEVER store raw credit card numbers or banking secrets on our servers.

### 2. How We Protect Your Data
All transmissions use TLS 1.3 encryption. Passwords and credentials stored within our infrastructure are encrypted with enterprise-grade algorithms. Digital fulfillment data is only visible to the purchasing customer and authorized order managers.

### 3. Third-Party Sharing
We never sell, rent, or trade your personal data. We interact with trusted payment gateways (Stripe, PayPal, Crypto processors) solely to verify payments.

### 4. Your Rights
You may request complete erasure of your account, purchase history, and associated identifiers at any time by contacting ${siteConfig.email}.`,
    status: 'published',
    lastPublishedAt: '2026-02-01T00:00:00Z',
    revisions: [
      {
        version: 1,
        content: 'Initial Privacy Policy published.',
        publishedAt: '2026-02-01T00:00:00Z',
        note: 'Launch release'
      }
    ],
    updatedAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'leg_refund',
    slug: 'refund-policy',
    title: 'Refund & Replacement Policy',
    content: `# Refund & Replacement Policy

**Effective Date: February 2026**

Customer satisfaction and reliability are our highest priorities.

### 1. Digital Nature of Goods
Because our products are intangible digital goods delivered immediately via automated license keys or account credentials, standard return procedures for physical items do not apply once credentials have been viewed.

### 2. 100% Replacement Warranty
If any credentials or license keys fail to activate or experience interruption during your paid subscription period:
- You are eligible for an immediate replacement.
- Our automated support desk and agents resolve 98% of replacement inquiries in under 30 minutes.

### 3. When Are Refunds Issued?
A full refund to the original payment method is issued when:
- We are unable to provide a functional replacement key/account within 24 hours of a verified issue.
- An accidental duplicate payment occurred.
- The item was out of stock and fulfillment cannot be completed within 12 hours.

### 4. How to Request Assistance
Open a ticket via your customer dashboard at /account/support or email ${siteConfig.email} with your Order Number (e.g. PK-84912).`,
    status: 'published',
    lastPublishedAt: '2026-02-01T00:00:00Z',
    revisions: [
      {
        version: 1,
        content: 'Official digital refund policy.',
        publishedAt: '2026-02-01T00:00:00Z',
        note: 'Standard policy'
      }
    ],
    updatedAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'leg_cookies',
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    content: `# Cookie & Session Policy

**Effective Date: February 2026**

Soft4u uses minimal, essential cookies and browser storage strictly required for operational functionality:
- **Authentication Session**: Keeps you securely signed in to your account.
- **Cart Storage**: Preserves your shopping cart items between page navigations.
- **Security & CSRF Protection**: Prevents cross-site request forgery and unauthorized order attempts.

We do not utilize invasive cross-site advertising tracking cookies.`,
    status: 'published',
    lastPublishedAt: '2026-02-01T00:00:00Z',
    revisions: [
      {
        version: 1,
        content: 'Official cookie policy.',
        publishedAt: '2026-02-01T00:00:00Z',
        note: 'Standard cookie disclosure'
      }
    ],
    updatedAt: '2026-02-01T00:00:00Z'
  }
];

export const initialHomepageSections: HomepageSection[] = [
  {
    id: 'sec_hero',
    type: 'hero',
    name: 'Hero Section',
    enabled: true,
    order: 1,
    settings: {
      kicker: 'PREMIUM DIGITAL COMMERCE & VERIFIED LICENSES',
      headline: 'Enterprise Subscriptions & Digital Keys at Wholesale Rates',
      subheadline: 'Automated 2-minute delivery, full-term replacement guarantees, and verified private accounts for AI, streaming, security, and developer software.',
      primaryCtaText: 'Browse Catalog',
      primaryCtaUrl: '/shop',
      secondaryCtaText: 'Track an Order',
      secondaryCtaUrl: '/track-order',
      badgeText: 'Instant Delivery · 24/7 Verified',
      stats: [
        { label: 'Active Subscribers', value: '48,000+' },
        { label: 'Avg Fulfillment Time', value: '110 Sec' },
        { label: 'Replacement Guarantee', value: '100%' }
      ]
    }
  },
  {
    id: 'sec_trust',
    type: 'trust_bar',
    name: 'Trust & Guarantees Bar',
    enabled: true,
    order: 2,
    settings: {
      items: [
        { icon: 'Zap', title: 'Instant Automated Delivery', desc: 'Credentials issued immediately to your dashboard' },
        { icon: 'ShieldCheck', title: 'Full Replacement Warranty', desc: '100% covered for the entire paid duration' },
        { icon: 'Lock', title: 'Bank-Grade Privacy', desc: 'Encrypted transactions with zero data resale' },
        { icon: 'LifeBuoy', title: '24/7 Priority Support', desc: 'Live ticketing and fast human agent response' }
      ]
    }
  },
  {
    id: 'sec_categories',
    type: 'categories',
    name: 'Featured Categories',
    enabled: true,
    order: 3,
    settings: {
      title: 'Curated Software & Subscription Categories',
      subtitle: 'Browse industry-leading platforms across artificial intelligence, entertainment, privacy, and design.'
    }
  },
  {
    id: 'sec_bestsellers',
    type: 'bestsellers',
    name: 'Best Selling Products',
    enabled: true,
    order: 4,
    settings: {
      title: 'Most Popular Digital Subscriptions',
      subtitle: 'Verified accounts and licenses trusted by over 48,000 satisfied professionals and consumers.',
      limit: 4
    }
  },
  {
    id: 'sec_banner',
    type: 'banner',
    name: 'Promotional Banner',
    enabled: true,
    order: 5,
    settings: {
      title: 'Save up to 80% on Developer AI & Creative Suites',
      description: 'Stop paying inflated monthly SaaS fees. Get genuine private accounts with instant automated onboarding.',
      couponCode: 'SOFT20',
      ctaText: 'Shop All Deals',
      ctaUrl: '/shop'
    }
  },
  {
    id: 'sec_benefits',
    type: 'benefits',
    name: 'Why Choose Us',
    enabled: true,
    order: 6,
    settings: {
      title: 'The Soft4u Standard: Trust, Speed & Assurance',
      subtitle: 'Unlike unverified marketplace sellers, we manage and warrant every subscription directly.',
      items: [
        {
          title: 'Direct Account Provisioning',
          description: 'No shared mess or broken password conflicts. Our accounts are private, clean, and pre-tested.'
        },
        {
          title: 'Automated Instant Vault',
          description: 'Access your login credentials, license keys, and renewal dates right inside your personal dashboard anytime.'
        },
        {
          title: 'Zero-Question Replacement',
          description: 'If a service changes policies or revokes access, click replacement and get fresh working credentials.'
        }
      ]
    }
  },
  {
    id: 'sec_how_it_works',
    type: 'how_it_works',
    name: 'How It Works',
    enabled: true,
    order: 7,
    settings: {
      title: 'Simple 3-Step Fulfillment Flow',
      subtitle: 'From selection to active software in less than 3 minutes.',
      steps: [
        { step: '01', title: 'Choose Your Plan', desc: 'Select from flexible 1-month, 3-month, or annual billing options.' },
        { step: '02', title: 'Secure Instant Checkout', desc: 'Pay via Card, Apple Pay, PayPal, or Crypto with zero transaction fees.' },
        { step: '03', title: 'Immediate Digital Access', desc: 'View your keys or credentials on screen and in your email immediately.' }
      ]
    }
  },
  {
    id: 'sec_testimonials',
    type: 'testimonials',
    name: 'Customer Testimonials',
    enabled: true,
    order: 8,
    settings: {
      title: 'Real Reviews From Real Subscribers',
      subtitle: 'See what engineers, designers, and media enthusiasts say about Soft4u.'
    }
  },
  {
    id: 'sec_faq',
    type: 'faq',
    name: 'Frequently Asked Questions',
    enabled: true,
    order: 9,
    settings: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about our digital licenses and warranty.',
      limit: 4
    }
  },
  {
    id: 'sec_cta',
    type: 'cta',
    name: 'Final Call To Action',
    enabled: true,
    order: 10,
    settings: {
      title: 'Ready to Upgrade Your Digital Workflow?',
      subtitle: 'Unlock premium AI, 4K streaming, and creative licenses in under 2 minutes.',
      ctaText: 'Explore All Subscriptions',
      ctaUrl: '/shop'
    }
  }
];

export const initialPaymentGateways: PaymentGateway[] = [
  {
    id: 'gw_stripe',
    key: 'stripe',
    name: 'Credit / Debit Card (Stripe)',
    description: 'Instant processing for Visa, MasterCard, Amex, Apple Pay, Google Pay',
    enabled: true,
    isSandbox: true,
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'],
    feePercentage: 0,
    instructions: 'Secure 256-bit SSL encrypted card authorization.',
    minAmount: 1,
    maxAmount: 5000
  },
  {
    id: 'gw_crypto',
    key: 'crypto',
    name: 'Cryptocurrency (USDT / BTC / ETH)',
    description: 'Instant decentralized settlement with zero card chargeback fees',
    enabled: true,
    isSandbox: false,
    currencies: ['USDT', 'BTC', 'ETH', 'SOL'],
    feePercentage: 0,
    instructions: 'Send exact calculated amount to the generated TRC20/ERC20 address. Order fulfills upon 1 network confirmation.',
    minAmount: 5,
    maxAmount: 10000
  },
  {
    id: 'gw_paypal',
    key: 'paypal',
    name: 'PayPal Global',
    description: 'Pay securely with your PayPal balance or linked bank account',
    enabled: true,
    isSandbox: true,
    currencies: ['USD', 'EUR', 'GBP'],
    feePercentage: 1.5,
    instructions: 'Redirects to PayPal portal for instant 1-click confirmation.',
    minAmount: 2,
    maxAmount: 2000
  },
  {
    id: 'gw_manual',
    key: 'manual',
    name: 'Direct Bank Wire / UPI Transfer',
    description: 'Manual verification for enterprise or localized payment methods',
    enabled: true,
    isSandbox: false,
    currencies: ['USD', 'INR', 'EUR'],
    feePercentage: 0,
    instructions: 'Transfer to our business account and enter transaction reference ID. Admin reviews within 30 minutes.',
    minAmount: 20,
    maxAmount: 20000
  }
];

export const initialSiteSettings: SiteSettings = {
  siteName: siteConfig.name,
  tagline: 'Premium Digital Subscriptions & Instant Software Licenses',
  description: 'Verified digital commerce platform with headless CMS, automated instant fulfillment, subscription tracking, and 24/7 warranty.',
  contactEmail: siteConfig.email,
  contactPhone: siteConfig.phone,
  contactWhatsapp: siteConfig.whatsapp,
  contactTelegram: '@Soft4uSupport',
  contactAddress: siteConfig.address,
  currencySymbol: '$',
  currencyCode: 'USD',
  taxRate: 0,
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing routine database upgrades to enhance fulfillment speed. We will be back online shortly!',
  guestCheckoutEnabled: true,
  requirePhone: false,
  requireWhatsapp: false,
  branding: {
    primaryColor: '#93C572',
    backgroundColor: '#F8FBF4',
    charcoalColor: '#2B3328',
    borderRadius: '8px'
  },
  socialLinks: {
    twitter: 'https://twitter.com/soft4u',
    telegram: 'https://t.me/soft4uchannel',
    whatsapp: siteConfig.whatsappHref,
    discord: 'https://discord.gg/soft4u'
  },
  seoDefaults: {
    title: 'Soft4u – Premium Digital Subscriptions & Software Licenses',
    description: 'Buy genuine subscriptions for ChatGPT Plus, Claude Pro, Netflix 4K, Canva Pro, and VPNs with instant delivery and full warranty.',
    keywords: 'digital subscriptions, cheap chatgpt plus, netflix uhd profile, canva pro lifetime, software license keys'
  },
  aiSupportEnabled: true,
  aiSupportName: 'Soft4u AI Concierge',
  aiWelcomeMessage: 'Hello! I am your Soft4u Assistant. How can I help you with our digital subscriptions, licenses, order status, or fulfillment today?'
};

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log_01',
    adminEmail: 'admin@soft4u.top',
    adminName: 'Alex Vance',
    action: 'SYSTEM_INITIALIZED',
    entity: 'SiteSettings',
    entityId: 'default',
    details: 'System bootstrapped with complete production catalog, CMS sections, and payment gateways.',
    timestamp: '2026-02-01T00:00:00Z'
  }
];
