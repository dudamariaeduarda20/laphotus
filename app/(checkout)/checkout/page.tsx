"use client";

import { useCart } from "@/lib/contexts/CartContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import CartItem from "@/components/CartItem";
import Link from "next/link";
import { useState } from "react";

export default function CheckoutPage() {
  const { items, getTotal, coupon, getDiscount } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useTranslation();
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
        throw new Error(error.error || t("checkout.err.process"));
      }

      const { checkoutUrl } = await res.json();
      window.location.assign(checkoutUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : t("checkout.err.payment"));
    } finally {
      setProcessingPayment(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t("cart.empty")}
        </h2>
        <p className="text-gray-600 mb-6">
          {t("checkout.empty.desc")}
        </p>
        <Link
          href="/photos"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t("checkout.empty.browse")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("cart.checkout")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photos Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {t("checkout.items")} ({items.length})
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
              {t("checkout.coupon.title")}
            </h2>

            {coupon ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <p className="text-green-800 font-semibold">
                  ✓ {coupon.code} {t("checkout.coupon.applied")}
                  {coupon.discountType === "percentage"
                    ? ` (${coupon.discountValue}%)`
                    : ` (€ ${coupon.discountValue.toFixed(2)})`}
                </p>
                <Link
                  href="/cart"
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  {t("checkout.coupon.change")}
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {t("checkout.coupon.have")}{" "}
                <Link href="/cart" className="text-blue-600 underline">
                  {t("checkout.coupon.applyCart")}
                </Link>{" "}
                {t("checkout.coupon.before")}
              </p>
            )}
          </div>

          {/* Payment Method (Placeholder for Phase 4) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {t("checkout.payment.title")}
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
                  <p className="font-semibold text-gray-900">{t("checkout.payment.card")}</p>
                  <p className="text-sm text-gray-600">
                    {t("checkout.payment.cardDesc")}
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
                  <p className="font-semibold text-gray-900">{t("checkout.payment.bank")}</p>
                  <p className="text-sm text-gray-600">{t("checkout.payment.soon")}</p>
                </div>
              </label>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p className="font-semibold mb-1">{t("checkout.demo.title")}</p>
              <p>{t("checkout.demo.desc")}</p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              {t("checkout.total.title")}
            </h2>

            <div className="space-y-3 pb-6 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("cart.subtotal")}</span>
                <span className="font-semibold">
                  € {subtotal.toFixed(2)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    {t("checkout.discount")}{coupon ? ` (${coupon.code})` : ""}:
                  </span>
                  <span className="font-semibold">
                    −€ {discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">{t("cart.vat")}</span>
                <span className="font-semibold">€ {tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold mb-6 pt-4">
              <span>{t("cart.total")}</span>
              <span className="text-green-600">€ {total.toFixed(2)}</span>
            </div>

            {/* Payment Button (exige login) */}
            {!authLoading && !isAuthenticated ? (
              <Link
                href="/auth/login"
                className="w-full block text-center py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 mb-3"
              >
                {t("checkout.loginToFinish")}
              </Link>
            ) : (
              <button
                onClick={handlePayment}
                disabled={processingPayment || authLoading}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 mb-3"
              >
                {processingPayment ? t("checkout.processing") : `💳 ${t("cart.checkout")}`}
              </button>
            )}

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
              <p className="font-semibold mb-1">{t("checkout.demo2.title")}</p>
              <p>{t("checkout.demo2.desc")}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/cart"
                className="block text-center text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                ← {t("checkout.backCart")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
