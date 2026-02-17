'use client';

// ============================================================================
// RATIO.RUN - TECHNICAL SPECIFICATIONS TABLE
// Dynamic category-based intelligent columns with fallback parsing
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

  // Filter to show only high and medium priority specs
  const displayColumns = config.columns.filter(
    col => col.priority === 'high' || col.priority === 'medium'
  );

  const formatValue = (
    value: string | number | null,
    format?: string,
    unit?: string
  ): string => {
    if (value === null || value === undefined) {
      return '—';
    }

    if (format === 'number' && typeof value === 'number') {
      return `${value.toLocaleString('tr-TR')}${unit ? ` ${unit}` : ''}`;
    }

    if (format === 'percentage' && typeof value === 'number') {
      return `${value}%`;
    }

    if (format === 'currency' && typeof value === 'number') {
      return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    }

    return `${value}${unit ? ` ${unit}` : ''}`;
  };

  const compareValues = (
    valueA: string | number | null,
    valueB: string | number | null,
    format?: string
  ): { winner: 'a' | 'b' | 'tie', advantage: number } => {
    if (valueA === null || valueB === null) {
      return { winner: 'tie', advantage: 0 };
    }

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      if (Math.abs(valueA - valueB) < 0.01) {
        return { winner: 'tie', advantage: 0 };
      }
      
      const advantage = ((Math.abs(valueA - valueB) / Math.min(valueA, valueB)) * 100);
      return {
        winner: valueA > valueB ? 'a' : 'b',
        advantage,
      };
    }

    return { winner: 'tie', advantage: 0 };
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Teknik Özellikler
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
      </div>

      {/* Mobile: Stacked Layout */}
      <div className="block lg:hidden space-y-4">
        {displayColumns.map((column) => {
          const valueA = getSpecValue(productA, column.key, categorySlug);
          const valueB = getSpecValue(productB, column.key, categorySlug);
          const comparison = compareValues(valueA, valueB, column.format);

          return (
            <div
              key={column.key}
              className="backdrop-blur-xl bg-gray-900/40 rounded-xl border border-gray-800/50 p-4"
            >
              <div className="text-sm font-semibold text-gray-400 mb-3">
                {column.label}
              </div>
              
              <div className="space-y-2">
                {/* Product A */}
                <div className={`
                  flex items-center justify-between p-3 rounded-lg
                  ${comparison.winner === 'a' 
                    ? 'bg-emerald-500/10 border border-emerald-500/30' 
                    : 'bg-gray-800/30'
                  }
                `}>
                  <span className="text-xs text-gray-500">
                    {productA.title.split(' ').slice(0, 3).join(' ')}...
                  </span>
                  <span className={`
                    text-lg font-bold
                    ${comparison.winner === 'a' ? 'text-emerald-400' : 'text-gray-300'}
                  `}>
                    {formatValue(valueA, column.format, column.unit)}
                  </span>
                </div>

                {/* Product B */}
                <div className={`
                  flex items-center justify-between p-3 rounded-lg
                  ${comparison.winner === 'b' 
                    ? 'bg-blue-500/10 border border-blue-500/30' 
                    : 'bg-gray-800/30'
                  }
                `}>
                  <span className="text-xs text-gray-500">
                    {productB.title.split(' ').slice(0, 3).join(' ')}...
                  </span>
                  <span className={`
                    text-lg font-bold
                    ${comparison.winner === 'b' ? 'text-blue-400' : 'text-gray-300'}
                  `}>
                    {formatValue(valueB, column.format, column.unit)}
                  </span>
                </div>
              </div>

              {/* Advantage indicator */}
              {comparison.winner !== 'tie' && comparison.advantage > 5 && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {comparison.advantage > 20 
                    ? '🔥 Önemli fark' 
                    : '✓ Daha iyi'
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden lg:block overflow-hidden rounded-2xl backdrop-blur-xl bg-gray-900/40 border border-gray-800/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/50">
              <th className="text-left p-4 text-sm font-semibold text-gray-400 w-1/3">
                Özellik
              </th>
              <th className="text-center p-4 text-sm font-semibold text-emerald-400 w-1/3">
                {productA.title.split(' ').slice(0, 4).join(' ')}
              </th>
              <th className="text-center p-4 text-sm font-semibold text-blue-400 w-1/3">
                {productB.title.split(' ').slice(0, 4).join(' ')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayColumns.map((column, index) => {
              const valueA = getSpecValue(productA, column.key, categorySlug);
              const valueB = getSpecValue(productB, column.key, categorySlug);
              const comparison = compareValues(valueA, valueB, column.format);

              return (
                <tr
                  key={column.key}
                  className={`
                    border-b border-gray-800/30 transition-colors duration-200
                    hover:bg-gray-800/20
                    ${index % 2 === 0 ? 'bg-gray-900/20' : ''}
                  `}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`
                        w-2 h-2 rounded-full
                        ${column.priority === 'high' ? 'bg-blue-500' : 'bg-gray-600'}
                      `} />
                      <span className="text-gray-300 font-medium">
                        {column.label}
                      </span>
                    </div>
                  </td>
                  
                  <td className={`
                    p-4 text-center relative
                    ${comparison.winner === 'a' ? 'bg-emerald-500/5' : ''}
                  `}>
                    <div className="flex items-center justify-center gap-2">
                      {comparison.winner === 'a' && (
                        <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`
                        text-lg font-bold
                        ${comparison.winner === 'a' ? 'text-emerald-400' : 'text-gray-300'}
                      `}>
                        {formatValue(valueA, column.format, column.unit)}
                      </span>
                    </div>
                  </td>
                  
                  <td className={`
                    p-4 text-center relative
                    ${comparison.winner === 'b' ? 'bg-blue-500/5' : ''}
                  `}>
                    <div className="flex items-center justify-center gap-2">
                      {comparison.winner === 'b' && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`
                        text-lg font-bold
                        ${comparison.winner === 'b' ? 'text-blue-400' : 'text-gray-300'}
                      `}>
                        {formatValue(valueB, column.format, column.unit)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
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
