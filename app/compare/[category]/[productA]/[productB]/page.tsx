// DYNAMIC SPEC TABLE — kategori bazlı özellik karşılaştırması
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// ─── Kategori bazlı spec tanımları ───────────────────────────────────────────
interface SpecDef {
  label: string;
  extract: (s: Record<string, any>) => string;
  higher?: boolean; // true = büyük değer kazanır, false = küçük, undefined = karşılaştırma yok
}

function boolStr(val: any): string {
  if (val === true  || val === 'true'  || val === 1) return 'Var';
  if (val === false || val === 'false' || val === 0) return 'Yok';
  return '—';
}

const CATEGORY_SPECS: Record<string, SpecDef[]> = {
  telefon: [
    { label: 'İşlemci',       extract: s => s.spec_labels?.['İşlemci'] || s.processor || s.chipset || '—' },
    { label: 'RAM',           extract: s => s.spec_labels?.['RAM'] || (s.ram_gb ? `${s.ram_gb} GB` : '—'),                higher: true },
    { label: 'Depolama',      extract: s => s.spec_labels?.['Depolama'] || (s.storage_gb ? `${s.storage_gb} GB` : '—'),   higher: true },
    { label: 'Ekran',         extract: s => s.spec_labels?.['Ekran'] || s.display || '—' },
    { label: 'Batarya',       extract: s => s.spec_labels?.['Batarya'] || (s.battery_mah ? `${s.battery_mah} mAh` : '—'), higher: true },
    { label: 'Şarj Hızı',    extract: s => s.spec_labels?.['Şarj Hızı'] || (s.charging_w ? `${s.charging_w}W` : '—'),    higher: true },
    { label: 'Arka Kamera',   extract: s => s.spec_labels?.['Arka Kamera'] || s.camera || s.rear_camera || '—' },
    { label: 'Ön Kamera',     extract: s => s.spec_labels?.['Ön Kamera'] || s.front_camera || '—' },
  ],
  laptop: [
    { label: 'İşlemci',       extract: s => s.spec_labels?.['İşlemci'] || s.processor || s.cpu || '—' },
    { label: 'GPU',           extract: s => s.spec_labels?.['GPU'] || s.gpu || s.graphics || '—' },
    { label: 'RAM',           extract: s => s.spec_labels?.['RAM'] || (s.ram_gb ? `${s.ram_gb} GB` : '—'),              higher: true },
    { label: 'SSD',           extract: s => s.spec_labels?.['SSD'] || (s.storage_gb ? `${s.storage_gb} GB` : '—'),      higher: true },
    { label: 'Ekran',         extract: s => s.spec_labels?.['Ekran'] || s.display || '—' },
    { label: 'Parlaklık',     extract: s => s.spec_labels?.['Parlaklık'] || (s.brightness_nits ? `${s.brightness_nits} nits` : '—'), higher: true },
    { label: 'Batarya (Wh)', extract: s => s.spec_labels?.['Batarya'] || (s.battery_wh ? `${s.battery_wh} Wh` : '—'),  higher: true },
  ],
  tablet: [
    { label: 'İşlemci (SoC)', extract: s => s.spec_labels?.['İşlemci'] || s.processor || s.chipset || '—' },
    { label: 'RAM',           extract: s => s.spec_labels?.['RAM'] || (s.ram_gb ? `${s.ram_gb} GB` : '—'),              higher: true },
    { label: 'Depolama',      extract: s => s.spec_labels?.['Depolama'] || (s.storage_gb ? `${s.storage_gb} GB` : '—'), higher: true },
    { label: 'Ekran',         extract: s => s.spec_labels?.['Ekran'] || s.display || '—' },
    { label: 'Yenileme Hızı', extract: s => s.spec_labels?.['Yenileme Hızı'] || (s.refresh_rate ? `${s.refresh_rate} Hz` : '—'), higher: true },
    { label: 'Batarya',       extract: s => s.spec_labels?.['Batarya'] || (s.battery_mah ? `${s.battery_mah} mAh` : '—'), higher: true },
    { label: 'Kalem Desteği', extract: s => s.spec_labels?.['Kalem Desteği'] || (s.stylus_support != null ? boolStr(s.stylus_support) : '—') },
  ],
  'akilli-saat': [
    { label: 'Pil Ömrü',        extract: s => s.spec_labels?.['Pil Ömrü'] || (s.battery_days ? `${s.battery_days} gün` : '—'), higher: true },
    { label: 'İşletim Sistemi', extract: s => s.spec_labels?.['İşletim Sistemi'] || s.os || '—' },
    { label: 'Ekran',           extract: s => s.spec_labels?.['Ekran'] || s.display_type || '—' },
    { label: 'Kasa Boyutu',     extract: s => s.spec_labels?.['Kasa Boyutu'] || (s.size_mm ? `${s.size_mm} mm` : '—') },
    { label: 'Parlaklık',       extract: s => s.spec_labels?.['Parlaklık'] || (s.brightness_nits ? `${s.brightness_nits} nits` : '—'), higher: true },
    { label: 'Malzeme',         extract: s => s.spec_labels?.['Malzeme'] || s.case_material || '—' },
    { label: 'ECG',             extract: s => s.spec_labels?.['ECG'] || (s.has_ecg != null ? boolStr(s.has_ecg) : '—') },
  ],
  kulaklik: [
    { label: 'ANC',            extract: s => s.spec_labels?.['ANC'] || (s.has_anc != null ? boolStr(s.has_anc) : '—') },
    { label: 'Codec Desteği',  extract: s => s.spec_labels?.['Codec'] || s.codec || '—' },
    { label: 'Toplam Batarya', extract: s => s.spec_labels?.['Batarya'] || (s.battery_hours ? `${s.battery_hours} saat` : '—'), higher: true },
    { label: 'Mikrofon',       extract: s => s.spec_labels?.['Mikrofon'] || s.mic_quality || '—' },
    { label: 'Multipoint',     extract: s => s.spec_labels?.['Multipoint'] || (s.multipoint != null ? boolStr(s.multipoint) : '—') },
  ],
  'robot-supurge': [
    { label: 'Navigasyon',      extract: s => s.spec_labels?.['Navigasyon'] || s.navigation || '—' },
    { label: 'Emme Gücü (Pa)', extract: s => s.spec_labels?.['Emme Gücü'] || (s.suction_pa ? `${s.suction_pa} Pa` : '—'), higher: true },
    { label: 'İstasyon',        extract: s => s.spec_labels?.['İstasyon'] || s.station_features || '—' },
    { label: 'Mop Teknolojisi', extract: s => s.spec_labels?.['Mop'] || s.mop_type || '—' },
    { label: 'Engel Tanıma',    extract: s => s.spec_labels?.['Engel Tanıma'] || s.obstacle_avoidance || '—' },
    { label: 'Batarya',         extract: s => s.spec_labels?.['Batarya'] || (s.battery_min ? `${s.battery_min} dk` : '—'), higher: true },
  ],
  televizyon: [
    { label: 'Panel Tipi',        extract: s => s.spec_labels?.['Panel'] || s.panel_type || '—' },
    { label: 'Yenileme Hızı',     extract: s => s.spec_labels?.['Yenileme Hızı'] || (s.refresh_rate ? `${s.refresh_rate} Hz` : '—'), higher: true },
    { label: 'Parlaklık',         extract: s => s.spec_labels?.['Parlaklık'] || (s.brightness_nits ? `${s.brightness_nits} nits` : '—'), higher: true },
    { label: 'HDR Formatları',    extract: s => s.spec_labels?.['HDR'] || s.hdr_formats || '—' },
    { label: 'HDMI 2.1',          extract: s => s.spec_labels?.['HDMI 2.1'] || (s.hdmi_21 != null ? boolStr(s.hdmi_21) : '—') },
    { label: 'İşlemci/Upscaling', extract: s => s.spec_labels?.['İşlemci'] || s.processor || '—' },
  ],
};

const SLUG_ALIAS: Record<string, string> = {
  'akilli-saat': 'akilli-saat', 'saat': 'akilli-saat', 'smartwatch': 'akilli-saat',
  'kulaklik': 'kulaklik', 'kulaklık': 'kulaklik', 'earbuds': 'kulaklik',
  'robot-supurge': 'robot-supurge', 'robot': 'robot-supurge',
  'televizyon': 'televizyon', 'tv': 'televizyon',
  'laptop': 'laptop', 'dizustu': 'laptop',
  'tablet': 'tablet',
  'telefon': 'telefon', 'cep-telefonu': 'telefon',
};

function extractNumeric(val: string): number | null {
  if (!val || val === '—') return null;
  const m = val.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}
// ─────────────────────────────────────────────────────────────────────────────

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://srypulfxbckherkmrjgs.supabase.co';

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeXB1bGZ4YmNraGVya21yamdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTczMDcsImV4cCI6MjA4NjczMzMwN30.gEYVh5tjSrO3sgc5rsnYgVrIy6YdK3I5qU5S6FwkX-I';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number | null;
  currency: string;
  image_url: string | null;
  source_url: string;
  specifications: Record<string, any> | null;
}

function getRatioScore(product: Product, maxPrice: number): number {
  const specs   = product.specifications ?? {};
  const overall = Number(specs.overall_score ?? 0);   // 0–10
  const stars   = Number(specs.stars         ?? 0);   // 0–5
  const price   = product.price && product.price >= 100 ? product.price : null;

  // Temel skor: overall_score varsa kullan (0-10 → 0-100), yoksa stars (0-5 → 0-100)
  let baseScore = overall > 0 ? overall * 10 : stars > 0 ? stars * 20 : 0;

  // Fiyat bonusu/malus: fiyat varsa düşük fiyat bonus verir
  if (price && maxPrice > 100) {
    const priceRatio  = price / maxPrice;          // 0–1 (0=en ucuz)
    const priceBonus  = (1 - priceRatio) * 20;     // max +20 puan ucuz ürüne
    baseScore = Math.min(100, baseScore + priceBonus);
  }

  return Math.min(100, Math.max(0, baseScore));
}

function getPrice(product: Product): number | null {
  // 100 TL altı yanlış parse edilmiş veri — gösterme
  if (product.price && product.price >= 100) return product.price;
  const specs = product.specifications ?? {};
  if (specs.price && Number(specs.price) >= 100) return Number(specs.price);
  if (specs.listPrice && Number(specs.listPrice) >= 100) return Number(specs.listPrice);
  return null;
}

export default function ComparisonPage() {
  const params = useParams();
  const slug   = params?.category as string ?? '';
  const idA    = params?.productA as string ?? '';
  const idB    = params?.productB as string ?? '';

  const [productA, setProductA] = useState<Product | null>(null);
  const [productB, setProductB] = useState<Product | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, [idA, idB]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const [{ data: a }, { data: b }] = await Promise.all([
        supabase.from('products').select('*').eq('id', idA).single(),
        supabase.from('products').select('*').eq('id', idB).single(),
      ]);
      setProductA(a as Product);
      setProductB(b as Product);
    } catch (err) {
      console.error('[ComparisonPage]', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!productA || !productB) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-2xl font-bold">Ürünler yüklenemedi</h1>
        <Link href={`/compare/${slug}`} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all">
          Geri Dön
        </Link>
      </div>
    );
  }

  const priceA = getPrice(productA);
  const priceB = getPrice(productB);
  const maxP   = Math.max(priceA ?? 0, priceB ?? 0, 1);
  const scoreA = getRatioScore(productA, maxP);
  const scoreB = getRatioScore(productB, maxP);
  const diff   = Math.abs(scoreA - scoreB);
  const winner = scoreA > scoreB ? 'a' : scoreB > scoreA ? 'b' : 'tie';
  const specsA = productA.specifications ?? {};
  const specsB = productB.specifications ?? {};

  const verdict = winner === 'tie'
    ? 'Bu iki ürün neredeyse eşit performans/fiyat oranına sahip.'
    : `${winner === 'a' ? productA.name : productB.name}, rakibine göre %${diff.toFixed(1)} daha iyi bir değer sunuyor.`;

  // Kategori spec tanımları
  const catKey   = SLUG_ALIAS[slug.toLowerCase()] ?? slug.toLowerCase();
  const specDefs = CATEGORY_SPECS[catKey] ?? null;

  // Fallback: her iki üründeki spec_labels birleşimi
  const fallbackKeys = Array.from(new Set([
    ...Object.keys(specsA.spec_labels ?? {}),
    ...Object.keys(specsB.spec_labels ?? {}),
  ]));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur z-50">
        <Link href="/" className="text-xl font-black tracking-tighter">
          RATIO<span className="text-blue-500">.RUN</span>
        </Link>
        <Link href={`/compare/${slug}`} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Geri
        </Link>
      </nav>

      {/* Arka plan ışıkları */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px]" />
        </div>
      )}

      <div className="relative max-w-6xl mx-auto px-4 py-10">

        {/* VS Header */}
        <div className="relative grid grid-cols-2 gap-8 mb-12 items-start">
          {/* VS Rozeti */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-gray-900 border-2 border-gray-700 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl">
              <span className="text-xl font-black bg-gradient-to-br from-emerald-400 to-blue-400 bg-clip-text text-transparent">VS</span>
            </div>
          </div>

          {/* Ürün A */}
          <ProductPanel product={productA} price={priceA} score={scoreA} isWinner={winner === 'a'} side="a" />
          {/* Ürün B */}
          <ProductPanel product={productB} price={priceB} score={scoreB} isWinner={winner === 'b'} side="b" />
        </div>

        {/* Karar Kartı */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Ratio Kararı</h2>
              <p className="text-gray-300 text-lg leading-relaxed">{verdict}</p>
              <div className="grid grid-cols-3 gap-4 mt-5">
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Fark</div>
                  <div className="text-2xl font-bold text-emerald-400">%{diff.toFixed(1)}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Ürün A Ratio</div>
                  <div className="text-2xl font-bold">{scoreA.toFixed(1)}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">Ürün B Ratio</div>
                  <div className="text-2xl font-bold">{scoreB.toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teknik Karşılaştırma — kategori bazlı dinamik tablo */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-xl font-bold">Teknik Karşılaştırma</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/50 bg-gray-900/30">
                <th className="text-left p-4 text-gray-400 text-sm w-1/3">Özellik</th>
                <th className="text-center p-4 text-emerald-400 text-sm w-1/3">{productA.name.split(' ').slice(0, 3).join(' ')}</th>
                <th className="text-center p-4 text-blue-400 text-sm w-1/3">{productB.name.split(' ').slice(0, 3).join(' ')}</th>
              </tr>
            </thead>
            <tbody>
              <SpecRow
                label="Fiyat"
                valA={priceA ? `₺${priceA.toLocaleString('tr-TR')}` : '—'}
                valB={priceB ? `₺${priceB.toLocaleString('tr-TR')}` : '—'}
                winnerA={!!priceA && !!priceB && priceA < priceB}
                winnerB={!!priceA && !!priceB && priceB < priceA}
              />
              {specDefs
                ? specDefs.map((def) => {
                    const vA = def.extract(specsA);
                    const vB = def.extract(specsB);
                    let wA = false, wB = false;
                    if (def.higher !== undefined && vA !== '—' && vB !== '—') {
                      const nA = extractNumeric(vA);
                      const nB = extractNumeric(vB);
                      if (nA !== null && nB !== null) {
                        wA = def.higher ? nA > nB : nA < nB;
                        wB = def.higher ? nB > nA : nB < nA;
                      } else {
                        wA = vA === 'Var' && vB === 'Yok';
                        wB = vB === 'Var' && vA === 'Yok';
                      }
                    }
                    return <SpecRow key={def.label} label={def.label} valA={vA} valB={vB} winnerA={wA} winnerB={wB} />;
                  })
                : fallbackKeys.map((key) => (
                    <SpecRow
                      key={key} label={key}
                      valA={String(specsA.spec_labels?.[key] ?? '—')}
                      valB={String(specsB.spec_labels?.[key] ?? '—')}
                      winnerA={false} winnerB={false}
                    />
                  ))
              }
              <SpecRow
                label="Yorum Sayısı"
                valA={specsA.reviewsCount ? Number(specsA.reviewsCount).toLocaleString('tr-TR') : '—'}
                valB={specsB.reviewsCount ? Number(specsB.reviewsCount).toLocaleString('tr-TR') : '—'}
                winnerA={(specsA.reviewsCount ?? 0) > (specsB.reviewsCount ?? 0)}
                winnerB={(specsB.reviewsCount ?? 0) > (specsA.reviewsCount ?? 0)}
              />
              <SpecRow
                label="Ratio Skoru (100 üzerinden)"
                valA={`${scoreA.toFixed(1)} / 100`}
                valB={`${scoreB.toFixed(1)} / 100`}
                winnerA={scoreA > scoreB}
                winnerB={scoreB > scoreA}
              />
            </tbody>
          </table>
        </div>

        {/* Linkler */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {productA.source_url && (
            <a href={productA.source_url} target="_blank" rel="noopener noreferrer"
              className="block text-center py-3 bg-gray-900 border border-gray-700 hover:border-emerald-500 rounded-xl text-sm font-medium transition-all">
              {productA.name.split(' ').slice(0, 3).join(' ')} → Satın Al
            </a>
          )}
          {productB.source_url && (
            <a href={productB.source_url} target="_blank" rel="noopener noreferrer"
              className="block text-center py-3 bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-xl text-sm font-medium transition-all">
              {productB.name.split(' ').slice(0, 3).join(' ')} → Satın Al
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductPanel({ product, price, score, isWinner, side }: {
  product: Product; price: number | null; score: number; isWinner: boolean; side: 'a' | 'b';
}) {
  const borderColor = isWinner
    ? side === 'a' ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-2xl' : 'border-blue-500/50 shadow-blue-500/10 shadow-2xl'
    : 'border-gray-800';

  return (
    <div className={`bg-gray-900/40 border rounded-2xl p-5 transition-all ${borderColor}`}>
      {/* Her iki kart da aynı yükseklikte rozet alanı — kazanan yoksa şeffaf */}
      <div className="mb-3 h-7">
        {isWinner && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
            ${side === 'a' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
            🏆 KAZANAN
          </div>
        )}
      </div>

      <div className="w-full mb-4 rounded-xl overflow-hidden bg-gray-800" style={{ position: 'relative', paddingBottom: '100%' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }}
          />
        ) : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', opacity: 0.2 }}>📦</span>}
      </div>
      <h3 className="font-bold text-gray-100 line-clamp-2 mb-2 text-sm">{product.name}</h3>
      <div className="text-2xl font-black mb-1">
        {price ? `₺${price.toLocaleString('tr-TR')}` : <span className="text-gray-500 text-base">Fiyat yok</span>}
      </div>
      <div className={`text-3xl font-black ${side === 'a' ? 'text-emerald-400' : 'text-blue-400'}`}>
        {score.toFixed(1)}<span className="text-sm text-gray-500 font-normal"> / 100</span>
      </div>
    </div>
  );
}

function SpecRow({ label, valA, valB, winnerA, winnerB }: {
  label: string; valA: string; valB: string; winnerA: boolean; winnerB: boolean;
}) {
  if (valA === '—' && valB === '—') return null;
  return (
    <tr className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors">
      <td className="p-4 text-gray-400 text-sm font-medium">{label}</td>
      <td className={`p-4 text-center text-sm font-bold ${winnerA ? 'text-emerald-400 bg-emerald-500/5' : 'text-gray-300'}`}>
        {winnerA && <span className="mr-1">✓</span>}{valA}
      </td>
      <td className={`p-4 text-center text-sm font-bold ${winnerB ? 'text-blue-400 bg-blue-500/5' : 'text-gray-300'}`}>
        {winnerB && <span className="mr-1">✓</span>}{valB}
      </td>
    </tr>
  );
}
