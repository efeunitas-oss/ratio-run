'use client';

// ============================================================================
// RATIO.RUN — CATEGORY CLIENT v4
// Dosya: app/compare/[category]/CategoryClient.tsx
// ============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/lib/types';
import { compareProducts, calculateRatioScore } from '@/lib/ratio-engine';
import { getSpecConfig } from '@/lib/spec-config';
import { TechSpecsTable } from '@/components/ui/TechSpecsTable';

// ─── Tipler ──────────────────────────────────────────────────────────────────
interface CategoryClientProps {
  products?: any[];
  initialProducts?: any[];
  categorySlug?: string;
  categoryUrl?: string;
  slug?: string;
  categoryName?: string;
  category?: { id: string; name: string; slug: string };
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

function getRatioBadge(score: number): { label: string; bg: string; text: string } {
  if (score >= 85) return { label: 'OLAĞANÜSTÜ', bg: '#C9A22720', text: '#D4AF37' };
  if (score >= 70) return { label: 'MÜKEMMEL',   bg: '#C9A22715', text: '#C9A227' };
  if (score >= 55) return { label: 'İYİ DEĞER',  bg: '#B8952A15', text: '#B8952A' };
  return               { label: 'MAKUL',          bg: '#6B728015', text: '#6B7280' };
}

// ─── Ürün Kartı ───────────────────────────────────────────────────────────────
function ProductCard({
  product, ratioScore, categoryUrl, selectionOrder, onSelect, onDeselect, disabled,
}: {
  product: any;
  ratioScore: number;
  categoryUrl: string;
  selectionOrder: 1 | 2 | null;
  onSelect: (p: any) => void;
  onDeselect: (p: any) => void;
  disabled: boolean;
}) {
  const specs      = product.specifications ?? {};
  const rating     = typeof specs.stars === 'number' ? specs.stars : 0;
  const isSelected = selectionOrder !== null;

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelected) onDeselect(product);
    else if (!disabled) onSelect(product);
  };

  const detailUrl = `/compare/${categoryUrl}/${product.id}`;

  return (
    <div style={{
      position: 'relative', borderRadius: 14, overflow: 'hidden',
      background: '#0D0D0D',
      border: isSelected ? '1px solid #C9A227' : '1px solid #1a1a1a',
      boxShadow: isSelected ? '0 0 20px rgba(201,162,39,0.15)' : undefined,
      display: 'flex', flexDirection: 'column',
      opacity: disabled && !isSelected ? 0.4 : 1,
      transition: 'border-color 0.15s',
    }}>
      {/* Seçim rozeti */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 20,
          width: 26, height: 26, borderRadius: '50%',
          background: '#C9A227', color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900,
        }}>
          {selectionOrder}
        </div>
      )}

      {/* Görsel — tıklanınca detaya gider */}
      <Link href={detailUrl} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ height: 160, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <span style={{ fontSize: 36, opacity: 0.1 }}>📦</span>
          )}
        </div>
      </Link>

      {/* İçerik */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* İsim — tıklanınca detaya gider */}
        <Link href={detailUrl} style={{ textDecoration: 'none' }}>
          <p style={{
            color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.35,
            margin: '0 0 8px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {product.name}
          </p>
        </Link>

        {/* Yıldızlar */}
        {rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 8 }}>
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="11" height="11" viewBox="0 0 20 20" fill={i <= Math.round(rating) ? '#C9A227' : '#2a2a2a'}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 3 }}>{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Fiyat + kaynak */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#C9A227' }}>
            {fmtPrice(product.price, product.currency)}
          </span>
          {product.source_name && (
            <span style={{ display: 'block', fontSize: 11, color: '#4b5563', marginTop: 2 }}>
              {product.source_name}
            </span>
          )}
        </div>

        {/* Karşılaştırma butonu — her zaman altta */}
        <button
          onClick={handleCompareClick}
          disabled={disabled && !isSelected}
          style={{
            marginTop: 'auto',
            width: '100%', padding: '8px 0', borderRadius: 8,
            fontSize: 12, fontWeight: 700,
            cursor: disabled && !isSelected ? 'default' : 'pointer',
            border: isSelected ? '1px solid #C9A22740' : '1px solid #ffffff10',
            background: isSelected ? '#C9A22720' : '#ffffff08',
            color: isSelected ? '#C9A227' : '#ffffff60',
          }}
        >
          {isSelected
            ? `✓ Seçildi (${selectionOrder})`
            : disabled
            ? <span style={{ visibility: 'hidden' }}>—</span>
            : '+ Karşılaştırmaya Ekle'}
        </button>
      </div>
    </div>
  );
}

// ─── Karşılaştırma Paneli ─────────────────────────────────────────────────────
function ComparisonPanel({ productA, productB, categorySlug, onClose }: {
  productA: any; productB: any; categorySlug: string; onClose: () => void;
}) {
  const result = compareProducts(productA, productB, categorySlug);
  const scoreA = result.ratio_a.normalized_score;
  const scoreB = result.ratio_b.normalized_score;
  const winner = result.winner;

  function getUrl(p: any): string | null {
    if (Array.isArray(p.sources) && p.sources.length > 0) return p.sources[0].url;
    return p.source_url ?? null;
  }

  const sides = [
    { product: productA, score: scoreA, side: 'a', url: getUrl(productA) },
    { product: productB, score: scoreB, side: 'b', url: getUrl(productB) },
  ];

  return (
    <div style={{ background: '#090909', border: '1px solid #C9A22730', borderRadius: 20, overflow: 'hidden', marginBottom: 32 }}>

      {/* Başlık */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #C9A22720', background: '#C9A22708' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9A227' }}>Ratio Analizi</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#C9A22715', color: '#C9A227', fontFamily: 'monospace' }}>CANLI</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
      </div>

      {/* İki ürün yan yana */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {sides.map(({ product, score, side, url }) => {
          const isWinner = winner === side;
          const badge = getRatioBadge(score);
          return (
            <div key={side} style={{
              padding: '20px 24px', position: 'relative',
              display: 'flex', flexDirection: 'column',
              background: isWinner ? '#C9A22706' : 'transparent',
              borderRight: side === 'a' ? '1px solid #1a1a1a' : undefined,
            }}>
              {isWinner && winner !== 'tie' && (
                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#C9A227', color: '#000' }}>
                  KAZANAN
                </div>
              )}

              {/* Görsel — sabit 180px */}
              <div style={{ height: 180, background: '#0d0d0d', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }}
                    loading="lazy" referrerPolicy="no-referrer"
                  />
                ) : <span style={{ fontSize: 32, opacity: 0.1 }}>📦</span>}
              </div>

              <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.3, margin: '0 0 6px',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {product.name}
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#C9A227', margin: '0 0 12px' }}>
                {fmtPrice(product.price, product.currency)}
              </p>

              {/* Skor */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>Ratio Skoru</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: isWinner ? '#D4AF37' : '#6b7280' }}>{score.toFixed(1)}</span>
                </div>
                <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(score, 100)}%`, background: isWinner ? 'linear-gradient(90deg,#9B7E24,#D4AF37)' : '#2a2a2a', transition: 'width 0.7s ease' }} />
                </div>
              </div>

              {/* Rozet */}
              <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.text, border: `1px solid ${badge.text}20`, marginBottom: 16, alignSelf: 'flex-start' }}>
                {badge.label}
              </div>

              {/* Satın al butonu — her zaman render */}
              <div style={{ marginTop: 'auto' }}>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer sponsored"
                    style={{
                      display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 10,
                      fontSize: 13, fontWeight: 700, textDecoration: 'none',
                      ...(isWinner ? { background: '#C9A227', color: '#000' } : { background: 'transparent', color: '#C9A227', border: '1px solid #C9A22740' }),
                    }}>
                    {isWinner ? '🛒 En İyi Fiyata Al →' : 'Fiyata Bak →'}
                  </a>
                ) : <div style={{ height: 40 }} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Öneri metni */}
      <div style={{ padding: '14px 20px', background: '#0a0a0a', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
        <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>{result.recommendation}</p>
      </div>

      {/* Teknik Özellikler */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a' }}>
        <p style={{ fontSize: 11, color: '#4b5563', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Teknik Özellikler</p>
        <TechSpecsTable productA={productA} productB={productB} categorySlug={categorySlug} />
      </div>

      {/* Detaylı Karşılaştırma Barları */}
      {Object.keys(result.ratio_a.breakdown.individual_scores).length > 0 && (
        <div style={{ padding: '16px 20px 20px' }}>
          <p style={{ fontSize: 11, color: '#4b5563', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Detaylı Karşılaştırma</p>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12, marginBottom: 8 }}>
            <div />
            <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {productA.name?.split(' ').slice(0, 3).join(' ')}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {productB.name?.split(' ').slice(0, 3).join(' ')}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(result.ratio_a.breakdown.individual_scores).map(([key, valA]) => {
              const a = valA as number ?? 0;
              const b = result.ratio_b.breakdown.individual_scores[key] as number ?? 0;
              const maxVal = Math.max(a, b, 1);
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                  <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: '#1a1a1a' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${(a / maxVal) * 100}%`, background: a > b ? '#D4AF37' : '#374151', transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: '#1a1a1a' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${(b / maxVal) * 100}%`, background: b > a ? '#D4AF37' : '#374151', transition: 'width 0.4s ease' }} />
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

// ─── ANA BİLEŞEN ─────────────────────────────────────────────────────────────
export default function CategoryClient({
  products: productsProp, initialProducts,
  categorySlug: categorySlugProp, categoryUrl: categoryUrlProp,
  slug, categoryName: categoryNameProp, category,
}: CategoryClientProps) {
  const products     = productsProp ?? initialProducts ?? [];
  const categorySlug = categorySlugProp ?? slug ?? category?.slug ?? '';
  const categoryName = categoryNameProp ?? category?.name ?? categorySlug;
  const categoryUrl  = categoryUrlProp ?? categorySlugProp ?? slug ?? category?.slug ?? '';

  const searchParams = useSearchParams();
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedA,      setSelectedA]      = useState<any | null>(null);
  const [selectedB,      setSelectedB]      = useState<any | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparing,      setComparing]      = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pAid = searchParams.get('productA');
    if (pAid) {
      const found = products.find((p: any) => p.id === pAid);
      if (found) setSelectedA(found);
    }
  }, [searchParams, products]);

  const config    = useMemo(() => getSpecConfig(categorySlug), [categorySlug]);
  const maxPrice  = useMemo(() => Math.max(...products.map((p: any) => p.price ?? 0), 1), [products]);

  const productsWithScore = useMemo(() =>
    products.map((p: any) => ({
      product: p,
      score: calculateRatioScore(p, config.weights, maxPrice).normalized_score as number,
    })),
    [products, config, maxPrice]
  );

  const filtered = useMemo(() =>
    productsWithScore.filter(({ product }: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return product.name?.toLowerCase().includes(q) || product.brand?.toLowerCase().includes(q) || product.model?.toLowerCase().includes(q);
    }),
    [productsWithScore, searchQuery]
  );

  const handleSelect = useCallback((product: any) => {
    if (!selectedA) setSelectedA(product);
    else if (!selectedB && product.id !== selectedA.id) setSelectedB(product);
  }, [selectedA, selectedB]);

  const handleDeselect = useCallback((product: any) => {
    if (selectedA?.id === product.id) { setSelectedA(selectedB); setSelectedB(null); setShowComparison(false); }
    else if (selectedB?.id === product.id) { setSelectedB(null); setShowComparison(false); }
  }, [selectedA, selectedB]);

  const handleCompare = () => {
    setComparing(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setShowComparison(true);
      setComparing(false);
      setTimeout(() => comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }));
  };

  const closeComparison = () => { setShowComparison(false); setSelectedA(null); setSelectedB(null); };
  const twoSelected = !!selectedA && !!selectedB;
  const selectionCount = (selectedA ? 1 : 0) + (selectedB ? 1 : 0);



  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 16px' }}>

      {/* Geri dön */}
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', textDecoration: 'none', marginBottom: 16 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#C9A227')}
        onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
      >← Ana Sayfa</a>

      {/* Başlık */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>{categoryName}</h1>
        <p style={{ fontSize: 13, color: '#4b5563', margin: 0 }}>{products.length} ürün · 2 ürün seç, karşılaştır</p>
      </div>

      {/* Arama */}
      <div style={{ marginBottom: 24, maxWidth: 480, position: 'relative' }}>
        <input
          type="text"
          placeholder="Bu kategoride ara..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#0d0d0d', border: `1px solid ${searchQuery ? '#C9A22760' : '#1a1a1a'}`,
            color: '#fff', padding: '11px 40px 11px 14px',
            borderRadius: 12, fontSize: 14, outline: 'none',
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}>
            ✕
          </button>
        )}
      </div>

      {/* Karşılaştırma Paneli */}
      <div ref={comparisonRef}>
        {showComparison && selectedA && selectedB && (
          <ComparisonPanel productA={selectedA} productB={selectedB} categorySlug={categorySlug} onClose={closeComparison} />
        )}
      </div>

      {/* Seçim durumu */}
      {selectionCount > 0 && !showComparison && (
        <div style={{ borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#C9A22710', border: '1px solid #C9A22730' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
            <span style={{ color: '#C9A227', fontWeight: 700 }}>{selectionCount}/2 ürün seçildi</span>
            {selectedA && <span style={{ color: '#9ca3af', fontSize: 12 }}>1. {selectedA.name?.split(' ').slice(0,3).join(' ')}</span>}
            {selectedB && <><span style={{ color: '#4b5563' }}>vs</span><span style={{ color: '#9ca3af', fontSize: 12 }}>2. {selectedB.name?.split(' ').slice(0,3).join(' ')}</span></>}
          </div>
          {!twoSelected && <span style={{ fontSize: 12, color: '#4b5563' }}>1 ürün daha seç</span>}
        </div>
      )}

      {/* Spinner */}
      {comparing && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #1f2937', borderTopColor: '#C9A227', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Ürün Grid — karşılaştırma açıkken gizle */}
      {!showComparison && (
        filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#4b5563' }}>
            <p style={{ fontSize: 16, margin: '0 0 8px' }}>"{searchQuery}" için sonuç bulunamadı</p>
            <p style={{ fontSize: 13, margin: 0 }}>Farklı bir kelime dene</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {filtered.map(({ product, score }: any) => {
              const order = selectedA?.id === product.id ? 1 : selectedB?.id === product.id ? 2 : null;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  ratioScore={score}
                  categoryUrl={categoryUrl}
                  selectionOrder={order as 1 | 2 | null}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                  disabled={twoSelected && order === null}
                />
              );
            })}
          </div>
        )
      )}


      {/* Karşılaştır butonu — 2 ürün seçilince ortada pill olarak çıkar */}
      {twoSelected && !showComparison && !comparing && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <button onClick={handleCompare} style={{
            padding: '14px 36px', borderRadius: 16,
            fontWeight: 800, fontSize: 16,
            background: 'linear-gradient(135deg, #D4AF37, #C9A227)',
            color: '#000', border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(201,162,39,0.45)',
            display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap',
          }}>
            ⚡ Karşılaştır
            <span style={{ fontSize: 13, opacity: 0.7, fontWeight: 600 }}>(2 ürün seçildi)</span>
          </button>
        </div>
      )}
      {twoSelected && !showComparison && <div style={{ height: 80 }} />}

    </div>
  );
}
