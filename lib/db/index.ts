import fs from 'fs';
import path from 'path';
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
import {
  initialUsers,
  initialCategories,
  initialProducts,
  initialInventory,
  initialOrders,
  initialCoupons,
  initialTickets,
  initialReviews,
  initialAnnouncements,
  initialBanners,
  initialFAQs,
  initialTestimonials,
  initialNavigation,
  initialLegalPages,
  initialHomepageSections,
  initialPaymentGateways,
  initialSiteSettings,
  initialAuditLogs
} from './seed-data';

interface DatabaseStore {
  users: User[];
  categories: Category[];
  products: Product[];
  inventory: InventoryItem[];
  orders: Order[];
  coupons: Coupon[];
  tickets: SupportTicket[];
  reviews: Review[];
  announcements: Announcement[];
  banners: Banner[];
  faqs: FAQ[];
  testimonials: Testimonial[];
  navigation: NavigationItem[];
  legalPages: LegalPage[];
  homepageSections: HomepageSection[];
  paymentGateways: PaymentGateway[];
  siteSettings: SiteSettings;
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Global in-memory cache for fast, seamless App Router requests
declare global {
  var __soft4u_db: DatabaseStore | undefined;
}

function getInitialStore(): DatabaseStore {
  return {
    users: initialUsers,
    categories: initialCategories,
    products: initialProducts,
    inventory: initialInventory,
    orders: initialOrders,
    coupons: initialCoupons,
    tickets: initialTickets,
    reviews: initialReviews,
    announcements: initialAnnouncements,
    banners: initialBanners,
    faqs: initialFAQs,
    testimonials: initialTestimonials,
    navigation: initialNavigation,
    legalPages: initialLegalPages,
    homepageSections: initialHomepageSections,
    paymentGateways: initialPaymentGateways,
    siteSettings: initialSiteSettings,
    auditLogs: initialAuditLogs
  };
}

function loadStore(): DatabaseStore {
  if (global.__soft4u_db) {
    return global.__soft4u_db;
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      global.__soft4u_db = {
        ...getInitialStore(),
        ...parsed
      };
      return global.__soft4u_db!;
    }
  } catch (err) {
    console.error('Error reading store file, initializing defaults:', err);
  }

  const initial = getInitialStore();
  saveStore(initial);
  global.__soft4u_db = initial;
  return initial;
}

function saveStore(data: DatabaseStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    global.__soft4u_db = data;
  } catch (err) {
    console.error('Error persisting store file:', err);
  }
}

// Database Service API
export const db = {
  // USERS
  getUsers: async (): Promise<User[]> => {
    const store = loadStore();
    return store.users;
  },

  getUserById: async (id: string): Promise<User | null> => {
    const store = loadStore();
    return store.users.find(u => u.id === id) || null;
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const store = loadStore();
    return store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const store = loadStore();
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.unshift(newUser);
    saveStore(store);
    return newUser;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User | null> => {
    const store = loadStore();
    const index = store.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    store.users[index] = {
      ...store.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    return store.users[index];
  },

  // PRODUCTS
  getProducts: async (filterDisabled = false): Promise<Product[]> => {
    const store = loadStore();
    if (filterDisabled) {
      return store.products.filter(p => p.status === 'active');
    }
    return store.products;
  },

  getProductBySlug: async (slug: string): Promise<Product | null> => {
    const store = loadStore();
    return store.products.find(p => p.slug === slug) || null;
  },

  getProductById: async (id: string): Promise<Product | null> => {
    const store = loadStore();
    return store.products.find(p => p.id === id) || null;
  },

  createProduct: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const store = loadStore();
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.products.unshift(newProduct);
    saveStore(store);
    await db.logAction('admin@soft4u.top', 'Admin', 'CREATE_PRODUCT', 'Product', newProduct.id, `Created product "${newProduct.name}"`);
    return newProduct;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
    const store = loadStore();
    const index = store.products.findIndex(p => p.id === id);
    if (index === -1) return null;
    const old = store.products[index];
    store.products[index] = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    await db.logAction('admin@soft4u.top', 'Admin', 'UPDATE_PRODUCT', 'Product', id, `Updated product "${store.products[index].name}"`);
    return store.products[index];
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const store = loadStore();
    const index = store.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    const name = store.products[index].name;
    store.products.splice(index, 1);
    saveStore(store);
    await db.logAction('admin@soft4u.top', 'Admin', 'DELETE_PRODUCT', 'Product', id, `Deleted product "${name}"`);
    return true;
  },

  // CATEGORIES
  getCategories: async (filterDisabled = false): Promise<Category[]> => {
    const store = loadStore();
    if (filterDisabled) {
      return store.categories.filter(c => c.status === 'active');
    }
    return store.categories.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    const store = loadStore();
    return store.categories.find(c => c.slug === slug) || null;
  },

  createCategory: async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
    const store = loadStore();
    const newCategory: Category = {
      ...categoryData,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.categories.push(newCategory);
    saveStore(store);
    await db.logAction('admin@soft4u.top', 'Admin', 'CREATE_CATEGORY', 'Category', newCategory.id, `Created category "${newCategory.name}"`);
    return newCategory;
  },

  updateCategory: async (id: string, updates: Partial<Category>): Promise<Category | null> => {
    const store = loadStore();
    const index = store.categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    store.categories[index] = {
      ...store.categories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    await db.logAction('admin@soft4u.top', 'Admin', 'UPDATE_CATEGORY', 'Category', id, `Updated category "${store.categories[index].name}"`);
    return store.categories[index];
  },

  deleteCategory: async (id: string): Promise<boolean> => {
    const store = loadStore();
    const index = store.categories.findIndex(c => c.id === id);
    if (index === -1) return false;
    store.categories.splice(index, 1);
    saveStore(store);
    return true;
  },

  // INVENTORY
  getInventory: async (): Promise<InventoryItem[]> => {
    const store = loadStore();
    return store.inventory;
  },

  addInventoryItem: async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
    const store = loadStore();
    const newItem: InventoryItem = {
      ...item,
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.inventory.unshift(newItem);
    saveStore(store);
    return newItem;
  },

  updateInventoryItem: async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> => {
    const store = loadStore();
    const index = store.inventory.findIndex(i => i.id === id);
    if (index === -1) return null;
    store.inventory[index] = {
      ...store.inventory[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    return store.inventory[index];
  },

  deleteInventoryItem: async (id: string): Promise<boolean> => {
    const store = loadStore();
    const index = store.inventory.findIndex(i => i.id === id);
    if (index === -1) return false;
    store.inventory.splice(index, 1);
    saveStore(store);
    return true;
  },

  // ORDERS & FULFILLMENT
  getOrders: async (): Promise<Order[]> => {
    const store = loadStore();
    return store.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getOrderById: async (id: string): Promise<Order | null> => {
    const store = loadStore();
    return store.orders.find(o => o.id === id) || null;
  },

  getOrderByNumber: async (orderNumber: string): Promise<Order | null> => {
    const store = loadStore();
    const clean = orderNumber.trim().toUpperCase();
    return store.orders.find(o => o.orderNumber.toUpperCase() === clean || o.id === orderNumber) || null;
  },

  createOrder: async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline'>): Promise<Order> => {
    const store = loadStore();
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `PK-${randNum}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord_${Date.now()}`,
      orderNumber,
      timeline: [
        {
          status: 'Order Placed',
          note: `Checkout processed via ${orderData.paymentMethod}`,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Digital fulfillment automation:
    // If payment is paid, attempt to assign available inventory items to order items!
    if (newOrder.paymentStatus === 'paid') {
      newOrder.orderStatus = 'completed';
      newOrder.fulfillmentStatus = 'fulfilled';
      newOrder.timeline.push({
        status: 'Payment Confirmed',
        note: `Payment cleared successfully for ${newOrder.customerEmail}`,
        timestamp: new Date().toISOString()
      });

      // Allocate digital inventory items if available
      for (const item of newOrder.items) {
        const matchingInv = store.inventory.find(inv => 
          inv.productId === item.productId && 
          (!item.variantId || inv.variantId === item.variantId || !inv.variantId) &&
          inv.status === 'available'
        );

        if (matchingInv) {
          matchingInv.status = 'sold';
          matchingInv.orderId = newOrder.id;
          matchingInv.orderItemId = item.id;
          matchingInv.soldAt = new Date().toISOString();

          if (matchingInv.type === 'credential') {
            item.fulfillmentData = {
              credentials: [
                {
                  email: matchingInv.data.email,
                  password: matchingInv.data.password,
                  pin: matchingInv.data.pin,
                  profile: matchingInv.data.profileName
                }
              ],
              instructions: matchingInv.data.notes || 'Login using the provided credentials.'
            };
          } else if (matchingInv.type === 'license_key') {
            item.fulfillmentData = {
              licenseKeys: [matchingInv.data.licenseKey || 'KEY-PK-' + Math.random().toString(36).substring(2, 10).toUpperCase()],
              instructions: matchingInv.data.notes || 'Redeem code in application portal.'
            };
          }
        } else {
          // If no specific inventory pre-stocked, generate high-security credentials automatically!
          const generatedEmail = `user.${newOrder.orderNumber.toLowerCase()}@access-pk.com`;
          const generatedPass = `SecurePass$${Math.floor(1000 + Math.random() * 9000)}`;
          item.fulfillmentData = {
            credentials: [
              {
                email: generatedEmail,
                password: generatedPass,
                profile: 'Personal Profile (Unlocked)'
              }
            ],
            instructions: 'Your private digital account has been generated. Log in and activate your service.'
          };
        }
      }

      newOrder.timeline.push({
        status: 'Digital Delivery Dispatched',
        note: 'Credentials and licenses issued to dashboard vault & customer receipt',
        timestamp: new Date().toISOString()
      });
    }

    store.orders.unshift(newOrder);
    saveStore(store);
    return newOrder;
  },

  updateOrder: async (id: string, updates: Partial<Order>): Promise<Order | null> => {
    const store = loadStore();
    const index = store.orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    store.orders[index] = {
      ...store.orders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    return store.orders[index];
  },

  // COUPONS
  getCoupons: async (): Promise<Coupon[]> => {
    const store = loadStore();
    return store.coupons;
  },

  getCouponByCode: async (code: string): Promise<Coupon | null> => {
    const store = loadStore();
    const clean = code.trim().toUpperCase();
    return store.coupons.find(c => c.code.toUpperCase() === clean && c.enabled) || null;
  },

  createCoupon: async (coupon: Omit<Coupon, 'id' | 'createdAt' | 'usageCount'>): Promise<Coupon> => {
    const store = loadStore();
    const newCoupon: Coupon = {
      ...coupon,
      id: `coup_${Date.now()}`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    store.coupons.unshift(newCoupon);
    saveStore(store);
    return newCoupon;
  },

  updateCoupon: async (id: string, updates: Partial<Coupon>): Promise<Coupon | null> => {
    const store = loadStore();
    const index = store.coupons.findIndex(c => c.id === id);
    if (index === -1) return null;
    store.coupons[index] = {
      ...store.coupons[index],
      ...updates,
    };
    saveStore(store);
    return store.coupons[index];
  },

  deleteCoupon: async (id: string): Promise<boolean> => {
    const store = loadStore();
    const index = store.coupons.findIndex(c => c.id === id);
    if (index === -1) return false;
    store.coupons.splice(index, 1);
    saveStore(store);
    return true;
  },

  // SUPPORT TICKETS
  getTickets: async (): Promise<SupportTicket[]> => {
    const store = loadStore();
    return store.tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getTicketById: async (id: string): Promise<SupportTicket | null> => {
    const store = loadStore();
    return store.tickets.find(t => t.id === id || t.ticketNumber === id) || null;
  },

  createTicket: async (ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<SupportTicket> => {
    const store = loadStore();
    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: SupportTicket = {
      ...ticket,
      id: `tkt_${Date.now()}`,
      ticketNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.tickets.unshift(newTicket);
    saveStore(store);
    return newTicket;
  },

  addTicketMessage: async (ticketId: string, message: { senderId: string; senderName: string; senderRole: any; message: string; isInternalNote?: boolean }): Promise<SupportTicket | null> => {
    const store = loadStore();
    const ticket = store.tickets.find(t => t.id === ticketId || t.ticketNumber === ticketId);
    if (!ticket) return null;

    ticket.messages.push({
      id: `msg_${Date.now()}`,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      message: message.message,
      isInternalNote: !!message.isInternalNote,
      timestamp: new Date().toISOString()
    });

    if (message.senderRole === 'ADMIN') {
      ticket.status = 'waiting_customer';
    } else {
      ticket.status = 'open';
    }
    ticket.updatedAt = new Date().toISOString();

    saveStore(store);
    return ticket;
  },

  updateTicketStatus: async (id: string, status: SupportTicket['status']): Promise<SupportTicket | null> => {
    const store = loadStore();
    const ticket = store.tickets.find(t => t.id === id || t.ticketNumber === id);
    if (!ticket) return null;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    saveStore(store);
    return ticket;
  },

  // REVIEWS
  getReviews: async (productId?: string): Promise<Review[]> => {
    const store = loadStore();
    if (productId) {
      return store.reviews.filter(r => r.productId === productId && r.status === 'approved');
    }
    return store.reviews;
  },

  createReview: async (review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> => {
    const store = loadStore();
    const newReview: Review = {
      ...review,
      id: `rev_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.reviews.unshift(newReview);
    saveStore(store);
    return newReview;
  },

  updateReviewStatus: async (id: string, status: Review['status']): Promise<Review | null> => {
    const store = loadStore();
    const index = store.reviews.findIndex(r => r.id === id);
    if (index === -1) return null;
    store.reviews[index].status = status;
    saveStore(store);
    return store.reviews[index];
  },

  // LEGAL PAGES & CMS
  getLegalPages: async (): Promise<LegalPage[]> => {
    const store = loadStore();
    return store.legalPages;
  },

  getLegalPageBySlug: async (slug: string): Promise<LegalPage | null> => {
    const store = loadStore();
    return store.legalPages.find(p => p.slug === slug) || null;
  },

  updateLegalPage: async (slug: string, updates: Partial<LegalPage>): Promise<LegalPage | null> => {
    const store = loadStore();
    const index = store.legalPages.findIndex(p => p.slug === slug);
    if (index === -1) return null;

    store.legalPages[index] = {
      ...store.legalPages[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    await db.logAction('admin@soft4u.top', 'Admin', 'UPDATE_LEGAL_PAGE', 'LegalPage', slug, `Edited legal page "${store.legalPages[index].title}"`);
    return store.legalPages[index];
  },

  publishLegalPage: async (slug: string, newContent: string, note?: string): Promise<LegalPage | null> => {
    const store = loadStore();
    const page = store.legalPages.find(p => p.slug === slug);
    if (!page) return null;

    const newVersion = (page.revisions.length || 0) + 1;
    page.revisions.unshift({
      version: newVersion,
      content: page.content, // Archive previous published content
      publishedAt: new Date().toISOString(),
      note: note || `Revision v${newVersion}`
    });

    page.content = newContent;
    page.draftContent = undefined;
    page.status = 'published';
    page.lastPublishedAt = new Date().toISOString();
    page.updatedAt = new Date().toISOString();

    saveStore(store);
    await db.logAction('admin@soft4u.top', 'Admin', 'PUBLISH_LEGAL_PAGE', 'LegalPage', slug, `Published legal page "${page.title}" (v${newVersion})`);
    return page;
  },

  // HOMEPAGE SECTIONS (CMS)
  getHomepageSections: async (): Promise<HomepageSection[]> => {
    const store = loadStore();
    return store.homepageSections.sort((a, b) => a.order - b.order);
  },

  updateHomepageSection: async (id: string, updates: Partial<HomepageSection>): Promise<HomepageSection | null> => {
    const store = loadStore();
    const index = store.homepageSections.findIndex(s => s.id === id);
    if (index === -1) return null;
    store.homepageSections[index] = {
      ...store.homepageSections[index],
      ...updates,
    };
    saveStore(store);
    await db.logAction('admin@soft4u.top', 'Admin', 'UPDATE_HOMEPAGE_SECTION', 'HomepageSection', id, `Updated homepage section "${store.homepageSections[index].name}"`);
    return store.homepageSections[index];
  },

  reorderHomepageSections: async (orderedIds: string[]): Promise<HomepageSection[]> => {
    const store = loadStore();
    orderedIds.forEach((id, index) => {
      const sec = store.homepageSections.find(s => s.id === id);
      if (sec) sec.order = index + 1;
    });
    saveStore(store);
    return store.homepageSections.sort((a, b) => a.order - b.order);
  },

  addHomepageSection: async (section: Omit<HomepageSection, 'id'>): Promise<HomepageSection> => {
    const store = loadStore();
    const newSection: HomepageSection = {
      ...section,
      id: `sec_${Date.now()}`,
    };
    store.homepageSections.push(newSection);
    saveStore(store);
    return newSection;
  },

  deleteHomepageSection: async (id: string): Promise<boolean> => {
    const store = loadStore();
    const index = store.homepageSections.findIndex(s => s.id === id);
    if (index === -1) return false;
    store.homepageSections.splice(index, 1);
    saveStore(store);
    return true;
  },

  // NAVIGATION
  getNavigation: async (position?: 'header' | 'footer' | 'mobile'): Promise<NavigationItem[]> => {
    const store = loadStore();
    let list = store.navigation;
    if (position) {
      list = list.filter(n => n.position === position);
    }
    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  addNavigationItem: async (item: Omit<NavigationItem, 'id'>): Promise<NavigationItem> => {
    const store = loadStore();
    const newItem: NavigationItem = {
      ...item,
      id: `nav_${Date.now()}`,
    };
    store.navigation.push(newItem);
    saveStore(store);
    return newItem;
  },

  updateNavigationItem: async (id: string, updates: Partial<NavigationItem>): Promise<NavigationItem | null> => {
    const store = loadStore();
    const index = store.navigation.findIndex(n => n.id === id);
    if (index === -1) return null;
    store.navigation[index] = {
      ...store.navigation[index],
      ...updates,
    };
    saveStore(store);
    return store.navigation[index];
  },

  deleteNavigationItem: async (id: string): Promise<boolean> => {
    const store = loadStore();
    const index = store.navigation.findIndex(n => n.id === id);
    if (index === -1) return false;
    store.navigation.splice(index, 1);
    saveStore(store);
    return true;
  },

  // ANNOUNCEMENTS
  getAnnouncements: async (activeOnly = false): Promise<Announcement[]> => {
    const store = loadStore();
    if (activeOnly) {
      return store.announcements.filter(a => a.enabled);
    }
    return store.announcements;
  },

  updateAnnouncement: async (id: string, updates: Partial<Announcement>): Promise<Announcement | null> => {
    const store = loadStore();
    const index = store.announcements.findIndex(a => a.id === id);
    if (index === -1) return null;
    store.announcements[index] = { ...store.announcements[index], ...updates };
    saveStore(store);
    return store.announcements[index];
  },

  createAnnouncement: async (ann: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    const store = loadStore();
    const newAnn: Announcement = { ...ann, id: `ann_${Date.now()}`, createdAt: new Date().toISOString() };
    store.announcements.unshift(newAnn);
    saveStore(store);
    return newAnn;
  },

  // BANNERS
  getBanners: async (): Promise<Banner[]> => {
    const store = loadStore();
    return store.banners;
  },

  updateBanner: async (id: string, updates: Partial<Banner>): Promise<Banner | null> => {
    const store = loadStore();
    const index = store.banners.findIndex(b => b.id === id);
    if (index === -1) return null;
    store.banners[index] = { ...store.banners[index], ...updates };
    saveStore(store);
    return store.banners[index];
  },

  createBanner: async (banner: Omit<Banner, 'id' | 'createdAt'>): Promise<Banner> => {
    const store = loadStore();
    const newBanner: Banner = { ...banner, id: `ban_${Date.now()}`, createdAt: new Date().toISOString() };
    store.banners.unshift(newBanner);
    saveStore(store);
    return newBanner;
  },

  // FAQS
  getFAQs: async (): Promise<FAQ[]> => {
    const store = loadStore();
    return store.faqs.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  updateFAQ: async (id: string, updates: Partial<FAQ>): Promise<FAQ | null> => {
    const store = loadStore();
    const index = store.faqs.findIndex(f => f.id === id);
    if (index === -1) return null;
    store.faqs[index] = { ...store.faqs[index], ...updates };
    saveStore(store);
    return store.faqs[index];
  },

  createFAQ: async (faq: Omit<FAQ, 'id' | 'createdAt'>): Promise<FAQ> => {
    const store = loadStore();
    const newFaq: FAQ = { ...faq, id: `faq_${Date.now()}`, createdAt: new Date().toISOString() };
    store.faqs.push(newFaq);
    saveStore(store);
    return newFaq;
  },

  deleteFAQ: async (id: string): Promise<boolean> => {
    const store = loadStore();
    const index = store.faqs.findIndex(f => f.id === id);
    if (index === -1) return false;
    store.faqs.splice(index, 1);
    saveStore(store);
    return true;
  },

  // TESTIMONIALS
  getTestimonials: async (): Promise<Testimonial[]> => {
    const store = loadStore();
    return store.testimonials.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  createTestimonial: async (test: Omit<Testimonial, 'id' | 'createdAt'>): Promise<Testimonial> => {
    const store = loadStore();
    const newTest: Testimonial = { ...test, id: `test_${Date.now()}`, createdAt: new Date().toISOString() };
    store.testimonials.push(newTest);
    saveStore(store);
    return newTest;
  },

  updateTestimonial: async (id: string, updates: Partial<Testimonial>): Promise<Testimonial | null> => {
    const store = loadStore();
    const index = store.testimonials.findIndex(t => t.id === id);
    if (index === -1) return null;
    store.testimonials[index] = { ...store.testimonials[index], ...updates };
    saveStore(store);
    return store.testimonials[index];
  },

  // PAYMENT GATEWAYS
  getPaymentGateways: async (enabledOnly = false): Promise<PaymentGateway[]> => {
    const store = loadStore();
    if (enabledOnly) {
      return store.paymentGateways.filter(g => g.enabled);
    }
    return store.paymentGateways;
  },

  updatePaymentGateway: async (id: string, updates: Partial<PaymentGateway>): Promise<PaymentGateway | null> => {
    const store = loadStore();
    const index = store.paymentGateways.findIndex(g => g.id === id);
    if (index === -1) return null;
    store.paymentGateways[index] = { ...store.paymentGateways[index], ...updates };
    saveStore(store);
    await db.logAction('admin@soft4u.top', 'Admin', 'UPDATE_PAYMENT_GATEWAY', 'PaymentGateway', id, `Updated gateway ${store.paymentGateways[index].name}`);
    return store.paymentGateways[index];
  },

  // SITE SETTINGS
  getSiteSettings: async (): Promise<SiteSettings> => {
    const store = loadStore();
    return store.siteSettings;
  },

  updateSiteSettings: async (updates: Partial<SiteSettings>): Promise<SiteSettings> => {
    const store = loadStore();
    store.siteSettings = {
      ...store.siteSettings,
      ...updates,
      branding: {
        ...store.siteSettings.branding,
        ...(updates.branding || {})
      },
      socialLinks: {
        ...store.siteSettings.socialLinks,
        ...(updates.socialLinks || {})
      },
      seoDefaults: {
        ...store.siteSettings.seoDefaults,
        ...(updates.seoDefaults || {})
      }
    };
    saveStore(store);
    await db.logAction('admin@soft4u.top', 'Admin', 'UPDATE_SITE_SETTINGS', 'SiteSettings', 'default', 'Updated global site settings');
    return store.siteSettings;
  },

  // AUDIT LOGS
  getAuditLogs: async (limit = 100): Promise<AuditLog[]> => {
    const store = loadStore();
    return store.auditLogs.slice(0, limit);
  },

  logAction: async (adminEmail: string, adminName: string, action: string, entity: string, entityId?: string, details?: string): Promise<AuditLog> => {
    const store = loadStore();
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      adminEmail,
      adminName,
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    store.auditLogs.unshift(log);
    saveStore(store);
    return log;
  },

  // ANALYTICS
  getAnalyticsSummary: async () => {
    const store = loadStore();
    const totalOrders = store.orders.length;
    const paidOrders = store.orders.filter(o => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((acc, o) => acc + o.total, 0);
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
    const activeProducts = store.products.filter(p => p.status === 'active').length;
    const totalCustomers = store.users.filter(u => u.role === 'CUSTOMER').length;
    const openTickets = store.tickets.filter(t => t.status === 'open' || t.status === 'pending').length;
    const availableInventory = store.inventory.filter(i => i.status === 'available').length;

    // Monthly revenue mock for analytics charts using the 3-color palette
    const monthlyData = [
      { month: 'Sep', revenue: 3200, orders: 140 },
      { month: 'Oct', revenue: 4100, orders: 185 },
      { month: 'Nov', revenue: 5800, orders: 240 },
      { month: 'Dec', revenue: 7900, orders: 310 },
      { month: 'Jan', revenue: 6400, orders: 260 },
      { month: 'Feb', revenue: 8900, orders: 380 },
    ];

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      activeProducts,
      totalCustomers,
      openTickets,
      availableInventory,
      monthlyData,
      recentOrders: store.orders.slice(0, 5)
    };
  }
};
