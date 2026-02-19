'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://srypulfxbckherkmrjgs.supabase.co';

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeXB1bGZ4YmNraGVya21yamdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTczMDcsImV4cCI6MjA4NjczMzMwN30.gEYVh5tjSrO3sgc5rsnYgVrIy6YdK3I5qU5S6FwkX-I';

const supabase = createClient(supabaseUrl, supabaseKey);

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
  specifications: Record<string, any> | null;
}

function getPrice(product: Product): number | null {
  // 100 TL altı yanlış parse edilmiş veriler — gösterme
  if (product.price && product.price >= 100) return product.price;
  const s = product.specifications ?? {};
  if (s.price && Number(s.price) >= 100) return Number(s.price);
  if (s.listPrice && Number(s.listPrice) >= 100) return Number(s.listPrice);
  return null;
}

// Gürültü kelimeleri — bunlar isimden çıkarılır
const NOISE_WORDS = [
  'Android Akıllı Telefon', 'Akıllı Telefon', 'Cep Telefonu',
  'Akıllı Saat', 'Spor Saati', 'Fitness Tracker', 'Smartwatch', 'Smart Watch',
  'Dizüstü Bilgisayar', 'Bilgisayar', 'Laptop', 'Notebook',
  'Robot Süpürge', 'Akıllı Süpürge', 'Robot Vacuum',
  'Kablosuz Kulaklık', 'Kulak İçi Kulaklık', 'Kulaklık', 'Earbuds',
  'Akıllı TV', 'Smart TV', 'Televizyon', 'QLED TV', 'OLED TV',
  'Tablet Bilgisayar', 'Android Tablet',
  'Türkiye Garantili', 'Türkiye Garanti', 'TR Garantili',
  'Siyah', 'Beyaz', 'Gri', 'Mavi', 'Kırmızı', 'Altın', 'Gümüş',
];

function formatName(name: string, brand: string): string {
  if (!name) return brand || 'Ürün';

  let s = name.trim();

  // Amazon mağaza ziyaret pattern'ini at — tüm tırnak varyantları:
  // "HUAWEI 'u ziyaret edin HUAWEI Band 10" → "HUAWEI Band 10"
  // Düz tırnak ('), eğik tırnak ('), ve tırnaksız varyant hepsi
  s = s.replace(/^.+?[\u2018\u2019\u0060']\s*[uüiı]\s+ziyaret\s+edin\s+/i, '').trim();
  // Hâlâ kalırsa ikinci geçiş
  s = s.replace(/^.+?ziyaret\s+edin\s+/i, '').trim();

  // Parantez içini tamamen at: (Samsung Türkiye Garantili) gibi
  s = s.replace(/\s*\([^)]*\)/g, '').trim();

  // Köşeli parantezi at
  s = s.replace(/\s*\[[^\]]*\]/g, '').trim();

  // Virgülden sonrasını at
  s = s.split(',')[0].trim();

  // " – " veya " - " ile başlayan açıklamaları at
  s = s.split(/\s+[–—]\s+/)[0].trim();

  // " | " ile başlayan ek bilgileri at
  s = s.split(' | ')[0].trim();

  // Gürültü kelimelerini büyük/küçük harf duyarsız kaldır
  for (const word of NOISE_WORDS) {
    const re = new RegExp(`\\s*\\b${word}\\b\\s*`, 'gi');
    s = s.replace(re, ' ').trim();
  }

  // Çoklu boşlukları temizle
  s = s.replace(/\s+/g, ' ').trim();

  // Sonunda virgül, tire, nokta varsa at
  s = s.replace(/[,.\-–—]+$/, '').trim();

  // Marka zaten başta değilse ve anlamlı bir brand varsa öne ekle
  if (brand && brand.length > 1 && !s.toLowerCase().startsWith(brand.toLowerCase())) {
    s = `${brand} ${s}`;
  }

  // Çok kısa kaldıysa (3 harften az) orijinali ilk 5 kelime al
  if (s.replace(/\s/g, '').length < 3) {
    s = name.split(' ').slice(0, 5).join(' ');
  }

  // Max 44 karakter
  if (s.length > 44) {
    s = s.substring(0, 41) + '...';
  }

  return s;
}

export default function CategoryPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const slug         = params?.category as string ?? '';
  const searchQuery  = searchParams?.get('search') ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [catName,  setCatName]  = useState('');
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (slug) fetchProducts();
  }, [slug, searchQuery]);

  async function fetchProducts() {
    setLoading(true);
    setNotFound(false);
    try {
      // "all" slug'ı → tüm ürünlerde arama yap
      if (slug === 'all') {
        if (searchQuery) {
          setCatName(`"${searchQuery}" için sonuçlar`);
          const { data } = await supabase
            .from('products')
            .select('*')
            .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`)
            .eq('is_active', true)
            .order('price', { ascending: true })
            .limit(200);
          setProducts((data as Product[]) ?? []);
        } else {
          setCatName('Tüm Ürünler');
          const { data } = await supabase
            .from('products').select('*').eq('is_active', true)
            .order('created_at', { ascending: false }).limit(200);
          setProducts((data as Product[]) ?? []);
        }
        setLoading(false);
        return;
      }

      // Normal kategori slug'ı
      const dbSlug = SLUG_MAP[slug.toLowerCase()] ?? slug.toLowerCase();
      const { data: category } = await supabase
        .from('categories').select('id, name').eq('slug', dbSlug).maybeSingle();

      if (!category) { setNotFound(true); setLoading(false); return; }
      setCatName(category.name);

      let query = supabase.from('products').select('*')
        .eq('category_id', category.id).eq('is_active', true)
        .order('price', { ascending: true }).limit(200);

      if (searchQuery) {
        query = supabase.from('products').select('*')
          .eq('category_id', category.id).eq('is_active', true)
          .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
          .limit(200);
      }

      const { data } = await query;
      setProducts((data as Product[]) ?? []);
    } catch (err) {
      console.error('[CategoryPage]', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  function handleCompare() {
    if (selected.length === 2) {
      router.push(`/compare/${slug}/${selected[0]}/${selected[1]}`);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl font-bold">Kategori bulunamadı</h1>
        <p className="text-gray-400">"{slug}" kategorisi veritabanında mevcut değil.</p>
        <Link href="/" className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur z-50">
        <Link href="/">
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 32, width: 'auto' }} />
        </Link>
        <span className="text-sm text-gray-400 font-medium">{catName}</span>
      </nav>

      {/* Karşılaştır Butonu */}
      {selected.length === 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-once">
          <button onClick={handleCompare}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-2xl shadow-blue-500/30 transition-all text-lg flex items-center gap-3">
            ⚡ Karşılaştır
            <span className="text-sm opacity-70">(2 ürün seçildi)</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">{catName}</h1>
          <p className="text-gray-400">
            {loading ? '...' : `${products.length} ürün`}
            {selected.length < 2 && !loading && products.length > 0 && (
              <span className="text-blue-400"> • Karşılaştırmak için 2 ürün seç</span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 animate-pulse">
                <div className="aspect-square bg-gray-800 rounded-xl mb-4" />
                <div className="h-4 bg-gray-800 rounded mb-2" />
                <div className="h-4 bg-gray-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-xl">Bu kategoride henüz ürün yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const isSelected = selected.includes(product.id);
              const price      = getPrice(product);
              const specs      = product.specifications ?? {};
              const rating     = typeof specs.stars === 'number' ? specs.stars : 0;

              return (
                <div key={product.id} onClick={() => toggleSelect(product.id)}
                  className={`relative cursor-pointer rounded-2xl border transition-all duration-200 flex flex-col
                    ${isSelected
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 scale-[1.02]'
                      : 'border-gray-800 bg-gray-900/40 hover:border-gray-600 hover:bg-gray-900/60'
                    }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold z-10">
                      {selected.indexOf(product.id) + 1}
                    </div>
                  )}

                  {/* Sabit kare görsel alanı — tüm kartlar eşit */}
                  <div className="w-full" style={{ paddingBottom: '100%', position: 'relative', overflow: 'hidden', borderRadius: '14px 14px 0 0', background: '#111' }}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          padding: '8px',
                        }}
                      />
                    ) : (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', opacity: 0.15 }}>📦</span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-gray-200 line-clamp-2 leading-tight mb-2 flex-1">
                      {formatName(product.name, product.brand)}
                    </h3>

                    {rating > 0 && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="text-amber-400 text-xs">{'★'.repeat(Math.min(Math.round(rating), 5))}</span>
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
        )}
      </div>
    </div>
  );
}
