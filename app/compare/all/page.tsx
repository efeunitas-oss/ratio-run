'use client';

// ============================================================================
// RATIO.RUN — GLOBAL ARAMA SAYFASI
// Dosya: app/compare/all/page.tsx
//
// DEĞİŞİKLİK:
//   • Ürüne tıklayınca artık kategori sayfasına körce gitmiyor
//   • → /compare/[category]?productA=[id] ile gidiyor
//   • CategoryClient bu param'ı görünce ürünü otomatik seçiyor
//   • Böylece kullanıcı direkt "2. ürünü seç" adımında başlıyor
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// ─── Slug eşleştirici ────────────────────────────────────────────────────────
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

// ─── Server: arama yap ───────────────────────────────────────────────────────
async function searchProducts(query: string) {
  if (!query || query.length < 2) return [];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, price, currency, image_url, source_name, category_id')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`)
    .eq('is_active', true)
    .order('price', { ascending: true })
    .limit(40);

  if (error || !products) return [];

  // category_id → slug için categories çek
  const catIds = [...new Set(products.map((p: any) => p.category_id))];
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')
    .in('id', catIds);

  const idToSlug: Record<string, string> = {};
  (categories ?? []).forEach((c: any) => {
    idToSlug[c.id] = DB_SLUG_TO_URL[c.slug] ?? c.slug;
  });

  return products.map((p: any) => ({
    ...p,
    categorySlug: idToSlug[p.category_id] ?? 'all',
  }));
}

// ─── Sayfa (Server Component) ─────────────────────────────────────────────────
export default async function AllPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const query = search?.trim() ?? '';
  const results = query ? await searchProducts(query) : [];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-[#C9A227]/15 px-6 py-4 sticky top-0 z-50 bg-black/90 backdrop-blur">
        <Link
          href="/"
          className="text-xl font-black tracking-tighter"
        >
          RATIO<span style={{ color: '#C9A227' }}>.RUN</span>
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Arama kutusu */}
        <form action="/compare/all" method="GET" className="mb-8">
          <div className="relative max-w-2xl">
            <input
              name="search"
              type="text"
              defaultValue={query}
              placeholder="Marka veya model ara... (örn: Samsung S25, Asus Vivobook)"
              autoFocus
              className="w-full bg-[#0D0D0D] border text-white px-5 py-4 pr-28 rounded-2xl text-sm outline-none transition-all"
              style={{ borderColor: query ? '#C9A22760' : '#1a1a1a' }}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-5 rounded-xl font-bold text-black text-sm"
              style={{ background: 'linear-gradient(135deg, #C9A227, #D4AF37)' }}
            >
              Ara
            </button>
          </div>
        </form>

        {/* Sonuçlar */}
        {query ? (
          <>
            <p className="text-sm text-gray-600 mb-6 font-mono">
              "{query}" için <span className="text-white">{results.length}</span> ürün bulundu
            </p>

            {results.length === 0 ? (
              <div className="text-center py-20 text-gray-700">
                <p className="text-lg mb-2">Sonuç bulunamadı</p>
                <p className="text-sm">Farklı bir marka veya model adı dene</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {results.map((product: any) => (
                  // Link: /compare/[category]?productA=[id]
                  // CategoryClient bu param'ı görünce ürünü otomatik seçer
                  <Link
                    key={product.id}
                    href={`/compare/${product.categorySlug}?productA=${product.id}`}
                    className="group bg-[#0D0D0D] rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                    style={{ border: '1px solid #1a1a1a' }}
                  >
                    {/* Görsel */}
                    <div className="aspect-square bg-black flex items-center justify-center overflow-hidden p-3">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-3xl opacity-10">📦</span>
                      )}
                    </div>

                    {/* İçerik */}
                    <div className="p-3">
                      {/* Kategori etiketi */}
                      <span
                        className="text-xs font-mono uppercase tracking-wider"
                        style={{ color: '#C9A22770' }}
                      >
                        {product.categorySlug}
                      </span>

                      {/* İsim */}
                      <p className="text-white text-xs font-medium leading-tight line-clamp-2 mt-1 mb-2">
                        {product.name}
                      </p>

                      {/* Fiyat */}
                      <p className="font-bold text-sm" style={{ color: '#C9A227' }}>
                        {product.price
                          ? new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: product.currency === 'TRY' ? 'TRY' : 'USD',
                              maximumFractionDigits: 2,
                            }).format(product.price)
                          : '—'
                        }
                      </p>

                      {/* CTA */}
                      <div
                        className="mt-2 w-full text-center py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{ background: '#C9A22715', color: '#C9A227', border: '1px solid #C9A22730' }}
                      >
                        Karşılaştırmaya Ekle →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          // Boş durum — kategori linkleri göster
          <div className="text-center py-20">
            <p className="text-gray-600 text-sm mb-8 font-mono uppercase tracking-widest">
              Kategori seç veya model ara
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { slug: 'telefon', label: 'Akıllı Telefon', icon: '📱' },
                { slug: 'laptop',  label: 'Laptop',          icon: '💻' },
                { slug: 'tablet',  label: 'Tablet',           icon: '📲' },
                { slug: 'saat',    label: 'Akıllı Saat',     icon: '⌚' },
                { slug: 'kulaklik',label: 'Kulaklık',        icon: '🎧' },
                { slug: 'robot-supurge', label: 'Robot Süpürge', icon: '🤖' },
                { slug: 'tv',      label: 'TV',               icon: '📺' },
                { slug: 'araba',   label: 'Otomobil',         icon: '🚗' },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/compare/${cat.slug}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: '#0D0D0D',
                    border: '1px solid #1a1a1a',
                    color: '#888',
                  }}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
