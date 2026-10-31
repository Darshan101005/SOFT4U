import { redirect } from 'next/navigation';

/** Old URL: payment accounts now live in Settings → Payment methods. */
export default function AdminPaymentGatewaysPage() {
  redirect('/admin/payment-methods');
}
