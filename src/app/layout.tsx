import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Outfit } from "next/font/google";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const urlSite = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(urlSite),
  title: {
    default: "vaugines, terres vivantes — association d'habitants à Vaugines (Luberon)",
    template: "%s · vaugines, terres vivantes",
  },
  description:
    "Association loi 1901 apolitique et ouverte à toutes et à tous : prendre soin du vivant à Vaugines, faire vivre le dialogue et le débat démocratique sur l'avenir du village.",
  applicationName: "vaugines, terres vivantes",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "vaugines, terres vivantes",
    images: [{ url: "/images/village.jpg", width: 1800, height: 1015, alt: "Le village de Vaugines et le Luberon" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#F6EEE2",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={`${outfit.variable} ${nunito.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brun focus:px-5 focus:py-3 focus:font-bold focus:text-white"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
