"use client";

import { useState } from "react";

interface Props {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      name: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      className: "bg-[#25D366] hover:bg-[#25D366]/90",
    },
    {
      name: "Facebook",
      icon: "📘",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: "bg-[#1877F2] hover:bg-[#1877F2]/90",
    },
    {
      name: "LinkedIn",
      icon: "💼",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className: "bg-[#0A66C2] hover:bg-[#0A66C2]/90",
    },
    {
      name: "X",
      icon: "𝕏",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: "bg-black hover:bg-black/80",
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API indisponível (ex: contexto não-seguro) — sem crash
    }
  };

  return (
    <div className="mb-2">
      <p className="text-sm font-medium text-gray-700 mb-2">Partilhar</p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`Partilhar no ${link.name}`}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-white text-lg transition ${link.className}`}
          >
            {link.icon}
          </a>
        ))}

        {/* Instagram não tem URL de partilha direta — copia o link em vez disso */}
        <button
          onClick={handleCopyLink}
          title="Copiar link para partilhar no Instagram"
          className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-tr from-[#f0bf38] via-[#ff2f92] to-[#833AB4] px-4 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          📷 {copied ? "Link copiado!" : "Instagram: copiar link"}
        </button>
      </div>
    </div>
  );
}
