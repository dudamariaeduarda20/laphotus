"use client";

import { useCart } from "@/lib/contexts/CartContext";
import CartItem from "@/components/CartItem";
import Link from "next/link";
import { useState } from "react";

export default function CheckoutPage() {
  const { items, getTotal, coupon, getDiscount } = useCart();
  const [processingPayment, setProcessingPayment] = useState(false);

  const subtotal = getTotal();
  const discountAmount = getDiscount(); // montante (€) vindo do carrinho
  const tax = (subtotal - discountAmount) * 0.23;
  const total = subtotal - discountAmount + tax;

  const handlePayment = async () => {
    setProcessingPayment(true);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ photoId: i.photoId, price: i.price })),
          subtotal,
          discount: discountAmount, // createOrder espera o montante, não a %
          couponCode: coupon?.code || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao processar pagamento");
      }

      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro no pagamento");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Seu carrinho está vazio
        </h2>
        <p className="text-gray-600 mb-6">
          Adicione fotos antes de finalizar a compra
        </p>
        <Link
          href="/photos"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Procurar Eventos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photos Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Artigos da Encomenda ({items.length})
            </h2>

            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.photoId} className="py-4">
                  <CartItem item={item} />
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Section (gerido no carrinho) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Código Promocional
            </h2>

            {coupon ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <p className="text-green-800 font-semibold">
                  ✓ {coupon.code} aplicado
                  {coupon.discountType === "percentage"
                    ? ` (${coupon.discountValue}%)`
                    : ` (€ ${coupon.discountValue.toFixed(2)})`}
                </p>
                <Link
                  href="/cart"
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Alterar
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Tem um cupom?{" "}
                <Link href="/cart" className="text-blue-600 underline">
                  Aplique no carrinho
                </Link>{" "}
                antes de finalizar.
              </p>
            )}
          </div>

          {/* Payment Method (Placeholder for Phase 4) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Método de Pagamento
            </h2>

            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-blue-500 rounded-lg cursor-pointer bg-blue-50">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  defaultChecked
                  className="w-4 h-4"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Cartão de Crédito</p>
                  <p className="text-sm text-gray-600">
                    Visa, Mastercard, American Express
                  </p>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer opacity-50">
                <input
                  type="radio"
                  name="payment"
                  value="pix"
                  disabled
                  className="w-4 h-4"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Transferência Bancária</p>
                  <p className="text-sm text-gray-600">Em breve</p>
                </div>
              </label>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p className="font-semibold mb-1">🧪 Modo demonstração</p>
              <p>Sem cobrança real — o pedido é confirmado para testar o fluxo e o download. Stripe liga-se quando houver chaves.</p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Total da Encomenda
            </h2>

            <div className="space-y-3 pb-6 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">
                  € {subtotal.toFixed(2)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Desconto{coupon ? ` (${coupon.code})` : ""}:
                  </span>
                  <span className="font-semibold">
                    −€ {discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">IVA (23%):</span>
                <span className="font-semibold">€ {tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold mb-6 pt-4">
              <span>Total:</span>
              <span className="text-green-600">€ {total.toFixed(2)}</span>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={processingPayment}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 mb-3"
            >
              {processingPayment ? "A processar..." : "💳 Finalizar Compra"}
            </button>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
              <p className="font-semibold mb-1">🧪 Checkout em modo demo</p>
              <p>Confirma o pedido sem cobrança real</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/cart"
                className="block text-center text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                ← Voltar ao Carrinho
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
