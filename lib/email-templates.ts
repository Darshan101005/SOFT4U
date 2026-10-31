import type { Currency, DeliveryField, Order, PaymentMethod } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import { siteConfig } from '@/lib/site-config';

/**
 * Branded HTML emails (pistachio palette, table layout for email clients).
 * Every template returns { subject, html, text }. All dynamic values are
 * HTML-escaped here.
 */

const C = {
  pista: '#93C572',
  pistaDark: '#4F7A33',
  pistaDarker: '#3F6328',
  pistaLight: '#DAEBC8',
  pistaLighter: '#F1F7EA',
  bg: '#F8FBF4',
  card: '#FFFFFF',
  charcoal: '#2B3328',
  muted: '#4D5848',
  subtle: '#687263',
  border: '#DDE7D3',
  amberBg: '#FDF3E2',
  amberBorder: '#F2D29B',
  roseBg: '#FBE9EC',
  roseBorder: '#F0B9C3',
};
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || siteConfig.url).replace(/\/$/, '');
}

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 0 auto;"><tr><td align="center" style="border-radius:12px;background-color:${C.pistaDark};">
<a href="${esc(href)}" target="_blank" style="display:inline-block;padding:14px 34px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">${esc(label)}</a>
</td></tr></table>`;
}

function rows(pairs: Array<[string, string]>): string {
  return pairs
    .map(
      ([k, v]) => `<tr>
<td style="padding:7px 0;vertical-align:top;width:42%;font-family:${FONT};font-size:14px;color:${C.subtle};">${esc(k)}</td>
<td style="padding:7px 0;vertical-align:top;font-family:${FONT};font-size:14px;font-weight:700;color:${C.charcoal};word-break:break-word;">${v}</td>
</tr>`,
    )
    .join('');
}

function panel(inner: string, tone: 'green' | 'amber' | 'rose' | 'plain' = 'plain'): string {
  const bg = tone === 'green' ? C.pistaLighter : tone === 'amber' ? C.amberBg : tone === 'rose' ? C.roseBg : '#FAFCF7';
  const border = tone === 'green' ? C.pistaLight : tone === 'amber' ? C.amberBorder : tone === 'rose' ? C.roseBorder : C.border;
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${bg};border:1px solid ${border};border-radius:14px;">
<tr><td style="padding:18px 22px;">${inner}</td></tr></table>`;
}

function label(text: string): string {
  return `<div style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.pistaDark};margin:0 0 12px 0;">${esc(text)}</div>`;
}

function p(text: string, extra = ''): string {
  return `<p style="margin:0 0 12px 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.muted};${extra}">${text}</p>`;
}

function codeBlock(code: string): string {
  const cells = code
    .split('')
    .map(
      d =>
        `<td style="width:46px;height:58px;background-color:#ffffff;border:2px solid ${C.pistaLight};border-radius:10px;text-align:center;font-family:${FONT};font-size:30px;font-weight:800;color:${C.charcoal};">${esc(d)}</td>`,
    )
    .join('<td style="width:8px;"></td>');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>${cells}</tr></table>`;
}

function layout(opts: { title: string; preheader: string; body: string }): string {
  const base = appBaseUrl();
  const wa = siteConfig.whatsappHref;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background-color:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${C.bg};">
<tr><td align="center" style="padding:32px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:${C.card};border:1px solid ${C.border};border-radius:18px;overflow:hidden;">
<tr><td style="height:6px;background-color:${C.pista};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td align="center" style="padding:30px 32px 6px 32px;">
<a href="${esc(base)}" style="text-decoration:none;font-family:${FONT};font-size:28px;font-weight:800;letter-spacing:-0.5px;color:${C.charcoal};">Soft<span style="color:${C.pistaDark};">4</span>u</a>
</td></tr>
<tr><td style="padding:18px 32px 30px 32px;">${opts.body}</td></tr>
<tr><td style="padding:20px 32px 26px 32px;background-color:${C.pistaLighter};border-top:1px solid ${C.border};">
<p style="margin:0 0 6px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.subtle};text-align:center;"><strong>This is an automated message. Please do not reply to this email.</strong></p>
<p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.subtle};text-align:center;">Need help? Visit our <a href="${esc(base)}/contact" style="color:${C.pistaDark};font-weight:700;text-decoration:none;">Contact page</a> or message us on <a href="${esc(wa)}" style="color:${C.pistaDark};font-weight:700;text-decoration:none;">WhatsApp ${esc(siteConfig.whatsapp)}</a>.</p>
<p style="margin:10px 0 0 0;font-family:${FONT};font-size:11px;color:${C.subtle};text-align:center;">&copy; ${new Date().getFullYear()} ${esc(siteConfig.name)} &middot; ${esc(siteConfig.domain)}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const TEXT_FOOTER = `\n\n--\nThis is an automated message. Please do not reply to this email.\nNeed help? ${appBaseUrl()}/contact or WhatsApp ${siteConfig.whatsapp}`;

function heading(text: string): string {
  return `<h1 style="margin:0 0 10px 0;font-family:${FONT};font-size:23px;line-height:1.3;font-weight:800;color:${C.charcoal};">${esc(text)}</h1>`;
}

function hello(name: string): string {
  return p(`Hi <strong style="color:${C.charcoal};">${esc(name || 'there')}</strong>,`);
}

function orderSummary(order: Order): string {
  const items = order.items
    .map(
      it =>
        `<tr><td style="padding:6px 0;font-family:${FONT};font-size:14px;color:${C.charcoal};">${esc(it.productName)} <span style="color:${C.subtle};">(${esc(it.variantName)}) &times; ${it.quantity}</span></td>
<td align="right" style="padding:6px 0;font-family:${FONT};font-size:14px;font-weight:700;color:${C.charcoal};white-space:nowrap;">${esc(formatMoney(it.price * it.quantity, order.currency))}</td></tr>`,
    )
    .join('');
  const discount =
    order.discount > 0
      ? `<tr><td style="padding:6px 0;font-family:${FONT};font-size:14px;color:${C.subtle};">Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ''}</td>
<td align="right" style="padding:6px 0;font-family:${FONT};font-size:14px;color:${C.pistaDark};font-weight:700;">-${esc(formatMoney(order.discount, order.currency))}</td></tr>`
      : '';
  return panel(
    `${label('Order summary')}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
${rows([['Order ID', `<span style="font-family:monospace;">${esc(order.orderNumber)}</span>`]])}
</table>
<div style="height:1px;background-color:${C.border};margin:8px 0;"></div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${items}${discount}
<tr><td style="padding:10px 0 0 0;font-family:${FONT};font-size:15px;font-weight:800;color:${C.charcoal};">Total</td>
<td align="right" style="padding:10px 0 0 0;font-family:${FONT};font-size:17px;font-weight:800;color:${C.pistaDarker};">${esc(formatMoney(order.total, order.currency))}</td></tr>
</table>`,
  );
}

function trackUrl(order: Order): string {
  return `${appBaseUrl()}/track-order?order=${encodeURIComponent(order.orderNumber)}`;
}

/* ------------------------------------------------------------------ */
/* Account emails                                                      */
/* ------------------------------------------------------------------ */

export function signupOtpEmail(d: { name: string; code: string; minutes: number; resent?: boolean }): EmailContent {
  const subject = d.resent ? `Your new ${siteConfig.name} verification code` : `Verify your email - ${siteConfig.name}`;
  const body = `${heading(d.resent ? 'Here is your new code' : 'Confirm your email address')}
${hello(d.name)}
${p(d.resent ? 'You asked for a new verification code. Use it to finish creating your account. Older codes no longer work.' : `Thanks for signing up with ${esc(siteConfig.name)}. Enter this code to verify your email and activate your account.`)}
<div style="margin:22px 0 10px 0;">${codeBlock(d.code)}</div>
${p(`This code expires in <strong style="color:${C.charcoal};">${d.minutes} minutes</strong>.`, 'text-align:center;')}
${panel(p(`<strong style="color:${C.charcoal};">Never share this code.</strong> ${esc(siteConfig.name)} staff will never ask you for it.`, 'margin:0;'), 'amber')}
<div style="height:14px;"></div>
${p("Didn't create an account? You can ignore this email.", `font-size:13px;color:${C.subtle};`)}`;
  return {
    subject,
    html: layout({ title: subject, preheader: `Your verification code is ${d.code}`, body }),
    text: `Hi ${d.name},\n\nYour ${siteConfig.name} verification code is ${d.code}. It expires in ${d.minutes} minutes.\nNever share this code.${TEXT_FOOTER}`,
  };
}

/** Same layout as the signup code, worded as a fresh code. */
export function resendOtpEmail(d: { name: string; code: string; minutes: number }): EmailContent {
  return signupOtpEmail({ ...d, resent: true });
}

export function passwordResetEmail(d: { name: string; code: string; link: string; minutes: number }): EmailContent {
  const subject = `Reset your ${siteConfig.name} password`;
  const body = `${heading('Reset your password')}
${hello(d.name)}
${p('We received a request to reset your password. Enter this code on the reset page, or use the button below.')}
<div style="margin:22px 0 10px 0;">${codeBlock(d.code)}</div>
${p(`The code and link expire in <strong style="color:${C.charcoal};">${d.minutes} minutes</strong> and work once.`, 'text-align:center;')}
${button(d.link, 'Reset password')}
<div style="height:18px;"></div>
${p("If you didn't ask for this, ignore this email. Your password stays the same.", `font-size:13px;color:${C.subtle};`)}`;
  return {
    subject,
    html: layout({ title: subject, preheader: `Your password reset code is ${d.code}`, body }),
    text: `Hi ${d.name},\n\nYour password reset code is ${d.code} (expires in ${d.minutes} minutes).\nOr open: ${d.link}\nIf you didn't ask for this, ignore this email.${TEXT_FOOTER}`,
  };
}

export function welcomeEmail(d: { name: string }): EmailContent {
  const base = appBaseUrl();
  const subject = `Welcome to ${siteConfig.name}`;
  const body = `${heading('Your account is ready')}
${hello(d.name)}
${p(`Your email is verified and your ${esc(siteConfig.name)} account is active. From your account you can:`)}
${panel(
  `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
${['Track every order and see delivered access details', 'Add your WhatsApp number or Telegram for faster delivery', 'Connect the SOFT4U ASSISTANT Telegram bot', 'Turn on two-factor authentication for extra security']
  .map(t => `<tr><td style="padding:5px 0;font-family:${FONT};font-size:14px;color:${C.charcoal};"><span style="color:${C.pistaDark};font-weight:800;">&#10003;</span>&nbsp; ${esc(t)}</td></tr>`)
  .join('')}
</table>`,
  'green',
)}
<div style="height:18px;"></div>
${button(`${base}/shop`, 'Browse products')}`;
  return {
    subject,
    html: layout({ title: subject, preheader: 'Your account is verified and ready to use.', body }),
    text: `Hi ${d.name},\n\nYour ${siteConfig.name} account is verified and ready. Browse products: ${base}/shop${TEXT_FOOTER}`,
  };
}

export function twoFactorChangedEmail(d: { name: string; enabled: boolean; when: string; device?: string }): EmailContent {
  const subject = d.enabled ? 'Two-factor authentication turned on' : 'Two-factor authentication turned off';
  const body = `${heading(subject)}
${hello(d.name)}
${p(
  d.enabled
    ? 'Two-factor authentication is now <strong>on</strong> for your account. You will be asked for a code from your authenticator app each time you sign in.'
    : 'Two-factor authentication is now <strong>off</strong> for your account. Signing in only needs your password.',
)}
${panel(`<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows([
  ['When', esc(d.when)],
  ['Device', esc(d.device || 'Unknown device')],
])}</table>`, d.enabled ? 'green' : 'amber')}
<div style="height:14px;"></div>
${p("If this wasn't you, reset your password straight away and contact us.", `font-size:13px;color:${C.subtle};`)}`;
  return {
    subject: `${subject} - ${siteConfig.name}`,
    html: layout({ title: subject, preheader: subject, body }),
    text: `Hi ${d.name},\n\n${subject} on ${d.when} (${d.device || 'unknown device'}). If this wasn't you, reset your password now.${TEXT_FOOTER}`,
  };
}

/* ------------------------------------------------------------------ */
/* Order emails                                                        */
/* ------------------------------------------------------------------ */

function paymentDetails(method: PaymentMethod | null, order: Order): string {
  if (!method) return '';
  const pairs: Array<[string, string]> = [['Method', esc(method.name)]];
  if (method.bankName) pairs.push(['Bank', esc(method.bankName)]);
  if (method.accountTitle) pairs.push(['Account title', esc(method.accountTitle)]);
  if (method.accountNumber) pairs.push(['Account number', `<span style="font-family:monospace;">${esc(method.accountNumber)}</span>`]);
  if (method.iban) pairs.push(['IBAN', `<span style="font-family:monospace;">${esc(method.iban)}</span>`]);
  if (method.branch) pairs.push(['Branch', esc(method.branch)]);
  pairs.push(['Amount to transfer', `<span style="color:${C.pistaDarker};">${esc(formatMoney(order.total, order.currency))}</span>`]);
  return panel(
    `${label('Payment details')}<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows(pairs)}</table>${
      method.instructions ? `<div style="height:8px;"></div>${p(esc(method.instructions), 'margin:0;font-size:13px;')}` : ''
    }`,
    'green',
  );
}

export function orderPlacedEmail(d: { order: Order; method: PaymentMethod | null }): EmailContent {
  const { order } = d;
  const subject = `Order ${order.orderNumber} received - complete your payment`;
  const body = `${heading('We received your order')}
${hello(order.customerName)}
${p('Transfer the exact total to the account below, then upload a screenshot of the payment and enter the transaction ID on your order page. We verify every payment and deliver as soon as it is approved.')}
${paymentDetails(d.method, order)}
<div style="height:14px;"></div>
${orderSummary(order)}
<div style="height:18px;"></div>
${button(trackUrl(order), 'Upload payment proof')}
<div style="height:14px;"></div>
${p('Keep your Order ID private. It is also your tracking ID.', `font-size:13px;color:${C.subtle};text-align:center;`)}`;
  return {
    subject,
    html: layout({ title: subject, preheader: `Transfer ${formatMoney(order.total, order.currency)} and upload your payment proof.`, body }),
    text: `Hi ${order.customerName},\n\nWe received order ${order.orderNumber}. Total: ${formatMoney(order.total, order.currency)}.\nTransfer the exact total via ${d.method?.name || order.paymentMethodName || order.paymentMethod}, then upload a screenshot of the payment and the transaction ID: ${trackUrl(order)}${TEXT_FOOTER}`,
  };
}

export function orderUnderReviewEmail(d: { order: Order }): EmailContent {
  const { order } = d;
  const subject = `Payment received for ${order.orderNumber} - under review`;
  const body = `${heading('Your payment is being verified')}
${hello(order.customerName)}
${p('Thanks! We received your payment proof. Our team is checking it now. You will get another email as soon as your payment is approved and your order is delivered.')}
${orderSummary(order)}
<div style="height:18px;"></div>
${button(trackUrl(order), 'Track your order')}`;
  return {
    subject,
    html: layout({ title: subject, preheader: 'We received your payment proof and are verifying it.', body }),
    text: `Hi ${order.customerName},\n\nWe received your payment proof for ${order.orderNumber} and are verifying it. Track: ${trackUrl(order)}${TEXT_FOOTER}`,
  };
}

export function paymentApprovedEmail(d: { order: Order }): EmailContent {
  const { order } = d;
  const subject = `Payment approved for ${order.orderNumber}`;
  const body = `${heading('Payment approved')}
${hello(order.customerName)}
${p('Good news: your payment is verified. We are preparing your access now and will send it to you shortly.')}
${orderSummary(order)}
<div style="height:18px;"></div>
${button(trackUrl(order), 'View order')}`;
  return {
    subject,
    html: layout({ title: subject, preheader: 'Your payment is verified. Delivery is on the way.', body }),
    text: `Hi ${order.customerName},\n\nYour payment for ${order.orderNumber} is approved. Delivery is on the way. ${trackUrl(order)}${TEXT_FOOTER}`,
  };
}

export function paymentRejectedEmail(d: { order: Order; reason: string }): EmailContent {
  const { order } = d;
  const subject = `Payment not approved for ${order.orderNumber}`;
  const body = `${heading('We could not approve your payment')}
${hello(order.customerName)}
${p('We checked the payment proof for your order and could not approve it.')}
${panel(`${label('Reason')}${p(esc(d.reason || 'The payment could not be matched.'), `margin:0;color:${C.charcoal};font-weight:700;`)}`, 'rose')}
<div style="height:14px;"></div>
${p('If you did pay, please upload a clear screenshot and the correct transaction ID again from the order page, or contact us with your Order ID.')}
${orderSummary(order)}
<div style="height:18px;"></div>
${button(trackUrl(order), 'Open order')}`;
  return {
    subject,
    html: layout({ title: subject, preheader: `Reason: ${d.reason}`, body }),
    text: `Hi ${order.customerName},\n\nWe could not approve the payment for ${order.orderNumber}.\nReason: ${d.reason}\nOpen your order: ${trackUrl(order)}${TEXT_FOOTER}`,
  };
}

export interface DeliveredItem {
  productName: string;
  variantName: string;
  fields: DeliveryField[];
  instructions?: string;
}

export function orderDeliveredEmail(d: { order: Order; items: DeliveredItem[]; note?: string }): EmailContent {
  const { order } = d;
  const subject = `Your order ${order.orderNumber} is delivered`;
  const blocks = d.items
    .map(
      it => `${panel(
        `${label(`${it.productName} - ${it.variantName}`)}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows(
          it.fields.map(f => [f.label, `<span style="font-family:monospace;font-size:14px;">${esc(f.value)}</span>`] as [string, string]),
        )}</table>${it.instructions ? `<div style="height:8px;"></div>${p(esc(it.instructions), 'margin:0;font-size:13px;')}` : ''}`,
        'green',
      )}<div style="height:12px;"></div>`,
    )
    .join('');
  const body = `${heading('Your access is ready')}
${hello(order.customerName)}
${p('Your order has been delivered. Here are your access details:')}
${blocks}
${d.note ? `${panel(`${label('Note from our team')}${p(esc(d.note), 'margin:0;')}`)}<div style="height:12px;"></div>` : ''}
${panel(p(`<strong style="color:${C.charcoal};">Keep these details private.</strong> Do not share them or change the account email, password or profile settings unless the product page says you can. Doing so can void your warranty.`, 'margin:0;'), 'amber')}
<div style="height:18px;"></div>
${button(trackUrl(order), 'View order')}`;
  const text = d.items
    .map(it => `${it.productName} - ${it.variantName}\n${it.fields.map(f => `${f.label}: ${f.value}`).join('\n')}${it.instructions ? `\n${it.instructions}` : ''}`)
    .join('\n\n');
  return {
    subject,
    html: layout({ title: subject, preheader: 'Your access details are inside. Keep them private.', body }),
    text: `Hi ${order.customerName},\n\nOrder ${order.orderNumber} is delivered.\n\n${text}${d.note ? `\n\nNote: ${d.note}` : ''}\n\nKeep these details private.${TEXT_FOOTER}`,
  };
}

export function adminNewOrderEmail(d: { order: Order; stage: 'placed' | 'proof_submitted' }): EmailContent {
  const { order } = d;
  const url = `${appBaseUrl()}/admin/orders/${encodeURIComponent(order.id)}`;
  const title = d.stage === 'placed' ? 'New order placed' : 'Payment proof submitted';
  const subject = `[${siteConfig.name}] ${title}: ${order.orderNumber} (${formatMoney(order.total, order.currency)})`;
  const proof = order.paymentProofs?.[0];
  const pairs: Array<[string, string]> = [
    ['Customer', esc(order.customerName)],
    ['Email', esc(order.customerEmail)],
  ];
  if (order.customerWhatsapp) pairs.push(['WhatsApp', esc(order.customerWhatsapp)]);
  pairs.push(['Payment method', esc(order.paymentMethodName || order.paymentMethod)]);

  if (proof) pairs.push(['Transaction ID', `<span style="font-family:monospace;">${esc(proof.transactionId)}</span>`]);
  const body = `${heading(title)}
${p(d.stage === 'placed' ? 'A customer placed an order and is about to pay.' : 'A customer uploaded a payment proof. Please verify it and approve or reject the order.')}
${panel(`<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows(pairs)}</table>`)}
<div style="height:14px;"></div>
${orderSummary(order)}
<div style="height:18px;"></div>
${button(url, 'Open in admin')}`;
  return {
    subject,
    html: layout({ title: subject, preheader: `${order.customerName} - ${formatMoney(order.total, order.currency)}`, body }),
    text: `${title}: ${order.orderNumber}\n${order.customerName} <${order.customerEmail}>\nTotal: ${formatMoney(order.total, order.currency)}\n${url}`,
  };
}
