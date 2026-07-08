"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SettingsTab = "site" | "about" | "social" | "models" | "profile" | "colors" | "links" | "watermark" | "portfolio";

const SETTINGS_TABS: Array<{ id: SettingsTab; label: string; icon: string }> = [
  { id: "site", label: "Meu site", icon: "📋" },
  { id: "about", label: "Sobre", icon: "👤" },
  { id: "social", label: "Redes sociais", icon: "🔗" },
  { id: "models", label: "Modelos", icon: "📅" },
  { id: "profile", label: "Imagem de perfil", icon: "🖼️" },
  { id: "colors", label: "Cores", icon: "🎨" },
  { id: "links", label: "Links editáveis", icon: "🔗" },
  { id: "watermark", label: "Marca d'água", icon: "🛡️" },
  { id: "portfolio", label: "Portfólio", icon: "📸" },
];

export default function PhotographerSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("site");
  const router = useRouter();

  const renderContent = () => {
    switch (activeTab) {
      case "site":
        return <SiteSettings />;
      case "about":
        return <AboutSettings />;
      case "social":
        return <SocialSettings />;
      case "models":
        return <ModelsSettings />;
      case "profile":
        return <ProfileSettings />;
      case "colors":
        return <ColorsSettings />;
      case "links":
        return <LinksSettings />;
      case "watermark":
        return <WatermarkSettings />;
      case "portfolio":
        return <PortfolioSettings />;
      default:
        return <SiteSettings />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">Personalize seu perfil e portfólio fotográfico</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-96">
          <div className="bg-white rounded-lg shadow p-6 space-y-2">
            <div className="mb-4">
              <Link href="/photographer" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Minha conta
              </Link>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-700 text-sm font-medium">Configurações</span>
            </div>

            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${
                  activeTab === tab.id
                    ? "bg-gray-100 border-l-4 border-orange-500 text-gray-900 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                <span className="ml-auto text-gray-400">✓</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-8">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}

function SiteSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Meu site</h2>
        <p className="text-gray-600 text-sm">Edite e atualize as informações do seu site</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link*</label>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-4 bg-gray-100 border border-gray-300 rounded-lg">
              https://
            </span>
            <input type="text" placeholder="seu-dominio" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
            <span className="inline-flex items-center px-4 bg-gray-100 border border-gray-300 rounded-lg">
              .fotop.com
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Domínio próprio</label>
          <div className="flex gap-2">
            <input type="text" placeholder="https://" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              MEU DOMÍNIO
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome de exibição*</label>
          <input type="text" placeholder="Seu nome" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">E-mail de atendimento*</label>
          <input type="email" placeholder="seu@email.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Telefone de atendimento*</label>
          <input type="tel" placeholder="+55 11 99999-9999" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título da página</label>
            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Palavras-chave</label>
            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
          Cancelar
        </button>
        <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
          SALVAR
        </button>
      </div>
    </div>
  );
}

function AboutSettings() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Seção "Sobre" em desenvolvimento</p>
    </div>
  );
}

function SocialSettings() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Redes sociais em desenvolvimento</p>
    </div>
  );
}

function ModelsSettings() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Modelos em desenvolvimento</p>
    </div>
  );
}

function ProfileSettings() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Imagem de perfil em desenvolvimento</p>
    </div>
  );
}

function ColorsSettings() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Cores em desenvolvimento</p>
    </div>
  );
}

function LinksSettings() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Links editáveis em desenvolvimento</p>
    </div>
  );
}

function WatermarkSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Marca d'água</h2>
        <p className="text-gray-600 text-sm">Altere a marca d'água do seu portfólio</p>
      </div>

      <div className="space-y-4">
        <p className="text-gray-700">Você pode alterar a sua marca d'água para deixá-la com o visual que desejar.</p>
        <a href="#" className="text-orange-500 hover:text-orange-600 font-medium underline">
          Saiba mais sobre como personalizar
        </a>
      </div>

      <div className="flex gap-4">
        <button className="px-8 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 font-medium">
          Fazer upload de uma marca d'água
        </button>
        <button className="px-8 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 font-medium">
          Utilizar padrão Fotop
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visualização</h3>
        <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
          <span className="text-gray-400">Pré-visualização da marca d'água</span>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
          Cancelar
        </button>
        <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
          SALVAR
        </button>
      </div>
    </div>
  );
}

function PortfolioSettings() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Portfólio em desenvolvimento</p>
    </div>
  );
}
