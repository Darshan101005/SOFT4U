/** Session storage key for the order summary shown on /order-success. */
export const LAST_ORDER_KEY = 'soft4u_last_order';

export interface LastOrderSummary {
  orderNumber: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  paymentMethod: string;
  items: { name: string; variant: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
}
