// app/page.tsx — SERVER COMPONENT
// Next.js 15 — veri sunucuda hazırlanıyor

import { createClient } from '@supabase/supabase-js';

// Ana sayfa 5 dakika önbelleklenir
export const revalidate = 300;
export const runtime = 'edge';
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

  const [{ data: prodData }, { data: catData }] = await Promise.all([
    supabase.from('products').select('category_id').eq('is_active', true),
    supabase.from('categories').select('id, slug, name'),
  ]);

  // Slug → menu id eşleştirmesi
  const counts: Record<string, number> = {};
  const catMap: Record<string, string> = {};

  (catData ?? []).forEach(c => {
    if (c.slug) catMap[c.id] = c.slug.toLowerCase();
  });

  (prodData ?? []).forEach(p => {
    const slug = catMap[p.category_id] ?? '';
    const cat = CATEGORIES.find(c =>
      c.id === slug ||
      c.link === slug ||
      (c.id === 'araba' && slug === 'otomobil') ||
      (c.id === 'tv' && slug === 'televizyon') ||
      slug.includes(c.id)
    );
    if (cat) counts[cat.id] = (counts[cat.id] || 0) + 1;
  });

  return <HomeClient categories={CATEGORIES} counts={counts} />;
}
