"use client";

import { useCart } from "@/lib/contexts/CartContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import CartItem from "@/components/CartItem";
import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentMethod = "stripe" | "pix" | "mbway";

interface PixResult {
  paymentMethod: "pix";
  qrCodeUrl: string;
  copyAndPaste: string;
  expiresAt: string;
}

interface MbwayResult {
  paymentMethod: "mbway";
  entityCode: string;
  reference: string;
  expiresAt: string;
}

function useCountdown(expiresAt: string | undefined) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => setRemaining(Math.max(0, Math.round((target - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function CheckoutPage() {
  const { items, getTotal, coupon, getDiscount } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [country, setCountry] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PixResult | MbwayResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/checkout/geolocation")
      .then((res) => res.json())
      .then((data) => setCountry(data.country))
      .catch(() => setCountry(null));
  }, []);

  const pixAvailable = country === "BR";
  const mbwayAvailable = country === "PT";
  const countdown = useCountdown(paymentResult?.expiresAt);

  const subtotal = getTotal();
  const discountAmount = getDiscount(); // montante (€) vindo do carrinho
  const tax = (subtotal - discountAmount) * 0.23;
  const total = subtotal - discountAmount + tax;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

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
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t("checkout.err.process"));
      }

      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      // PIX/MB Way não redirecionam — mostram QR/referência in-page.
      setPaymentResult(data);
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
          className="inline-block px-6 py-2 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b]"
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
              <div className="p-4 bg-[#fef7e8] border border-green-200 rounded-lg flex items-center justify-between">
                <p className="text-green-800 font-semibold">
                  ✓ {coupon.code} {t("checkout.coupon.applied")}
                  {coupon.discountType === "percentage"
                    ? ` (${coupon.discountValue}%)`
                    : ` (€ ${coupon.discountValue.toFixed(2)})`}
                </p>
                <Link
                  href="/cart"
                  className="text-sm text-[#09419b] hover:text-[#09419b] underline"
                >
                  {t("checkout.coupon.change")}
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {t("checkout.coupon.have")}{" "}
                <Link href="/cart" className="text-[#09419b] underline">
                  {t("checkout.coupon.applyCart")}
                </Link>{" "}
                {t("checkout.coupon.before")}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {t("checkout.payment.title")}
            </h2>

            <div className="space-y-3">
              <label
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                  paymentMethod === "stripe" ? "border-[#09419b] bg-[#e8f0ff]" : "border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="stripe"
                  checked={paymentMethod === "stripe"}
                  onChange={() => setPaymentMethod("stripe")}
                  className="w-4 h-4"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">{t("checkout.payment.card")}</p>
                  <p className="text-sm text-gray-600">
                    {t("checkout.payment.cardDesc")}
                  </p>
                </div>
              </label>

              {pixAvailable && (
                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                    paymentMethod === "pix" ? "border-[#09419b] bg-[#e8f0ff]" : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="pix"
                    checked={paymentMethod === "pix"}
                    onChange={() => setPaymentMethod("pix")}
                    className="w-4 h-4"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">PIX</p>
                    <p className="text-sm text-gray-600">
                      {t("checkout.payment.pixDesc", "QR code ou copia e cola, confirmação instantânea")}
                    </p>
                  </div>
                </label>
              )}

              {mbwayAvailable && (
                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                    paymentMethod === "mbway" ? "border-[#09419b] bg-[#e8f0ff]" : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="mbway"
                    checked={paymentMethod === "mbway"}
                    onChange={() => setPaymentMethod("mbway")}
                    className="w-4 h-4"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">MB WAY</p>
                    <p className="text-sm text-gray-600">
                      {t("checkout.payment.mbwayDesc", "Confirme o pagamento na app MB WAY")}
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* PIX / MB Way — instruções pós-criação (QR/copia-e-cola ou entidade/referência) */}
          {paymentResult?.paymentMethod === "pix" && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {t("checkout.pix.title", "Pague com PIX")}
              </h2>
              <img
                src={paymentResult.qrCodeUrl}
                alt="QR Code PIX"
                className="w-48 h-48 mx-auto mb-4 border border-gray-200 rounded-lg"
              />
              <p className="text-sm text-gray-600 mb-2">
                {t("checkout.pix.expiresIn", "Expira em")} <span className="font-semibold">{countdown}</span>
              </p>
              <div className="flex items-center gap-2 mt-4">
                <input
                  readOnly
                  value={paymentResult.copyAndPaste}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 truncate"
                />
                <button
                  onClick={() => handleCopy(paymentResult.copyAndPaste)}
                  className="px-4 py-2 bg-[#09419b] text-white rounded-lg text-sm font-semibold whitespace-nowrap"
                >
                  {copied ? t("checkout.pix.copied", "Copiado!") : t("checkout.pix.copy", "Copiar")}
                </button>
              </div>
            </div>
          )}

          {paymentResult?.paymentMethod === "mbway" && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {t("checkout.mbway.title", "Pague com MB WAY")}
              </h2>
              <div className="flex justify-center gap-8 mb-4">
                <div>
                  <p className="text-sm text-gray-600">{t("checkout.mbway.entity", "Entidade")}</p>
                  <p className="text-2xl font-bold text-gray-900">{paymentResult.entityCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("checkout.mbway.reference", "Referência")}</p>
                  <p className="text-2xl font-bold text-gray-900">{paymentResult.reference}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {t("checkout.pix.expiresIn", "Expira em")} <span className="font-semibold">{countdown}</span>
              </p>
            </div>
          )}
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
                <div className="flex justify-between text-[#f0bf38]">
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
              <span className="text-[#f0bf38]">€ {total.toFixed(2)}</span>
            </div>

            {/* Payment Button (exige login) */}
            {!authLoading && !isAuthenticated ? (
              <Link
                href="/auth/login"
                className="w-full block text-center py-3 bg-[#09419b] text-white font-semibold rounded-lg hover:bg-[#09419b] mb-3"
              >
                {t("checkout.loginToFinish")}
              </Link>
            ) : paymentResult ? (
              <p className="text-center text-sm text-gray-600 mb-3">
                {t("checkout.awaitingPayment", "Aguardando confirmação do pagamento…")}
              </p>
            ) : (
              <button
                onClick={handlePayment}
                disabled={processingPayment || authLoading}
                className="w-full py-3 bg-[#f0bf38] text-white font-semibold rounded-lg hover:bg-[#f0bf38] disabled:opacity-50 mb-3"
              >
                {processingPayment
                  ? t("checkout.processing")
                  : paymentMethod === "stripe"
                    ? `💳 ${t("cart.checkout")}`
                    : t("checkout.generatePayment", "Gerar pagamento")}
              </button>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/cart"
                className="block text-center text-[#09419b] hover:text-[#09419b] text-sm font-semibold"
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
