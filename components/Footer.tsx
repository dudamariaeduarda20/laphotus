import Link from "next/link";

/** Footer global LAPHOTUS (4 colunas + rodapé legal). */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 className="font-bold text-white mb-3">Institucional</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:text-white">Sobre</Link></li>
            <li><Link href="/" className="hover:text-white">Blog</Link></li>
            <li><Link href="/" className="hover:text-white">Pacotes & produtos</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Venda suas fotos</h4>
          <ul className="space-y-2">
            <li><Link href="/auth/register" className="hover:text-white">Sou fotógrafo</Link></li>
            <li><Link href="/auth/register" className="hover:text-white">Sou organizador</Link></li>
            <li><Link href="/auth/register" className="hover:text-white">Escolas</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Conta</h4>
          <ul className="space-y-2">
            <li><Link href="/profile" className="hover:text-white">Minha conta</Link></li>
            <li><Link href="/downloads" className="hover:text-white">Meus pedidos</Link></li>
            <li><Link href="/auth/login" className="hover:text-white">Entrar</Link></li>
            <li><Link href="/auth/register" className="hover:text-white">Cadastrar</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Ajuda</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:text-white">Como comprar</Link></li>
            <li><Link href="/" className="hover:text-white">Contato</Link></li>
            <li><Link href="/" className="hover:text-white">Suporte</Link></li>
            <li><Link href="/" className="hover:text-white">Remover minhas fotos</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span className="font-bold text-white">LAPHOTUS</span>
          <span>© {year} LAPHOTUS · Marketplace de fotografia de eventos</span>
          <span>Privacidade · Termos</span>
        </div>
      </div>
    </footer>
  );
}
