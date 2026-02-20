// app/compare/[category]/CategoryClient.tsx
// CLIENT COMPONENT — sadece interaktif kısımlar burada
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  source_url: string;
  stars?: number;
  listPrice?: number;
}

interface Props {
  slug: string;
  catName: string;
  catId: string;
  initialProducts: Product[];
  totalCount: number;
  searchQuery: string;
  notFound: boolean;
}

function getPrice(p: Product): number | null {
  if (p.price && p.price >= 100) return p.price;
  if (p.listPrice && Number(p.listPrice) >= 100) return Number(p.listPrice);
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

export default function CategoryClient({
  slug, catName, catId, initialProducts, totalCount, searchQuery, notFound
}: Props) {
  const router = useRouter();
  const [products,    setProducts]    = useState<Product[]>(initialProducts);
  const [selected,    setSelected]    = useState<string[]>([]);
  const [offset,      setOffset]      = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = products.length < totalCount;

  async function loadMore() {
    setLoadingMore(true);
    try {
      let q = supabase
        .from('products')
        .select('id,name,brand,price,image_url,source_url,specifications->stars,specifications->listPrice')
        .eq('category_id', catId)
        .eq('is_active', true)
        .order('price', { ascending: true, nullsFirst: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (searchQuery) {
        q = q.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
      }

      const { data } = await q;
      setProducts(prev => [...prev, ...((data as Product[]) ?? [])]);
      setOffset(prev => prev + PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
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

  if (notFound) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl font-bold">Kategori bulunamadı</h1>
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

      {/* Karşılaştır Butonu */}
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
          <h1 className="text-4xl font-black mb-2">{catName}</h1>
          <p className="text-gray-400">
            {totalCount} ürün
            {selected.length < 2 && products.length > 0 && (
              <span style={{ color: GOLD }}> • Karşılaştırmak için 2 ürün seç</span>
            )}
          </p>
        </div>

        {/* Ürün Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => {
            const isSelected = selected.includes(product.id);
            const selIndex   = selected.indexOf(product.id) + 1;
            const price      = getPrice(product);
            const rating     = typeof product.stars === 'number' ? product.stars : 0;

            return (
              <div
                key={product.id}
                onClick={() => toggleSelect(product.id)}
                className="relative cursor-pointer rounded-2xl border transition-all duration-150 flex flex-col"
                style={isSelected ? {
                  borderColor: GOLD,
                  background: `${GOLD}10`,
                  boxShadow: `0 0 20px ${GOLD}25`,
                  transform: 'scale(1.02)',
                } : {
                  borderColor: 'rgb(31 41 55)',
                  background: 'rgba(17,24,39,0.4)',
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

        {/* Daha Fazla */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-8 py-3 rounded-xl font-bold border transition-all text-white"
              style={{ borderColor: `${GOLD}60` }}
            >
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
      </div>
    </div>
  );
}
