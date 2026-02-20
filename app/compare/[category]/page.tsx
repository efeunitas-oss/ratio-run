'use client';

// app/compare/[category]/page.tsx
// TEK DOSYA — CategoryClient ayrı değil, her şey burada

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const GOLD        = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';
const PAGE_SIZE   = 48;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number | null;
  image_url: string | null;
  specifications: Record<string, any> | null;
}

function getPrice(p: Product): number | null {
  if (p.price && p.price >= 100) return p.price;
  const lp = p.specifications?.listPrice;
  if (lp && Number(lp) >= 100) return Number(lp);
  return null;
}

function formatName(name: string, brand: string): string {
  if (!name) return brand || 'Ürün';
  let s = name.trim();
  s = s.replace(/^.+?ziyaret\s+edin\s+/i, '').trim();
  s = s.replace(/\s*\([^)]*\)/g, '').trim();
  s = s.replace(/\s*\[[^\]]*\]/g, '').trim();
  s = s.split(',')[0].trim();
  s = s.split(/\s+[–—]\s+/)[0].trim();
  s = s.split(' | ')[0].trim();
  const noise = ['Android Akıllı Telefon','Akıllı Telefon','Cep Telefonu','Akıllı Saat',
    'Dizüstü Bilgisayar','Bilgisayar','Laptop','Robot Süpürge','Kablosuz Kulaklık',
    'Kulaklık','Earbuds','Akıllı TV','Smart TV','Televizyon','Tablet Bilgisayar',
    'Türkiye Garantili','TR Garantili'];
  for (const w of noise) s = s.replace(new RegExp(`\\s*\\b${w}\\b\\s*`, 'gi'), ' ').trim();
  s = s.replace(/\s+/g, ' ').replace(/[,.\-–—]+$/, '').trim();
  if (brand?.length > 1 && !s.toLowerCase().startsWith(brand.toLowerCase())) s = `${brand} ${s}`;
  if (s.replace(/\s/g, '').length < 3) s = name.split(' ').slice(0, 5).join(' ');
  return s.length > 44 ? s.substring(0, 41) + '...' : s;
}

export default function CategoryPage() {
  const params      = useParams();
  const searchParams = useSearchParams();
  const router      = useRouter();

  // useParams her zaman string veya string[] döner — güvenli al
  const rawSlug    = params?.category;
  const slug       = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug ?? '');
  const searchQuery = searchParams?.get('search') ?? '';

  const [products,    setProducts]    = useState<Product[]>([]);
  const [catName,     setCatName]     = useState('');
  const [catId,       setCatId]       = useState('');
  const [totalCount,  setTotalCount]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notFound,    setNotFound]    = useState(false);
  const [selected,    setSelected]    = useState<string[]>([]);
  const [offset,      setOffset]      = useState(0);

  useEffect(() => {
    if (!slug) return;
    setProducts([]); setOffset(0); setSelected([]); setNotFound(false);
    load(0, '');
  }, [slug, searchQuery]);

  async function load(currentOffset: number, resolvedId: string) {
    if (currentOffset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      // Kategori ID'yi çöz — sadece ilk yüklemede
      let activeCatId = resolvedId;

      if (!activeCatId) {
        // Tüm kategorileri çek, esnek eşleştir
        const { data: allCats } = await supabase
          .from('categories').select('id, name, slug');

        if (!allCats?.length) { setNotFound(true); setLoading(false); return; }

        const s = slug.toLowerCase();
        const aliases: Record<string, string[]> = {
          araba:          ['otomobil', 'araba'],
          tv:             ['televizyon', 'tv'],
          saat:           ['akilli-saat', 'saat', 'akıllı-saat'],
          'robot-supurge':['robot-supurge', 'robot-süpürge', 'robotsupurge'],
        };
        const candidates = [s, ...(aliases[s] ?? [])];

        const cat =
          allCats.find(c => candidates.includes(c.slug?.toLowerCase() ?? '')) ||
          allCats.find(c => candidates.includes(c.name?.toLowerCase() ?? '')) ||
          allCats.find(c => candidates.some(cand => c.slug?.toLowerCase().includes(cand))) ||
          allCats.find(c => candidates.some(cand => cand.includes(c.slug?.toLowerCase() ?? '')));

        if (!cat) { setNotFound(true); setLoading(false); return; }

        setCatName(cat.name);
        setCatId(cat.id);
        activeCatId = cat.id;
      }

      // Ürünleri çek
      let q = supabase
        .from('products')
        .select('id,name,brand,price,image_url,specifications', { count: 'exact' })
        .eq('category_id', activeCatId)
        .eq('is_active', true)
        .range(currentOffset, currentOffset + PAGE_SIZE - 1);

      if (searchQuery) {
        q = q.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
      } else {
        q = q.order('price', { ascending: true, nullsFirst: false });
      }

      const { data, count } = await q;
      const fetched = (data as Product[]) ?? [];

      if (currentOffset === 0) {
        setProducts(fetched);
        setTotalCount(count ?? 0);
      } else {
        setProducts(prev => [...prev, ...fetched]);
      }
      setOffset(currentOffset + PAGE_SIZE);

    } catch (err) {
      console.error('[CategoryPage]', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  const hasMore = products.length > 0 && products.length < totalCount;

  // ── NOT FOUND ──────────────────────────────────────────────────────────────
  if (notFound) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="text-2xl font-bold">Kategori bulunamadı</h1>
      <p className="text-gray-500 text-sm">"{slug}"</p>
      <Link href="/" className="mt-4 px-6 py-3 rounded-xl font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}>
        Ana Sayfaya Dön
      </Link>
    </div>
  );

  // ── ANA SAYFA ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">

      {/* Nav */}
      <nav className="border-b px-4 py-3 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur z-50"
        style={{ borderColor: `${GOLD}30` }}>
        <Link href="/">
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 30, width: 'auto' }} />
        </Link>
        <span className="text-sm text-gray-400 truncate max-w-[200px]">{catName}</span>
      </nav>

      {/* Karşılaştır Butonu */}
      {selected.length === 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm">
          <button
            onClick={() => router.push(`/compare/${slug}/${selected[0]}/${selected[1]}`)}
            className="w-full py-4 font-bold rounded-2xl text-base flex items-center justify-center gap-2 text-white"
            style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`, boxShadow: `0 8px 32px ${GOLD}50` }}
          >
            ⚡ Karşılaştır
            <span className="text-sm opacity-80">(2 ürün seçildi)</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">

        {/* Başlık */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-black mb-1">{catName || ' '}</h1>
          <p className="text-gray-500 text-sm">
            {loading
              ? <span className="inline-block w-16 h-3 bg-gray-800 rounded animate-pulse" />
              : <>{totalCount} ürün{selected.length < 2 && products.length > 0 &&
                  <span style={{ color: GOLD }}> · 2 ürün seç, karşılaştır</span>}</>
            }
          </p>
        </div>

        {/* Skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="aspect-square bg-gray-800" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-800 rounded w-full" />
                  <div className="h-3 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-1/2 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <div className="text-5xl mb-4">📦</div>
            <p>Bu kategoride henüz ürün yok.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => {
                const isSelected = selected.includes(product.id);
                const selIndex   = selected.indexOf(product.id) + 1;
                const price      = getPrice(product);
                const rating     = typeof product.specifications?.stars === 'number'
                  ? product.specifications.stars : 0;

                return (
                  <div key={product.id} onClick={() => toggleSelect(product.id)}
                    className="relative cursor-pointer rounded-2xl border flex flex-col overflow-hidden"
                    style={isSelected
                      ? { borderColor: GOLD, background: `${GOLD}10`, boxShadow: `0 0 16px ${GOLD}30` }
                      : { borderColor: '#1F2937', background: 'rgba(17,24,39,0.5)' }}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black z-10 text-black"
                        style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}>
                        {selIndex}
                      </div>
                    )}

                    {/* Görsel */}
                    <div className="bg-[#0a0a0a]" style={{ position: 'relative', paddingBottom: '90%' }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name}
                          loading="lazy" decoding="async" referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                        />
                      ) : (
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.08 }}>📦</span>
                      )}
                    </div>

                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-xs font-medium text-gray-300 line-clamp-2 leading-snug mb-2 flex-1">
                        {formatName(product.name, product.brand)}
                      </p>
                      {rating > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          <span style={{ color: GOLD_BRIGHT, fontSize: 10 }}>
                            {'★'.repeat(Math.min(Math.round(rating), 5))}
                          </span>
                          <span className="text-gray-600 text-xs">{rating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="text-sm font-bold text-white">
                        {price
                          ? `₺${price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                          : <span className="text-gray-600 text-xs">Fiyat güncelleniyor</span>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8 pb-24">
                <button onClick={() => load(offset, catId)} disabled={loadingMore}
                  className="px-8 py-3 rounded-xl font-bold border text-white text-sm"
                  style={{ borderColor: `${GOLD}50` }}>
                  {loadingMore
                    ? <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-gray-700 rounded-full animate-spin" style={{ borderTopColor: GOLD }} />
                        Yükleniyor...
                      </span>
                    : `Daha Fazla (${totalCount - products.length} ürün)`
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
