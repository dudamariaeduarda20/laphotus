"use client";

export default function RecomprarButton() {
  return (
    <button
      onClick={() => alert("Adicionar ao carrinho - em desenvolvimento")}
      className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
    >
      🛍️ Recomprar
    </button>
  );
}
