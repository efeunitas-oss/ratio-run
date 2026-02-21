// app/compare/[category]/page.tsx
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import CategoryClient from './CategoryClient';

export const revalidate = 300;

const SLUG_MAP: Record<string, string> = {
  laptop:         'laptop',
  telefon:        'telefon',
  tablet:         'tablet',
  saat:           'saat',
  kulaklik:       'kulaklik',
  'robot-supurge':'robot-supurge',
  tv:             'tv',
  araba:          'otomobil',
  otomobil:       'otomobil',
};

type Props = { params: Promise<{ category: string }> };

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const slug = SLUG_MAP[category.toLowerCase()];
  if (!slug) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Kategori bilgisi
  const { data: cat } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!cat) notFound();

  // İlk 48 ürünü çek — fiyata göre sıralı
  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, model, price, avg_price, image_url, source_url, source_name, sources, specifications, is_active, stock_status')
    .eq('category_id', cat.id)
    .eq('is_active', true)
    .order('price', { ascending: true, nullsFirst: false })
    .limit(48);

  return (
    <CategoryClient
      category={cat}
      initialProducts={products || []}
      categorySlug={slug}
    />
  );
}
