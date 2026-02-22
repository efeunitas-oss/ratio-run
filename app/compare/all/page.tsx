// app/compare/all/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { compareProducts } from '@/lib/ratio-engine';
import { ComparisonView } from '@/components/comparison/ComparisonView';

const GOLD        = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';

const DB_SLUG_TO_URL: Record<string, string> = {
  'telefon':       'telefon',
  'laptop':        'laptop',
  'tablet':        'tablet',
  'saat':          'saat',
  'kulaklik':      'kulaklik',
  'robot-supurge': 'robot-supurge',
  'tv':            'tv',
  'otomobil':      'araba',
};

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number | null;
  currency: string;
  image_url: string | null;
  source_name: string;
  category_id: string;
  categorySlug?: string;
  specifications?: Record<string, any>;
  sources?: any[];
  source_url?: string;
  avg_price?: number | null;
}

export default function AllPage() {
  const searchParams = useSearchParams();
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<Product[]>([]);
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q && q.length >= 2) handleSearch(q);
  }, []); // eslint-disable-line

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    setComparison(null);
    setSelected([]);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, brand, price, avg_price, currency, image_url, source_name, source_url, sources, specifications, category_id')
        .or(`name.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(40);

      if (!products) { setResults([]); return; }

      const catIds = [...new Set(products.map((p: any) => p.category_id))];
      const { data: categories } = await supabase
        .from('categories')
        .select('id, slug')
        .in('id', catIds);

      const idToSlug: Record<string, string> = {};
      (categories ?? []).forEach((c: any) => {
        idToSlug[c.id] = DB_SLUG_TO_URL[c.slug] ?? c.slug;
      });

      setResults(products.map((p: any) => ({ ...p, categorySlug: idToSlug[p.category_id] ?? 'all' })));
    } finally {
      setSearching(false);
    }
  }, []);

  const toggleSelect = useCallback((product: Product) => {
    setComparison(null);
    setSelected(prev => {
      const already = prev.find(p => p.id === product.id);
      if (already) return prev.filter(p => p.id !== product.id);
      if (prev.length >= 2) return [prev[1], product];
      return [...prev, product];
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (selected.length !== 2) return;
    // İki farklı kategoriden ürün seçildiyse ilk ürünün slug'ını kullan
    const slug = selected[0].categorySlug ?? 'laptop';
    const result = compareProducts(selected[0] as any, selected[1] as any, slug);
    setComparison(result);
    setTimeout(() => {
      document.getElementById('comparison-result')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [selected]);

  const handleRestart = () => {
    setComparison(null);
    setSelected([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <span style={{ fontSize: 13, color: '#9ca3af' }}>{selected.length}/2 seçildi</span>
        )}
        {comparison && (
          <button onClick={handleRestart} style={{ padding: '8px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13, background: 'transparent', color: '#9ca3af', border: '1px solid #374151', cursor: 'pointer' }}>
            ← Geri Dön
          </button>
        )}
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 16px' }}>

        {comparison ? (
          <div id="comparison-result">
            <ComparisonView comparison={comparison} categorySlug={selected[0]?.categorySlug ?? 'laptop'} />
          </div>
        ) : (
          <>
            {/* Arama kutusu */}
            <div style={{ marginBottom: 32, maxWidth: 600 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Marka veya model ara... (örn: Samsung S25, Asus Vivobook)"
                  autoFocus
                  style={{
                    width: '100%', background: '#111827', border: `1px solid ${GOLD}50`,
                    color: '#fff', padding: '14px 20px', borderRadius: 14,
                    fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {searching && (
                  <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, border: '2px solid #374151', borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                )}
              </div>
              {query && !searching && (
                <p style={{ color: '#6b7280', fontSize: 13, marginTop: 8, fontFamily: 'monospace' }}>
                  "{query}" için <span style={{ color: '#fff' }}>{results.length}</span> ürün bulundu
                </p>
              )}
            </div>

            {/* Seçili ürünler bar */}
            {selected.length > 0 && (
              <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 14, background: 'rgba(201,162,39,0.08)', border: `1px solid ${GOLD}40`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: GOLD_BRIGHT, fontWeight: 600 }}>Seçilenler:</span>
                {selected.map(p => (
                  <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1f2937', borderRadius: 8, padding: '5px 10px', fontSize: 12 }}>
                    {p.name?.split(' ').slice(0, 4).join(' ')}
                    <button onClick={() => toggleSelect(p)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0, fontSize: 14 }}>✕</button>
                  </span>
                ))}
                {selected.length === 2 && (
                  <button onClick={handleCompare} style={{ marginLeft: 'auto', padding: '8px 20px', borderRadius: 9, fontWeight: 700, fontSize: 13, background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`, color: '#000', border: 'none', cursor: 'pointer' }}>
                    Karşılaştır →
                  </button>
                )}
              </div>
            )}

            {/* Sonuçlar grid */}
            {results.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 12 }}>
                {results.map(product => {
                  const price = product.avg_price || product.price;
                  const sel = isSelected(product);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleSelect(product)}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        background: sel ? 'rgba(201,162,39,0.12)' : 'rgba(17,24,39,0.6)',
                        border: sel ? `2px solid ${GOLD}` : '1px solid #1F2937',
                        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                        transition: 'border-color 0.15s, transform 0.15s',
                        transform: sel ? 'translateY(-3px)' : 'none',
                        position: 'relative',
                      }}
                      onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = `${GOLD}60`; }}
                      onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = '#1F2937'; }}
                    >
                      {sel && (
                        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, background: GOLD, color: '#000', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                          ✓ SEÇİLDİ
                        </div>
                      )}

                      {/* Görsel — sabit yükseklik */}
                      <div style={{ background: '#0d0d0d', width: '100%', height: 160, position: 'relative', flexShrink: 0 }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} loading="lazy" referrerPolicy="no-referrer"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                        ) : (
                          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, opacity: 0.08 }}>📦</span>
                        )}
                      </div>

                      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {/* Kategori etiketi */}
                        <span style={{ fontSize: 10, color: `${GOLD}90`, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
                          {product.categorySlug}
                        </span>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', lineHeight: 1.4, margin: 0 }}>
                          {product.name?.split(' ').slice(0, 6).join(' ')}
                        </p>
                        <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: '1px solid #1f2937' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
                            {price
                              ? `₺${price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                              : <span style={{ color: '#6b7280', fontSize: 11 }}>Fiyat güncelleniyor</span>}
                          </p>
                          <div style={{ marginTop: 6, padding: '5px 10px', background: `${GOLD}15`, borderRadius: 6, border: `1px solid ${GOLD}30`, textAlign: 'center', fontSize: 11, color: GOLD_BRIGHT, fontWeight: 600 }}>
                            + Karşılaştırmaya Ekle
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !query ? (
              /* Boş durum */
              <div style={{ textAlign: 'center', paddingTop: 80 }}>
                <p style={{ color: '#4b5563', fontSize: 13, marginBottom: 32, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2 }}>
                  Kategori seç veya model ara
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
                  {[
                    { slug: 'telefon', label: 'Akıllı Telefon', icon: '📱' },
                    { slug: 'laptop',  label: 'Laptop',         icon: '💻' },
                    { slug: 'tablet',  label: 'Tablet',         icon: '📲' },
                    { slug: 'saat',    label: 'Akıllı Saat',   icon: '⌚' },
                    { slug: 'kulaklik',label: 'Kulaklık',       icon: '🎧' },
                    { slug: 'robot-supurge', label: 'Robot Süpürge', icon: '🤖' },
                    { slug: 'tv',      label: 'TV',             icon: '📺' },
                    { slug: 'araba',   label: 'Otomobil',       icon: '🚗' },
                  ].map(cat => (
                    <a key={cat.slug} href={`/compare/${cat.slug}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 500, textDecoration: 'none', background: '#0D0D0D', border: '1px solid #1a1a1a', color: '#888' }}>
                      {cat.icon} {cat.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Fixed bottom karşılaştır butonu */}
      {selected.length === 2 && !comparison && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 99 }}>
          <button onClick={handleCompare} style={{
            padding: '14px 36px', borderRadius: 16, fontWeight: 800, fontSize: 16,
            background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
            color: '#000', border: 'none', cursor: 'pointer',
            boxShadow: `0 8px 32px ${GOLD}60`,
            display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap',
          }}>
            ⚡ Karşılaştır <span style={{ fontSize: 13, opacity: 0.75, fontWeight: 600 }}>(2 ürün seçildi)</span>
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </main>
  );
}
