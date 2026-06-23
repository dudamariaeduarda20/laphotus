export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Fotos Desporto</h1>
          <p className="text-slate-400">Marketplace de Fotografia Profissional</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">{children}</div>
      </div>
    </div>
  );
}
