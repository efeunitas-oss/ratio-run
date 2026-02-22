'use client';

// ============================================================================
// RATIO.RUN - COMPARISON VIEW v2
// Düzeltmeler:
//   • product.title → product.name
//   • .title.split() null crash'i giderildi
//   • Türkçe encoding düzeltildi
// ============================================================================

import { RatioComparisonResult } from '@/lib/types';
import { ProductCard } from '@/components/ui/ProductCard';
import { TechSpecsTable } from '@/components/ui/TechSpecsTable';
import { extractBrand, getSpecConfig } from '@/lib/spec-config';
import { useEffect, useState } from 'react';

interface ComparisonViewProps {
  comparison: RatioComparisonResult;
  categorySlug: string;
}

export function ComparisonView({ comparison, categorySlug }: ComparisonViewProps) {
  const [mounted, setMounted] = useState(false);

  // ── Marka tespiti: name kullan, title değil ───────────────────────────────
  const brandA = extractBrand(comparison.product_a.name);
  const brandB = extractBrand(comparison.product_b.name);
  const config = getSpecConfig(categorySlug);

  const colorA = config.brand_colors[brandA] || {
    primary: '#10B981',
    glow: 'rgba(16, 185, 129, 0.3)',
    accent: '#FFFFFF',
  };
  const colorB = config.brand_colors[brandB] || {
    primary: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.3)',
    accent: '#FFFFFF',
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Kısa başlık yardımcısı — null-safe ───────────────────────────────────
  const shortName = (name: string | null | undefined, wordCount = 5) => {
    if (!name) return 'Ürün';
    return name.split(' ').slice(0, wordCount).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Animasyonlu arka plan gradyanları */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 transition-all duration-1000 ${
            mounted ? 'scale-100' : 'scale-0'
          }`}
          style={{ background: `radial-gradient(circle, ${colorA.primary}, transparent 70%)` }}
        />
        <div
          className={`absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 transition-all duration-1000 delay-300 ${
            mounted ? 'scale-100' : 'scale-0'
          }`}
          style={{ background: `radial-gradient(circle, ${colorB.primary}, transparent 70%)` }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-3 py-4">


        {/* VS Alanı */}
        <div className="mb-6">
          <div className="relative">
            {/* VS Rozeti */}
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 20 }}>
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-[#C9A227] to-[#D4AF37] opacity-30" />
                </div>
                <div className="relative backdrop-blur-xl bg-gray-900/80 border-2 border-gray-700 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl">
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#D4AF37" }}>
                    VS
                  </span>
                </div>
              </div>
            </div>

            {/* Ürün Kartları */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className={`transition-all duration-700 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
                <ProductCard
                  product={comparison.product_a}
                  ratioScore={comparison.ratio_a}
                  categorySlug={categorySlug}
                  isWinner={comparison.winner === 'a'}
                  isCrushingVictory={comparison.is_crushing_victory && comparison.winner === 'a'}
                />
              </div>

              <div className={`transition-all duration-700 delay-200 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                <ProductCard
                  product={comparison.product_b}
                  ratioScore={comparison.ratio_b}
                  categorySlug={categorySlug}
                  isWinner={comparison.winner === 'b'}
                  isCrushingVictory={comparison.is_crushing_victory && comparison.winner === 'b'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Karar Analizi */}
        <div className={`mb-6 transition-all duration-700 delay-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="backdrop-blur-xl bg-gradient-to-br from-gray-900/60 to-gray-900/40 border border-gray-800/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A227]/15 to-[#C9A227]/5 border border-[#C9A227]/40 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-100 mb-3">Karar Analizi</h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                  {comparison.recommendation}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="backdrop-blur-sm bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                    <div className="text-sm text-gray-500 mb-1">Fark Yüzdesi</div>
                    <div className="text-2xl font-bold text-[#D4AF37]">
                      %{comparison.advantage_percentage.toFixed(1)}
                    </div>
                  </div>
                  <div className="backdrop-blur-sm bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                    <div className="text-sm text-gray-500 mb-1">Ürün A Ratio</div>
                    <div className="text-2xl font-bold text-gray-100">
                      {comparison.ratio_a.normalized_score.toFixed(1)}
                    </div>
                  </div>
                  <div className="backdrop-blur-sm bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                    <div className="text-sm text-gray-500 mb-1">Ürün B Ratio</div>
                    <div className="text-2xl font-bold text-gray-100">
                      {comparison.ratio_b.normalized_score.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teknik Özellikler Tablosu */}
        <div className={`transition-all duration-700 delay-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <TechSpecsTable
            productA={comparison.product_a}
            productB={comparison.product_b}
            categorySlug={categorySlug}
          />
        </div>

        {/* Detaylı Puan Dağılımı */}
        <div className={`mt-12 transition-all duration-700 delay-900 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <details className="backdrop-blur-xl bg-gray-900/40 border border-gray-800/50 rounded-2xl overflow-hidden">
            <summary className="cursor-pointer p-6 hover:bg-gray-800/30 transition-colors">
              <span className="text-xl font-bold text-gray-100">Detaylı Puan Dağılımı</span>
            </summary>
            <div className="p-6 border-t border-gray-800/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ürün A */}
                <div>
                  <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">
                    {shortName(comparison.product_a.name)}
                  </h3>
                  <ScoreBreakdown scores={comparison.ratio_a.breakdown.individual_scores} color="gold" />
                  {/* "Neden bu puanı aldı?" açıklamaları */}
                  {comparison.ratio_a.breakdown.explanations?.length > 0 && (
                    <ExplanationList explanations={comparison.ratio_a.breakdown.explanations} />
                  )}
                </div>

                {/* Ürün B */}
                <div>
                  <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">
                    {shortName(comparison.product_b.name)}
                  </h3>
                  <ScoreBreakdown scores={comparison.ratio_b.breakdown.individual_scores} color="gold" />
                  {comparison.ratio_b.breakdown.explanations?.length > 0 && (
                    <ExplanationList explanations={comparison.ratio_b.breakdown.explanations} />
                  )}
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

// ─── Alt Bileşenler ───────────────────────────────────────────────────────────

function ScoreBreakdown({
  scores,
  color,
}: {
  scores: Record<string, number>;
  color: 'gold';
}) {
  const barColor = 'from-[#C9A227] to-[#D4AF37]';

  return (
    <div className="space-y-3 mb-4">
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-gray-400 capitalize text-sm">
            {key.replace(/_/g, ' ')}
          </span>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
            <span className="text-gray-300 font-mono w-12 text-right text-sm">
              {value.toFixed(1)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExplanationList({ explanations }: { explanations: string[] }) {
  return (
    <div className="mt-4 p-3 bg-gray-800/40 rounded-xl border border-gray-700/30">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        Neden bu puanı aldı?
      </div>
      <ul className="space-y-1">
        {explanations.map((exp, i) => (
          <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
            <span className="text-[#C9A227] mt-0.5">›</span>
            {exp}
          </li>
        ))}
      </ul>
    </div>
  );
}
