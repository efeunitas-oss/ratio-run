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


interface ComparisonViewProps {
  comparison: RatioComparisonResult;
  categorySlug: string;
}

export function ComparisonView({ comparison, categorySlug }: ComparisonViewProps) {

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
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle, ${colorA.primary}, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
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

                <div style={{ background: "rgba(17,24,39,0.95)", border: "1px solid #4b5563", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: "#D4AF37" }}>
                    VS
                  </span>
                </div>
              </div>
            </div>

            {/* Ürün Kartları */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
              <div>
                <ProductCard
                  product={comparison.product_a}
                  ratioScore={comparison.ratio_a}
                  categorySlug={categorySlug}
                  isWinner={comparison.winner === 'a'}
                  isCrushingVictory={comparison.is_crushing_victory && comparison.winner === 'a'}
                />
              </div>

              <div>
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
        <div style={{ marginBottom: 24 }}>
          <div className="backdrop-blur-xl bg-gradient-to-br from-gray-900/60 to-gray-900/40 border border-gray-800/50 rounded-2xl p-4 shadow-2xl">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div className="flex-shrink-0">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex-1">
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f3f4f6", margin: "0 0 6px" }}>Karar Analizi</h2>
                <p style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
                  {comparison.recommendation}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 12, maxWidth: "85%", marginLeft: "auto", marginRight: "auto" }}>
                  <div style={{ background: "rgba(55,65,81,0.25)", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(75,85,99,0.4)", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#6b7280", marginBottom: 3, lineHeight: 1.2 }}>Fark Yüzdesi</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#D4AF37" }}>
                      %{comparison.advantage_percentage.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ background: "rgba(55,65,81,0.25)", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(75,85,99,0.4)", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#6b7280", marginBottom: 3, lineHeight: 1.2 }}>Ürün A Ratio</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f3f4f6" }}>
                      {comparison.ratio_a.normalized_score.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ background: "rgba(55,65,81,0.25)", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(75,85,99,0.4)", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#6b7280", marginBottom: 3, lineHeight: 1.2 }}>Ürün B Ratio</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f3f4f6" }}>
                      {comparison.ratio_b.normalized_score.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teknik Özellikler Tablosu */}
        <div>
          <TechSpecsTable
            productA={comparison.product_a}
            productB={comparison.product_b}
            categorySlug={categorySlug}
          />
        </div>

        {/* Detaylı Puan Dağılımı */}
        <div style={{ marginTop: 32 }}>
          <details className="backdrop-blur-xl bg-gray-900/40 border border-gray-800/50 rounded-2xl overflow-hidden">
            <summary style={{ cursor: "pointer", padding: "12px 16px" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6" }}>Detaylı Puan Dağılımı</span>
            </summary>
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(55,65,81,0.3)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Ürün A */}
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "#D4AF37", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "#D4AF37", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{ fontSize: 10, color: "#6b7280", textTransform: "capitalize", whiteSpace: "nowrap", minWidth: 0 }}>
            {key.replace(/_/g, ' ')}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
            <div style={{ flex: 1, height: 6, background: "#1f2937", borderRadius: 4, overflow: "hidden", minWidth: 0 }}>
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
            <span style={{ fontSize: 11, color: "#d1d5db", fontFamily: "monospace", textAlign: "right", flexShrink: 0 }}>
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
