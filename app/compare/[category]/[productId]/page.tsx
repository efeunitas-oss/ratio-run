// app/compare/[category]/[productId]/page.tsx
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export const revalidate = 300;

const BASE_URL = 'https://ratio.run';

const SLUG_MAP: Record<string, string> = {
  laptop:          'laptop',
  telefon:         'telefon',
  tablet:          'tablet',
  saat:            'saat',
  kulaklik:        'kulaklik',
  'robot-supurge': 'robot-supurge',
  tv:              'tv',
  araba:           'otomobil',
  otomobil:        'otomobil',
};

type Props = { params: Promise<{ category: string; productId: string }> };

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Dinamik Metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, productId } = await params;
  const slug = SLUG_MAP[category.toLowerCase()];
  if (!slug) return {};

  const supabase = getSupabase();
  const { data: product } = await supabase
    .from('products')
    .select('name, brand, price, image_url, specifications')
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (!product) return {};

  const name   = product.name ?? 'Ürün';
  const brand  = product.brand ?? '';
  const price  = product.price
    ? `₺${Math.round(product.price).toLocaleString('tr-TR')}`
    : '';

  const title       = `${name} — Ratio Score ile İncele`;
  const description = `${brand} ${name} için Ratio Score, teknik özellikler ve en iyi fiyat. ${price ? `Güncel fiyat: ${price}.` : ''} Türkiye\'nin matematiksel ürün karşılaştırma platformu ratio.run\'da incele.`;

  const canonicalUrl = `${BASE_URL}/compare/${category}/${productId}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      url: canonicalUrl,
      siteName: 'RATIO.RUN',
      title: `${title} | RATIO.RUN`,
      description,
      images: product.image_url
        ? [{ url: product.image_url, alt: name }]
        : [{ url: '/logo.png', width: 1200, height: 630, alt: 'RATIO.RUN' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | RATIO.RUN`,
      description,
      images: product.image_url ? [product.image_url] : ['/logo.png'],
    },
  };
}

// ─── Sayfa ────────────────────────────────────────────────────────────────────
export default async function ProductDetailPage({ params }: Props) {
  const { category, productId } = await params;
  const slug = SLUG_MAP[category.toLowerCase()];
  if (!slug) notFound();

  const supabase = getSupabase();

  // Ana ürün
  const { data: product } = await supabase
    .from('products')
    .select('id, name, brand, model, price, avg_price, image_url, source_url, source_name, sources, specifications, is_active, stock_status, category_id')
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (!product) notFound();

  // Kategori
  const { data: cat } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('id', product.category_id)
    .single();

  // Aynı kategoriden benzer ürünler (fiyat yakın, max 6)
  const price = product.avg_price ?? product.price ?? 0;
  const priceLow  = price * 0.7;
  const priceHigh = price * 1.4;

  const { data: similarProducts } = await supabase
    .from('products')
    .select('id, name, brand, model, price, avg_price, image_url, source_url, source_name, sources, specifications, stock_status')
    .eq('category_id', product.category_id)
    .eq('is_active', true)
    .neq('id', productId)
    .gte('price', priceLow)
    .lte('price', priceHigh)
    .order('price', { ascending: true })
    .limit(6);

  return (
    <ProductDetailClient
      product={product}
      category={cat ?? { id: '', name: slug, slug }}
      categorySlug={slug}
      categoryUrl={category}
      similarProducts={similarProducts ?? []}
    />
  );
}
