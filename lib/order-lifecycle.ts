import { getPool, tx } from '@/lib/db/pool';
import { db } from '@/lib/db';
import type { AdminUser, DeliveryChannel, DeliveryField, InventoryItem, Order, OrderItem } from '@/lib/db/types';
import { newId } from '@/lib/ids';
import { dataUriBytes, uploadPaymentProof } from '@/lib/cloudinary';
import { queueEmail, sendEmail } from '@/lib/email';
import {
  adminNewOrderEmail,
  orderDeliveredEmail,
  orderPlacedEmail,
  orderUnderReviewEmail,
  paymentApprovedEmail,
  paymentRejectedEmail,
  type DeliveredItem,
} from '@/lib/email-templates';
import { notifyAdminsTelegram, notifyCustomerTelegram, sendDeliveryToTelegram, telegramEnabled, esc } from '@/lib/telegram';
import { formatMoney } from '@/lib/money';
import { payAmountFor } from '@/lib/fx';


/**
 * Manual-payment order lifecycle:
 *
 *   pending (awaiting proof) --submitPaymentProof--> under_review
 *   under_review --approveOrder--> processing --deliverOrder--> completed
 *   under_review/pending --rejectOrder--> rejected --submitPaymentProof--> under_review (retry)
 *   pending/under_review/rejected --cancelOrder--> cancelled   (customer or admin)
 *   processing/completed --refundOrder--> refunded   (paid orders; undelivered ones release the coupon)
 *
 * There is no payment deadline: an order stays "Awaiting payment" until proof
 * arrives or it is cancelled. The customer pays exactly the order total in the
 * order currency; prices and the FX rate are locked on the order at creation.
 * Vault items are never reserved at creation, only claimed at deliverOrder
 * inside a transaction (conditional UPDATE ... WHERE status = 'available'
 * takes the row lock), so one item can never go to two orders.
 *
 * Every transition is a single conditional UPDATE ("claim"), so double clicks
 * or two admins acting at once cannot apply it twice.
 */

export class OrderError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function event(status: string, note: string, actor?: string) {
  return JSON.stringify([{ status, note, timestamp: new Date().toISOString(), ...(actor ? { actor } : {}) }]);
}

async function mustGet(orderId: string): Promise<Order> {
  const order = await db.getOrderById(orderId);
  if (!order) throw new OrderError('NOT_FOUND', 'Order not found', 404);
  return order;
}

async function adminAlertEmails(): Promise<string[]> {
  const [admins, settings] = await Promise.all([db.getAdmins(), db.getSiteSettings()]);
  const list = [...admins.filter(a => a.status === 'active').map(a => a.email), ...(settings.orderAlertEmails || [])];
  return [...new Set(list.map(e => e.trim().toLowerCase()).filter(Boolean))];
}

/* ------------------------------------------------------------------ */
/* Notifications for a newly placed order                              */
/* ------------------------------------------------------------------ */

/** Customer "complete your payment" email + admin alert (email + Telegram). Call after db.createOrder. */
export async function notifyOrderPlaced(order: Order): Promise<void> {
  const method = await db.getPaymentMethodByKey(order.paymentMethod);
  const send = await payAmountFor(method, order);
  queueEmail(order.customerEmail, orderPlacedEmail({ order, method, sendAmount: send?.amount }), 'order_placed');
  const admins = await adminAlertEmails();
  if (admins.length) queueEmail(admins, adminNewOrderEmail({ order, stage: 'placed' }), 'admin_new_order');
  await notifyAdminsTelegram(order, 'placed');
}

/* ------------------------------------------------------------------ */
/* Payment proof                                                       */
/* ------------------------------------------------------------------ */

export interface PaymentProofInput {
  transactionId: string;
  senderName?: string;
  senderAccount?: string;
  amount?: number;
  /** 1-3 data:image/(png|jpeg|webp);base64 screenshots, 5 MB each */
  screenshotDataUris: string[];
  /** Payment date typed by the customer (optional). */
  paymentDate?: string;
  methodKey?: string;
}

export const MAX_PROOF_IMAGES = 3;
export const MAX_PROOF_IMAGE_BYTES = 5 * 1024 * 1024;

/** Customer uploads screenshot + transaction id. Allowed while pending or after a rejection. */
export async function submitPaymentProof(orderId: string, input: PaymentProofInput): Promise<Order> {
  const order = await mustGet(orderId);
  if (!['pending', 'rejected'].includes(order.orderStatus)) {
    throw new OrderError(
      'INVALID_STATE',
      order.orderStatus === 'under_review' ? 'We already have your payment proof and are reviewing it.' : 'This order can no longer accept a payment proof.',
      409,
    );
  }
  const txn = (input.transactionId || '').trim();
  if (txn.length < 4 || txn.length > 64) throw new OrderError('INVALID_TXN', 'Enter the transaction ID from your payment receipt');
  const methodKey = input.methodKey || order.paymentMethod;

  const dupe = await getPool().query(
    `SELECT 1 FROM payment_proofs WHERE method_key = $1 AND lower(transaction_id) = lower($2) AND status <> 'rejected' AND order_id <> $3`,
    [methodKey, txn, order.id],
  );
  if (dupe.rowCount) throw new OrderError('TXN_USED', 'This transaction ID has already been used for another order.', 409);

  const shots = (input.screenshotDataUris || []).filter(Boolean);
  if (shots.length === 0) throw new OrderError('NO_SCREENSHOT', 'Attach your payment screenshot');
  if (shots.length > MAX_PROOF_IMAGES) throw new OrderError('TOO_MANY', `Upload up to ${MAX_PROOF_IMAGES} screenshots`);
  if (shots.some(s => dataUriBytes(s) > MAX_PROOF_IMAGE_BYTES)) throw new OrderError('TOO_LARGE', 'Each screenshot must be 5 MB or smaller');
  const images: Array<{ publicId: string; format: string }> = [];
  for (const shot of shots) images.push(await uploadPaymentProof(shot, order.orderNumber));
  const image = images[0];
  // GBP account: lock the amount to send and the rate used (null for PKR / USD accounts).
  const send = await payAmountFor(await db.getPaymentMethodByKey(methodKey), { total: order.total, currency: order.currency });

  try {
    await tx(async client => {
      const claim = await client.query(
        `UPDATE orders SET order_status = 'under_review', payment_status = 'submitted', status_reason = NULL, updated_at = now(),
           timeline = timeline || $2::jsonb, pay_currency = $3, pay_amount = $4, pay_fx_rate = $5
         WHERE id = $1 AND order_status IN ('pending', 'rejected') RETURNING id`,
        [order.id, event('Payment proof submitted', `Transaction ID ${txn}`), send?.currency ?? null, send?.amount ?? null, send?.rate ?? null],
      );
      if (!claim.rowCount) throw new OrderError('INVALID_STATE', 'This order can no longer accept a payment proof.', 409);
      await client.query(
        `INSERT INTO payment_proofs (id, order_id, method_key, transaction_id, sender_name, sender_account, amount, image_public_id, image_format, images, payment_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)`,
        [
          newId('pp'),
          order.id,
          methodKey,
          txn,
          input.senderName || null,
          input.senderAccount || null,
          input.amount ?? null,
          image.publicId,
          image.format,
          JSON.stringify(images),
          input.paymentDate ? String(input.paymentDate).slice(0, 40) : null,
        ],
      );
    });
  } catch (err: any) {
    if (err?.code === '23505') throw new OrderError('TXN_USED', 'This transaction ID has already been used for another order.', 409);
    throw err;
  }

  const updated = await mustGet(order.id);
  queueEmail(updated.customerEmail, orderUnderReviewEmail({ order: updated }), 'order_under_review');
  const admins = await adminAlertEmails();
  if (admins.length) queueEmail(admins, adminNewOrderEmail({ order: updated, stage: 'proof_submitted' }), 'admin_new_order');
  await notifyAdminsTelegram(updated, 'proof_submitted');
  return updated;
}

/* ------------------------------------------------------------------ */
/* Admin review                                                        */
/* ------------------------------------------------------------------ */

const APPROVABLE = `order_status IN ('pending', 'under_review', 'rejected')`;

export async function approveOrder(orderId: string, admin: Pick<AdminUser, 'id' | 'name'>, opts: { notify?: boolean } = {}): Promise<Order> {
  const res = await tx(async client => {
    const claim = await client.query(
      `UPDATE orders SET order_status = 'processing', payment_status = 'paid', status_reason = NULL, approved_at = now(), approved_by = $2,
         updated_at = now(), timeline = timeline || $3::jsonb
       WHERE id = $1 AND ${APPROVABLE} RETURNING id`,
      [orderId, admin.id, event('Payment approved', `Verified by ${admin.name}`, admin.name)],
    );
    if (!claim.rowCount) return false;
    await client.query(
      `UPDATE payment_proofs SET status = 'accepted', reviewed_by = $2, reviewed_at = now()
        WHERE id = (SELECT id FROM payment_proofs WHERE order_id = $1 AND status = 'submitted' ORDER BY created_at DESC LIMIT 1)`,
      [orderId, admin.id],
    );
    return true;
  });
  if (!res) {
    const current = await mustGet(orderId);
    throw new OrderError('INVALID_STATE', `This order is ${current.orderStatus.replace('_', ' ')} and cannot be approved.`, 409);
  }
  const order = await mustGet(orderId);
  if (opts.notify !== false) {
    queueEmail(order.customerEmail, paymentApprovedEmail({ order }), 'payment_approved');
    if (order.customerId) await notifyCustomerTelegram(order.customerId, `✅ Payment approved for <code>${esc(order.orderNumber)}</code>. Delivery is on the way.`);
  }
  return order;
}

export async function rejectOrder(orderId: string, admin: Pick<AdminUser, 'id' | 'name'>, reason: string): Promise<Order> {
  const why = (reason || '').trim();
  if (why.length < 3) throw new OrderError('REASON_REQUIRED', 'Enter a reason the customer will see');
  const ok = await tx(async client => {
    const claim = await client.query(
      `UPDATE orders SET order_status = 'rejected', payment_status = 'rejected', status_reason = $2, rejected_at = now(), updated_at = now(),
         timeline = timeline || $3::jsonb
       WHERE id = $1 AND order_status IN ('pending', 'under_review') RETURNING id`,
      [orderId, why, event('Payment rejected', why, admin.name)],
    );
    if (!claim.rowCount) return false;
    await client.query(
      `UPDATE payment_proofs SET status = 'rejected', reject_reason = $2, reviewed_by = $3, reviewed_at = now()
        WHERE order_id = $1 AND status = 'submitted'`,
      [orderId, why, admin.id],
    );
    return true;
  });
  if (!ok) {
    const current = await mustGet(orderId);
    throw new OrderError('INVALID_STATE', `This order is ${current.orderStatus.replace('_', ' ')} and cannot be rejected.`, 409);
  }
  const order = await mustGet(orderId);
  queueEmail(order.customerEmail, paymentRejectedEmail({ order, reason: why }), 'payment_rejected');
  if (order.customerId) await notifyCustomerTelegram(order.customerId, `❌ Payment for <code>${esc(order.orderNumber)}</code> was not approved.\nReason: ${esc(why)}`);
  return order;
}

/* ------------------------------------------------------------------ */
/* Delivery                                                            */
/* ------------------------------------------------------------------ */

/** Vault items to the admin per order line: what can be sent right now. */
export async function getVaultSuggestions(orderId: string): Promise<Array<{ orderItem: OrderItem; available: InventoryItem[]; fields: DeliveryField[][] }>> {
  const order = await mustGet(orderId);
  const out = [];
  for (const item of order.items) {
    const available = await db.getAvailableInventory(item.productId, item.variantId, item.quantity);
    out.push({ orderItem: item, available, fields: available.map(inventoryToFields) });
  }
  return out;
}

/** Turns a vault item into labelled fields (Email / Password / PIN / Profile / Licence key / extras). */
export function inventoryToFields(inv: InventoryItem): DeliveryField[] {
  const d = inv.data || {};
  const fields: DeliveryField[] = [];
  if (d.email) fields.push({ label: 'Email', value: d.email });
  if (d.password) fields.push({ label: 'Password', value: d.password });
  if (d.profileName) fields.push({ label: 'Profile', value: d.profileName });
  if (d.pin) fields.push({ label: 'PIN', value: d.pin });
  if (d.licenseKey) fields.push({ label: 'Licence key', value: d.licenseKey });
  for (const f of d.fields || []) if (f?.label && f?.value) fields.push({ label: f.label, value: f.value });
  return fields;
}

export interface DeliveryLineInput {
  orderItemId: string;
  /** Key/value pairs typed by the admin (heading + value, "+" adds more). */
  fields?: DeliveryField[];
  /** Vault items to hand out for this line; their fields are added automatically. */
  inventoryItemIds?: string[];
  instructions?: string;
}

export interface DeliverInput {
  lines: DeliveryLineInput[];
  note?: string;
  /** Where to send: email and/or telegram. WhatsApp is manual (copyText is returned). */
  channels: DeliveryChannel[];
}

export interface DeliverResult {
  order: Order;
  emailSent: boolean;
  telegramSent: boolean;
  telegramAvailable: boolean;
  /** Plain text the admin can copy into WhatsApp. */
  copyText: string;
}

export function buildDeliveryText(order: Order, items: DeliveredItem[], note?: string): string {
  const parts = [`Soft4u order ${order.orderNumber} is delivered.`, ''];
  for (const it of items) {
    parts.push(`${it.productName} (${it.variantName})`);
    for (const f of it.fields) parts.push(`${f.label}: ${f.value}`);
    if (it.instructions) parts.push(it.instructions);
    parts.push('');
  }
  if (note) parts.push(note, '');
  parts.push('Please keep these details private.');
  return parts.join('\n');
}

function cleanFields(fields: DeliveryField[] | undefined): DeliveryField[] {
  return (fields || [])
    .map(f => ({ label: String(f?.label ?? '').trim().slice(0, 60), value: String(f?.value ?? '').trim().slice(0, 2000) }))
    .filter(f => f.label && f.value);
}

/**
 * "Accept and send": approves the order if it is still under review, assigns
 * vault items, stores the delivered fields, marks it completed and sends it by
 * the chosen channels. Calling it again on a completed order re-sends (or
 * replaces) the delivery.
 */
export async function deliverOrder(orderId: string, admin: Pick<AdminUser, 'id' | 'name'>, input: DeliverInput): Promise<DeliverResult> {
  let order = await mustGet(orderId);
  if (['pending', 'under_review', 'rejected'].includes(order.orderStatus)) {
    order = await approveOrder(orderId, admin, { notify: false });
  }
  if (!['processing', 'completed'].includes(order.orderStatus)) {
    throw new OrderError('INVALID_STATE', `This order is ${order.orderStatus} and cannot be delivered.`, 409);
  }

  const byId = new Map(order.items.map(i => [i.id, i]));
  const delivered: DeliveredItem[] = [];
  await tx(async client => {
    // Lock the order so two "Accept and send" clicks run one after the other; the
    // second sees the changed status and stops instead of sending a second time.
    const locked = await client.query<{ order_status: string }>(`SELECT order_status FROM orders WHERE id = $1 FOR UPDATE`, [order.id]);
    if (locked.rows[0]?.order_status !== order.orderStatus) {
      throw new OrderError('ORDER_CHANGED', 'This order was just updated (maybe by another admin). Refresh to see the latest status.', 409);
    }
    for (const line of input.lines) {
      const item = byId.get(line.orderItemId);
      if (!item) throw new OrderError('BAD_ITEM', 'Unknown order line');
      const fields = cleanFields(line.fields);
      const invIds = [...new Set(line.inventoryItemIds || [])];
      if (invIds.length) {
        const claimed = await client.query(
          `UPDATE inventory_items SET status = 'sold', order_id = $2, order_item_id = $3, sold_at = now(), updated_at = now()
            WHERE id = ANY($1::text[]) AND status = 'available' AND product_id = $4 AND (variant_id = $5 OR variant_id IS NULL)
              AND (expires_at IS NULL OR expires_at > now()) RETURNING *`,
          [invIds, order.id, item.id, item.productId, item.variantId ?? null],
        );
        if (claimed.rowCount !== invIds.length) throw new OrderError('VAULT_TAKEN', 'A selected vault item was already used. Refresh and pick again.', 409);
        for (const row of claimed.rows) {
          fields.push(
            ...inventoryToFields({
              id: row.id,
              productId: row.product_id,
              variantId: row.variant_id ?? undefined,
              type: row.type,
              data: row.data || {},
              status: row.status,
              createdAt: '',
              updatedAt: '',
            }),
          );
        }
      }
      if (fields.length === 0) throw new OrderError('EMPTY_DELIVERY', `Add at least one detail for ${item.productName}`);
      const instructions = (line.instructions || '').trim() || undefined;
      const previous = item.fulfillmentData?.inventoryItemIds || [];
      await client.query(`UPDATE order_items SET fulfillment_data = $2::jsonb, delivered_at = now() WHERE id = $1`, [
        item.id,
        JSON.stringify({ fields, instructions, inventoryItemIds: [...previous, ...invIds] }),
      ]);
      delivered.push({ productName: item.productName, variantName: item.variantName, fields, instructions });
    }
    const allDelivered = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM order_items WHERE order_id = $1 AND fulfillment_data IS NULL`,
      [order.id],
    );
    const complete = (allDelivered.rows[0]?.n ?? 0) === 0;
    await client.query(
      `UPDATE orders SET order_status = CASE WHEN $2 THEN 'completed' ELSE order_status END,
         fulfillment_status = CASE WHEN $2 THEN 'fulfilled' ELSE 'partially_fulfilled' END,
         delivered_at = CASE WHEN $2 THEN now() ELSE delivered_at END, delivered_by = $3,
         delivery_channels = $4::jsonb, updated_at = now(), timeline = timeline || $5::jsonb
       WHERE id = $1`,
      [
        order.id,
        complete,
        admin.id,
        JSON.stringify(input.channels),
        event(order.orderStatus === 'completed' ? 'Delivery re-sent' : complete ? 'Delivered' : 'Partially delivered', `Sent via ${input.channels.join(', ') || 'manual'}`, admin.name),
      ],
    );
  });

  const updated = await mustGet(order.id);
  const note = (input.note || '').trim() || undefined;
  let emailSent = false;
  let telegramSent = false;
  if (input.channels.includes('email')) {
    emailSent = (await sendEmail(updated.customerEmail, orderDeliveredEmail({ order: updated, items: delivered, note }), 'order_delivered')).ok;
  }
  const telegramAvailable = Boolean(updated.customerId && telegramEnabled());
  if (input.channels.includes('telegram') && updated.customerId) {
    telegramSent = (await sendDeliveryToTelegram(updated.customerId, updated, delivered, note)) > 0;
  }
  return { order: updated, emailSent, telegramSent, telegramAvailable, copyText: buildDeliveryText(updated, delivered, note) };
}

/* ------------------------------------------------------------------ */
/* Cancel / refund                                                     */
/* ------------------------------------------------------------------ */

export async function cancelOrder(orderId: string, by: { type: 'customer' | 'admin'; name: string }, reason?: string): Promise<Order> {
  const why = (reason || '').trim() || (by.type === 'customer' ? 'Cancelled by customer' : 'Cancelled by admin');
  const r = await getPool().query<{ coupon_code: string | null }>(
    `UPDATE orders SET order_status = 'cancelled', status_reason = $2, cancelled_at = now(), updated_at = now(), timeline = timeline || $3::jsonb
      WHERE id = $1 AND order_status IN ('pending', 'under_review', 'rejected') RETURNING coupon_code`,
    [orderId, why, event('Cancelled', why, by.name)],
  );
  if (!r.rowCount) {
    const current = await mustGet(orderId);
    throw new OrderError('INVALID_STATE', `This order is ${current.orderStatus.replace('_', ' ')} and cannot be cancelled.`, 409);
  }
  if (r.rows[0]?.coupon_code) await db.releaseCouponUse(r.rows[0].coupon_code);
  return mustGet(orderId);
}

/**
 * Records a refund for a paid order: delivered (completed), or approved but not
 * delivered yet (processing, e.g. the product could not be supplied). Refunding
 * an undelivered order also releases its coupon use.
 */
export async function refundOrder(orderId: string, admin: Pick<AdminUser, 'id' | 'name'>, reason: string): Promise<Order> {
  const why = (reason || '').trim();
  if (why.length < 3) throw new OrderError('REASON_REQUIRED', 'Enter a refund reason');
  const r = await getPool().query<{ prev_status: string; coupon_code: string | null }>(
    `WITH prev AS (SELECT id, order_status FROM orders WHERE id = $1 FOR UPDATE)
     UPDATE orders o SET order_status = 'refunded', payment_status = 'refunded', status_reason = $2, refunded_at = now(), updated_at = now(),
       timeline = o.timeline || $3::jsonb
     FROM prev WHERE o.id = prev.id AND prev.order_status IN ('processing', 'completed')
     RETURNING prev.order_status AS prev_status, o.coupon_code`,
    [orderId, why, event('Refunded', why, admin.name)],
  );
  if (!r.rowCount) throw new OrderError('INVALID_STATE', 'Only paid orders (approved or delivered) can be refunded.', 409);
  if (r.rows[0].prev_status === 'processing' && r.rows[0].coupon_code) await db.releaseCouponUse(r.rows[0].coupon_code);
  const order = await mustGet(orderId);
  if (order.customerId) await notifyCustomerTelegram(order.customerId, `↩️ Order <code>${esc(order.orderNumber)}</code> was refunded (${esc(formatMoney(order.total, order.currency))}).`);
  return order;
}
