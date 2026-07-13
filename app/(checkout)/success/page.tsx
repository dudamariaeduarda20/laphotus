"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/contexts/CartContext";
import { useTranslation } from "@/lib/hooks/useTranslation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { t, locale } = useTranslation();
  const sessionId = searchParams.get("session");
  const orderId = searchParams.get("order");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const confirmPayment = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        // Simulate webhook call
        const res = await fetch("/api/webhooks/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "charge.succeeded",
            data: {
              orderId,
              stripePaymentId: sessionId,
            },
          }),
        });

        if (res.ok) {
          setConfirmed(true);
          clearCart(); // limpa estado + localStorage (carrinho e cupom)
        }
      } catch (err) {
        console.error("Falha ao confirmar pagamento:", err);
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [orderId, sessionId, clearCart]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#09419b]"></div>
          <p className="mt-4 text-gray-600">{t("success.processing")}</p>
        </div>
      </div>
    );
  }

  if (!confirmed) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("success.fail.title")}
        </h1>
        <p className="text-gray-600 mb-6">
          {t("success.fail.desc")}
        </p>
        <Link
          href="/cart"
          className="inline-block px-6 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b]"
        >
          {t("checkout.backCart")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Success Message */}
      <div className="bg-[#fef7e8] border border-green-200 rounded-lg p-8 text-center mb-8">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold text-green-900 mb-2">
          {t("success.title")}
        </h1>
        <p className="text-green-800">
          {t("success.desc")}
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("success.order.title")}
        </h2>

        <div className="space-y-4 pb-6 border-b border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-600">{t("success.order.number")}</span>
            <span className="font-semibold text-gray-900">#{orderId?.substring(0, 8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t("success.order.date")}</span>
            <span className="font-semibold text-gray-900">
              {new Date().toLocaleDateString(
                { pt: "pt-PT", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE" }[locale] || "pt-PT"
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t("success.order.status")}</span>
            <span className="inline-block px-3 py-1 bg-[#fef7e8] text-green-800 text-sm font-semibold rounded-full">
              {t("success.order.paid")}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          {t("success.order.email")}
        </p>
      </div>

      {/* Next Steps */}
      <div className="bg-[#e8f0ff] border border-blue-200 rounded-lg p-8 mb-8">
        <h3 className="font-bold text-blue-900 mb-4">{t("success.steps.title")}</h3>
        <ul className="space-y-3 text-blue-900">
          <li className="flex items-start gap-3">
            <span className="text-lg">1️⃣</span>
            <span>{t("success.steps.1")}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">2️⃣</span>
            <span>{t("success.steps.2")}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">3️⃣</span>
            <span>{t("success.steps.3")}</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/download/${orderId}`}
          className="inline-block px-6 py-3 bg-[#f0bf38] text-white font-semibold rounded-lg hover:bg-[#f0bf38] text-center"
        >
          ⬇ {t("success.downloads")}
        </Link>
        <Link
          href="/photos"
          className="inline-block px-6 py-3 bg-[#09419b] text-white font-semibold rounded-lg hover:bg-[#09419b] text-center"
        >
          🔍 {t("success.more")}
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  const { t } = useTranslation();
  return <div className="py-20 text-center text-gray-400">{t("common.loading")}</div>;
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
