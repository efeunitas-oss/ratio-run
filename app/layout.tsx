import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://ratio.run";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "RATIO.RUN — Matematiksel Ürün Karşılaştırma",
    template: "%s | RATIO.RUN",
  },
  description:
    "Türkiye'nin ilk matematiksel ürün karar motoru. Ratio Score ile telefon, laptop, tablet ve daha fazlasını duygusal değil matematiksel olarak karşılaştır.",
  keywords: [
    "ürün karşılaştırma",
    "fiyat karşılaştırma",
    "ratio score",
    "en iyi telefon",
    "en iyi laptop",
    "hangi telefon almalıyım",
    "trendyol karşılaştırma",
    "amazon türkiye karşılaştırma",
    "matematiksel ürün puanı",
  ],
  authors: [{ name: "ratio.run" }],
  creator: "ratio.run",
  publisher: "ratio.run",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: BASE_URL,
    siteName: "RATIO.RUN",
    title: "RATIO.RUN — Matematiksel Ürün Karşılaştırma",
    description:
      "Türkiye'nin ilk matematiksel ürün karar motoru. Ratio Score ile en iyi değeri bul.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "RATIO.RUN",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RATIO.RUN — Matematiksel Ürün Karşılaştırma",
    description:
      "Türkiye'nin ilk matematiksel ürün karar motoru. Ratio Score ile en iyi değeri bul.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "tr-TR": BASE_URL,
    },
  },
  verification: {
    google: "PSVOCXM3bEPThbeJsKAaUHJJBMlovu-IJW_-USYByGo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
