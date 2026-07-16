'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Error boundary for /carrinho.
 *
 * Sem isto, qualquer throw no render do carrinho (ex: item corrompido no
 * localStorage de uma versão antiga) sobe até a raiz e o Next mostra a
 * página cheia "This page couldn't load", sem saída. Aqui damos:
 *  - reset() pra tentar re-renderizar
 *  - botão que limpa o carrinho corrompido e recarrega (escape hatch real)
 */
export default function CartError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[carrinho] render error:', error);
  }, [error]);

  const clearAndReload = () => {
    try {
      localStorage.removeItem('sports-photos-cart');
      localStorage.removeItem('sports-photos-coupon');
    } catch {
      // ignore
    }
    window.location.href = '/carrinho';
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="font-serif text-2xl text-[#09419b] mb-3">
          Não foi possível abrir o carrinho
        </h1>
        <p className="text-[#666] mb-8">
          Ocorreu um problema ao carregar os seus itens. Tente novamente ou
          esvazie o carrinho.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#09419b] text-white rounded-lg font-semibold hover:bg-[#0a2e6b] transition"
          >
            Tentar novamente
          </button>
          <button
            onClick={clearAndReload}
            className="px-6 py-3 border-2 border-[#09419b] text-[#09419b] rounded-lg font-semibold hover:bg-[#09419b]/5 transition"
          >
            Esvaziar carrinho
          </button>
        </div>
        <Link
          href="/photos"
          className="block mt-6 text-[#09419b] font-semibold hover:text-[#ff2f92] transition"
        >
          ← Continuar a explorar fotos
        </Link>
      </div>
    </div>
  );
}
