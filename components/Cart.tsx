"use client";

import { useCart } from "@/lib/contexts/CartContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import Link from "next/link";
import CartItem from "./CartItem";
import { useState } from "react";

export default function Cart() {
  const { items, getTotal, getItemCount, clearCart } = useCart();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = getItemCount();
  const total = getTotal();

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <span className="text-2xl">🛒</span>
        {itemCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-screen w-full sm:w-96 bg-white shadow-lg z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">{t("cart.title")}</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto">
            {itemCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 p-4 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <p>{t("cart.empty")}</p>
                <p className="text-sm mt-2">
                  {t("cart.empty.hint")}
                </p>
              </div>
            ) : (
              <div className="p-4">
                {items.map((item) => (
                  <CartItem key={item.photoId} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {itemCount > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("cart.subtotal")}</span>
                  <span className="font-semibold">€ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-600">{t("cart.vat")}</span>
                  <span className="font-semibold">
                    € {(total * 0.23).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>{t("cart.total")}</span>
                  <span className="text-[#f0bf38]">
                    € {(total * 1.23).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <Link
                href="/checkout"
                className="w-full block text-center py-3 bg-[#09419b] text-white font-semibold rounded-lg hover:bg-[#09419b]"
              >
                {t("cart.checkout")}
              </Link>

              <button
                onClick={clearCart}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t("cart.clear")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
