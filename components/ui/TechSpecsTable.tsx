'use client';

import { Product } from '@/lib/types';
import { getSpecConfig } from '@/lib/spec-config';
import { getSpecValue } from '@/lib/ratio-engine';

const GOLD = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';

interface TechSpecsTableProps {
  productA: Product;
  productB: Product;
  categorySlug: string;
  className?: string;
}

export function TechSpecsTable({ productA, productB, categorySlug, className = '' }: TechSpecsTableProps) {
  const config = getSpecConfig(categorySlug);
  const displayColumns = config.columns.filter(col => col.priority === 'high' || col.priority === 'medium');

  const shortName = (product: Product, words = 3) => {
    const name = product.name ?? 'Ürün';
    return name.split(' ').slice(0, words).join(' ');
  };

  const formatValue = (value: string | number | null, format?: string, unit?: string): string => {
    if (value === null || value === undefined) return '—';
    if (format === 'number' && typeof value === 'number')
      return `${value.toLocaleString('tr-TR')}${unit ? ` ${unit}` : ''}`;
    if (format === 'percentage' && typeof value === 'number') return `${value}%`;
    if (format === 'currency' && typeof value === 'number')
      return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    return `${value}${unit ? ` ${unit}` : ''}`;
  };

  const compareValues = (valueA: string | number | null, valueB: string | number | null) => {
    if (valueA === null || valueB === null) return { winner: 'tie' as const, advantage: 0 };
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      if (Math.abs(valueA - valueB) < 0.01) return { winner: 'tie' as const, advantage: 0 };
      const advantage = (Math.abs(valueA - valueB) / Math.min(valueA, valueB)) * 100;
      return { winner: valueA > valueB ? 'a' as const : 'b' as const, advantage };
    }
    return { winner: 'tie' as const, advantage: 0 };
  };

  const priceA = productA.price ?? 0;
  const priceB = productB.price ?? 0;

  const allRows = [
    ...displayColumns.map(col => {
      const vA = getSpecValue(productA, col.key, categorySlug);
      const vB = getSpecValue(productB, col.key, categorySlug);
      const cmp = compareValues(vA, vB);
      return {
        key: col.key,
        label: col.label,
        priority: col.priority,
        valA: formatValue(vA, col.format, col.unit),
        valB: formatValue(vB, col.format, col.unit),
        winner: cmp.winner,
      };
    }),
    {
      key: '__price__',
      label: 'Fiyat',
      priority: 'high' as const,
      valA: `₺${priceA.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      valB: `₺${priceB.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      winner: priceA < priceB ? 'a' as const : priceB < priceA ? 'b' as const : 'tie' as const,
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* Başlık */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f3f4f6', margin: 0 }}>Teknik Özellikler</h2>
        <div style={{ height: 3, width: 60, background: `linear-gradient(90deg, ${GOLD_BRIGHT}, ${GOLD})`, borderRadius: 4, marginTop: 6 }} />
      </div>

      {/* Her zaman tablo — mobil + masaüstü aynı */}
      <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(55,65,81,0.5)', background: 'rgba(17,24,39,0.6)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 280 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(55,65,81,0.5)' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', width: '34%' }}>Özellik</th>
              <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: GOLD_BRIGHT, width: '33%' }}>
                {shortName(productA, 3)}
              </th>
              <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: GOLD_BRIGHT, width: '33%' }}>
                {shortName(productB, 3)}
              </th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, index) => (
              <tr key={row.key} style={{ borderBottom: '1px solid rgba(55,65,81,0.25)', background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: row.priority === 'high' ? GOLD : '#4b5563', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#d1d5db', fontWeight: 500 }}>{row.label}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', background: row.winner === 'a' ? `rgba(201,162,39,0.06)` : 'transparent' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.winner === 'a' ? GOLD_BRIGHT : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {row.winner === 'a' && <span style={{ fontSize: 10 }}>✓</span>}
                    {row.valA}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', background: row.winner === 'b' ? `rgba(201,162,39,0.06)` : 'transparent' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.winner === 'b' ? GOLD_BRIGHT : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {row.winner === 'b' && <span style={{ fontSize: 10 }}>✓</span>}
                    {row.valB}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block' }} />
          Yüksek öncelik
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4b5563', display: 'inline-block' }} />
          Orta öncelik
        </span>
      </div>
    </div>
  );
}
