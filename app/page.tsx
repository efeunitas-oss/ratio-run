// app/page.tsx — SERVER COMPONENT
// Kategori sayıları sunucuda hazırlanıyor, mobil anında görüyor

import { createClient } from '@supabase/supabase-js';
import HomeClient from './HomeClient';

const CATEGORIES = [
  { id: 'laptop',        label: 'Laptop',       icon: '💻', link: 'laptop',        dbSlug: 'laptop'        },
  { id: 'telefon',       label: 'Telefon',       icon: '📱', link: 'telefon',       dbSlug: 'telefon'       },
  { id: 'tablet',        label: 'Tablet',        icon: '📲', link: 'tablet',        dbSlug: 'tablet'        },
  { id: 'saat',          label: 'Akıllı Saat',   icon: '⌚', link: 'saat',          dbSlug: 'saat'          },
  { id: 'kulaklik',      label: 'Kulaklık',      icon: '🎧', link: 'kulaklik',      dbSlug: 'kulaklik'      },
  { id: 'robot-supurge', label: 'Robot Süpürge', icon: '🤖', link: 'robot-supurge', dbSlug: 'robot-supurge' },
  { id: 'tv',            label: 'Televizyon',    icon: '📺', link: 'tv',            dbSlug: 'tv'            },
  { id: 'araba',         label: 'Otomobil',      icon: '🚗', link: 'araba',         dbSlug: 'otomobil'      },
];

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Tek sorguda kategori sayılarını al
  const [{ data: prodData }, { data: catData }] = await Promise.all([
    supabase.from('products').select('category_id').eq('is_active', true),
    supabase.from('categories').select('id, slug'),
  ]);

  const slugToId: Record<string, string> = {};
  (catData ?? []).forEach((c) => { if (c.slug) slugToId[c.slug.toLowerCase()] = c.id; });

  const dbIdToMenuId: Record<string, string> = {};
  CATEGORIES.forEach((cat) => {
    if (slugToId[cat.dbSlug]) dbIdToMenuId[slugToId[cat.dbSlug]] = cat.id;
    if (slugToId[cat.id])     dbIdToMenuId[slugToId[cat.id]]     = cat.id;
  });

  const counts: Record<string, number> = {};
  (prodData ?? []).forEach((p) => {
    const menuId = dbIdToMenuId[p.category_id];
    if (menuId) counts[menuId] = (counts[menuId] || 0) + 1;
  });

  return <HomeClient categories={CATEGORIES} counts={counts} />;
}
