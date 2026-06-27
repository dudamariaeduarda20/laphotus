"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/contexts/CartContext";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">A processar seu pagamento...</p>
        </div>
      </div>
    );
  }

  if (!confirmed) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Falha na Confirmação
        </h1>
        <p className="text-gray-600 mb-6">
          Houve um problema ao processar seu pagamento.
        </p>
        <Link
          href="/cart"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar ao Carrinho
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center mb-8">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold text-green-900 mb-2">
          Pagamento Confirmado!
        </h1>
        <p className="text-green-800">
          Sua encomenda foi paga com sucesso. Você pode agora descarregar suas fotos.
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Detalhes da Encomenda
        </h2>

        <div className="space-y-4 pb-6 border-b border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-600">Número da Encomenda:</span>
            <span className="font-semibold text-gray-900">#{orderId?.substring(0, 8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data:</span>
            <span className="font-semibold text-gray-900">
              {new Date().toLocaleDateString("pt-PT")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estado:</span>
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
              Paga
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Um email de confirmação foi enviado para seu endereço de e-mail registado.
        </p>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
        <h3 className="font-bold text-blue-900 mb-4">Próximos Passos</h3>
        <ul className="space-y-3 text-blue-900">
          <li className="flex items-start gap-3">
            <span className="text-lg">1️⃣</span>
            <span>Acesse sua página de transferências para descarregar as fotos</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">2️⃣</span>
            <span>As fotos estão sem marca d&apos;água e em alta resolução</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">3️⃣</span>
            <span>Você tem acesso permanente às suas compras</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/downloads"
          className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-center"
        >
          ⬇ Minhas Transferências
        </Link>
        <Link
          href="/photos"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-center"
        >
          🔍 Procurar Mais Fotos
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">A carregar…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
