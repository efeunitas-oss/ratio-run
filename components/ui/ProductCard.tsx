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
  product,
  ratioScore,
  categorySlug,
  isWinner = false,
  isCrushingVictory = false,
  onClick,
  className = '',
}: ProductCardProps) {
  const { status, optimizedUrl } = useImageLoader(product.image_url ?? '');
  const [imageError, setImageError] = useState(false);

  const productName = product.name ?? 'İsimsiz Ürün';
  const brand = extractBrand(productName);
  const config = getSpecConfig(categorySlug);
  const specs = product.specifications ?? {};
  const rating: number = typeof specs.stars === 'number' ? specs.stars : 0;
  const reviewsCount: number = typeof specs.reviewsCount === 'number' ? specs.reviewsCount : 0;
  const currencySymbol = product.currency === 'USD' ? '$' : '₺';
  const valueBadge = ratioScore ? getValueBadge(ratioScore.normalized_score) : null;

  const pAny = product as any;
  const buyUrl = Array.isArray(pAny.sources) && pAny.sources.length > 0
    ? pAny.sources[0].url
    : pAny.source_url ?? null;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(17,24,39,0.8)',
        border: isWinner ? `2px solid ${GOLD}` : '1px solid rgba(55,65,81,0.5)',
        boxShadow: isWinner
          ? `0 0 0 2px ${GOLD}, 0 0 40px rgba(201,162,39,0.4), 0 8px 32px rgba(0,0,0,0.5)`
          : '0 4px 20px rgba(0,0,0,0.3)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Kazanan rozeti */}
      {isWinner && (
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 20,
          background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
          color: '#000', fontSize: 11, fontWeight: 800,
          boxShadow: `0 2px 12px rgba(201,162,39,0.5)`,
        }}>
          ★ {isCrushingVictory ? 'EZİCİ ÜSTÜNLÜK' : 'KAZANAN'}
        </div>
      )}

      {/* Görsel — sabit 200px */}
      <div style={{ height: 200, position: 'relative', background: '#0d0d0d', flexShrink: 0 }}>
        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, border: `3px solid #374151`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
        {status === 'loaded' && !imageError ? (
          <img
            src={optimizedUrl}
            alt={productName}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 12 }}
          />
        ) : (status === 'error' || imageError) ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={getFallbackIconDataUrl()} alt="" style={{ width: 64, height: 64, opacity: 0.2 }} />
          </div>
        ) : null}
      </div>

      {/* İçerik */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {/* İsim */}
        <p style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', lineHeight: 1.4, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {productName}
        </p>

        {/* Yıldızlar */}
        {rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: GOLD_BRIGHT, fontSize: 12 }}>
              {'★'.repeat(Math.min(Math.round(rating), 5))}{'☆'.repeat(Math.max(0, 5 - Math.round(rating)))}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {rating.toFixed(1)} ({reviewsCount.toLocaleString('tr-TR')})
            </span>
          </div>
        )}

        {/* Fiyat + Ratio */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
              {currencySymbol}{(product.price ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          {ratioScore && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Ratio Skoru</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: GOLD_BRIGHT }}>
                {ratioScore.normalized_score.toFixed(1)}
              </div>
            </div>
          )}
        </div>

        {/* Değer rozeti */}
        {valueBadge && (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          }} className={`${valueBadge.bgColor} ${valueBadge.color}`}>
            {valueBadge.text}
          </span>
        )}

        {/* Satın Al butonu */}
        {buyUrl && (
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'block', textAlign: 'center', padding: '8px 0',
              borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none',
              marginTop: 4,
              ...(isWinner
                ? { background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`, color: '#000' }
                : { background: 'rgba(255,255,255,0.05)', color: GOLD_BRIGHT, border: `1px solid ${GOLD}40` }
              )
            }}
          >
            {isWinner ? '🛒 Satın Al →' : 'Fiyata Bak →'}
          </a>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
