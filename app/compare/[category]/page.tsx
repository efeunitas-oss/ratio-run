// app/compare/[category]/page.tsx
// Next.js 15 — params await edilmesi zorunlu
// Veri sunucuda çekiliyor, kullanıcıya hazır HTML gidiyor

import { createClient } from '@supabase/supabase-js';

// Sayfa 5 dakika önbelleklenir — her kullanıcıya anında HTML gider
export const revalidate = 300;
import { Suspense } from 'react';
import CategoryClient from './CategoryClient';

const SLUG_MAP: Record<string, string> = { araba: 'otomobil' };

// Next.js 15'te props tipi böyle tanımlanır
type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ search?: string }>;
};

export default async function CategoryPage({ params, searchParams }: Props) {
  // Next.js 15 — await zorunlu
  const { category: slug }   = await params;
  const { search: searchQuery = '' } = await searchParams;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Tüm kategorileri çek, frontend slug eşleştirmesine gerek yok
  const { data: allCats } = await supabase
    .from('categories')
    .select('id, name, slug');

  if (!allCats || allCats.length === 0) {
    return <CategoryClient
      slug={slug} catName="" catId=""
      initialProducts={[]} totalCount={0}
      searchQuery={searchQuery} notFound={true}
    />;
  }

  // Çoklu eşleştirme — DB'de hangi slug olursa bulsun
  const s      = slug.toLowerCase();
  const mapped = (SLUG_MAP[s] ?? s).toLowerCase();

  const category =
    allCats.find(c => c.slug?.toLowerCase() === s)      ||
    allCats.find(c => c.slug?.toLowerCase() === mapped)  ||
    allCats.find(c => c.name?.toLowerCase() === s)       ||
    allCats.find(c => c.name?.toLowerCase().replace(/\s+/g, '-') === s) ||
    allCats.find(c => c.slug?.toLowerCase().includes(s)) ||
    allCats.find(c => s.includes(c.slug?.toLowerCase() ?? ''));

  if (!category) {
    return <CategoryClient
      slug={slug} catName="" catId=""
      initialProducts={[]} totalCount={0}
      searchQuery={searchQuery} notFound={true}
    />;
  }

  // İlk 48 ürünü sunucuda çek
  let query = supabase
    .from('products')
    .select('id,name,brand,price,image_url,source_url,specifications', { count: 'exact' })
    .eq('category_id', category.id)
    .eq('is_active', true)
    .range(0, 47);

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
  } else {
    query = query.order('price', { ascending: true, nullsFirst: false });
  }

  const { data: products, count } = await query;

  return (
    <CategoryClient
      slug={slug}
      catName={category.name}
      catId={category.id}
      initialProducts={(products ?? []) as any[]}
      totalCount={count ?? 0}
      searchQuery={searchQuery}
      notFound={false}
    />
  );
}
