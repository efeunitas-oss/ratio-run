// app/sitemap.ts
import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://ratio.run";

// Kategori slug → URL slug eşlemesi
const CATEGORY_URL_SLUGS: Record<string, string> = {
  telefon:         "telefon",
  laptop:          "laptop",
  tablet:          "tablet",
  saat:            "saat",
  kulaklik:        "kulaklik",
  "robot-supurge": "robot-supurge",
  tv:              "tv",
  otomobil:        "otomobil",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const now = new Date();

  // ─── Statik sayfalar ──────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // ─── Kategori sayfaları ───────────────────────────────────────────────────
  const categoryPages: MetadataRoute.Sitemap = Object.entries(
    CATEGORY_URL_SLUGS
  ).map(([, urlSlug]) => ({
    url: `${BASE_URL}/compare/${urlSlug}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.9,
  }));

  // ─── Ürün sayfaları (aktif ürünler) ──────────────────────────────────────
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at, category_id")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(5000); // Google sitemap limiti 50.000, güvenli sınır

    if (products && products.length > 0) {
      // Kategori ID → slug haritasını oluştur
      const { data: categories } = await supabase
        .from("categories")
        .select("id, slug");

      const catMap = new Map(
        (categories || []).map((c) => [c.id, c.slug])
      );

      productPages = products
        .filter((p) => {
          const catSlug = catMap.get(p.category_id);
          return catSlug && CATEGORY_URL_SLUGS[catSlug];
        })
        .map((p) => {
          const catSlug = catMap.get(p.category_id)!;
          const urlSlug = CATEGORY_URL_SLUGS[catSlug];
          return {
            url: `${BASE_URL}/compare/${urlSlug}/${p.id}`,
            lastModified: new Date(p.updated_at || now),
            changeFrequency: "daily" as const,
            priority: 0.7,
          };
        });
    }
  } catch {
    // Ürün sayfaları oluşturulamazsa devam et
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
