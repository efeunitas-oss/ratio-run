'use client';

// ============================================================================
// RATIO.RUN — CATEGORY CLIENT v4
// app/compare/[category]/CategoryClient.tsx
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/lib/types';
import { compareProducts, calculateRatioScore } from '@/lib/ratio-engine';
import { getSpecConfig } from '@/lib/spec-config';

// ─── Tipler ──────────────────────────────────────────────────────────────────
interface CategoryClientProps {
  category?: { id: string; name: string; slug: string };
  initialProducts?: any[];
  products?: Product[];
  categorySlug?: string;
  categoryName?: string;
  slug?: string;
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────
function fmtPrice(price: number | null, currency = 'TRY'): string {
  if (!price) return '—';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency === 'TRY' ? 'TRY' : 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function getRatioBadge(score: number) {
  if (score >= 85) return { label: 'OLAĞANÜSTÜ', bg: '#C9A22720', color: '#D4AF37' };
  if (score >= 70) return { label: 'MÜKEMMEL',   bg: '#C9A22715', color: '#C9A227' };
  if (score >= 55) return { label: 'İYİ DEĞER',  bg: '#B8952A15', color: '#B8952A' };
  return               { label: 'MAKUL',          bg: '#6B728015', color: '#6B7280' };
}

function getSourceUrl(p: Product): string | null {
  const specs = (p.specifications ?? {}) as Record<string, unknown>;
  const pAny = p as unknown as Record<string, unknown>;
  if (Array.isArray(pAny.sources) && pAny.sources.length > 0)
    return ((pAny.sources[0] as Record<string,string>).url) ?? null;
  if (Array.isArray(specs.sources) && specs.sources.length > 0)
    return ((specs.sources[0] as Record<string,string>).url) ?? null;
  return (pAny.source_url as string) ?? null;
}

// ─── Ürün Kartı ──────────────────────────────────────────────────────────────
function ProductCard({
  product, ratioScore, selectionOrder, onSelect, onDeselect, disabled,
}: {
  product: Product;
  ratioScore: number;
  selectionOrder: 1 | 2 | null;
  onSelect: (p: Product) => void;
  onDeselect: (p: Product) => void;
  disabled: boolean;
}) {
  const specs = (product.specifications ?? {}) as Record<string, unknown>;
  const rating = typeof specs.stars === 'number' ? specs.stars : 0;
  const badge = getRatioBadge(ratioScore);
  const isSelected = selectionOrder !== null;

  const handleClick = () => {
    if (isSelected) onDeselect(product);
    else if (!disabled) onSelect(product);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative rounded-xl overflow-hidden transition-all duration-200 select-none ${
        isSelected ? 'scale-[1.01]' : disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'
      }`}
      style={{
        background: '#0D0D0D',
        border: isSelected ? '1px solid #C9A227' : '1px solid #1a1a1a',
        boxShadow: isSelected ? '0 0 20px rgba(201,162,39,0.15)' : undefined,
      }}
    >
      {isSelected && (
        <div className="absolute top-2 left-2 z-20 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" style={{ background: '#C9A227', color: '#000' }}>
          {selectionOrder}
        </div>
      )}

      <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full text-xs font-bold font-mono" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}30` }}>
        {ratioScore.toFixed(0)}/100
      </div>

      <div className="aspect-square bg-black flex items-center justify-center overflow-hidden p-4">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name ?? ''} className="w-full h-full object-contain" loading="lazy" referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <span className="text-4xl opacity-10">📦</span>
        )}
      </div>

      <div className="p-3">
        <p className="text-white text-sm font-medium leading-tight line-clamp-2 mb-2">{product.name}</p>

        {rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map((i) => (
              <svg key={i} className="w-3 h-3" fill={i <= Math.round(rating) ? '#C9A227' : '#2a2a2a'} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs text-gray-600 ml-1">{rating.toFixed(1)}</span>
          </div>
        )}

        <div className="flex items-end justify-between mb-3">
          <span className="text-base font-bold" style={{ color: '#C9A227' }}>{fmtPrice(product.price, product.currency)}</span>
          {product.source_name && <span className="text-xs text-gray-700 font-mono truncate ml-2 max-w-[80px]">{product.source_name}</span>}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
          disabled={disabled && !isSelected}
          className="w-full py-2 rounded-lg text-xs font-bold transition-all"
          style={isSelected
            ? { background: '#C9A22720', color: '#C9A227', border: '1px solid #C9A22740' }
            : { background: '#ffffff08', color: '#ffffff50', border: '1px solid #ffffff08' }}
        >
          {isSelected ? `✓ Seçildi (${selectionOrder}. ürün)` : disabled ? '—' : '+ Karşılaştırmaya Ekle'}
        </button>
      </div>
    </div>
  );
}

// ─── Karşılaştırma Paneli ─────────────────────────────────────────────────────
function ComparisonPanel({ productA, productB, categorySlug, onClose }: {
  productA: Product; productB: Product; categorySlug: string; onClose: () => void;
}) {
  const result = compareProducts(productA, productB, categorySlug);
  const { ratio_a, ratio_b, winner, recommendation } = result;
  const scoreA = ratio_a.normalized_score;
  const scoreB = ratio_b.normalized_score;

  const sides = [
    { product: productA, score: scoreA, badge: getRatioBadge(scoreA), side: 'a', url: getSourceUrl(productA) },
    { product: productB, score: scoreB, badge: getRatioBadge(scoreB), side: 'b', url: getSourceUrl(productB) },
  ] as const;

  return (
    <div className="rounded-2xl overflow-hidden mb-8" style={{ background: '#090909', border: '1px solid #C9A22730' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#C9A22720', background: '#C9A22708' }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono uppercase tracking-widest" style={{ color: '#C9A227' }}>Ratio Analizi</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: '#C9A22715', color: '#C9A227' }}>CANLI</span>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors text-lg leading-none">✕</button>
      </div>

      <div className="grid grid-cols-2">
        {sides.map(({ product, score, badge, side, url }) => {
          const isWinner = winner !== 'tie' && winner === side;
          return (
            <div key={side} className="p-4 lg:p-6 relative" style={{ borderRight: side === 'a' ? '1px solid #1a1a1a' : undefined, background: isWinner ? '#C9A22706' : undefined }}>
              {isWinner && (
                <div className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#C9A227', color: '#000' }}>KAZANAN</div>
              )}
              <div className="aspect-square bg-black rounded-lg flex items-center justify-center mb-3 overflow-hidden max-h-28">
                {product.image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={product.image_url} alt={product.name ?? ''} className="w-full h-full object-contain p-2" loading="lazy" referrerPolicy="no-referrer" />
                  : <span className="text-2xl opacity-20">📦</span>}
              </div>
              <p className="text-white text-sm font-semibold line-clamp-2 mb-1 leading-tight">{product.name}</p>
              <p className="text-base font-bold mb-3" style={{ color: '#C9A227' }}>{fmtPrice(product.price, product.currency)}</p>

              <div className="mb-3">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs text-gray-600 font-mono">Ratio Skoru</span>
                  <span className="text-2xl font-black" style={{ color: isWinner ? '#D4AF37' : '#6B7280' }}>{score.toFixed(1)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(score, 100)}%`, background: isWinner ? 'linear-gradient(90deg,#9B7E24,#D4AF37)' : '#2a2a2a' }} />
                </div>
              </div>

              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mb-4" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}20` }}>
                {badge.label}
              </div>

              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer sponsored"
                  className="block w-full text-center py-2.5 rounded-lg text-xs font-bold transition-all"
                  style={isWinner ? { background: '#C9A227', color: '#000' } : { background: '#ffffff08', color: '#C9A227', border: '1px solid #C9A22730' }}>
                  {isWinner ? '🛒 En İyi Fiyata Al →' : 'Fiyata Bak →'}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t" style={{ borderColor: '#1a1a1a', background: '#0A0A0A' }}>
        <p className="text-sm text-gray-400 leading-relaxed">{recommendation}</p>
      </div>

      {Object.keys(ratio_a.breakdown.individual_scores).length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs text-gray-700 font-mono uppercase tracking-widest mb-3 pt-4">Detaylı Karşılaştırma</p>
          <div className="space-y-2.5">
            {Object.keys(ratio_a.breakdown.individual_scores).map((key) => {
              const a = ratio_a.breakdown.individual_scores[key] ?? 0;
              const b = ratio_b.breakdown.individual_scores[key] ?? 0;
              const maxVal = Math.max(a, b, 1);
              return (
                <div key={key}>
                  <span className="text-xs text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                      <div className="h-full rounded-full" style={{ width: `${(a / maxVal) * 100}%`, background: winner === 'a' && a >= b ? '#D4AF37' : '#3a3a3a' }} />
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
                      <div className="h-full rounded-full" style={{ width: `${(b / maxVal) * 100}%`, background: winner === 'b' && b >= a ? '#D4AF37' : '#3a3a3a' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function CategoryClient({ category, initialProducts, products: productsProp, categorySlug: categorySlugProp, categoryName: categoryNameProp, slug }: CategoryClientProps) {
  const products: Product[] = productsProp ?? initialProducts ?? [];
  const categorySlug: string = categorySlugProp ?? slug ?? category?.slug ?? '';
  const categoryName: string = categoryNameProp ?? category?.name ?? categorySlug;

  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedA, setSelectedA] = useState<Product | null>(null);
  const [selectedB, setSelectedB] = useState<Product | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pAid = searchParams.get('productA');
    if (pAid) {
      const found = products.find((p) => p.id === pAid);
      if (found) setSelectedA(found);
    }
  }, [searchParams, products]);

  const config = getSpecConfig(categorySlug);
  const maxPrice = Math.max(...products.map((p) => p.price ?? 0), 1);
  const productsWithScore = products.map((p) => ({
    product: p,
    score: calculateRatioScore(p, config.weights, maxPrice).normalized_score,
  }));

  const filtered = productsWithScore.filter(({ product }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return product.name?.toLowerCase().includes(q) || product.brand?.toLowerCase().includes(q) || product.model?.toLowerCase().includes(q);
  });

  const handleSelect = useCallback((product: Product) => {
    if (!selectedA) {
      setSelectedA(product);
    } else if (!selectedB && product.id !== selectedA.id) {
      setSelectedB(product);
      setShowComparison(true);
      setTimeout(() => comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [selectedA, selectedB]);

  const handleDeselect = useCallback((product: Product) => {
    if (selectedA?.id === product.id) {
      setSelectedA(selectedB);
      setSelectedB(null);
      if (!selectedB) setShowComparison(false);
    } else if (selectedB?.id === product.id) {
      setSelectedB(null);
      setShowComparison(false);
    }
  }, [selectedA, selectedB]);

  const closeComparison = () => { setShowComparison(false); setSelectedA(null); setSelectedB(null); };
  const selectionCount = (selectedA ? 1 : 0) + (selectedB ? 1 : 0);
  const twoSelected = selectionCount === 2;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">{categoryName}</h1>
        <p className="text-sm text-gray-600">{products.length} ürün · 2 ürün seç, karşılaştır</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-xl">
          <input type="text" placeholder="Bu kategoride ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D0D0D] border text-white px-4 py-3 rounded-xl text-sm outline-none transition-all pr-10"
            style={{ borderColor: searchQuery ? '#C9A22760' : '#1a1a1a' }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">✕</button>
          )}
        </div>
        {searchQuery && <p className="text-xs text-gray-600 mt-2 font-mono">{filtered.length} sonuç</p>}
      </div>

      <div ref={comparisonRef}>
        {showComparison && selectedA && selectedB && (
          <ComparisonPanel productA={selectedA} productB={selectedB} categorySlug={categorySlug} onClose={closeComparison} />
        )}
      </div>

      {selectionCount > 0 && !showComparison && (
        <div className="rounded-xl px-4 py-3 mb-6 flex items-center justify-between flex-wrap gap-2" style={{ background: '#C9A22710', border: '1px solid #C9A22730' }}>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="font-bold" style={{ color: '#C9A227' }}>{selectionCount}/2 seçildi</span>
            {selectedA && <span className="text-gray-400 text-xs truncate max-w-[140px]">1. {selectedA.name}</span>}
            {selectedB && <><span className="text-gray-700">vs</span><span className="text-gray-400 text-xs truncate max-w-[140px]">2. {selectedB.name}</span></>}
          </div>
          {!twoSelected && <span className="text-xs text-gray-600">1 ürün daha seç</span>}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-700">
          <p className="text-lg mb-2">"{searchQuery}" için sonuç bulunamadı</p>
          <p className="text-sm">Farklı bir kelime dene</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(({ product, score }) => {
            const order = selectedA?.id === product.id ? 1 : selectedB?.id === product.id ? 2 : null;
            return (
              <ProductCard key={product.id} product={product} ratioScore={score}
                selectionOrder={order as 1 | 2 | null}
                onSelect={handleSelect} onDeselect={handleDeselect}
                disabled={twoSelected && order === null} />
            );
          })}
        </div>
      )}

      {twoSelected && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 lg:hidden" style={{ background: '#090909', borderTop: '1px solid #C9A22730' }}>
          <button
            onClick={() => { setShowComparison(true); setTimeout(() => comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
            className="w-full py-3.5 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#C9A227,#D4AF37)', color: '#000' }}
          >
            ⚡ Karşılaştır
          </button>
        </div>
      )}
      {twoSelected && <div className="h-20 lg:hidden" />}
    </div>
  );
}
