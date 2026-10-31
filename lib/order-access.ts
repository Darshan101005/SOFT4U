import { db } from '@/lib/db';
import type { Order, PaymentMethod, User } from '@/lib/db/types';
import { getSessionUser } from '@/lib/session';
import { formatMoney } from '@/lib/money';

/**
 * Who may see what on the customer side:
 *  - the signed-in owner sees everything, including delivered access, and may
 *    upload proof or cancel
 *  - anyone else (including viewers of orders whose account was deleted) sees
 *    status only; delivered access requires the owner's session
 * Internal fields (IP, user agent, admin note, FX rate, proof image ids) never leave the server.
 */

export interface PublicOrder extends Omit<Order, 'ip' | 'userAgent' | 'adminNote' | 'approvedBy' | 'deliveredBy' | 'fxRate' | 'totalPkr'> {
  canSeeDelivery: boolean;
  requiresSignIn: boolean;
  paymentDetails?: Pick<PaymentMethod, 'key' | 'name' | 'type' | 'accountTitle' | 'accountNumber' | 'iban' | 'bankName' | 'branch' | 'instructions' | 'logo'> | null;
  /** 'Total: USD 10.00' or 'Total: PKR 2,499' (exactly what the customer pays). */
  totalLabel: string;
}

export async function loadOrderForViewer(orderNumberOrId: string): Promise<{ order: Order; viewer: User | null; isOwner: boolean; canSeeDelivery: boolean } | null> {
  const key = (orderNumberOrId || '').trim();
  if (!key) return null;
  const order = (await db.getOrderByNumber(key)) || (key.startsWith('ord_') ? await db.getOrderById(key) : null);
  if (!order) return null;
  const viewer = await getSessionUser();
  const isOwner = Boolean(viewer && order.customerId && viewer.id === order.customerId);
  const canSeeDelivery = isOwner;
  return { order, viewer, isOwner, canSeeDelivery };
}

export async function toPublicOrder(order: Order, canSeeDelivery: boolean): Promise<PublicOrder> {
  const { ip, userAgent, adminNote, approvedBy, deliveredBy, fxRate, totalPkr, ...rest } = order;
  void fxRate;
  void totalPkr;
  void ip;
  void userAgent;
  void adminNote;
  void approvedBy;
  void deliveredBy;
  let paymentDetails: PublicOrder['paymentDetails'] = null;
  if (['pending', 'rejected'].includes(order.orderStatus)) {
    const m = await db.getPaymentMethodByKey(order.paymentMethod);
    if (m) {
      paymentDetails = {
        key: m.key,
        name: m.name,
        type: m.type,
        accountTitle: m.accountTitle,
        accountNumber: m.accountNumber,
        iban: m.iban,
        bankName: m.bankName,
        branch: m.branch,
        instructions: m.instructions,
        logo: m.logo,
      };
    }
  }
  // Anyone who only knows the Order ID gets status + items, never the
  // customer's contact details or what they submitted as payment proof.
  if (!canSeeDelivery) {
    const [local = '', domain = ''] = (order.customerEmail || '').split('@');
    rest.customerName = rest.customerName ? `${rest.customerName.trim().charAt(0)}***` : '';
    rest.customerEmail = local && domain ? `${local.charAt(0)}***@${domain}` : '';
    rest.customerPhone = undefined;
    rest.customerWhatsapp = undefined;
    rest.customerTelegram = undefined;
    rest.customerNote = undefined;
    paymentDetails = null;
  }
  return {
    ...rest,
    items: rest.items.map(i => (canSeeDelivery ? i : { ...i, fulfillmentData: undefined })),
    paymentProofs: canSeeDelivery
      ? (rest.paymentProofs || []).map(p => ({ ...p, imagePublicId: undefined, images: [], reviewedBy: undefined }))
      : (rest.paymentProofs || []).map(p => ({
          id: p.id,
          orderId: p.orderId,
          methodKey: p.methodKey,
          transactionId: '',
          images: [],
          status: p.status,
          rejectReason: p.rejectReason,
          createdAt: p.createdAt,
        })),
    timeline: rest.timeline.map(t => ({ status: t.status, note: t.note, timestamp: t.timestamp })),
    canSeeDelivery,
    requiresSignIn: !canSeeDelivery && order.orderStatus === 'completed',
    paymentDetails,
    totalLabel: `Total: ${formatMoney(order.total, order.currency)}`,
  };
}
