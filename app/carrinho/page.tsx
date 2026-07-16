'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/contexts/CartContext';
import { useTranslation } from '@/lib/hooks/useTranslation';

export const dynamic = 'force-dynamic';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { items, getTotal, getItemCount, clearCart, removeItem } = useCart();
  const { t } = useTranslation();

  const total = getTotal();
  const itemCount = getItemCount();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="font-serif font-bold text-4xl text-[#09419b] mb-4">🛒</p>
          <h1 className="font-serif text-2xl text-[#09419b] mb-4">Acesso Necessário</h1>
          <p className="text-[#666] mb-8">Faça login para ver o seu carrinho</p>
          <Link href="/auth/login" className="inline-block px-8 py-3 bg-[#09419b] text-white rounded-lg font-semibold hover:bg-[#0a2e6b] transition">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif font-bold text-5xl text-[#09419b] mb-4">Meu Carrinho</h1>
          <p className="text-lg text-[#666]">{itemCount} item{itemCount !== 1 ? 'ns' : ''}</p>
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-lg">
            <p className="text-6xl mb-4">🛒</p>
            <h2 className="font-serif text-2xl text-[#09419b] mb-4">Carrinho Vazio</h2>
            <p className="text-[#666] mb-8">Nenhuma foto adicionada ainda</p>
            <Link href="/photos" className="inline-block px-8 py-3 bg-[#ff2f92] text-white rounded-lg font-semibold hover:opacity-90 transition">
              Explorar Fotos
            </Link>
          </div>
        )}

        {/* Cart Items */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.photoId} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#09419b] mb-1">{item.name}</h3>
                      <p className="text-sm text-[#666]">
                        {item.eventTitle} • {item.photographerName}
                      </p>
                      <p className="text-sm text-[#f0bf38] font-semibold mt-2">
                        €{item.price.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.photoId)}
                      className="text-red-600 hover:text-red-700 font-semibold text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6 h-fit space-y-6">
              <div>
                <h2 className="font-serif font-bold text-2xl text-[#09419b] mb-4">Resumo</h2>

                {/* Total */}
                <div className="border-t border-[#f0bf38] pt-4 space-y-3">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold text-[#09419b]">Total</span>
                    <span className="font-bold text-[#f0bf38] text-2xl">
                      €{total.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full px-6 py-4 bg-[#ff2f92] text-white font-semibold rounded-lg hover:opacity-90 transition"
                >
                  Prosseguir para Checkout
                </button>
                <button
                  onClick={clearCart}
                  className="w-full px-6 py-3 border-2 border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition"
                >
                  Limpar Carrinho
                </button>
              </div>

              {/* Continue Shopping */}
              <Link
                href="/photos"
                className="block text-center px-6 py-3 text-[#09419b] font-semibold hover:text-[#ff2f92] transition"
              >
                ← Continuar Comprando
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
