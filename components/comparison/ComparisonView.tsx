'use client';

// ============================================================================
// RATIO.RUN - COMPARISON VIEW
// Premium VS screen with brand glow effects and decision recommendation
// ============================================================================

import { ComparisonResult } from '@/lib/types';
import { ProductCard } from '@/components/ui/ProductCard';
import { TechSpecsTable } from '@/components/ui/TechSpecsTable';
import { extractBrand, getSpecConfig } from '@/lib/spec-config';
import { useEffect, useState } from 'react';

interface ComparisonViewProps {
  comparison: ComparisonResult;
  categorySlug: string;
}

export function ComparisonView({ comparison, categorySlug }: ComparisonViewProps) {
  const [mounted, setMounted] = useState(false);
  
  const brandA = extractBrand(comparison.product_a.title);
  const brandB = extractBrand(comparison.product_b.title);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 transition-all duration-1000 ${
            mounted ? 'scale-100' : 'scale-0'
          }`}
          style={{
            background: `radial-gradient(circle, ${colorA.primary}, transparent 70%)`,
          }}
        />
        <div
          className={`absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 transition-all duration-1000 delay-300 ${
            mounted ? 'scale-100' : 'scale-0'
          }`}
          style={{
            background: `radial-gradient(circle, ${colorB.primary}, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 bg-clip-text text-transparent">
            Ratio.Run
          </h1>
          <p className="text-gray-400 text-lg">
            Akıllı Karar Mekanizması
          </p>
        </div>

        {/* VS Header */}
        <div className="mb-12">
          <div className="relative">
            {/* VS Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 opacity-30" />
                </div>
                <div className="relative backdrop-blur-xl bg-gray-900/80 border-2 border-gray-700 rounded-full w-24 h-24 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl font-black bg-gradient-to-br from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                    VS
                  </span>
                </div>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
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

        {/* Recommendation Card */}
        <div className={`mb-12 transition-all duration-700 delay-500 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="backdrop-blur-xl bg-gradient-to-br from-gray-900/60 to-gray-900/40 border border-gray-800/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-100 mb-3">
                  Karar Analizi
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                  {comparison.recommendation}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="backdrop-blur-sm bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                    <div className="text-sm text-gray-500 mb-1">Fark Yüzdesi</div>
                    <div className="text-2xl font-bold text-emerald-400">
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

        {/* Technical Specifications */}
        <div className={`transition-all duration-700 delay-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <TechSpecsTable
            productA={comparison.product_a}
            productB={comparison.product_b}
            categorySlug={categorySlug}
          />
        </div>

        {/* Score Breakdown (Expandable) */}
        <div className={`mt-12 transition-all duration-700 delay-900 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <details className="backdrop-blur-xl bg-gray-900/40 border border-gray-800/50 rounded-2xl overflow-hidden">
            <summary className="cursor-pointer p-6 hover:bg-gray-800/30 transition-colors">
              <span className="text-xl font-bold text-gray-100">
                Detaylı Puan Dağılımı
              </span>
            </summary>
            <div className="p-6 border-t border-gray-800/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product A Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-4">
                    {comparison.product_a.title.split(' ').slice(0, 5).join(' ')}
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(comparison.ratio_a.breakdown.individual_scores).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                              style={{ width: `${(value / 100) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-300 font-mono w-12 text-right">
                            {value.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product B Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">
                    {comparison.product_b.title.split(' ').slice(0, 5).join(' ')}
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(comparison.ratio_b.breakdown.individual_scores).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                              style={{ width: `${(value / 100) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-300 font-mono w-12 text-right">
                            {value.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
