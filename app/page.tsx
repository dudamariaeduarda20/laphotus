import Link from "next/link";
import SearchEventBar from "@/components/SearchEventBar";
import RecentEvents from "@/components/RecentEvents";
import { EVENT_CATEGORIES } from "@/lib/categories";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero de busca */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Encontre as suas fotos do evento
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Procure por nome do evento ou pelo seu rosto e leve as suas
            melhores fotos desportivas.
          </p>
          <SearchEventBar />
        </div>
      </section>

      {/* Faixa de categorias */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Explore por categoria
        </h2>
        <div className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/photos?sport=${encodeURIComponent(c.value)}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition flex items-center gap-2"
            >
              <span>{c.icon}</span>
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Eventos recentes (fetch real) */}
      <RecentEvents />

      {/* Bloco institucional / prova social */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600">+5 mil</div>
            <div className="text-gray-600 mt-1">fotógrafos parceiros</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600">+12 mil</div>
            <div className="text-gray-600 mt-1">eventos cobertos</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600">+8 milhões</div>
            <div className="text-gray-600 mt-1">fotos entregues</div>
          </div>
        </div>
      </section>

      {/* Bloco "venda suas fotos" */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Venda as suas fotos na LAPHOTUS
          </h2>
          <p className="text-gray-600">
            Tudo o que precisa para transformar a sua fotografia num negócio.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { icon: "🚫", title: "Sem mensalidade", desc: "Pague só quando vende." },
            { icon: "🎯", title: "Controle total", desc: "Os seus preços, as suas regras." },
            { icon: "🌐", title: "Site de vendas próprio", desc: "Galeria pronta por evento." },
            { icon: "⚡", title: "Agilidade", desc: "Upload em lote e indexação automática." },
          ].map((v) => (
            <div
              key={v.title}
              className="bg-white rounded-xl border border-gray-200 p-6 text-center"
            >
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
              <p className="text-sm text-gray-600">{v.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/auth/register"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition"
          >
            Começar agora
          </Link>
        </div>
      </section>
    </div>
  );
}
