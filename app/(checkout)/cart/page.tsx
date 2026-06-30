"use client";

import { useState } from "react";
import { useCart } from "@/lib/contexts/CartContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import CartItem from "@/components/CartItem";
import Link from "next/link";

export default function CartPage() {
  const { t } = useTranslation();
  const {
    items,
    getTotal,
    getItemCount,
    clearCart,
    coupon,
    applyCoupon,
    clearCoupon,
    getDiscount,
  } = useCart();

  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const itemCount = getItemCount();
  const subtotal = getTotal();
  const discount = getDiscount();
  const tax = (subtotal - discount) * 0.23; // 23% IVA (Portugal)
  const total = subtotal - discount + tax;

  const handleApplyCoupon = async () => {
    if (!code.trim()) {
      setCouponError(t("cartpage.err.empty"));
      return;
    }
    setApplying(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCouponError(data.error || t("cartpage.err.invalid"));
        return;
      }
      applyCoupon(data.coupon);
      setCode("");
    } catch {
      setCouponError(t("cartpage.err.validate"));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("cart.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {itemCount === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("cart.empty")}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t("cartpage.emptyDesc")}
                </p>
                <Link
                  href="/photos"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t("dashboard.searchEvents")}
                </Link>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">
                    {itemCount} {itemCount !== 1 ? t("cartpage.items") : t("cartpage.item")} {t("cartpage.inCart")}
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
                {t("cartpage.summary")}
              </h2>

              {/* Cupom */}
              <div className="pb-6 border-b border-gray-200">
                {coupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="text-sm">
                      <span className="font-semibold text-green-800">
                        {coupon.code}
                      </span>
                      <span className="text-green-700">
                        {" "}
                        ·{" "}
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}% off`
                          : `€ ${coupon.discountValue.toFixed(2)} off`}
                      </span>
                    </div>
                    <button
                      onClick={clearCoupon}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                    >
                      {t("cartpage.remove")}
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("cartpage.couponLabel")}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder={t("cartpage.couponPlaceholder")}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applying}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        {applying ? "..." : t("cartpage.apply")}
                      </button>
                    </div>
                    {couponError && (
                      <p className="mt-2 text-sm text-red-600">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 py-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("cart.subtotal")}</span>
                  <span className="font-semibold">
                    € {subtotal.toFixed(2)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">{t("checkout.discount")}:</span>
                    <span className="font-semibold text-green-700">
                      − € {discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("cart.vat")}</span>
                  <span className="font-semibold">
                    € {tax.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold mb-6 pt-4">
                <span>{t("cart.total")}</span>
                <span className="text-green-600">€ {total.toFixed(2)}</span>
              </div>

              <Link
                href="/checkout"
                className="w-full block text-center py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 mb-3"
              >
                {t("cart.checkout")}
              </Link>

              <button
                onClick={clearCart}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t("cart.clear")}
              </button>

              <Link
                href="/photos"
                className="block text-center text-blue-600 hover:text-blue-700 text-sm font-semibold mt-4"
              >
                {t("cartpage.continue")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
