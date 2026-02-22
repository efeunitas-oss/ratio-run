// app/compare/[category]/CategoryClient.tsx
'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const GOLD        = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number | null;
  avg_price: number | null;
  image_url: string | null;
  source_url: string;
  source_name: string;
  sources: any[];
  specifications: Record<string, any>;
  stock_status: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  category: Category;
  initialProducts: Product[];
  categorySlug: string;
}

const NOISE_WORDS = [
  'Android Akıllı Telefon','Akıllı Telefon','Cep Telefonu',
  'Akıllı Saat','Spor Saati','Dizüstü Bilgisayar',
  'Laptop','Notebook','Robot Süpürge','Kablosuz Kulaklık',
  'Akıllı TV','Smart TV','Televizyon','Tablet Bilgisayar',
  'Türkiye Garantili','TR Garantili','Türkiye Garanti',
  'Yenilenmiş','Yenilenmiş ',
];

function formatName(name: string, brand: string): string {
  if (!name) return brand || 'Ürün';
  let s = name.trim().split(',')[0].split(' | ')[0].trim();
  for (const w of NOISE_WORDS) {
    s = s.replace(new RegExp(`\\s*\\b${w}\\b\\s*`, 'gi'), ' ').trim();
  }
  s = s.replace(/\s+/g, ' ').replace(/[,.\-–—]+$/, '').trim();
  if (brand?.length > 1 && !s.toLowerCase().startsWith(brand.toLowerCase())) {
    s = `${brand} ${s}`;
  }
  return s.length > 55 ? s.substring(0, 52) + '...' : s;
}

export default function CategoryClient({ category, initialProducts, categorySlug }: Props) {
  const [products, setProducts]   = useState<Product[]>(initialProducts);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(initialProducts.length === 48);
  const [sortBy, setSortBy]       = useState<'price' | 'rating' | 'score'>('price');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const from = page * 48;
    const { data } = await supabase
      .from('products')
      .select('id, name, brand, model, price, avg_price, image_url, source_url, source_name, sources, specifications, is_active, stock_status')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('price', { ascending: true, nullsFirst: false })
      .range(from, from + 47);

    if (data) {
      setProducts(prev => [...prev, ...data]);
      setHasMore(data.length === 48);
      setPage(prev => prev + 1);
    }
    setLoading(false);
  }, [loading, page, category.id]);

  // Filtrele + sırala
  const filtered = products
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'price') {
        const pa = a.avg_price || a.price || 999999;
        const pb = b.avg_price || b.price || 999999;
        return pa - pb;
      }
      if (sortBy === 'rating') {
        return (b.specifications?.stars || 0) - (a.specifications?.stars || 0);
      }
      return (b.specifications?.overall_score || 0) - (a.specifications?.overall_score || 0);
    });

  const overallScore = (p: Product) => p.specifications?.overall_score || null;
  const rating       = (p: Product) => p.specifications?.stars || 0;

  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${GOLD}35`, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 36, width: 'auto' }} />
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
            ratio<span style={{ color: GOLD_BRIGHT }}>.run</span>
          </span>
        </a>
        <span style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>
          {filtered.length} ürün
        </span>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 16px' }}>

        {/* Başlık + Filtreler */}
        <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{category.name}</h1>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>
              {products.length} ürün · 2 ürün seç, karşılaştır
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Arama */}
            <input
              type="text"
              placeholder="Bu kategoride ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: '#111827', border: `1px solid ${GOLD}50`,
                color: '#fff', padding: '8px 14px', borderRadius: 10,
                fontSize: 13, outline: 'none', width: 200,
              }}
            />
            {/* Sıralama */}
            {(['price', 'rating', 'score'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: 'none',
                  background: sortBy === s ? `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` : '#111827',
                  color: sortBy === s ? '#000' : '#9ca3af',
                }}
              >
                {s === 'price' ? 'Fiyat' : s === 'rating' ? 'Puan' : 'Ratio'}
              </button>
            ))}
          </div>
        </div>

        {/* Ürün Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 12 }}>
          {filtered.map(product => {
            const price = product.avg_price || product.price;
            const score = overallScore(product);
            const stars = rating(product);

            return (
              <div
                key={product.id}
                style={{
                  display: 'flex', flexDirection: 'column',
                  background: 'rgba(17,24,39,0.6)', border: '1px solid #1F2937',
                  borderRadius: 16, overflow: 'hidden',
                  transition: 'border-color 0.15s, transform 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${GOLD}80`;
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#1F2937';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Görsel */}
                <div style={{ background: '#0d0d0d', position: 'relative', paddingBottom: '80%' }}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                    />
                  ) : (
                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, opacity: 0.08 }}>📦</span>
                  )}
                  {/* Ratio Score badge */}
                  {score !== null && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: score >= 8 ? '#15803d' : score >= 6 ? GOLD : '#6b7280',
                      color: '#fff', borderRadius: 8, padding: '2px 7px',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {score}/10
                    </div>
                  )}
                </div>

                {/* Bilgi */}
                <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', lineHeight: 1.4, margin: 0 }}>
                    {formatName(product.name, product.brand)}
                  </p>

                  {stars > 0 && (
                    <span style={{ fontSize: 11, color: GOLD_BRIGHT }}>
                      {'★'.repeat(Math.min(Math.round(stars), 5))}{'☆'.repeat(Math.max(0, 5 - Math.round(stars)))} {stars.toFixed(1)}
                    </span>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: '1px solid #1f2937' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
                      {price
                        ? `₺${price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                        : <span style={{ color: '#6b7280', fontSize: 11 }}>Fiyat güncelleniyor</span>
                      }
                    </p>
                    {/* Kaynak linkler */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {Array.isArray(product.sources) && product.sources.length > 0
                        ? product.sources.map((s: any, i: number) => (
                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 10, color: GOLD_BRIGHT, textDecoration: 'none', border: `1px solid ${GOLD}40`, borderRadius: 4, padding: '2px 5px' }}
                              onClick={e => e.stopPropagation()}>
                              {s.name}
                            </a>
                          ))
                        : product.source_url && (
                            <a href={product.source_url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 10, color: GOLD_BRIGHT, textDecoration: 'none', border: `1px solid ${GOLD}40`, borderRadius: 4, padding: '2px 5px' }}
                              onClick={e => e.stopPropagation()}>
                              {product.source_name}
                            </a>
                          )
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Daha fazla yükle */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button
              onClick={loadMore}
              disabled={loading}
              style={{
                padding: '12px 36px', borderRadius: 12, fontWeight: 700, fontSize: 14,
                background: loading ? '#374151' : `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
                color: loading ? '#9ca3af' : '#000', border: 'none', cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16 }}>&ldquo;{search}&rdquo; için sonuç bulunamadı</p>
          </div>
        )}
      </div>
    </main>
  );
}
