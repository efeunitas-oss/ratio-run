'use client';

import React, { useState, useMemo } from 'react';
import { Vehicle, RobotVacuum, GenericProduct, ComparisonResult } from './types';
import { compareVehicles, compareVacuums, compareGeneric } from './algorithm';
import SmartBuyButton from '@/components/SmartBuyButton';

interface RatioRunAppProps {
  categories: any[];
  productsByCategory: Record<string, any[]>;
}

export default function RatioRunApp({ categories, productsByCategory }: RatioRunAppProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('otomobil');
  const [product1Id, setProduct1Id] = useState<string>('');
  const [product2Id, setProduct2Id] = useState<string>('');

  const currentProducts = productsByCategory[selectedCategory] || [];

  const comparison = useMemo(() => {
    if (!product1Id || !product2Id) return null;

    const p1 = currentProducts.find(p => p.id === product1Id);
    const p2 = currentProducts.find(p => p.id === product2Id);

    if (!p1 || !p2) return null;

    // Kategoriye göre karşılaştırma fonksiyonunu seç
    if (p1.category === 'VEHICLE') {
      return compareVehicles(p1 as Vehicle, p2 as Vehicle);
    } else if (p1.category === 'ROBOT_VACUUM') {
      return compareVacuums(p1 as RobotVacuum, p2 as RobotVacuum);
    } else {
      return compareGeneric(p1 as GenericProduct, p2 as GenericProduct);
    }
  }, [product1Id, product2Id, currentProducts]);

  // Kategori değiştiğinde ürün seçimlerini sıfırla
  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setProduct1Id('');
    setProduct2Id('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                RATIO.RUN
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">Don't buy with emotions. Trust the data.</p>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.slug
                      ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/50'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Product Count Badge */}
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
            <span className="text-sm text-zinc-400">Toplam Ürün: </span>
            <span className="text-lg font-bold text-amber-500">{currentProducts.length}</span>
          </div>
        </div>

        {/* Product Selectors */}
        {currentProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <ProductSelector
              label="1. Ürün"
              products={currentProducts}
              selectedId={product1Id}
              onChange={setProduct1Id}
              otherSelectedId={product2Id}
            />
            <ProductSelector
              label="2. Ürün"
              products={currentProducts}
              selectedId={product2Id}
              onChange={setProduct2Id}
              otherSelectedId={product1Id}
            />
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-zinc-300 mb-2">
              Bu kategoride henüz ürün yok
            </h3>
            <p className="text-sm text-zinc-500">
              Yakında bu kategoriye ürünler eklenecek!
            </p>
          </div>
        )}

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-6 sm:space-y-8">
            <ComparisonView comparison={comparison} />
          </div>
        )}

        {/* Empty State */}
        {!comparison && currentProducts.length > 0 && (
          <div className="text-center py-16 sm:py-24">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6 animate-bounce">
              {categories.find(c => c.slug === selectedCategory)?.icon || '📊'}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-300 mb-2">
              Karşılaştırmaya Başla
            </h2>
            <p className="text-sm sm:text-base text-zinc-500">
              Yukarıdan iki ürün seçin
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-xs sm:text-sm text-zinc-500">
          <p>RatioRun © 2026 - Akıllı Karşılaştırma Platformu</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface ProductSelectorProps {
  label: string;
  products: any[];
  selectedId: string;
  onChange: (id: string) => void;
  otherSelectedId: string;
}

function ProductSelector({ label, products, selectedId, onChange, otherSelectedId }: ProductSelectorProps) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 sm:p-6 border border-zinc-800 hover:border-amber-500/50 transition-all">
      <label className="block text-xs sm:text-sm font-bold text-amber-500 mb-3 sm:mb-4">{label}</label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-zinc-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
      >
        <option value="">Seçiniz...</option>
        {products.map((product) => {
          const disabled = product.id === otherSelectedId;
          const displayName = `${product.brand} ${product.name}`;

          return (
            <option key={product.id} value={product.id} disabled={disabled}>
              {displayName}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function ComparisonView({ comparison }: { comparison: ComparisonResult }) {
  const winner = comparison.winner === 'product1' ? comparison.product1 : comparison.product2;
  const loser = comparison.winner === 'product1' ? comparison.product2 : comparison.product1;

  return (
    <div className="space-y-6">
      {/* Winner Card */}
      <div className="bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-yellow-500/20 rounded-2xl p-6 sm:p-8 border-2 border-yellow-500 shadow-lg shadow-yellow-500/50">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl animate-bounce">👑</span>
          <h2 className="text-2xl font-black text-yellow-400">AKILLI SEÇİM</h2>
        </div>
        <h3 className="text-3xl font-black text-zinc-100 mb-4">
          {(winner.product || winner.vehicle || winner.vacuum).name}
        </h3>
        <div className="bg-zinc-900/70 rounded-lg p-4 mb-4">
          <p className="text-zinc-300">{comparison.verdict}</p>
        </div>
        <div className="text-right">
          <div className="text-6xl font-black text-yellow-400">
            {winner.finalScore.toFixed(1)}
          </div>
          <div className="text-sm text-yellow-400/70">/ 100</div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreCard analysis={comparison.product1} isWinner={comparison.winner === 'product1'} />
        <ScoreCard analysis={comparison.product2} isWinner={comparison.winner === 'product2'} />
      </div>
    </div>
  );
}

function ScoreCard({ analysis, isWinner }: { analysis: any; isWinner: boolean }) {
  const product = analysis.product || analysis.vehicle || analysis.vacuum;

  return (
    <div className={`bg-zinc-900 rounded-xl p-6 border-2 ${
      isWinner ? 'border-yellow-500 ring-4 ring-yellow-500/30' : 'border-zinc-800'
    }`}>
      {isWinner && (
        <div className="bg-yellow-500/20 px-3 py-2 rounded-lg mb-4 border border-yellow-500/30">
          <span className="text-yellow-400 font-bold">👑 KAZANAN</span>
        </div>
      )}
      
      <h3 className="text-xl font-bold mb-4">{product.name}</h3>
      
      <div className="mb-6">
        {Object.entries(analysis.categoryScores || {}).map(([key, value]: [string, any]) => (
          <div key={key} className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-zinc-400 capitalize">{key}</span>
              <span className="text-sm font-bold text-amber-500">{value.toFixed(1)}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-zinc-400">Final Skor</span>
          <span className="text-3xl font-black text-amber-500">
            {analysis.finalScore.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="mt-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
          <div className="font-bold text-emerald-400 mb-2">✅ Güçlü Yönler</div>
          <ul className="space-y-1 text-sm text-emerald-300">
            {analysis.strengths.slice(0, 3).map((s: string, i: number) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
          <div className="font-bold text-red-400 mb-2">⚠️ Uyarılar</div>
          <ul className="space-y-1 text-sm text-red-300">
            {analysis.warnings.slice(0, 3).map((w: string, i: number) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}