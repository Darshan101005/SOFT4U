import type { DeliveryField, OrderItem } from '@/lib/db/types';

/**
 * Delivered access of one order item as label/value rows. Covers the main
 * key/value format plus the older credentials / licence key shapes.
 */
export function deliveredFieldsOf(item: Pick<OrderItem, 'fulfillmentData'>): DeliveryField[] {
  const f = item.fulfillmentData;
  if (!f) return [];
  const out: DeliveryField[] = [...(f.fields || [])].filter(x => x && x.label && x.value);
  for (const c of f.credentials || []) {
    if (c.email) out.push({ label: 'Email', value: c.email });
    if (c.password) out.push({ label: 'Password', value: c.password });
    if (c.pin) out.push({ label: 'PIN', value: c.pin });
    if (c.profile) out.push({ label: 'Profile', value: c.profile });
  }
  for (const k of f.licenseKeys || []) if (k) out.push({ label: 'Licence key', value: k });
  return out;
}
