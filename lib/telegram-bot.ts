import { db } from '@/lib/db';
import type { Order } from '@/lib/db/types';
import { verifyCredentials, verifyUserTotp } from '@/lib/auth';
import { formatMoney } from '@/lib/money';
import { getUsdPkrRate } from '@/lib/fx';
import { usdPriceFor } from '@/lib/pricing';
import { clearAttempts, isLimited, recordAttempt } from '@/lib/rate-limit';
import { siteConfig } from '@/lib/site-config';
import { deliveredFieldsOf } from '@/lib/delivery-fields';
import {
  answerCallbackQuery,
  appUrl,
  BOT_NAME,
  deleteMessage,
  esc,
  sendChatAction,
  sendMessage,
  type InlineKeyboard,
  type TgCallbackQuery,
  type TgMessage,
  type TgUpdate,
} from '@/lib/telegram';
import { clearState, consumeLinkCode, getLinkedUserId, getState, linkUserChat, logoutChat, setState } from '@/lib/telegram-link';

/**
 * Bot conversation logic for SOFT4U ASSISTANT (called by /api/telegram/webhook).
 *
 * Linking: `/link CODE`, the t.me/<bot>?start=CODE deep link, a bare 6-character
 * code, or signing in with email + password inside the bot (rate limited; the
 * password message is deleted straight away).
 * Every order lookup checks that the order belongs to the customer linked to
 * this chat; other orders get the same "not found" answer.
 * Free text that is not a command goes to `freeTextHandler` (the AI assistant).
 */

type FreeTextHandler = (ctx: { chatId: string; text: string; userId: string | null }) => Promise<string | null>;

let freeTextHandler: FreeTextHandler | null = null;

/** Lets the AI assistant module answer free-text messages. Return null to fall back to the menu. */
export function setFreeTextHandler(handler: FreeTextHandler) {
  freeTextHandler = handler;
}

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MIN = 15;
const LINK_CODE_MAX_ATTEMPTS = 8;
const TICKETS_PER_HOUR = 3;

const STATUS_LABEL: Record<Order['orderStatus'], string> = {
  pending: '⏳ Awaiting payment',
  under_review: '🔎 Payment under review',
  processing: '⚙️ Approved, preparing delivery',
  completed: '✅ Delivered',
  rejected: '❌ Payment rejected',
  cancelled: '🚫 Cancelled',
  refunded: '↩️ Refunded',
};

const orderUrl = (o: Order) => `${appUrl()}/account/orders/${encodeURIComponent(o.orderNumber)}`;

function menu(linked: boolean): InlineKeyboard {
  const rows: InlineKeyboard = [[{ text: '🛍 Products', callback_data: 'products' }, { text: '🌐 Website', url: appUrl() }]];
  if (linked) {
    rows.push([{ text: '📦 My orders', callback_data: 'orders' }, { text: '💬 Support', callback_data: 'support' }]);
    rows.push([{ text: '❓ Help', callback_data: 'help' }, { text: '🔌 Disconnect', callback_data: 'unlink' }]);
  } else {
    rows.push([{ text: '🔗 Connect account', callback_data: 'link' }, { text: '💬 Support', callback_data: 'support' }]);
    rows.push([{ text: '❓ Help', callback_data: 'help' }]);
  }
  return rows;
}

async function showMenu(chatId: string) {
  const userId = await getLinkedUserId(chatId);
  const user = userId ? await db.getUserById(userId) : null;
  const text = user
    ? `👋 <b>Hi ${esc(user.name.split(' ')[0])}!</b>\n\nI'm <b>${BOT_NAME}</b>. Check your orders, see products and prices, and receive delivered access right here. You can also just ask me a question.`
    : `👋 <b>Welcome to ${esc(siteConfig.name)}</b>\n\nI'm <b>${BOT_NAME}</b>. Browse products and prices, ask me anything, or connect your ${esc(siteConfig.name)} account to track orders and get deliveries here.`;
  await sendMessage(chatId, text, { keyboard: menu(Boolean(user)) });
}

const HELP = () =>
  [
    `<b>${BOT_NAME} commands</b>`,
    '',
    '/orders - your recent orders',
    '/order S4U-XXXXXXXXXX - one order\'s status',
    '/access S4U-XXXXXXXXXX - delivered access of your order',
    '/products - what is available now',
    '/support - contact our team (/support your message opens a ticket)',
    '/link CODE - connect with the code from the website',
    '/link - sign in with email and password',
    '/unlink - disconnect this Telegram',
    '',
    'Get your code on the website: Account → Telegram.',
    'You can also type a question in your own words.',
  ].join('\n');

async function showProducts(chatId: string) {
  const [products, settings, fx] = await Promise.all([db.getProducts(true), db.getSiteSettings(), getUsdPkrRate().catch(() => ({ rate: 0 }))]);
  if (products.length === 0) {
    await sendMessage(chatId, 'No products are listed right now. Please check back soon.');
    return;
  }
  const lines = products.slice(0, 40).map(p => {
    const variants = p.variants.filter(v => v.status === 'active');
    const cheapest = variants.length ? variants.reduce((a, b) => (b.price < a.price ? b : a)) : null;
    const pkr = formatMoney(cheapest ? cheapest.price : p.price, 'PKR');
    const usd = cheapest && settings.usdEnabled && fx.rate > 0 ? ` · ${formatMoney(usdPriceFor(cheapest, fx.rate, settings.usdPricing), 'USD')}` : '';
    return `• <a href="${esc(`${appUrl()}/products/${p.slug}`)}">${esc(p.name)}</a> - from ${esc(pkr)}${esc(usd)}`;
  });
  const more = products.length > 40 ? `\n…and ${products.length - 40} more on the website.` : '';
  await sendMessage(chatId, `🛍 <b>Available now</b>\n\n${lines.join('\n')}${more}\n\nOrder on the website:`, {
    keyboard: [[{ text: 'Shop now', url: `${appUrl()}/shop` }]],
  });
}

function orderLine(o: Order): string {
  return `<code>${esc(o.orderNumber)}</code> · ${esc(formatMoney(o.total, o.currency))}\n${STATUS_LABEL[o.orderStatus] || esc(o.orderStatus)}\n${o.items
    .map(i => `• ${esc(i.productName)} (${esc(i.variantName)})${i.quantity > 1 ? ` × ${i.quantity}` : ''}`)
    .join('\n')}`;
}

async function needLink(chatId: string, what: string) {
  await sendMessage(chatId, `Connect your account first to ${what}.`, { keyboard: [[{ text: '🔗 Connect account', callback_data: 'link' }]] });
}

async function showOrders(chatId: string) {
  const userId = await getLinkedUserId(chatId);
  if (!userId) return needLink(chatId, 'see your orders');
  const orders = await db.getOrders({ customerId: userId, limit: 5 });
  if (orders.length === 0) {
    await sendMessage(chatId, 'You have no orders yet.', { keyboard: [[{ text: 'Shop now', url: `${appUrl()}/shop` }]] });
    return;
  }
  const keyboard: InlineKeyboard = orders.map(o =>
    o.orderStatus === 'completed'
      ? [{ text: `🔑 Access ${o.orderNumber}`, callback_data: `a:${o.orderNumber}` }]
      : [{ text: `📄 ${o.orderNumber}`, callback_data: `o:${o.orderNumber}` }],
  );
  keyboard.push([{ text: 'All orders on the website', url: `${appUrl()}/account/orders` }]);
  await sendMessage(chatId, `📦 <b>Your recent orders</b>\n\n${orders.map(orderLine).join('\n\n')}`, { keyboard });
}

/** The order if it belongs to the customer linked to this chat. */
async function ownOrder(chatId: string, number: string): Promise<{ userId: string | null; order: Order | null }> {
  const userId = await getLinkedUserId(chatId);
  const clean = (number || '').trim().toUpperCase();
  const order = userId && clean ? await db.getOrderByNumber(clean) : null;
  return { userId, order: order && order.customerId === userId ? order : null };
}

async function orderNotFound(chatId: string) {
  await sendMessage(chatId, 'Order not found on your account. Check the Order ID, or track it on the website.', {
    keyboard: [[{ text: 'Track order', url: `${appUrl()}/track-order` }]],
  });
}

async function showOrder(chatId: string, number: string) {
  if (!number) {
    await sendMessage(chatId, 'Send the Order ID like <code>/order S4U-XXXXXXXXXX</code>, or tap /orders.');
    return;
  }
  const { userId, order } = await ownOrder(chatId, number);
  if (!userId) return needLink(chatId, 'check your orders');
  if (!order) return orderNotFound(chatId);

  const lines = [orderLine(order)];
  if (order.statusReason && ['rejected', 'cancelled', 'refunded'].includes(order.orderStatus)) lines.push(`\nReason: ${esc(order.statusReason)}`);
  if (['pending', 'rejected'].includes(order.orderStatus)) {
    const m = await db.getPaymentMethodByKey(order.paymentMethod);
    lines.push(`\n💳 <b>Amount to transfer: ${esc(formatMoney(order.total, order.currency))}</b>`);
    if (m) {
      lines.push(`${esc(m.name)}`, `Account title: <code>${esc(m.accountTitle)}</code>`, `Account number: <code>${esc(m.accountNumber)}</code>`);
      if (m.iban) lines.push(`IBAN: <code>${esc(m.iban)}</code>`);
    }
    lines.push('\nThen upload the payment screenshot and the transaction ID on the order page.');
  }
  if (order.orderStatus === 'under_review') lines.push('\nWe received your payment proof. Our team is checking it.');
  const keyboard: InlineKeyboard = [[{ text: 'Open order', url: orderUrl(order) }]];
  if (order.orderStatus === 'completed') keyboard.unshift([{ text: '🔑 Show access', callback_data: `a:${order.orderNumber}` }]);
  await sendMessage(chatId, lines.join('\n'), { keyboard });
}

/** Delivered access for the linked customer's own completed order. */
async function showAccess(chatId: string, number: string) {
  if (!number) {
    await sendMessage(chatId, 'Send the Order ID like <code>/access S4U-XXXXXXXXXX</code>, or tap /orders.');
    return;
  }
  const { userId, order } = await ownOrder(chatId, number);
  if (!userId) return needLink(chatId, 'see delivered access');
  if (!order) return orderNotFound(chatId);
  if (order.orderStatus !== 'completed') {
    await sendMessage(chatId, `This order is not delivered yet.\nStatus: ${STATUS_LABEL[order.orderStatus] || esc(order.orderStatus)}`, {
      keyboard: [[{ text: 'Open order', url: orderUrl(order) }]],
    });
    return;
  }
  const lines = [`🔑 <b>Access for</b> <code>${esc(order.orderNumber)}</code>`, ''];
  for (const item of order.items) {
    lines.push(`<b>${esc(item.productName)}</b> (${esc(item.variantName)})`);
    const fields = deliveredFieldsOf(item);
    if (fields.length === 0) lines.push('<i>Details are on the order page.</i>');
    for (const f of fields) lines.push(`${esc(f.label)}: <code>${esc(f.value)}</code>`);
    if (item.fulfillmentData?.instructions) lines.push(`<i>${esc(item.fulfillmentData.instructions)}</i>`);
    lines.push('');
  }
  lines.push('🔒 Keep these details private. Do not change the account email, password or profile unless the product page allows it.');
  await sendMessage(chatId, lines.join('\n'), { keyboard: [[{ text: 'Open order', url: orderUrl(order) }]] });
}

async function contactText(): Promise<string> {
  const s = await db.getSiteSettings().catch(() => null);
  return [
    '💬 <b>Contact support</b>',
    '',
    `WhatsApp: ${esc(s?.contactWhatsapp || siteConfig.whatsapp)}`,
    `Email: ${esc(s?.contactEmail || siteConfig.email)}`,
    `Hours: ${esc(s?.businessHours || siteConfig.hours)}`,
  ].join('\n');
}

async function support(chatId: string, text: string, msg?: TgMessage) {
  const userId = await getLinkedUserId(chatId);
  const user = userId ? await db.getUserById(userId) : null;
  const waNumber = siteConfig.whatsappHref;
  if (!text) {
    const extra = user
      ? '\n\nTo open a ticket from here, send <code>/support</code> followed by your message, e.g. <code>/support My Netflix login stopped working (S4U-XXXXXXXXXX)</code>.'
      : '\n\nConnect your account to open support tickets from Telegram.';
    await sendMessage(chatId, (await contactText()) + extra, {
      keyboard: [[{ text: 'WhatsApp', url: waNumber }, { text: 'Contact page', url: `${appUrl()}/contact` }]],
    });
    return;
  }
  if (!user) {
    await sendMessage(chatId, `${await contactText()}\n\nConnect your account to open a ticket here.`, {
      keyboard: [[{ text: '🔗 Connect account', callback_data: 'link' }, { text: 'WhatsApp', url: waNumber }]],
    });
    return;
  }
  const key = `tg-ticket:${chatId}`;
  if (await isLimited(key, TICKETS_PER_HOUR, 60)) {
    await sendMessage(chatId, 'You opened several tickets in the last hour. Our team will reply soon; for urgent help use WhatsApp.', {
      keyboard: [[{ text: 'WhatsApp', url: waNumber }]],
    });
    return;
  }
  await recordAttempt(key);
  const number = text.match(/S4U-[A-Z0-9]{10}/i)?.[0]?.toUpperCase();
  const order = number ? await db.getOrderByNumber(number) : null;
  const ticket = await db.createTicket({
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    subject: text.slice(0, 80),
    orderId: order && order.customerId === user.id ? order.id : undefined,
    category: 'Telegram',
    status: 'open',
    priority: 'medium',
    messages: [{ senderId: user.id, senderName: user.name || msg?.from?.first_name || 'Customer', senderRole: 'CUSTOMER', message: text.slice(0, 4000) }],
  });
  await sendMessage(chatId, `✅ Ticket <code>${esc(ticket.ticketNumber)}</code> opened. Our team will reply by email and on the website.`, {
    keyboard: [[{ text: 'My tickets', url: `${appUrl()}/account/support` }]],
  });
}

async function startLink(chatId: string) {
  await setState(chatId, 'login_email');
  await sendMessage(
    chatId,
    `🔗 <b>Connect your ${esc(siteConfig.name)} account</b>\n\nFastest: on the website open <b>Account → Telegram</b> and send me the 6-character code like <code>/link AB12CD</code>.\n\nOr send your account <b>email address</b> now to sign in here. /cancel to stop.`,
  );
}

/** Returns true when the message was handled (linked, or refused because of too many wrong codes). */
async function tryLinkCode(chatId: string, code: string, msg: TgMessage, opts: { bare?: boolean } = {}): Promise<boolean> {
  const key = `tg-link:${chatId}`;
  if (await isLimited(key, LINK_CODE_MAX_ATTEMPTS, LOGIN_WINDOW_MIN)) {
    // A bare 6-letter word may just be chat text: let it go to the assistant instead.
    if (opts.bare) return false;
    await sendMessage(chatId, `⏳ Too many wrong codes. Try again in ${LOGIN_WINDOW_MIN} minutes with a new code from the website (Account → Telegram).`);
    return true;
  }
  const result = await consumeLinkCode(code, { chatId, username: msg.from?.username, firstName: msg.from?.first_name });
  if (!result) {
    await recordAttempt(key);
    return false;
  }
  await clearAttempts(key);
  await clearState(chatId);
  if (result.kind === 'admin') {
    await sendMessage(chatId, '✅ Admin alerts connected. You will get new orders and payment proofs here.');
  } else {
    await sendMessage(chatId, '✅ Your account is connected. Order updates and delivered access will also arrive here.', { keyboard: menu(true) });
  }
  return true;
}

async function unlink(chatId: string) {
  await logoutChat(chatId);
  await sendMessage(chatId, '🔌 This Telegram is disconnected from your account. You can connect again any time with /link.', { keyboard: menu(false) });
}

async function handleText(msg: TgMessage) {
  const chatId = String(msg.chat.id);
  const text = (msg.text || '').trim();
  if (!text) return;

  if (text.startsWith('/')) {
    const [raw, ...args] = text.split(/\s+/);
    const cmd = raw.split('@')[0].toLowerCase();
    const arg = args.join(' ').trim();
    if (cmd !== '/cancel') await clearState(chatId);
    switch (cmd) {
      case '/start':
        if (arg && (await tryLinkCode(chatId, arg, msg))) return;
        if (arg) await sendMessage(chatId, '❌ That connect code is invalid or expired. Generate a new one on the website (Account → Telegram).');
        return showMenu(chatId);
      case '/link':
        if (arg) {
          if (!(await tryLinkCode(chatId, arg, msg))) await sendMessage(chatId, '❌ That code is invalid or expired. Generate a new one on the website (Account → Telegram).');
          return;
        }
        return startLink(chatId);
      case '/orders':
        return showOrders(chatId);
      case '/order':
        return showOrder(chatId, arg);
      case '/access':
        return showAccess(chatId, arg);
      case '/products':
        return showProducts(chatId);
      case '/support':
        return support(chatId, arg, msg);
      case '/logout':
      case '/unlink':
        return unlink(chatId);
      case '/cancel':
        await clearState(chatId);
        return showMenu(chatId);
      case '/menu':
        return showMenu(chatId);
      case '/help':
      default:
        return void (await sendMessage(chatId, HELP()));
    }
  }

  const state = await getState(chatId);
  if (state?.mode === 'login_email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      await sendMessage(chatId, 'That does not look like an email. Send your account email, or /cancel.');
      return;
    }
    await setState(chatId, 'login_password', { email: text.toLowerCase() });
    await sendMessage(chatId, '🔒 Now send your <b>password</b>. I will delete that message right away.');
    return;
  }
  if (state?.mode === 'login_password') {
    await deleteMessage(chatId, msg.message_id);
    const key = `tg-login:${chatId}`;
    if (await isLimited(key, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MIN)) {
      await clearState(chatId);
      await sendMessage(chatId, `⏳ Too many sign-in attempts. Try again in ${LOGIN_WINDOW_MIN} minutes, or use the code from the website (Account → Telegram).`);
      return;
    }
    const email = String(state.data.email || '');
    const found = email ? await verifyCredentials(email, text) : null;
    if (!found) {
      await recordAttempt(key);
      await setState(chatId, 'login_email');
      await sendMessage(chatId, '❌ Incorrect email or password (or the email is not verified yet). Send your email again, or /cancel.\n\nForgot it? Reset on the website.', {
        keyboard: [[{ text: 'Reset password', url: `${appUrl()}/forgot-password` }]],
      });
      return;
    }
    if (found.totpRequired) {
      await setState(chatId, 'login_totp', { userId: found.user.id });
      await sendMessage(chatId, '🔐 Two-factor authentication is on. Send the 6-digit code from your authenticator app, or /cancel.');
      return;
    }
    await linkUserChat(found.user.id, { chatId, username: msg.from?.username, firstName: msg.from?.first_name });
    await clearState(chatId);
    await sendMessage(chatId, `✅ Signed in as <b>${esc(found.user.email)}</b>. Your account is connected.`, { keyboard: menu(true) });
    return;
  }
  if (state?.mode === 'login_totp') {
    await deleteMessage(chatId, msg.message_id);
    const userId = String(state.data.userId || '');
    const check = userId ? await verifyUserTotp(userId, text) : 'invalid';
    if (check === 'locked') {
      await clearState(chatId);
      await sendMessage(chatId, `⏳ Too many wrong codes. Try again in ${LOGIN_WINDOW_MIN} minutes, or use the code from the website (Account → Telegram).`);
      return;
    }
    if (check !== 'ok') {
      await sendMessage(chatId, '❌ That code is not right. Send the current 6-digit code, or /cancel.');
      return;
    }
    const user = await db.getUserById(userId);
    if (!user) {
      await clearState(chatId);
      return showMenu(chatId);
    }
    await linkUserChat(user.id, { chatId, username: msg.from?.username, firstName: msg.from?.first_name });
    await clearState(chatId);
    await sendMessage(chatId, `✅ Signed in as <b>${esc(user.email)}</b>. Your account is connected.`, { keyboard: menu(true) });
    return;
  }

  // A bare 6-character code also links.
  if (/^[A-Za-z0-9]{6}$/.test(text) && (await tryLinkCode(chatId, text, msg, { bare: true }))) return;
  // A bare order number shows that order.
  if (/^S4U-[A-Z0-9]{10}$/i.test(text)) return showOrder(chatId, text);

  if (freeTextHandler) {
    const userId = await getLinkedUserId(chatId);
    await sendChatAction(chatId, 'typing');
    const reply = await freeTextHandler({ chatId, text, userId }).catch(() => null);
    if (reply) {
      await sendMessage(chatId, reply);
      return;
    }
  }
  await showMenu(chatId);
}

async function handleCallback(cb: TgCallbackQuery) {
  const chatId = cb.message ? String(cb.message.chat.id) : String(cb.from.id);
  await answerCallbackQuery(cb.id);
  const data = cb.data || '';
  if (data.startsWith('o:')) return showOrder(chatId, data.slice(2));
  if (data.startsWith('a:')) return showAccess(chatId, data.slice(2));
  switch (data) {
    case 'products':
      return showProducts(chatId);
    case 'orders':
      return showOrders(chatId);
    case 'link':
      return startLink(chatId);
    case 'support':
      return support(chatId, '');
    case 'unlink':
      return unlink(chatId);
    case 'help':
      return void (await sendMessage(chatId, HELP()));
    default:
      return showMenu(chatId);
  }
}

export async function handleTelegramUpdate(update: TgUpdate): Promise<void> {
  if (update.callback_query) {
    const chatType = update.callback_query.message?.chat.type;
    if (chatType && chatType !== 'private') return;
    return handleCallback(update.callback_query);
  }
  const msg = update.message;
  if (!msg || msg.chat.type !== 'private') return;
  await handleText(msg);
}
