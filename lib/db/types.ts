// No staff roles: an account is either an admin (can open /admin) or a customer.
export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  avatar?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  banner?: string;
  parentId?: string | null;
  status: 'active' | 'disabled';
  displayOrder: number;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryType = 'credential' | 'license_key' | 'manual' | 'generated';

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  description?: string;
  features?: string[];
  deliveryMethod?: string;
  deliveryTime?: string;
  status: 'active' | 'disabled';
  expiryDays?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  images: string[];
  logo?: string;
  categoryId: string;
  tags: string[];
  price: number;
  compareAtPrice?: number;
  discount: number;
  status: 'active' | 'draft' | 'disabled' | 'archived';
  featured: boolean;
  bestseller: boolean;
  isNew: boolean;
  trending: boolean;
  badge?: string;
  deliveryTime: string;
  deliveryMethod: string;
  productType: string;
  inventoryModel: InventoryType;
  features: string[];
  requirements: string[];
  usageInstructions: string;
  refundInfo: string;
  seoTitle?: string;
  seoDescription?: string;
  relatedProductIds?: string[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  variantId?: string;
  type: InventoryType;
  data: {
    email?: string;
    password?: string;
    licenseKey?: string;
    pin?: string;
    profileName?: string;
    notes?: string;
  };
  status: 'available' | 'reserved' | 'sold' | 'disabled' | 'expired';
  orderId?: string;
  orderItemId?: string;
  soldAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
  expiryDays?: number;
  fulfillmentData?: {
    credentials?: Array<{ email?: string; password?: string; pin?: string; profile?: string }>;
    licenseKeys?: string[];
    instructions?: string;
  };
}

export interface OrderTimelineEvent {
  status: string;
  note: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  fulfillmentStatus: 'unfulfilled' | 'fulfilled' | 'partially_fulfilled';
  orderStatus: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  startDate?: string;
  expiryDate?: string;
  enabled: boolean;
  productIds?: string[];
  categoryIds?: string[];
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  attachments?: string[];
  isInternalNote: boolean;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  orderId?: string;
  productId?: string;
  category: string;
  status: 'open' | 'pending' | 'waiting_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'hidden' | 'rejected';
  isFeatured: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  text: string;
  link?: string;
  ctaText?: string;
  startDate?: string;
  endDate?: string;
  priority: number;
  enabled: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  ctaText?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  priority: number;
  position: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  status: 'active' | 'disabled';
  productId?: string;
  categoryId?: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  roleOrCompany?: string;
  avatar?: string;
  rating: number;
  content: string;
  featured: boolean;
  displayOrder: number;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  parentId?: string | null;
  displayOrder: number;
  visible: boolean;
  targetBlank: boolean;
  position: 'header' | 'footer' | 'mobile';
}

export interface PageRevision {
  version: number;
  title: string;
  content: string;
  publishedAt: string;
  author: string;
  note?: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  revisions: PageRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface LegalPageRevision {
  version: number;
  content: string;
  publishedAt: string;
  note?: string;
}

export interface LegalPage {
  id: string;
  slug: 'terms' | 'privacy' | 'refund-policy' | 'cookie-policy' | 'disclaimer' | 'shipping-policy';
  title: string;
  content: string;
  draftContent?: string;
  status: 'draft' | 'published';
  lastPublishedAt: string;
  revisions: LegalPageRevision[];
  updatedAt: string;
}

export interface HomepageSection {
  id: string;
  type: 
    | 'hero' 
    | 'trust_bar' 
    | 'categories' 
    | 'featured_products' 
    | 'bestsellers' 
    | 'banner' 
    | 'benefits' 
    | 'how_it_works' 
    | 'testimonials' 
    | 'reviews' 
    | 'faq' 
    | 'cta' 
    | 'newsletter';
  name: string;
  enabled: boolean;
  order: number;
  settings: Record<string, any>;
}

export interface PaymentGateway {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  isSandbox: boolean;
  currencies: string[];
  feePercentage: number;
  instructions: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactTelegram: string;
  contactAddress: string;
  currencySymbol: string;
  currencyCode: string;
  taxRate: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  guestCheckoutEnabled: boolean;
  requirePhone: boolean;
  requireWhatsapp: boolean;
  branding: {
    primaryColor: string; // #93C572
    backgroundColor: string; // #F8FBF4
    charcoalColor: string; // #2B3328
    borderRadius: string;
  };
  socialLinks: {
    twitter?: string;
    telegram?: string;
    whatsapp?: string;
    discord?: string;
    youtube?: string;
    instagram?: string;
  };
  seoDefaults: {
    title: string;
    description: string;
    ogImage?: string;
    keywords?: string;
  };
  aiSupportEnabled: boolean;
  aiSupportName: string;
  aiWelcomeMessage: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  timestamp: string;
}
