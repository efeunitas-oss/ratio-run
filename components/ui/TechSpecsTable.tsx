'use client';

// ============================================================================
// RATIO.RUN - TECH SPECS TABLE v2
// Düzeltmeler: product.title → product.name, null-safe price, encoding fixed
// ============================================================================

import { Product } from '@/lib/types';
import { getSpecConfig } from '@/lib/spec-config';
import { getSpecValue } from '@/lib/ratio-engine';

interface TechSpecsTableProps {
  productA: Product;
  productB: Product;
  categorySlug: string;
  className?: string;
}

export function TechSpecsTable({
  productA,
  productB,
  categorySlug,
  className = '',
}: TechSpecsTableProps) {
  const config = getSpecConfig(categorySlug);

  const displayColumns = config.columns.filter(
    (col) => col.priority === 'high' || col.priority === 'medium'
  );

  // Null-safe kısa ad yardımcısı
  const shortName = (product: Product, words = 3) => {
    const name = product.name ?? 'Ürün';
    const parts = name.split(' ').slice(0, words).join(' ');
    return parts.length < name.length ? `${parts}...` : parts;
  };

  const formatValue = (
    value: string | number | null,
    format?: string,
    unit?: string
  ): string => {
    if (value === null || value === undefined) return '—';

    if (format === 'number' && typeof value === 'number')
      return `${value.toLocaleString('tr-TR')}${unit ? ` ${unit}` : ''}`;

    if (format === 'percentage' && typeof value === 'number')
      return `${value}%`;

    if (format === 'currency' && typeof value === 'number')
      return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;

    return `${value}${unit ? ` ${unit}` : ''}`;
  };

  const compareValues = (
    valueA: string | number | null,
    valueB: string | number | null
  ): { winner: 'a' | 'b' | 'tie'; advantage: number } => {
    if (valueA === null || valueB === null) return { winner: 'tie', advantage: 0 };

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      if (Math.abs(valueA - valueB) < 0.01) return { winner: 'tie', advantage: 0 };
      const advantage = (Math.abs(valueA - valueB) / Math.min(valueA, valueB)) * 100;
      return { winner: valueA > valueB ? 'a' : 'b', advantage };
    }

    return { winner: 'tie', advantage: 0 };
  };

  // Fiyat karşılaştırması — null-safe
  const priceA = productA.price ?? 0;
  const priceB = productB.price ?? 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Başlık */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Teknik Özellikler</h2>
        <div className="h-1 w-20 bg-gradient-to-r from-[#C9A227] to-[#D4AF37] rounded-full" />
      </div>

      {/* Mobil: Kart Düzeni */}
      <div className="block lg:hidden space-y-4">
        {displayColumns.map((column) => {
          const valueA = getSpecValue(productA, column.key, categorySlug);
          const valueB = getSpecValue(productB, column.key, categorySlug);
          const comparison = compareValues(valueA, valueB);

          return (
            <div
              key={column.key}
              className="backdrop-blur-xl bg-gray-900/40 rounded-xl border border-gray-800/50 p-4"
            >
              <div className="text-sm font-semibold text-gray-400 mb-3">{column.label}</div>
              <div className="space-y-2">
                {/* Ürün A */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  comparison.winner === 'a'
                    ? `bg-[#C9A227]/10 border border-[#C9A227]/40`
                    : 'bg-gray-800/30'
                }`}>
                  <span className="text-xs text-gray-500">{shortName(productA)}</span>
                  <span className={`text-lg font-bold ${
                    comparison.winner === 'a' ? 'text-[#D4AF37]' : 'text-gray-300'
                  }`}>
                    {formatValue(valueA, column.format, column.unit)}
                  </span>
                </div>

                {/* Ürün B */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  comparison.winner === 'b'
                    ? `bg-[#C9A227]/10 border border-[#C9A227]/40`
                    : 'bg-gray-800/30'
                }`}>
                  <span className="text-xs text-gray-500">{shortName(productB)}</span>
                  <span className={`text-lg font-bold ${
                    comparison.winner === 'b' ? 'text-[#D4AF37]' : 'text-gray-300'
                  }`}>
                    {formatValue(valueB, column.format, column.unit)}
                  </span>
                </div>
              </div>

              {comparison.winner !== 'tie' && comparison.advantage > 5 && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {comparison.advantage > 20 ? '🔥 Önemli fark' : '✓ Daha iyi'}
                </div>
              )}
            </div>
          );
        })}

        {/* Fiyat satırı (mobil) */}
        <div className="backdrop-blur-xl bg-gray-900/40 rounded-xl border border-gray-800/50 p-4">
          <div className="text-sm font-semibold text-gray-400 mb-3">Fiyat</div>
          <div className="space-y-2">
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              priceA < priceB ? `bg-[#C9A227]/10 border border-[#C9A227]/40` : 'bg-gray-800/30'
            }`}>
              <span className="text-xs text-gray-500">{shortName(productA)}</span>
              <span className={`text-lg font-bold ${priceA < priceB ? 'text-[#D4AF37]' : 'text-gray-300'}`}>
                ₺{priceA.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              priceB < priceA ? `bg-[#C9A227]/10 border border-[#C9A227]/40` : 'bg-gray-800/30'
            }`}>
              <span className="text-xs text-gray-500">{shortName(productB)}</span>
              <span className={`text-lg font-bold ${priceB < priceA ? 'text-[#D4AF37]' : 'text-gray-300'}`}>
                ₺{priceB.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Masaüstü: Tablo */}
      <div className="hidden lg:block overflow-hidden rounded-2xl backdrop-blur-xl bg-gray-900/40 border border-gray-800/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/50">
              <th className="text-left p-4 text-sm font-semibold text-gray-400 w-1/3">Özellik</th>
              <th className="text-center p-4 text-sm font-semibold w-1/3" style={{ color: "#D4AF37" }}>
                {shortName(productA, 4)}
              </th>
              <th className="text-center p-4 text-sm font-semibold w-1/3" style={{ color: "#D4AF37" }}>
                {shortName(productB, 4)}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayColumns.map((column, index) => {
              const valueA = getSpecValue(productA, column.key, categorySlug);
              const valueB = getSpecValue(productB, column.key, categorySlug);
              const comparison = compareValues(valueA, valueB);

              return (
                <tr
                  key={column.key}
                  className={`border-b border-gray-800/30 transition-colors hover:bg-gray-800/20 ${
                    index % 2 === 0 ? 'bg-gray-900/20' : ''
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        column.priority === 'high' ? 'bg-[#C9A227]' : 'bg-gray-600'
                      }`} />
                      <span className="text-gray-300 font-medium">{column.label}</span>
                    </div>
                  </td>

                  <td className={`p-4 text-center ${comparison.winner === 'a' ? 'bg-[#C9A227]/5' : ''}`}>
                    <div className="flex items-center justify-center gap-2">
                      {comparison.winner === 'a' && (
                        <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-lg font-bold ${
                        comparison.winner === 'a' ? 'text-[#D4AF37]' : 'text-gray-300'
                      }`}>
                        {formatValue(valueA, column.format, column.unit)}
                      </span>
                    </div>
                  </td>

                  <td className={`p-4 text-center ${comparison.winner === 'b' ? 'bg-[#C9A227]/5' : ''}`}>
                    <div className="flex items-center justify-center gap-2">
                      {comparison.winner === 'b' && (
                        <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-lg font-bold ${
                        comparison.winner === 'b' ? 'text-[#D4AF37]' : 'text-gray-300'
                      }`}>
                        {formatValue(valueB, column.format, column.unit)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Fiyat satırı */}
            <tr className="border-b border-gray-800/30 hover:bg-gray-800/20">
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#C9A227]" />
                  <span className="text-gray-300 font-medium">Fiyat</span>
                </div>
              </td>
              <td className={`p-4 text-center ${priceA < priceB ? 'bg-[#C9A227]/5' : ''}`}>
                <span className={`text-lg font-bold ${priceA < priceB ? 'text-[#D4AF37]' : 'text-gray-300'}`}>
                  ₺{priceA.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </td>
              <td className={`p-4 text-center ${priceB < priceA ? 'bg-[#C9A227]/5' : ''}`}>
                <span className={`text-lg font-bold ${priceB < priceA ? 'text-[#D4AF37]' : 'text-gray-300'}`}>
                  ₺{priceB.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Açıklama */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#C9A227]" />
          <span>Yüksek öncelik</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-600" />
          <span>Orta öncelik</span>
        </div>
      </div>
    </div>
  );
}
