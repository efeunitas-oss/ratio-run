// app/page.tsx
import { createClient } from '@supabase/supabase-js';
import HomeClient from './HomeClient';

export const revalidate = 300;

const CATEGORIES = [
  { id: 'laptop',        label: 'Laptop',        icon: '💻', link: 'laptop'        },
  { id: 'telefon',       label: 'Telefon',        icon: '📱', link: 'telefon'       },
  { id: 'tablet',        label: 'Tablet',         icon: '📲', link: 'tablet'        },
  { id: 'saat',          label: 'Akıllı Saat',    icon: '⌚', link: 'saat'          },
  { id: 'kulaklik',      label: 'Kulaklık',       icon: '🎧', link: 'kulaklik'      },
  { id: 'robot-supurge', label: 'Robot Süpürge',  icon: '🤖', link: 'robot-supurge' },
  { id: 'tv',            label: 'Televizyon',     icon: '📺', link: 'tv'            },
  { id: 'araba',         label: 'Otomobil',       icon: '🚗', link: 'araba'         },
];

// Kategori slug → display bilgisi
const SLUG_TO_CAT: Record<string, { label: string; link: string }> = {
  laptop:        { label: 'Laptop',       link: 'laptop'        },
  telefon:       { label: 'Telefon',      link: 'telefon'       },
  tablet:        { label: 'Tablet',       link: 'tablet'        },
  saat:          { label: 'Akıllı Saat',  link: 'saat'          },
  kulaklik:      { label: 'Kulaklık',     link: 'kulaklik'      },
  'robot-supurge': { label: 'Robot Süpürge', link: 'robot-supurge' },
  televizyon:    { label: 'Televizyon',   link: 'tv'            },
  tv:            { label: 'Televizyon',   link: 'tv'            },
  otomobil:      { label: 'Otomobil',     link: 'araba'         },
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Sabit seed ile deterministik "delta" — her ürünün görsel hareketliliği
function seedDelta(id: string, score: number): number {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xfffffff;
  const raw = ((hash % 200) - 100) / 100; // -1 ile +1 arası
  return parseFloat((raw * 4.5).toFixed(1));  // ±4.5 aralığı
}

export default async function Home() {
  const supabase = getSupabase();

  // ── Kategori sayıları ──────────────────────────────────────────────────────
  const { data: catData } = await supabase.from('categories').select('id, slug, name');
  const counts: Record<string, number> = {};
  const catIdToSlug: Record<string, string> = {};

  await Promise.all((catData ?? []).map(async (cat) => {
    const slug = cat.slug?.toLowerCase() ?? '';
    catIdToSlug[cat.id] = slug;

    const menuCat = CATEGORIES.find(c =>
      c.id === slug ||
      c.link === slug ||
      (c.id === 'araba' && slug === 'otomobil') ||
      (c.id === 'tv' && (slug === 'televizyon' || slug === 'tv')) ||
      slug.includes(c.id)
    );
    if (!menuCat) return;

    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', cat.id)
      .eq('is_active', true);

    if (count) counts[menuCat.id] = count;
  }));

  const totalProducts = Object.values(counts).reduce((a, b) => a + b, 0);

  // ── Her kategoriden top 3 ürün çek ────────────────────────────────────────
  const allTopProducts: any[] = [];

  await Promise.all((catData ?? []).map(async (cat) => {
    const slug = cat.slug?.toLowerCase() ?? '';
    const catInfo = SLUG_TO_CAT[slug];
    if (!catInfo) return;

    const { data: products } = await supabase
      .from('products')
      .select('id, name, brand, price, avg_price, specifications, category_id')
      .eq('category_id', cat.id)
      .eq('is_active', true)
      .not('price', 'is', null)
      .order('price', { ascending: false })
      .limit(40);

    if (!products || products.length === 0) return;

    // Ratio score hesapla ve sırala
    const prices = products.map((p: any) => p.avg_price ?? p.price ?? 0).filter(Boolean);
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 1;
    const { getSpecConfig } = await import('../lib/spec-config');
    const { calculateRatioScore } = await import('../lib/ratio-engine');
    const config = getSpecConfig(slug);

    const scored = products
      .map((p: any) => {
        try {
          const result = calculateRatioScore(p as any, config.weights, maxPrice);
          return { ...p, score: (result.normalized_score as number) ?? 0 };
        } catch {
          return null;
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null && p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    for (const p of scored) {
      allTopProducts.push({
        id:           p.id,
        name:         p.name ?? 'Bilinmiyor',
        brand:        p.brand ?? '',
        score:        p.score,
        price:        p.avg_price ?? p.price ?? 0,
        category:     catInfo.label,
        categorySlug: catInfo.link,
        delta:        seedDelta(p.id, p.score),
      });
    }
  }));

  // Genel sıralama — skora göre
  allTopProducts.sort((a, b) => b.score - a.score);
  const topProducts = allTopProducts.slice(0, 20);

  // Son güncelleme — şu an (SSR her 5 dk rebuild ediyor)
  const lastUpdated = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <HomeClient
      categories={CATEGORIES}
      counts={counts}
      topProducts={topProducts}
      totalProducts={totalProducts}
      lastUpdated={lastUpdated}
    />
  );
}
