"use client";

import { useCart } from "@/lib/contexts/CartContext";
import CartItem from "@/components/CartItem";
import Link from "next/link";

export default function CartPage() {
  const { items, getTotal, getItemCount, clearCart } = useCart();

  const itemCount = getItemCount();
  const subtotal = getTotal();
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrinho de Compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {itemCount === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Seu carrinho está vazio
                </h2>
                <p className="text-gray-600 mb-6">
                  Comece a comprar para adicionar fotos ao seu carrinho
                </p>
                <Link
                  href="/photos"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Procurar Eventos
                </Link>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">
                    {itemCount} item{itemCount !== 1 ? "ns" : ""} no seu carrinho
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <div key={item.photoId} className="p-6">
                      <CartItem item={item} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        {itemCount > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Resumo da Encomenda
              </h2>

              <div className="space-y-4 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">
                    € {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA (23%):</span>
                  <span className="font-semibold">
                    € {tax.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold mb-6 pt-4">
                <span>Total:</span>
                <span className="text-green-600">€ {total.toFixed(2)}</span>
              </div>

              <Link
                href="/checkout"
                className="w-full block text-center py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 mb-3"
              >
                Finalizar Compra
              </Link>

              <button
                onClick={clearCart}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Limpar Carrinho
              </button>

              <Link
                href="/photos"
                className="block text-center text-blue-600 hover:text-blue-700 text-sm font-semibold mt-4"
              >
                Continuar Compras
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
