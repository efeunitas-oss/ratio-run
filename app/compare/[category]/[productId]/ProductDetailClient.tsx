'use client';

// app/compare/[category]/[productId]/ProductDetailClient.tsx

import { useMemo } from 'react';
import Link from 'next/link';
import { calculateRatioScore } from '@/lib/ratio-engine';
import { getSpecConfig } from '@/lib/spec-config';

const GOLD        = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number | null;
  avg_price: number | null;
  image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  sources: any;
  specifications: Record<string, any>;
  stock_status: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  product: Product;
  category: Category;
  categorySlug: string;
  categoryUrl: string;
  similarProducts: Product[];
}

function fmtPrice(price: number | null): string {
  if (!price) return '—';
  return `₺${Math.round(price).toLocaleString('tr-TR')}`;
}

function RatioGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#10B981' : score >= 65 ? GOLD : score >= 50 ? '#F59E0B' : '#6B7280';
  const label = score >= 80 ? 'OLAĞANÜSTÜ' : score >= 65 ? 'MÜKEMMEL' : score >= 50 ? 'İYİ DEĞER' : 'MAKUL';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
        <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{score.toFixed(0)}</span>
          <span style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>/100</span>
        </div>
      </div>
      <div style={{
        marginTop: 10, display: 'inline-block',
        padding: '3px 12px', borderRadius: 20,
        fontSize: 11, fontWeight: 700,
        background: `${color}20`, color,
        border: `1px solid ${color}40`,
      }}>
        {label}
      </div>
    </div>
  );
}

function SourceLink({ product }: { product: Product }) {
  const sources: Array<{ name: string; url: string; price?: number }> =
    Array.isArray(product.sources) && product.sources.length > 0
      ? product.sources
      : product.source_url
      ? [{ name: product.source_name ?? 'Mağaza', url: product.source_url }]
      : [];

  if (sources.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 10,
            background: i === 0 ? `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` : 'rgba(201,162,39,0.08)',
            border: i === 0 ? 'none' : `1px solid ${GOLD}40`,
            color: i === 0 ? '#000' : GOLD_BRIGHT,
            textDecoration: 'none', fontWeight: 700, fontSize: 14,
            transition: 'opacity 0.15s',
          }}
        >
          <span>{i === 0 ? '🛒 En İyi Fiyata Al' : `${s.name} ↗`}</span>
          {s.price && (
            <span style={{ fontFamily: 'monospace' }}>{fmtPrice(s.price)}</span>
          )}
        </a>
      ))}
    </div>
  );
}

function SpecRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      padding: '10px 0',
      borderBottom: '1px solid #1f2937',
      background: highlight ? `${GOLD}08` : 'transparent',
    }}>
      <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: highlight ? GOLD_BRIGHT : '#e5e7eb' }}>{value}</span>
    </div>
  );
}

function SimilarCard({ product, categoryUrl, categorySlug }: { product: Product; categoryUrl: string; categorySlug: string }) {
  const config = getSpecConfig(categorySlug);
  const maxPrice = product.avg_price ?? product.price ?? 1;
  const score = calculateRatioScore(product as any, config.weights, maxPrice * 1.5).normalized_score;
  const color = score >= 70 ? GOLD_BRIGHT : '#6b7280';

  return (
    <Link
      href={`/compare/${categoryUrl}/${product.id}`}
      style={{
        display: 'flex', flexDirection: 'column',
        background: '#0d0d0d', border: '1px solid #1f2937',
        borderRadius: 14, overflow: 'hidden',
        textDecoration: 'none', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = `${GOLD}60`}
      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1f2937'}
    >
      <div style={{ height: 120, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span style={{ fontSize: 28, opacity: 0.1 }}>📦</span>
        )}
      </div>
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', lineHeight: 1.3, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </p>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: GOLD_BRIGHT }}>
            {fmtPrice(product.avg_price ?? product.price)}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace' }}>
            {score.toFixed(0)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ProductDetailClient({
  product, category, categorySlug, categoryUrl, similarProducts,
}: Props) {
  const config = useMemo(() => getSpecConfig(categorySlug), [categorySlug]);

  const maxPrice = useMemo(() =>
    Math.max(product.avg_price ?? product.price ?? 0, 1),
    [product]
  );

  const ratioScore = useMemo(() =>
    calculateRatioScore(product as any, config.weights, maxPrice * 1.5),
    [product, config, maxPrice]
  );

  const score = ratioScore.normalized_score;

  // Teknik özellik satırları
  const specRows = useMemo(() => {
    const displayCols = config.columns.filter(c => c.priority === 'high' || c.priority === 'medium');
    const specs = product.specifications ?? {};

    return displayCols
      .map(col => {
        const raw = specs[col.key];
        if (raw == null || raw === '' || raw === 0) return null;
        let formatted = '';
        if (col.format === 'number') formatted = `${Number(raw).toLocaleString('tr-TR')}${col.unit ? ` ${col.unit}` : ''}`;
        else if (col.format === 'percentage') formatted = `%${raw}`;
        else formatted = String(raw);
        return { label: col.label, value: formatted, priority: col.priority };
      })
      .filter(Boolean) as { label: string; value: string; priority: string }[];
  }, [product, config]);

  // Fiyat
  const displayPrice = fmtPrice(product.avg_price ?? product.price);

  // JSON-LD server page.tsx'de üretiliyor

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <nav style={{
        borderBottom: `1px solid ${GOLD}35`,
        padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)', zIndex: 50,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 36, width: 'auto' }} />
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
            ratio<span style={{ color: GOLD_BRIGHT }}>.run</span>
          </span>
        </a>
        <Link
          href={`/compare/${categoryUrl}`}
          style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← {category.name}
        </Link>
      </nav>

      {/* BREADCRUMB */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#4b5563' }}>
          <a href="/" style={{ color: '#4b5563', textDecoration: 'none' }}>Ana Sayfa</a>
          <span>›</span>
          <Link href={`/compare/${categoryUrl}`} style={{ color: '#4b5563', textDecoration: 'none' }}>{category.name}</Link>
          <span>›</span>
          <span style={{ color: '#9ca3af' }}>{product.name?.split(' ').slice(0, 4).join(' ')}</span>
        </div>
      </div>

      {/* ANA İÇERİK */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: 32, alignItems: 'start' }}>

          {/* SOL — Görsel + Özellikler */}
          <div>
            {/* Görsel */}
            <div style={{
              background: '#0d0d0d', borderRadius: 20, border: '1px solid #1f2937',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 380, overflow: 'hidden', marginBottom: 24,
            }}>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 24 }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span style={{ fontSize: 60, opacity: 0.08 }}>📦</span>
              )}
            </div>

            {/* Teknik Özellikler */}
            {specRows.length > 0 && (
              <div style={{ background: '#0d0d0d', borderRadius: 16, border: '1px solid #1f2937', padding: '20px 24px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb', margin: '0 0 16px' }}>
                  Teknik Özellikler
                </h2>
                {specRows.map((row, i) => (
                  <SpecRow key={i} label={row.label} value={row.value} highlight={row.priority === 'high'} />
                ))}

                {/* Fiyat her zaman altta */}
                <SpecRow label="Fiyat" value={displayPrice} highlight />
              </div>
            )}
          </div>

          {/* SAĞ — Bilgiler + Ratio + Satın Al */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Başlık */}
            <div>
              {product.brand && (
                <p style={{ fontSize: 13, color: GOLD_BRIGHT, fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {product.brand}
                </p>
              )}
              <h1 style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                {product.name}
              </h1>
            </div>

            {/* Yıldızlar */}
            {product.specifications?.stars > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{ color: i <= Math.round(product.specifications.stars) ? GOLD_BRIGHT : '#374151', fontSize: 16 }}>★</span>
                  ))}
                </div>
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  {product.specifications.stars.toFixed(1)}
                  {product.specifications.reviewsCount ? ` (${product.specifications.reviewsCount.toLocaleString('tr-TR')} değerlendirme)` : ''}
                </span>
              </div>
            )}

            {/* Fiyat */}
            <div style={{ padding: '16px 20px', background: '#0d0d0d', borderRadius: 14, border: '1px solid #1f2937' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Güncel Fiyat</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: GOLD_BRIGHT }}>
                {displayPrice}
              </div>
            </div>

            {/* Ratio Score */}
            <div style={{ padding: '20px', background: '#0d0d0d', borderRadius: 14, border: `1px solid ${GOLD}30` }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Ratio Score
              </div>
              <RatioGauge score={score} />

              {/* Breakdown barları */}
              {Object.keys(ratioScore.breakdown.individual_scores).length > 0 && (
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(ratioScore.breakdown.individual_scores).map(([key, val]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 11, color: GOLD_BRIGHT, fontWeight: 700 }}>{(val as number).toFixed(0)}</span>
                      </div>
                      <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          width: `${Math.min((val as number), 100)}%`,
                          background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`,
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Satın Al Linkleri */}
            <SourceLink product={product} />

            {/* Karşılaştır CTA */}
            <Link
              href={`/compare/${categoryUrl}?productA=${product.id}`}
              style={{
                display: 'block', textAlign: 'center',
                padding: '12px 0', borderRadius: 12,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                background: 'transparent',
                color: GOLD_BRIGHT,
                border: `1px solid ${GOLD}50`,
                transition: 'background 0.15s',
              }}
            >
              ⚡ Başka Ürünle Karşılaştır
            </Link>
          </div>
        </div>

        {/* MOBİL: grid override */}
        <style>{`
          @media (max-width: 768px) {
            .product-detail-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* BENZERİ ÜRÜNLER */}
        {similarProducts.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#e5e7eb', marginBottom: 16 }}>
              Benzer Ürünler
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {similarProducts.map(p => (
                <SimilarCard key={p.id} product={p} categoryUrl={categoryUrl} categorySlug={categorySlug} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
