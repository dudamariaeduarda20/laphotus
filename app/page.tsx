export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">Fotos Desporto SaaS</h1>
          <p className="text-slate-400 mt-1">Marketplace de Fotografia Profissional de Desporto</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Venda Fotos de Desporto com Inteligência
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Plataforma de e-commerce completa para fotógrafos de eventos. Carregue, procure e venda fotos com reconhecimento facial e indexação de atletas. MVP Fase 1 pronto.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="#tech"
              className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Stack Técnico
            </a>
            <a
              href="#features"
              className="px-6 py-3 border border-slate-400 rounded-lg hover:bg-slate-700 transition"
            >
              Funcionalidades
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mb-16">
          <h3 className="text-2xl font-bold mb-8">Funcionalidades MVP Fase 1</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "User Roles",
                desc: "Client, Photographer, Organizer, Admin",
              },
              {
                title: "Event Management",
                desc: "Create, edit, organize sports events",
              },
              {
                title: "Photo Upload",
                desc: "Individual & batch upload with S3 ready",
              },
              {
                title: "Gallery & Search",
                desc: "Instant search, filters, favorites",
              },
              {
                title: "E-commerce",
                desc: "Cart, checkout, Stripe payments",
              },
              {
                title: "Dashboard",
                desc: "Photographer stats, analytics, revenue",
              },
            ].map((feature, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                <p className="text-slate-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section id="tech" className="mb-16 bg-slate-700 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-8">Tech Stack</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Frontend</h4>
              <ul className="space-y-2 text-slate-300">
                <li>✓ Next.js 15 (App Router)</li>
                <li>✓ TypeScript</li>
                <li>✓ Tailwind CSS</li>
                <li>✓ Shadcn UI</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Backend</h4>
              <ul className="space-y-2 text-slate-300">
                <li>✓ Next.js API Routes</li>
                <li>✓ PostgreSQL</li>
                <li>✓ Prisma ORM</li>
                <li>✓ Redis Cache</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Infrastructure</h4>
              <ul className="space-y-2 text-slate-300">
                <li>✓ Supabase Auth</li>
                <li>✓ AWS S3</li>
                <li>✓ Stripe Payments</li>
                <li>✓ Cloudflare CDN</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">AI (Phase 2+)</h4>
              <ul className="space-y-2 text-slate-300">
                <li>✓ AWS Rekognition</li>
                <li>✓ Face Recognition</li>
                <li>✓ OCR Athlete Numbers</li>
                <li>✓ Vector Embeddings</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Database */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold mb-8">14 Enterprise Tables</h3>
          <div className="bg-slate-700 rounded-lg p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              "User",
              "Photographer",
              "Organizer",
              "Event",
              "Photo",
              "FaceIndex",
              "BibNumber",
              "Order",
              "OrderItem",
              "Favorite",
              "Coupon",
              "Transaction",
              "Notification",
              "AuditLog",
            ].map((table) => (
              <div
                key={table}
                className="bg-slate-600 rounded px-3 py-2 text-center"
              >
                {table}
              </div>
            ))}
          </div>
        </section>

        {/* Login Roles */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Entrar na Plataforma</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <a
              href="/auth/login?type=cliente"
              className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-8 text-center hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">👤</div>
              <h4 className="text-xl font-bold text-white mb-2">Cliente</h4>
              <p className="text-blue-100 text-sm">Comprar fotos de desporto</p>
            </a>

            <a
              href="/auth/login?type=fotografo"
              className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-8 text-center hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">📸</div>
              <h4 className="text-xl font-bold text-white mb-2">Fotógrafo</h4>
              <p className="text-purple-100 text-sm">Carregar e vender fotos</p>
            </a>

            <a
              href="/auth/login?type=organizador"
              className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-8 text-center hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-xl font-bold text-white mb-2">Organizador</h4>
              <p className="text-green-100 text-sm">Gerir eventos desportivos</p>
            </a>

            <a
              href="/auth/login?type=admin"
              className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-8 text-center hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">🔑</div>
              <h4 className="text-xl font-bold text-white mb-2">Administrador</h4>
              <p className="text-red-100 text-sm">Gerir plataforma</p>
            </a>
          </div>
        </section>

        {/* Next Steps */}
        <section className="bg-blue-900 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Credenciais de Teste</h3>
          <p className="text-slate-200 mb-6 max-w-2xl mx-auto">
            Todos têm palavra-passe <code className="bg-slate-800 px-2 py-1 rounded">Test1234!</code>
          </p>
          <div className="space-y-3 text-left max-w-lg mx-auto text-sm text-slate-300">
            <p>👤 Cliente: <code className="bg-slate-800 px-2 py-1 rounded">cliente@sportsphotos.pt</code></p>
            <p>📸 Fotógrafo: <code className="bg-slate-800 px-2 py-1 rounded">fotografo1@sportsphotos.pt</code></p>
            <p>🎯 Organizador: <code className="bg-slate-800 px-2 py-1 rounded">organizador@sportsphotos.pt</code></p>
            <p>🔑 Admin: <code className="bg-slate-800 px-2 py-1 rounded">admin@sportsphotos.pt</code></p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 px-4 mt-16 text-center text-slate-400">
        <p>Sports Photos SaaS - MVP Phase 1 - Ready for Enterprise Scale</p>
      </footer>
    </div>
  );
}
