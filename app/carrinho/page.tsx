import { headers } from 'next/headers';
import CartPageClient from './CartPageClient';

export default async function CartPage() {
  await headers(); // request-time API read forces per-request rendering, not static prerender
  return <CartPageClient />;
}
