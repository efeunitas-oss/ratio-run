// app/compare/[category]/page.tsx
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import CategoryClient from "./CategoryClient";

export const revalidate = 300;

const BASE_URL = "https://ratio.run";

const SLUG_MAP: Record<string, string> = {
  laptop:          "laptop",
  telefon:         "telefon",
  tablet:          "tablet",
  saat:            "saat",
  kulaklik:        "kulaklik",
  "robot-supurge": "robot-supurge",
  tv:              "tv",
  araba:           "otomobil",
  otomobil:        "otomobil",
};

// Kategori için Türkçe SEO metinleri
const CATEGORY_SEO: Record<string, {
  title: string;
  description: string;
  keywords: string[];
}> = {
  telefon: {
    title: "En İyi Akıllı Telefon — Ratio Score ile Karşılaştır",
    description:
      "2025-2026 yılının en iyi akıllı telefonlarını Ratio Score ile karşılaştır. Samsung, iPhone, Xiaomi, Oppo ve daha fazlası. Trendyol ve Amazon TR fiyatları.",
    keywords: [
      "en iyi telefon 2026",
      "akıllı telefon karşılaştırma",
      "hangi telefon almalıyım",
      "samsung galaxy karşılaştırma",
      "iphone fiyat karşılaştırma",
      "xiaomi redmi note",
      "telefon ratio score",
    ],
  },
  laptop: {
    title: "En İyi Laptop — Ratio Score ile Karşılaştır",
    description:
      "2025-2026 yılının en iyi laptoplarını Ratio Score ile karşılaştır. Gaming, ofis, öğrenci laptopları. Trendyol ve Amazon TR en ucuz fiyatlar.",
    keywords: [
      "en iyi laptop 2026",
      "laptop karşılaştırma",
      "hangi laptop almalıyım",
      "gaming laptop",
      "ofis laptopu",
      "asus tuf laptop",
      "laptop ratio score",
    ],
  },
  tablet: {
    title: "En İyi Tablet — Ratio Score ile Karşılaştır",
    description:
      "2025-2026 yılının en iyi tabletlerini Ratio Score ile karşılaştır. iPad, Samsung Galaxy Tab, Xiaomi Pad ve daha fazlası.",
    keywords: [
      "en iyi tablet 2026",
      "tablet karşılaştırma",
      "hangi tablet almalıyım",
      "samsung galaxy tab",
      "ipad fiyat",
      "tablet ratio score",
    ],
  },
  saat: {
    title: "En İyi Akıllı Saat — Ratio Score ile Karşılaştır",
    description:
      "2025-2026 yılının en iyi akıllı saatlerini Ratio Score ile karşılaştır. Samsung Galaxy Watch, Huawei Watch, Apple Watch fiyatları.",
    keywords: [
      "en iyi akıllı saat 2026",
      "akıllı saat karşılaştırma",
      "samsung galaxy watch",
      "huawei watch",
      "akıllı saat ratio score",
    ],
  },
  kulaklik: {
    title: "En İyi Kulaklık — Ratio Score ile Karşılaştır",
    description:
      "2025-2026 yılının en iyi kulaklıklarını Ratio Score ile karşılaştır. Kablosuz, ANC, gaming kulaklıklar. En ucuz fiyatlar.",
    keywords: [
      "en iyi kulaklık 2026",
      "kulaklık karşılaştırma",
      "kablosuz kulaklık",
      "anc kulaklık",
      "gaming kulaklık",
      "kulaklık ratio score",
    ],
  },
  "robot-supurge": {
    title: "En İyi Robot Süpürge — Ratio Score ile Karşılaştır",
    description:
      "2025-2026 yılının en iyi robot süpürgelerini Ratio Score ile karşılaştır. Roborock, Dreame, Xiaomi ve daha fazlası. En uygun fiyatlar.",
    keywords: [
      "en iyi robot süpürge 2026",
      "robot süpürge karşılaştırma",
      "roborock fiyat",
      "dreame robot",
      "robot süpürge ratio score",
    ],
  },
  tv: {
    title: "En İyi TV — Ratio Score ile Karşılaştır",
    description:
      "2025-2026 yılının en iyi televizyonlarını Ratio Score ile karşılaştır. 4K, OLED, QLED, Smart TV modelleri. En ucuz fiyatlar.",
    keywords: [
      "en iyi tv 2026",
      "televizyon karşılaştırma",
      "4k tv",
      "oled tv",
      "smart tv fiyat",
      "tv ratio score",
    ],
  },
  otomobil: {
    title: "Otomobil Karşılaştırma — Ratio Score ile Karşılaştır",
    description:
      "Otomobilleri Ratio Score ile karşılaştır. En iyi değer araç hangi marka ve model?",
    keywords: [
      "otomobil karşılaştırma",
      "en iyi araba 2026",
      "araba ratio score",
    ],
  },
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Props = { params: Promise<{ category: string }> };

// ─── Dinamik SEO Metadata ───────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const slug = SLUG_MAP[category.toLowerCase()];
  if (!slug) return {};

  const seo = CATEGORY_SEO[slug];
  if (!seo) return {};

  const canonicalUrl = `${BASE_URL}/compare/${category}`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: canonicalUrl,
      siteName: "RATIO.RUN",
      title: `${seo.title} | RATIO.RUN`,
      description: seo.description,
      images: [
        {
          url: "/logo.png",
          width: 1200,
          height: 630,
          alt: `RATIO.RUN — ${seo.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${seo.title} | RATIO.RUN`,
      description: seo.description,
      images: ["/logo.png"],
    },
  };
}

// ─── Statik Path Üretimi ────────────────────────────────────────────────────
export async function generateStaticParams() {
  return Object.keys(SLUG_MAP).map((category) => ({ category }));
}

// ─── Sayfa ──────────────────────────────────────────────────────────────────
export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const slug = SLUG_MAP[category.toLowerCase()];
  if (!slug) notFound();

  const supabase = getSupabase();

  const { data: cat } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!cat) notFound();

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, brand, model, price, avg_price, image_url, source_url, source_name, sources, specifications, is_active, stock_status"
    )
    .eq("category_id", cat.id)
    .eq("is_active", true)
    .order("price", { ascending: true, nullsFirst: false })
    .limit(48);

  return (
    <CategoryClient
      category={cat}
      initialProducts={products || []}
      categorySlug={slug}
    />
  );
}
