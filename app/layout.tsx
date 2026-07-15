import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/contexts/CartContext";
import { TranslationProvider } from "@/lib/contexts/TranslationContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { FavoritesProvider } from "@/lib/contexts/FavoritesContext";
import { AuthProvider } from "@/lib/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "LAPHOTUS — As suas fotos de eventos desportivos",
  description: "Encontre e compre as suas fotos de eventos desportivos com busca por reconhecimento facial e por número de dorsal.",
  keywords: "fotografia desportiva, fotos de evento, reconhecimento facial, dorsal",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  openGraph: {
    title: "LAPHOTUS",
    description: "Marketplace de fotografia de eventos desportivos",
    type: "website",
    url: "https://laphotus.com",
    siteName: "LAPHOTUS",
  },
  twitter: {
    card: "summary_large_image",
    title: "LAPHOTUS",
    description: "Marketplace de fotografia de eventos desportivos",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// Anti-flash: apply saved theme before first paint
const themeScript = `
try {
  const t = localStorage.getItem('theme');
  const dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
} catch(e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-PT"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "LAPHOTUS",
              url: "https://laphotus.com",
              logo: "https://laphotus.com/logo.svg",
              description: "Marketplace de fotografia de eventos desportivos",
              sameAs: [
                "https://facebook.com/laphotus",
                "https://instagram.com/laphotus",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: "https://laphotus.com",
              name: "LAPHOTUS",
              description: "Encontre e compre fotos de eventos desportivos",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://laphotus.com/photos?search={search_term_string}",
                },
                query_input: "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950 transition-colors">
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <TranslationProvider>
                <ThemeProvider>
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </ThemeProvider>
              </TranslationProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
