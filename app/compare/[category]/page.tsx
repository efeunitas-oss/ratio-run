// app/compare/[category]/page.tsx
// SERVER COMPONENT — veri sunucuda çekiliyor, mobil anında görüyor

import { createClient } from '@supabase/supabase-js';
import CategoryClient from './CategoryClient';

const SLUG_MAP: Record<string, string> = { araba: 'otomobil' };

interface PageProps {
  params: { category: string };
  searchParams: { search?: string };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const slug        = params.category ?? '';
  const searchQuery = searchParams?.search ?? '';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Kategori bilgisini al ────────────────────────────────────────────────
  const dbSlug = SLUG_MAP[slug.toLowerCase()] ?? slug.toLowerCase();
  const { data: category } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', dbSlug)
    .maybeSingle();

  if (!category) {
    return <CategoryClient
      slug={slug}
      catName=""
      catId=""
      initialProducts={[]}
      totalCount={0}
      searchQuery={searchQuery}
      notFound={true}
    />;
  }

  // ── İlk 48 ürünü sunucuda çek ────────────────────────────────────────────
  let query = supabase
    .from('products')
    .select(
      'id,name,brand,price,image_url,source_url,specifications->stars,specifications->listPrice',
      { count: 'exact' }
    )
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
