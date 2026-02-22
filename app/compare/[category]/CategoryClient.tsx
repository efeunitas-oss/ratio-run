// app/compare/[category]/CategoryClient.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { compareProducts } from '@/lib/ratio-engine';
import { ComparisonView } from '@/components/comparison/ComparisonView';

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
  sources: any;
  specifications: Record<string, any>;
  stock_status: string;
}

interface Category { id: string; name: string; slug: string; }

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
  'Türkiye Garantili','TR Garantili','Türkiye Garanti','Yenilenmiş',
];

function formatName(name: string, brand: string): string {
  if (!name) return brand || 'Ürün';
  let s = name.trim().split(',')[0].split(' | ')[0].trim();
  for (const w of NOISE_WORDS) {
    s = s.replace(new RegExp(`\\b${w}\\b`, 'gi'), ' ').trim();
  }
  s = s.replace(/\s+/g, ' ').replace(/[,.\-–—]+$/, '').trim();
  if (brand?.length > 1 && !s.toLowerCase().startsWith(brand.toLowerCase())) {
    s = `${brand} ${s}`;
  }
  return s.length > 55 ? s.substring(0, 52) + '...' : s;
}

export default function CategoryClient({ category, initialProducts, categorySlug }: Props) {
  const searchParams = useSearchParams();

  const [products, setProducts]       = useState<Product[]>(initialProducts);
  const [selected, setSelected]       = useState<Product[]>([]);
  const [comparison, setComparison]   = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(initialProducts.length === 48);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Global aramadan ?productA= gelince otomatik seç
  useEffect(() => {
    const pAid = searchParams.get('productA');
    if (!pAid) return;
    const found = products.find(p => p.id === pAid);
    if (found) setSelected([found]);
  }, [searchParams, products]);

  const toggleSelect = useCallback((product: Product) => {
    setComparison(null);
    setSelected(prev => {
      const isSelected = prev.find(p => p.id === product.id);
      if (isSelected) return prev.filter(p => p.id !== product.id);
      if (prev.length >= 2) return [prev[1], product];
      return [...prev, product];
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (selected.length !== 2) return;
    const result = compareProducts(selected[0] as any, selected[1] as any, categorySlug);
    setComparison(result);
    // Karşılaştırma sonucuna scroll — aşağıda açılır
    setTimeout(() => {
      document.getElementById('comparison-result')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [selected, categorySlug]);

  const handleRestart = () => {
    setComparison(null);
    setSelected([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const from = page * 48;
    const { data } = await supabase
      .from('products')
      .select('id, name, brand, model, price, avg_price, image_url, source_url, source_name, sources, specifications, stock_status')
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

  const filtered = products
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const pa = a.avg_price || a.price || 999999;
      const pb = b.avg_price || b.price || 999999;
      return pa - pb;
    });

  const isSelected = (p: Product) => !!selected.find(s => s.id === p.id);

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
        {selected.length > 0 && !comparison && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>{selected.length}/2 seçildi</span>
            {selected.length === 2 && (
              <button onClick={handleCompare} style={{
                padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
                color: '#000', border: 'none', cursor: 'pointer',
              }}>
                Karşılaştır →
              </button>
            )}
          </div>
        )}
        {comparison && (
          <button onClick={handleRestart} style={{
            padding: '8px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13,
            background: 'transparent', color: '#9ca3af',
            border: '1px solid #374151', cursor: 'pointer',
          }}>
            ← Geri Dön
          </button>
        )}
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 16px' }}>

        {/* Karşılaştırma açıkken sadece ComparisonView göster */}
        {comparison ? (
          <div id="comparison-result">
            <ComparisonView comparison={comparison} categorySlug={categorySlug} />
          </div>
        ) : (
          <>
            {/* Başlık + Arama */}
            <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{category.name}</h1>
                <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>
                  {filtered.length} ürün · <span style={{ color: GOLD_BRIGHT }}>2 ürün seç, karşılaştır</span>
                </p>
              </div>
              <input
                type="text"
                placeholder="Bu kategoride ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: '#111827', border: `1px solid ${GOLD}50`,
                  color: '#fff', padding: '9px 14px', borderRadius: 10,
                  fontSize: 13, outline: 'none', width: 240,
                }}
              />
            </div>

            {/* Seçili ürünler bar */}
            {selected.length > 0 && (
              <div style={{
                marginBottom: 20, padding: '14px 18px', borderRadius: 14,
                background: 'rgba(201,162,39,0.08)', border: `1px solid ${GOLD}40`,
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 13, color: GOLD_BRIGHT, fontWeight: 600 }}>Seçilenler:</span>
                {selected.map(p => (
                  <span key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#1f2937', borderRadius: 8, padding: '5px 10px', fontSize: 12,
                  }}>
                    {formatName(p.name, p.brand)}
                    <button onClick={() => toggleSelect(p)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0, fontSize: 14 }}>✕</button>
                  </span>
                ))}
                {selected.length === 2 && (
                  <button onClick={handleCompare} style={{
                    marginLeft: 'auto', padding: '8px 20px', borderRadius: 9, fontWeight: 700, fontSize: 13,
                    background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
                    color: '#000', border: 'none', cursor: 'pointer',
                  }}>
                    Karşılaştır →
                  </button>
                )}
              </div>
            )}

            {/* Ürün Grid — görseller aynı hizada */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 12 }}>
              {filtered.map(product => {
                const price = product.avg_price || product.price;
                const score = product.specifications?.overall_score ?? null;
                const stars = product.specifications?.stars || 0;
                const sel   = isSelected(product);

                return (
                  <div
                    key={product.id}
                    onClick={() => toggleSelect(product)}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      background: sel ? 'rgba(201,162,39,0.12)' : 'rgba(17,24,39,0.6)',
                      border: sel ? `2px solid ${GOLD}` : '1px solid #1F2937',
                      borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                      transition: 'border-color 0.15s, transform 0.15s, background 0.15s',
                      transform: sel ? 'translateY(-3px)' : 'none',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = `${GOLD}60`; }}
                    onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = '#1F2937'; }}
                  >
                    {sel && (
                      <div style={{
                        position: 'absolute', top: 8, left: 8, zIndex: 10,
                        background: GOLD, color: '#000', borderRadius: 6,
                        padding: '2px 8px', fontSize: 10, fontWeight: 700,
                      }}>
                        ✓ SEÇİLDİ
                      </div>
                    )}

                    {/* Görsel — sabit yükseklik, hepsi aynı hizada */}
                    <div style={{ background: '#0d0d0d', width: '100%', height: 160, position: 'relative', flexShrink: 0 }}>
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
                      {score !== null && (
                        <div style={{
                          position: 'absolute', top: 8, right: 8,
                          background: score >= 8 ? '#15803d' : score >= 6 ? '#92400e' : '#374151',
                          color: '#fff', borderRadius: 8, padding: '2px 7px',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {score}/10
                        </div>
                      )}
                    </div>

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
                            : <span style={{ color: '#6b7280', fontSize: 11 }}>Fiyat güncelleniyor</span>}
                        </p>
                        <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                          {Array.isArray(product.sources) && product.sources.length > 0
                            ? product.sources.map((s: any, i: number) => (
                                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{ fontSize: 10, color: GOLD_BRIGHT, textDecoration: 'none', border: `1px solid ${GOLD}40`, borderRadius: 4, padding: '2px 5px' }}>
                                  {s.name} ↗
                                </a>
                              ))
                            : product.source_url && (
                                <a href={product.source_url} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{ fontSize: 10, color: GOLD_BRIGHT, textDecoration: 'none', border: `1px solid ${GOLD}40`, borderRadius: 4, padding: '2px 5px' }}>
                                  {product.source_name} ↗
                                </a>
                              )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button onClick={loadMore} disabled={loading} style={{
                  padding: '12px 36px', borderRadius: 12, fontWeight: 700, fontSize: 14,
                  background: loading ? '#374151' : `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
                  color: loading ? '#9ca3af' : '#000', border: 'none', cursor: loading ? 'default' : 'pointer',
                }}>
                  {loading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
                </button>
              </div>
            )}

            {filtered.length === 0 && search && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p>&ldquo;{search}&rdquo; için sonuç bulunamadı</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
