'use client';

import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';

export default function CartIcon() {
  const { items } = useCart();
  const itemCount = items.length;

  return (
    <Link href="/carrinho" className="relative flex items-center justify-center">
      <svg
        className="w-6 h-6 text-[#333] hover:text-[#ff2f92] transition"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#ff2f92] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
