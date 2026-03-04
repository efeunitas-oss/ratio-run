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

const CATEGORY_LABELS: Record<string, string> = {
  laptop:          'Laptop',
  telefon:         'Telefon',
  tablet:          'Tablet',
  saat:            'Akıllı Saat',
  kulaklik:        'Kulaklık',
  'robot-supurge': 'Robot Süpürge',
  tv:              'Televizyon',
  otomobil:        'Otomobil',
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
    .select('name, brand, price, avg_price, image_url, specifications')
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (!product) return {};

  const name  = product.name ?? 'Ürün';
  const brand = product.brand ?? '';
  const price = product.avg_price ?? product.price;
  const priceStr = price ? `₺${Math.round(price).toLocaleString('tr-TR')}` : '';
  const catLabel = CATEGORY_LABELS[slug] ?? slug;

  const title       = `${brand ? brand + ' ' : ''}${name} Fiyat ve Özellikler | RATIO.RUN`;
  const description = `${name} için Ratio Score, teknik özellikler ve en iyi fiyat karşılaştırması.${priceStr ? ` Güncel fiyat: ${priceStr}.` : ''} ratio.run'da ${catLabel} kategorisinde incele.`;
  const canonicalUrl = `${BASE_URL}/compare/${category}/${productId}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type:      'website',
      locale:    'tr_TR',
      url:       canonicalUrl,
      siteName:  'RATIO.RUN',
      title,
      description,
      images: product.image_url
        ? [{ url: product.image_url, alt: name, width: 800, height: 800 }]
        : [{ url: `${BASE_URL}/logo.png`, width: 1200, height: 630, alt: 'RATIO.RUN' }],
    },
    twitter: {
      card:   'summary_large_image',
      title,
      description,
      images: product.image_url ? [product.image_url] : [`${BASE_URL}/logo.png`],
    },
  };
}

// ─── JSON-LD oluşturucu ───────────────────────────────────────────────────────
function buildJsonLd(product: any, category: string, productId: string) {
  const slug      = SLUG_MAP[category.toLowerCase()] ?? category;
  const catLabel  = CATEGORY_LABELS[slug] ?? slug;
  const name      = product.name ?? '';
  const brand     = product.brand ?? '';
  const price     = product.avg_price ?? product.price ?? 0;
  const specs     = product.specifications ?? {};
  const pageUrl   = `${BASE_URL}/compare/${category}/${productId}`;

  // Kaynak URL — affiliate linki
  const offerUrl = Array.isArray(product.sources) && product.sources.length > 0
    ? product.sources[0].url
    : product.source_url ?? pageUrl;

  // Product schema
  const productSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name,
    description: `${brand ? brand + ' ' : ''}${name} — Türkiye'nin matematiksel ürün karşılaştırma platformu ratio.run'da fiyat ve özellik karşılaştırması.`,
    brand: {
      '@type': 'Brand',
      name:    brand || 'Bilinmiyor',
    },
    ...(product.image_url ? { image: [product.image_url] } : {}),
    offers: {
      '@type':           'Offer',
      priceCurrency:     'TRY',
      price:             price.toFixed(2),
      availability:      'https://schema.org/InStock',
      url:               offerUrl,
      priceValidUntil:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name:    Array.isArray(product.sources) && product.sources.length > 0
          ? product.sources[0].name ?? 'ratio.run'
          : product.source_name ?? 'ratio.run',
      },
    },
  };

  // AggregateRating — sadece gerçek veri varsa ekle
  if (specs.stars && typeof specs.stars === 'number' && specs.stars > 0) {
    productSchema.aggregateRating = {
      '@type':       'AggregateRating',
      ratingValue:   specs.stars.toFixed(1),
      reviewCount:   String(specs.reviewsCount ?? specs.commentCount ?? 1),
      bestRating:    '5',
      worstRating:   '1',
    };
  }

  // BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      {
        '@type':    'ListItem',
        position:   1,
        name:       'Ana Sayfa',
        item:       BASE_URL,
      },
      {
        '@type':    'ListItem',
        position:   2,
        name:       catLabel,
        item:       `${BASE_URL}/compare/${category}`,
      },
      {
        '@type':    'ListItem',
        position:   3,
        name,
        item:       pageUrl,
      },
    ],
  };

  // WebPage schema
  const webPageSchema = {
    '@context':    'https://schema.org',
    '@type':       'WebPage',
    '@id':         pageUrl,
    url:           pageUrl,
    name:          `${name} Fiyat ve Özellikler`,
    description:   productSchema.description,
    inLanguage:    'tr-TR',
    isPartOf: {
      '@type': 'WebSite',
      '@id':   BASE_URL,
      name:    'RATIO.RUN',
      url:     BASE_URL,
    },
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
  };

  return [productSchema, breadcrumbSchema, webPageSchema];
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

  // Benzer ürünler
  const price     = product.avg_price ?? product.price ?? 0;
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

  // JSON-LD — server tarafında üretiliyor, Google her zaman okur
  const jsonLdSchemas = buildJsonLd(product, category, productId);

  return (
    <>
      {/* Tüm JSON-LD şemaları — server-side render */}
      {jsonLdSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <ProductDetailClient
        product={product}
        category={cat ?? { id: '', name: CATEGORY_LABELS[slug] ?? slug, slug }}
        categorySlug={slug}
        categoryUrl={category}
        similarProducts={similarProducts ?? []}
      />
    </>
  );
}
