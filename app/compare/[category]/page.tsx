'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const GOLD        = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';
const PAGE_SIZE   = 48;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://srypulfxbckherkmrjgs.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeXB1bGZ4YmNraGVya21yamdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTczMDcsImV4cCI6MjA4NjczMzMwN30.gEYVh5tjSrO3sgc5rsnYgVrIy6YdK3I5qU5S6FwkX-I';
const supabase = createClient(supabaseUrl, supabaseKey);

// Orijinal çalışan SLUG_MAP — sadece farklı olanlar
const SLUG_MAP: Record<string, string> = {
  araba: 'otomobil',
};

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number | null;
  image_url: string | null;
  source_url: string;
  specifications: { stars?: number; listPrice?: number } | null;
}

function getPrice(p: Product): number | null {
  if (p.price && p.price >= 100) return p.price;
  const lp = p.specifications?.listPrice;
  if (lp && Number(lp) >= 100) return Number(lp);
  return null;
}

const NOISE_WORDS = [
  'Android Akıllı Telefon','Akıllı Telefon','Cep Telefonu',
  'Akıllı Saat','Spor Saati','Fitness Tracker','Smartwatch','Smart Watch',
  'Dizüstü Bilgisayar','Bilgisayar','Laptop','Notebook',
  'Robot Süpürge','Akıllı Süpürge','Robot Vacuum',
  'Kablosuz Kulaklık','Kulak İçi Kulaklık','Kulaklık','Earbuds',
  'Akıllı TV','Smart TV','Televizyon','QLED TV','OLED TV',
  'Tablet Bilgisayar','Android Tablet',
  'Türkiye Garantili','Türkiye Garanti','TR Garantili',
  'Siyah','Beyaz','Gri','Mavi','Kırmızı','Altın','Gümüş',
];

function formatName(name: string, brand: string): string {
  if (!name) return brand || 'Ürün';
  let s = name.trim();
  s = s.replace(/^.+?[\u2018\u2019\u0060']\s*[uüiı]\s+ziyaret\s+edin\s+/i, '').trim();
  s = s.replace(/^.+?ziyaret\s+edin\s+/i, '').trim();
  s = s.replace(/\s*\([^)]*\)/g, '').trim();
  s = s.replace(/\s*\[[^\]]*\]/g, '').trim();
  s = s.split(',')[0].trim();
  s = s.split(/\s+[–—]\s+/)[0].trim();
  s = s.split(' | ')[0].trim();
  for (const word of NOISE_WORDS) {
    const re = new RegExp(`\\s*\\b${word}\\b\\s*`, 'gi');
    s = s.replace(re, ' ').trim();
  }
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/[,.\-–—]+$/, '').trim();
  if (brand && brand.length > 1 && !s.toLowerCase().startsWith(brand.toLowerCase())) {
    s = `${brand} ${s}`;
  }
  if (s.replace(/\s/g, '').length < 3) s = name.split(' ').slice(0, 5).join(' ');
  if (s.length > 44) s = s.substring(0, 41) + '...';
  return s;
}

export default function CategoryPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const slug         = params?.category as string ?? '';
  const searchQuery  = searchParams?.get('search') ?? '';

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
    if (slug) {
      setProducts([]);
      setOffset(0);
      setSelected([]);
      setNotFound(false);
      fetchProducts(0, true, '');
    }
  }, [slug, searchQuery]);

  async function fetchProducts(currentOffset: number, isFirst: boolean, resolvedCatId: string) {
    if (isFirst) setLoading(true);
    else setLoadingMore(true);

    try {
      // Tüm kategori slug'da çalışan orijinal mantık
      if (slug === 'all') {
        if (isFirst) setCatName(searchQuery ? `"${searchQuery}" için sonuçlar` : 'Tüm Ürünler');
        let q = supabase
          .from('products')
          .select('id,name,brand,price,image_url,source_url,specifications', { count: 'exact' })
          .eq('is_active', true)
          .range(currentOffset, currentOffset + PAGE_SIZE - 1);
        if (searchQuery) {
          q = q.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
        } else {
          q = q.order('created_at', { ascending: false });
        }
        const { data, count } = await q;
        if (isFirst) { setProducts((data as Product[]) ?? []); setTotalCount(count ?? 0); }
        else setProducts(prev => [...prev, ...((data as Product[]) ?? [])]);
        setOffset(currentOffset + PAGE_SIZE);
        return;
      }

      // Kategori ID çöz — sadece ilk yüklemede
      let activeCatId = resolvedCatId;
      if (isFirst || !activeCatId) {
        // 1. Önce SLUG_MAP ile dene
        const dbSlug = SLUG_MAP[slug.toLowerCase()] ?? slug.toLowerCase();
        
        // 2. Tüm kategorileri çek ve frontend'de eşleştir (en güvenilir yöntem)
        const { data: allCats } = await supabase
          .from('categories').select('id, name, slug');
        
        if (!allCats || allCats.length === 0) { setNotFound(true); return; }

        // Eşleştirme öncelikleri: exact slug > mapped slug > name içeriyor > slug içeriyor
        const s = slug.toLowerCase();
        const mapped = (SLUG_MAP[s] ?? s).toLowerCase();
        
        let category = 
          allCats.find(c => c.slug?.toLowerCase() === s) ||
          allCats.find(c => c.slug?.toLowerCase() === mapped) ||
          allCats.find(c => c.name?.toLowerCase() === s) ||
          allCats.find(c => c.name?.toLowerCase().includes(s)) ||
          allCats.find(c => c.slug?.toLowerCase().includes(s));

        if (!category) { setNotFound(true); return; }
        setCatName(category.name);
        setCatId(category.id);
        activeCatId = category.id;
      }

      let q = supabase
        .from('products')
        .select('id,name,brand,price,image_url,source_url,specifications', { count: 'exact' })
        .eq('category_id', activeCatId)
        .eq('is_active', true)
        .range(currentOffset, currentOffset + PAGE_SIZE - 1);

      if (searchQuery) {
        q = q.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
      } else {
        q = q.order('price', { ascending: true, nullsFirst: false });
      }

      const { data, count } = await q;
      if (isFirst) { setProducts((data as Product[]) ?? []); setTotalCount(count ?? 0); }
      else setProducts(prev => [...prev, ...((data as Product[]) ?? [])]);
      setOffset(currentOffset + PAGE_SIZE);
    } catch (err) {
      console.error('[CategoryPage]', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function loadMore() {
    fetchProducts(offset, false, catId);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  const hasMore = products.length < totalCount && products.length > 0;

  if (notFound) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl font-bold">Kategori bulunamadı</h1>
        <p className="text-gray-400">"{slug}" kategorisi veritabanında mevcut değil.</p>
        <Link href="/" className="mt-4 px-6 py-3 rounded-xl font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}>
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur z-50"
        style={{ borderColor: `${GOLD}30` }}>
        <Link href="/">
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 32, width: 'auto' }} />
        </Link>
        <span className="text-sm text-gray-400 font-medium">{catName}</span>
      </nav>

      {/* Karşılaştır Floating Butonu */}
      {selected.length === 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => router.push(`/compare/${slug}/${selected[0]}/${selected[1]}`)}
            className="px-8 py-4 font-bold rounded-2xl text-lg flex items-center gap-3 text-white"
            style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`, boxShadow: `0 8px 32px ${GOLD}50` }}
          >
            ⚡ Karşılaştır
            <span className="text-sm opacity-80">(2 ürün seçildi)</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">{catName || ' '}</h1>
          <p className="text-gray-400">
            {loading
              ? <span className="inline-block w-20 h-4 bg-gray-800 rounded animate-pulse" />
              : <>
                  {totalCount} ürün
                  {selected.length < 2 && products.length > 0 && (
                    <span style={{ color: GOLD }}> • Karşılaştırmak için 2 ürün seç</span>
                  )}
                </>
            }
          </p>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}>
                <div className="aspect-square bg-gray-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-5 bg-gray-800 rounded w-1/2 mt-3" />
                </div>
              </div>
            ))}
          </div>

        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-xl">Bu kategoride henüz ürün yok.</p>
          </div>

        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const isSelected = selected.includes(product.id);
                const selIndex   = selected.indexOf(product.id) + 1;
                const price      = getPrice(product);
                const rating     = typeof product.specifications?.stars === 'number' ? product.specifications.stars : 0;

                return (
                  <div key={product.id} onClick={() => toggleSelect(product.id)}
                    className="relative cursor-pointer rounded-2xl border transition-all duration-150 flex flex-col"
                    style={isSelected ? {
                      borderColor: GOLD, background: `${GOLD}10`,
                      boxShadow: `0 0 20px ${GOLD}25`, transform: 'scale(1.02)',
                    } : {
                      borderColor: 'rgb(31 41 55)', background: 'rgba(17,24,39,0.4)',
                    }}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black z-10 text-black"
                        style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}>
                        {selIndex}
                      </div>
                    )}

                    {/* Görsel — lazy load */}
                    <div className="w-full rounded-t-2xl overflow-hidden bg-[#0d0d0d]"
                      style={{ paddingBottom: '100%', position: 'relative' }}>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
                        />
                      ) : (
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', opacity: 0.1 }}>📦</span>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-sm font-semibold text-gray-200 line-clamp-2 leading-tight mb-2 flex-1">
                        {formatName(product.name, product.brand)}
                      </h3>
                      {rating > 0 && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <span className="text-xs" style={{ color: GOLD_BRIGHT }}>
                            {'★'.repeat(Math.min(Math.round(rating), 5))}
                          </span>
                          <span className="text-gray-500 text-xs">{rating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="text-base font-bold text-white mt-auto">
                        {price
                          ? `₺${price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                          : <span className="text-gray-500 text-xs">Fiyat güncelleniyor</span>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Daha Fazla Yükle */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button onClick={loadMore} disabled={loadingMore}
                  className="px-8 py-3 rounded-xl font-bold border transition-all text-white"
                  style={{ borderColor: `${GOLD}60` }}>
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-gray-600 rounded-full animate-spin"
                        style={{ borderTopColor: GOLD }} />
                      Yükleniyor...
                    </span>
                  ) : (
                    `Daha Fazla Göster (${totalCount - products.length} ürün kaldı)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
