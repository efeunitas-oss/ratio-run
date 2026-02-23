'use client';

import { Product, RatioScore } from '@/lib/types';
import { getValueBadge } from '@/lib/ratio-engine';
import { extractBrand, getSpecConfig } from '@/lib/spec-config';
import { useImageLoader, getFallbackIconDataUrl } from '@/lib/image-handler';
import { useState } from 'react';

const GOLD = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';

interface ProductCardProps {
  product: Product;
  ratioScore?: RatioScore;
  categorySlug: string;
  isWinner?: boolean;
  isCrushingVictory?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ProductCard({
  product, ratioScore, categorySlug,
  isWinner = false, isCrushingVictory = false,
  onClick, className = '',
}: ProductCardProps) {
  const { status, optimizedUrl } = useImageLoader(product.image_url ?? '');
  const [imageError, setImageError] = useState(false);

  const productName = product.name ?? 'İsimsiz Ürün';
  const specs = product.specifications ?? {};
  const rating: number = typeof specs.stars === 'number' ? specs.stars : 0;
  const reviewsCount: number = typeof specs.reviewsCount === 'number' ? specs.reviewsCount : 0;
  const currencySymbol = '₺'; // Tüm fiyatlar TL — Amazon TR ve Trendyol
  const valueBadge = ratioScore ? getValueBadge(ratioScore.normalized_score) : null;

  const pAny = product as any;
  const buyUrl = Array.isArray(pAny.sources) && pAny.sources.length > 0
    ? pAny.sources[0].url : pAny.source_url ?? null;

  // Fiyat kısalt: 12.749,00 → 12.749
  const priceFormatted = (() => {
    const p = product.price ?? 0;
    if (p >= 1000) return `${currencySymbol}${Math.round(p).toLocaleString('tr-TR')}`;
    return `${currencySymbol}${p.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  })();

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden',
        background: 'rgba(17,24,39,0.9)',
        border: isWinner ? `2px solid ${GOLD}` : '1px solid rgba(55,65,81,0.5)',
        boxShadow: isWinner
          ? `0 0 0 1px ${GOLD}, 0 0 24px rgba(201,162,39,0.35)`
          : '0 4px 16px rgba(0,0,0,0.3)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}
    >
      {/* Kazanan rozeti */}
      {isWinner && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 20,
          padding: '3px 8px', borderRadius: 20,
          background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
          color: '#000', fontSize: 10, fontWeight: 800,
          whiteSpace: 'nowrap',
        }}>
          ★ {isCrushingVictory ? 'EZİCİ' : 'KAZANAN'}
        </div>
      )}

      {/* Görsel — sabit 150px */}
      <div style={{ height: 150, position: 'relative', background: '#0d0d0d', flexShrink: 0 }}>
        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, border: `2px solid #374151`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
        {status === 'loaded' && !imageError ? (
          <img src={optimizedUrl} alt={productName} referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
        ) : (status === 'error' || imageError) ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={getFallbackIconDataUrl()} alt="" style={{ width: 48, height: 48, opacity: 0.2 }} />
          </div>
        ) : null}
      </div>

      {/* İçerik */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
        {/* İsim — 2 satır max */}
        <p style={{
          fontSize: 11, fontWeight: 600, color: '#e5e7eb', lineHeight: 1.3, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {productName}
        </p>

        {/* Yıldızlar */}
        {rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: GOLD_BRIGHT, fontSize: 10 }}>
              {'★'.repeat(Math.min(Math.round(rating), 5))}{'☆'.repeat(Math.max(0, 5 - Math.round(rating)))}
            </span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>
              {rating.toFixed(1)} ({reviewsCount})
            </span>
          </div>
        )}

        {/* Fiyat + Ratio — flex row, her ikisi de shrink olmaz */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', minWidth: 0 }}>
            {priceFormatted}
          </div>
          {ratioScore && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 8, color: '#6b7280', lineHeight: 1 }}>Ratio</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: GOLD_BRIGHT }}>
                {ratioScore.normalized_score.toFixed(1)}
              </div>
            </div>
          )}
        </div>

        {/* Değer rozeti */}
        {valueBadge && (
          <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}
            className={`${valueBadge.bgColor} ${valueBadge.color}`}>
            {valueBadge.text}
          </span>
        )}

        {/* Satın Al butonu */}
        {buyUrl && (
          <a href={buyUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'block', textAlign: 'center', padding: '7px 0',
              borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: 'none',
              ...(isWinner
                ? { background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`, color: '#000' }
                : { background: 'rgba(255,255,255,0.04)', color: GOLD_BRIGHT, border: `1px solid ${GOLD}35` }
              )
            }}>
            {isWinner ? '🛒 Satın Al →' : 'Fiyata Bak →'}
          </a>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
