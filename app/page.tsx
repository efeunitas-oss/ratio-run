// app/page.tsx — SERVER COMPONENT
// Next.js 15 — veri sunucuda hazırlanıyor

import { createClient } from '@supabase/supabase-js';

// Ana sayfa 5 dakika önbelleklenir
export const revalidate = 300;
import HomeClient from './HomeClient';

const CATEGORIES = [
  { id: 'laptop',        label: 'Laptop',       icon: '💻', link: 'laptop'        },
  { id: 'telefon',       label: 'Telefon',       icon: '📱', link: 'telefon'       },
  { id: 'tablet',        label: 'Tablet',        icon: '📲', link: 'tablet'        },
  { id: 'saat',          label: 'Akıllı Saat',   icon: '⌚', link: 'saat'          },
  { id: 'kulaklik',      label: 'Kulaklık',      icon: '🎧', link: 'kulaklik'      },
  { id: 'robot-supurge', label: 'Robot Süpürge', icon: '🤖', link: 'robot-supurge' },
  { id: 'tv',            label: 'Televizyon',    icon: '📺', link: 'tv'            },
  { id: 'araba',         label: 'Otomobil',      icon: '🚗', link: 'araba'         },
];

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Tek sorguda kategori başına ürün sayısı — 708 satır değil 8 satır gelir
  const { data: catData } = await supabase
    .from('categories')
    .select('id, slug, name');

  const counts: Record<string, number> = {};

  await Promise.all(
    (catData ?? []).map(async (cat) => {
      const menuCat = CATEGORIES.find(c =>
        c.id === cat.slug?.toLowerCase() ||
        c.link === cat.slug?.toLowerCase() ||
        (c.id === 'araba' && cat.slug === 'otomobil') ||
        (c.id === 'tv' && cat.slug === 'televizyon') ||
        cat.slug?.toLowerCase().includes(c.id)
      );
      if (!menuCat) return;

      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id)
        .eq('is_active', true);

      if (count) counts[menuCat.id] = count;
    })
  );

  return <HomeClient categories={CATEGORIES} counts={counts} />;
}
