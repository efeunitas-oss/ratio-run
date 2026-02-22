'use client';

// ============================================================================
// RATIO.RUN - PRODUCT CARD v2
// Düzeltmeler:
//   • product.title → product.name (DB şemasıyla uyumlu)
//   • rating/reviews → specifications.stars / specifications.reviewsCount
//   • Türkçe encoding düzeltildi
//   • Null crash'leri giderildi
// ============================================================================

import { Product, RatioScore } from '@/lib/types';
import { getValueBadge } from '@/lib/ratio-engine';
import { extractBrand, getSpecConfig } from '@/lib/spec-config';
import { useImageLoader, getFallbackIconDataUrl } from '@/lib/image-handler';
import { useState } from 'react';

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

  // ── Ürün adı: DB'de 'name' kolonu, 'title' değil ──────────────────────────
  const productName = product.name ?? 'İsimsiz Ürün';

  // ── Marka: name'den çıkar ─────────────────────────────────────────────────
  const brand = extractBrand(productName);
  const config = getSpecConfig(categorySlug);
  const brandColor = config.brand_colors[brand] || {
    primary: '#4B5563',
    glow: 'rgba(75, 85, 99, 0.3)',
    accent: '#9CA3AF',
  };

  // ── Rating: DB'de doğrudan kolon yok, specifications içinde ──────────────
  const specs = product.specifications ?? {};
  const rating: number = typeof specs.stars === 'number' ? specs.stars : 0;
  const reviewsCount: number =
    typeof specs.reviewsCount === 'number' ? specs.reviewsCount : 0;

  // ── Para birimi sembolü ───────────────────────────────────────────────────
  const currencySymbol = product.currency === 'USD' ? '$' : '₺';

  const valueBadge = ratioScore ? getValueBadge(ratioScore.normalized_score) : null;

  return (
    <div
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-2xl
        backdrop-blur-xl bg-gray-900/40
        border border-gray-800/50
        transition-all duration-500 ease-out
        hover:bg-gray-900/60 hover:border-gray-700/50
        hover:scale-[1.02] hover:shadow-2xl
        ${onClick ? 'cursor-pointer' : ''}
        ${isWinner ? 'ring-4 ring-[#C9A227] shadow-2xl' : ''}
        ${className}
      `}
      style={{
        boxShadow: isWinner
          ? `0 0 60px rgba(201,162,39,0.5), 0 0 0 2px #C9A227, 0 20px 60px rgba(0,0,0,0.5)`
          : undefined,
      }}
    >
      {/* Brand Glow Background */}
      {isWinner && (
        <div
          className="absolute inset-0 opacity-10 blur-3xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${brandColor.primary}, transparent 70%)`,
          }}
        />
      )}

      {/* Winner Badge */}
      {isWinner && (
        <div className="absolute top-4 right-4 z-10">
          <div className="relative">
            {isCrushingVictory && (
              <div className="absolute inset-0 animate-ping">
                <div className="h-full w-full rounded-full bg-[#C9A227]/40" />
              </div>
            )}
            <div className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#C9A227]/15 to-[#C9A227]/10 backdrop-blur-sm border border-[#C9A227]/40">
              <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-bold text-[#D4AF37] tracking-wide">
                {isCrushingVictory ? 'EZİCİ ÜSTÜNLÜK' : 'KAZANAN'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative p-6">
        {/* Görsel */}
        <div className="relative aspect-square mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50">
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-700 border-t-gray-500 rounded-full animate-spin" />
            </div>
          )}

          {status === 'loaded' && !imageError ? (
            <img
              src={optimizedUrl}
              alt={productName}
              className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : status === 'error' || imageError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={getFallbackIconDataUrl()}
                alt="Ürün görseli"
                className="w-24 h-24 opacity-30"
              />
            </div>
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Ürün Adı — line-clamp ile taşmayı önle */}
        <h3 className="text-lg font-semibold text-gray-100 mb-3 line-clamp-2 leading-tight">
          {productName}
        </h3>

        {/* Değerlendirme */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating) ? 'text-[#D4AF37]' : 'text-gray-700'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-400">
            {rating.toFixed(1)} ({reviewsCount.toLocaleString('tr-TR')})
          </span>
        </div>

        {/* Fiyat & Ratio Skoru */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-gray-100">
              {currencySymbol}
              {(product.price ?? 0).toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          {ratioScore && (
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Ratio Skoru</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#C9A227] bg-clip-text text-transparent">
                {ratioScore.normalized_score.toFixed(1)}
              </div>
            </div>
          )}
        </div>

        {/* Değer Rozeti */}
        {valueBadge && (
          <div
            className={`
              inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold tracking-wider
              ${valueBadge.bgColor} ${valueBadge.color}
              border border-current/20
            `}
          >
            {valueBadge.text}
          </div>
        )}

        {/* Satın Al Butonu */}
        {(() => {
          const pAny = product as any;
          const url = Array.isArray(pAny.sources) && pAny.sources.length > 0
            ? pAny.sources[0].url
            : pAny.source_url ?? null;
          if (!url) return null;
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={e => e.stopPropagation()}
              className="mt-4 block w-full text-center py-2.5 rounded-xl text-xs font-bold transition-all"
              style={isWinner
                ? { background: 'linear-gradient(135deg, #D4AF37, #C9A227)', color: '#000' }
                : { background: 'rgba(255,255,255,0.05)', color: '#C9A227', border: '1px solid rgba(201,162,39,0.3)' }
              }
            >
              {isWinner ? '🛒 Satın Al →' : 'Fiyata Bak →'}
            </a>
          );
        })()}
      </div>

      {/* Hover Kenarlık Efekti */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${brandColor.glow} 0%, transparent 50%, ${brandColor.glow} 100%)`,
          }}
        />
      </div>
    </div>
  );
}
