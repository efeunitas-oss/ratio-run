// app/compare/all/page.tsx — Global arama sayfası
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const revalidate = 0;

const GOLD        = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';

const NOISE_WORDS = [
  'Android Akıllı Telefon','Akıllı Telefon','Cep Telefonu',
  'Akıllı Saat','Spor Saati','Dizüstü Bilgisayar','Bilgisayar',
  'Laptop','Notebook','Robot Süpürge','Kablosuz Kulaklık',
  'Akıllı TV','Smart TV','Televizyon','Tablet Bilgisayar',
  'Türkiye Garantili','TR Garantili','Türkiye Garanti',
  'Siyah','Beyaz','Gri','Mavi','Kırmızı','Altın','Gümüş',
];

function formatName(name: string, brand: string): string {
  if (!name) return brand || 'Ürün';
  let s = name.trim();
  s = s.split(',')[0].trim();
  s = s.split(' | ')[0].trim();
  for (const word of NOISE_WORDS) {
    s = s.replace(new RegExp(`\\s*\\b${word}\\b\\s*`, 'gi'), ' ').trim();
  }
  s = s.replace(/\s+/g, ' ').replace(/[,.\-–—]+$/, '').trim();
  if (brand?.length > 1 && !s.toLowerCase().startsWith(brand.toLowerCase())) {
    s = `${brand} ${s}`;
  }
  return s.length > 50 ? s.substring(0, 47) + '...' : s;
}

type Props = { searchParams: Promise<{ search?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { search: q = '' } = await searchParams;
  const searchQuery = q.trim();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let products: any[] = [];
  if (searchQuery.length > 1) {
    const { data } = await supabase
      .from('products')
      .select('id, name, brand, price, avg_price, image_url, source_url, specifications, categories(slug)')
      .eq('is_active', true)
      .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
      .order('price', { ascending: true, nullsFirst: false })
      .limit(96);
    products = data || [];
  }

  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${GOLD}35`, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 36, width: 'auto' }} />
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
            ratio<span style={{ color: GOLD_BRIGHT }}>.run</span>
          </span>
        </a>
      </nav>

      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 20px' }}>

        {/* Arama kutusu */}
        <form action="/compare/all" method="GET" style={{ marginBottom: 32, position: 'relative', maxWidth: 600 }}>
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Model veya marka ara..."
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(17,24,39,0.6)', border: `1px solid ${GOLD}60`,
              color: '#fff', padding: '16px 120px 16px 20px',
              borderRadius: 14, fontSize: 16, outline: 'none',
            }}
          />
          <button type="submit" style={{
            position: 'absolute', right: 8, top: 8, bottom: 8,
            padding: '0 20px', borderRadius: 10, fontWeight: 700,
            background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
            color: '#000', border: 'none', cursor: 'pointer',
          }}>
            Ara
          </button>
        </form>

        {/* Başlık */}
        {searchQuery && (
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              &ldquo;{searchQuery}&rdquo; için sonuçlar
            </h1>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>
              {products.length} ürün bulundu
            </p>
          </div>
        )}

        {/* Sonuç yok */}
        {searchQuery && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sonuç bulunamadı</h2>
            <p style={{ color: '#9ca3af' }}>&ldquo;{searchQuery}&rdquo; için ürün bulunamadı</p>
            <a href="/" style={{ display: 'inline-block', marginTop: 24, padding: '12px 28px', borderRadius: 12, fontWeight: 700, background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`, color: '#000', textDecoration: 'none' }}>
              Ana Sayfaya Dön
            </a>
          </div>
        )}

        {/* Arama yapılmadı */}
        {!searchQuery && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Ne aramak istiyorsunuz?</h2>
            <p style={{ color: '#9ca3af', marginTop: 8 }}>Marka veya model adı yazın</p>
          </div>
        )}

        {/* Ürün Grid */}
        {products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {products.map((product) => {
              const price = product.avg_price || product.price;
              const rating = product.specifications?.stars || 0;
              const catSlug = (product.categories as any)?.slug || '';

              return (
                <Link
                  key={product.id}
                  href={`/compare/${catSlug}`}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(17,24,39,0.5)', border: '1px solid #1F2937',
                    borderRadius: 16, overflow: 'hidden', textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ background: '#0d0d0d', position: 'relative', paddingBottom: '85%' }}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={undefined}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                      />
                    ) : (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, opacity: 0.1 }}>📦</span>
                    )}
                  </div>
                  <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', lineHeight: 1.4, margin: 0 }}>
                      {formatName(product.name, product.brand)}
                    </p>
                    {rating > 0 && (
                      <span style={{ fontSize: 11, color: GOLD_BRIGHT }}>
                        {'★'.repeat(Math.min(Math.round(rating), 5))} {rating.toFixed(1)}
                      </span>
                    )}
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, marginTop: 'auto' }}>
                      {price ? `₺${price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : <span style={{ color: '#6b7280', fontSize: 11 }}>Fiyat güncelleniyor</span>}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
