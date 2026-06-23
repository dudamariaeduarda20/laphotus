"use client";

import { useCart } from "@/lib/contexts/CartContext";
import CartItem from "@/components/CartItem";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [processingDiscount, setProcessingDiscount] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const subtotal = getTotal();
  const discountAmount = (subtotal * discount) / 100;
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
          subtotal: getTotal(),
          discount,
          couponCode: couponCode || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao processar pagamento");
      }

      const { orderId, checkoutUrl } = await res.json();

      // Simulate Stripe redirect
      // In production: redirect to Stripe
      window.location.href = checkoutUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro no pagamento");
    } finally {
      setProcessingPayment(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setDiscountError("Enter coupon code");
      return;
    }

    setProcessingDiscount(true);
    setDiscountError(null);

    try {
      // Mock coupon validation (Phase 4 will use real API)
      if (couponCode === "WELCOME20") {
        setDiscount(20);
        setCouponCode("");
      } else if (couponCode === "SAVE10") {
        setDiscount(10);
        setCouponCode("");
      } else {
        setDiscountError("Invalid coupon code");
      }
    } finally {
      setProcessingDiscount(false);
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

          {/* Coupon Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Código Promocional
            </h2>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Introduza código promocional"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={applyCoupon}
                disabled={processingDiscount}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processingDiscount ? "..." : "Aplicar"}
              </button>
            </div>

            {discountError && (
              <p className="text-red-600 text-sm">{discountError}</p>
            )}

            {discount > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">
                  ✓ Desconto de {discount}% aplicado!
                </p>
              </div>
            )}

            <p className="text-xs text-gray-600 mt-3">
              Tente: WELCOME20 ou SAVE10
            </p>
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
              <p className="font-semibold mb-1">💳 Integração Stripe</p>
              <p>Processamento de pagamento será ativado na Fase 4</p>
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

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto ({discount}%):</span>
                  <span className="font-semibold">
                    -€ {discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">IVA (23%):</span>
                <span className="font-semibold">€ {(subtotal * 0.23).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold mb-6 pt-4">
              <span>Total:</span>
              <span className="text-green-600">€ {(subtotal + (subtotal * 0.23) - discountAmount).toFixed(2)}</span>
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
              <p className="font-semibold mb-1">✓ Integração Stripe</p>
              <p>Pagamento seguro com Stripe Checkout</p>
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
