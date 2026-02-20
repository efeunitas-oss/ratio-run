'use client';

import React, { useState, useMemo } from 'react';
import { 
  Vehicle, 
  RobotVacuum, 
  GenericProduct, 
  ComparisonResult, 
  VehicleAnalysis, 
  VacuumAnalysis, 
  GenericAnalysis 
} from '@/lib/types';
import { compareVehicles, compareVacuums, compareGeneric } from './algorithm';

// ─── TİP GÜVENLİ YARDIMCI (HELPER) ────────────────────────────────────────────
// Bu fonksiyon TypeScript'in "VehicleAnalysis üzerinde product yok" hatasını çözer.
function getAnalysisItem(analysis: VehicleAnalysis | VacuumAnalysis | GenericAnalysis) {
  if ('vehicle' in analysis) return analysis.vehicle;
  if ('vacuum' in analysis) return analysis.vacuum;
  if ('product' in analysis) return analysis.product;
  return null;
}

interface RatioRunAppProps {
  categories: any[];
  productsByCategory: Record<string, any[]>;
}

export default function RatioRunApp({ categories, productsByCategory }: RatioRunAppProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('otomobil');
  const [product1Id, setProduct1Id] = useState<string>('');
  const [product2Id, setProduct2Id] = useState<string>('');

  const currentProducts = productsByCategory[selectedCategory] || [];

  const comparison = useMemo<ComparisonResult | null>(() => {
    if (!product1Id || !product2Id) return null;

    const p1 = currentProducts.find((p: any) => p.id === product1Id);
    const p2 = currentProducts.find((p: any) => p.id === product2Id);

    if (!p1 || !p2) return null;

    // Kategoriye göre doğru algoritmayı çalıştır
    if (p1.category === 'VEHICLE') {
      return compareVehicles(p1 as Vehicle, p2 as Vehicle);
    } else if (p1.category === 'ROBOT_VACUUM') {
      return compareVacuums(p1 as RobotVacuum, p2 as RobotVacuum);
    } else {
      return compareGeneric(p1 as GenericProduct, p2 as GenericProduct);
    }
  }, [product1Id, product2Id, currentProducts]);

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
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">
                <img src="/logo.png" alt="Ratio.Run" style={{ height: 36, width: 'auto' }} />
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">Duygularla değil, verilerle karar ver.</p>
            </div>

            {/* Kategori Seçimi */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.slug
                      ? 'text-black shadow-lg'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  }`}
                  style={selectedCategory === cat.slug ? {
                    background: 'linear-gradient(135deg, #D4AF37, #C9A227)',
                    boxShadow: '0 4px 14px #C9A22745',
                  } : {}}
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
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
            <span className="text-sm text-zinc-400">Toplam Ürün: </span>
            <span className="text-lg font-bold text-[#D4AF37]">{currentProducts.length}</span>
          </div>
        </div>

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
            <h3 className="text-xl font-bold text-zinc-300 mb-2">Bu kategoride henüz ürün yok</h3>
            <p className="text-sm text-zinc-500">Yakında eklenecek.</p>
          </div>
        )}

        {comparison && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ComparisonView comparison={comparison} />
          </div>
        )}

        {!comparison && currentProducts.length > 0 && (
          <div className="text-center py-16 sm:py-24">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6 animate-bounce">
              {categories.find((c: any) => c.slug === selectedCategory)?.icon || '📊'}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-300 mb-2">Karşılaştırmaya Başla</h2>
            <p className="text-sm sm:text-base text-zinc-500">Analiz için yukarıdan iki ürün seçin.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-xs sm:text-sm text-zinc-500">
          <p>RatioRun © 2026</p>
        </div>
      </footer>
    </div>
  );
}

// ─── ALT BİLEŞENLER ──────────────────────────────────────────────────────────

function ProductSelector({
  label, products, selectedId, onChange, otherSelectedId,
}: {
  label: string;
  products: any[];
  selectedId: string;
  onChange: (id: string) => void;
  otherSelectedId: string;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 sm:p-6 border border-zinc-800 hover:border-[#C9A227]/50 transition-all">
      <label className="block text-xs sm:text-sm font-bold text-[#D4AF37] mb-3 sm:mb-4">{label}</label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-zinc-700 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/20 transition-all cursor-pointer"
      >
        <option value="">Seçiniz...</option>
        {products.map((product) => (
          <option key={product.id} value={product.id} disabled={product.id === otherSelectedId}>
            {product.brand} {product.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function ComparisonView({ comparison }: { comparison: ComparisonResult }) {
  // Burada type-safe helper kullanıyoruz
  const winnerAnalysis = comparison.winner === 'product1' ? comparison.product1 : comparison.product2;
  const winnerItem = getAnalysisItem(winnerAnalysis);
  const winnerName = winnerItem ? winnerItem.name : 'Bilinmiyor';

  return (
    <div className="space-y-6">
      {/* Winner Card */}
      <div className="bg-gradient-to-br from-[#C9A227]/15 via-[#D4AF37]/10 to-[#C9A227]/15 rounded-2xl p-6 sm:p-8 border-2 border-[#C9A227] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🏆</div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <span className="text-4xl animate-bounce">👑</span>
          <h2 className="text-2xl font-black text-[#D4AF37]">KAZANAN SEÇİM</h2>
        </div>
        <h3 className="text-3xl font-black text-zinc-100 mb-4 relative z-10">{winnerName}</h3>
        <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg p-4 mb-4 border border-[#C9A227]/20 relative z-10">
          <p className="text-zinc-300 font-medium">"{comparison.verdict}"</p>
        </div>
        <div className="text-right relative z-10">
          <div className="text-6xl font-black text-[#D4AF37]">{winnerAnalysis.finalScore.toFixed(1)}</div>
          <div className="text-sm text-[#D4AF37]/70 font-bold tracking-widest">RATIO PUANI</div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreCard 
          analysis={comparison.product1} 
          isWinner={comparison.winner === 'product1'} 
        />
        <ScoreCard 
          analysis={comparison.product2} 
          isWinner={comparison.winner === 'product2'} 
        />
      </div>
    </div>
  );
}

function ScoreCard({ analysis, isWinner }: { analysis: VehicleAnalysis | VacuumAnalysis | GenericAnalysis; isWinner: boolean }) {
  // Helper fonksiyon ile güvenli veri çekme
  const item = getAnalysisItem(analysis);
  const name = item ? item.name : 'Ürün';

  // Warnings, strengths güvenli erişim (null check)
  const strengths = analysis.strengths || [];
  const warnings = analysis.warnings || [];
  const categoryScores = analysis.categoryScores || {};

  return (
    <div className={`bg-zinc-900 rounded-xl p-6 border-2 transition-all duration-300 ${
      isWinner ? 'border-[#C9A227] ring-4 ring-[#C9A227]/25 transform scale-[1.02]' : 'border-zinc-800 opacity-90'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white max-w-[70%]">{name}</h3>
        {isWinner && (
          <div className="bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            KAZANAN
          </div>
        )}
      </div>

      <div className="mb-6 space-y-3">
        {Object.entries(categoryScores).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">{key}</span>
              <span className="text-xs font-bold text-[#D4AF37]">{(value as number).toFixed(0)}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#C9A227] to-[#D4AF37] rounded-full" 
                style={{ width: `${value}%` }} 
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-800 pt-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-zinc-400">Genel Skor</span>
          <span className={`text-3xl font-black ${isWinner ? 'text-[#D4AF37]' : 'text-zinc-500'}`}>
            {analysis.finalScore.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {strengths.length > 0 && (
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1">
              <span>✅</span> AVANTAJLAR
            </div>
            <ul className="space-y-1">
              {strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="text-xs text-emerald-300/80 line-clamp-1">• {s}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
              <span>⚠️</span> DİKKAT
            </div>
            <ul className="space-y-1">
              {warnings.slice(0, 3).map((w, i) => (
                <li key={i} className="text-xs text-red-300/80 line-clamp-1">• {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}