import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/contexts/CartContext";
import { TranslationProvider } from "@/lib/contexts/TranslationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LAPHOTUS — As suas fotos de eventos desportivos",
  description: "Encontre e compre as suas fotos de eventos desportivos com busca por reconhecimento facial e por número de dorsal.",
  keywords: "fotografia desportiva, fotos de evento, reconhecimento facial, dorsal",
  openGraph: {
    title: "LAPHOTUS",
    description: "Marketplace de fotografia de eventos desportivos",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <TranslationProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </TranslationProvider>
        </CartProvider>
      </body>
    </html>
  );
}
