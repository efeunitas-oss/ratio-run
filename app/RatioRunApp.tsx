'use client';

import React, { useState, useMemo } from 'react';
import { Vehicle, RobotVacuum, Product } from './types';
import { SAMPLE_VEHICLES, SAMPLE_VACUUMS } from './data';
import { compareVehicles, compareVacuums, formatCurrency, getScoreColor, getScoreLabel, VacuumAnalysis } from './algorithm';
import { VehicleAnalysis } from './types';
import SmartBuyButton from '@/components/SmartBuyButton';

type Category = 'VEHICLE' | 'ROBOT_VACUUM';

export default function RatioRunApp() {
  const [category, setCategory] = useState<Category>('VEHICLE');
  const [product1Id, setProduct1Id] = useState<string>('');
  const [product2Id, setProduct2Id] = useState<string>('');

  const products = category === 'VEHICLE' ? SAMPLE_VEHICLES : SAMPLE_VACUUMS;
  const isVehicleCategory = category === 'VEHICLE';

  const comparison = useMemo(() => {
    if (!product1Id || !product2Id) return null;

    const p1 = products.find(p => p.id === product1Id);
    const p2 = products.find(p => p.id === product2Id);

    if (!p1 || !p2) return null;

    if (category === 'VEHICLE') {
      return compareVehicles(p1 as Vehicle, p2 as Vehicle);
    } else {
      return compareVacuums(p1 as RobotVacuum, p2 as RobotVacuum);
    }
  }, [product1Id, product2Id, products, category]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                RATIO.RUN
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">Karşılaştır, Karar Ver, Pişman Olma</p>
            </div>

            {/* Category Switcher */}
            <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg">
              <button
                onClick={() => {
                  setCategory('VEHICLE');
                  setProduct1Id('');
                  setProduct2Id('');
                }}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all ${
                  category === 'VEHICLE'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                🚗 Otomobil
              </button>
              <button
                onClick={() => {
                  setCategory('ROBOT_VACUUM');
                  setProduct1Id('');
                  setProduct2Id('');
                }}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all ${
                  category === 'ROBOT_VACUUM'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                🤖 Robot Süpürge
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Product Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <ProductSelector
            label="1. Ürün"
            products={products}
            selectedId={product1Id}
            onChange={setProduct1Id}
            otherSelectedId={product2Id}
            isVehicle={isVehicleCategory}
          />
          <ProductSelector
            label="2. Ürün"
            products={products}
            selectedId={product2Id}
            onChange={setProduct2Id}
            otherSelectedId={product1Id}
            isVehicle={isVehicleCategory}
          />
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-6 sm:space-y-8">
            {/* Winner Card */}
            <WinnerCard comparison={comparison} isVehicle={isVehicleCategory} />

            {/* Score Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ScoreCard
                analysis={comparison.vehicle1 as VehicleAnalysis}
                isWinner={comparison.winner === 'vehicle1'}
                isVehicle={isVehicleCategory}
              />
              <ScoreCard
                analysis={comparison.vehicle2 as VehicleAnalysis}
                isWinner={comparison.winner === 'vehicle2'}
                isVehicle={isVehicleCategory}
              />
            </div>

            {/* Detailed Comparison Table */}
            <DetailedComparisonTable
              analysis1={comparison.vehicle1}
              analysis2={comparison.vehicle2}
              isVehicle={isVehicleCategory}
            />
          </div>
        )}

        {/* Empty State */}
        {!comparison && (
          <div className="text-center py-16 sm:py-24">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">
              {isVehicleCategory ? '🚗' : '🤖'}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-300 mb-2">
              {isVehicleCategory ? 'Araç Seçin' : 'Robot Süpürge Seçin'}
            </h2>
            <p className="text-sm sm:text-base text-zinc-500">
              Karşılaştırma için yukarıdan iki ürün seçin
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-xs sm:text-sm text-zinc-500">
          <p>© 2026 Ratio.Run - Akıllı Karşılaştırma Platformu</p>
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
  products: (Vehicle | RobotVacuum)[];
  selectedId: string;
  onChange: (id: string) => void;
  otherSelectedId: string;
  isVehicle: boolean;
}

function ProductSelector({ label, products, selectedId, onChange, otherSelectedId, isVehicle }: ProductSelectorProps) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 sm:p-6 border border-zinc-800">
      <label className="block text-xs sm:text-sm font-bold text-amber-500 mb-3 sm:mb-4">{label}</label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-zinc-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
      >
        <option value="">Seçiniz...</option>
        {products.map((product) => {
          const disabled = product.id === otherSelectedId;
          const displayName = isVehicle
            ? `${(product as Vehicle).brand} ${(product as Vehicle).model} (${(product as Vehicle).year})`
            : `${(product as RobotVacuum).brand} ${(product as RobotVacuum).name}`;

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

interface WinnerCardProps {
  comparison: any;
  isVehicle: boolean;
}

function WinnerCard({ comparison, isVehicle }: WinnerCardProps) {
  const winnerAnalysis = comparison.winner === 'vehicle1' ? comparison.vehicle1 : comparison.vehicle2;
  const winnerProduct = isVehicle
    ? (winnerAnalysis as VehicleAnalysis).vehicle
    : (winnerAnalysis as VacuumAnalysis).vacuum;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 rounded-2xl p-6 sm:p-8 border border-amber-500/20">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Winner Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl sm:text-4xl">🏆</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-500">KAZANAN</h2>
              <p className="text-xs sm:text-sm text-zinc-400">Ağırlıklı Skor Sistemi ile Hesaplandı</p>
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-100 mb-4">
            {isVehicle ? (winnerProduct as Vehicle).name : (winnerProduct as RobotVacuum).name}
          </h3>

          <div className="bg-zinc-900/50 rounded-lg p-4 mb-4">
            <p className="text-sm sm:text-base text-zinc-300 whitespace-pre-line leading-relaxed">
              {comparison.verdict}
            </p>
          </div>

          {/* Smart Buy Button */}
          <SmartBuyButton product={winnerProduct} />
        </div>

        {/* Right: Final Score Box - FIXED */}
        <div className="lg:w-48 bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <div className="text-xs font-bold text-zinc-500 mb-2">FİNAL SKOR</div>
          <div className="text-5xl sm:text-6xl font-black text-amber-500 italic tracking-tighter">
            {typeof winnerAnalysis.finalScore === 'number' 
              ? winnerAnalysis.finalScore.toFixed(1) 
              : '0.0'}
          </div>
          <div className="text-xs text-zinc-500 mt-2">/ 100</div>
        </div>
      </div>
    </div>
  );
}

interface ScoreCardProps {
  analysis: VehicleAnalysis | VacuumAnalysis;
  isWinner: boolean;
  isVehicle: boolean;
}

function ScoreCard({ analysis, isWinner, isVehicle }: ScoreCardProps) {
  const product = isVehicle 
    ? (analysis as VehicleAnalysis).vehicle 
    : (analysis as VacuumAnalysis).vacuum;
  
  const categoryScores = analysis.categoryScores;

  // Type-safe category score rendering
  const categories = isVehicle
    ? [
        { label: 'Mühendislik', score: (categoryScores as any).engineering || 0 },
        { label: 'Piyasa Değeri', score: (categoryScores as any).market || 0 },
        { label: 'Kalite & Prestij', score: (categoryScores as any).quality || 0 },
        { label: 'Güvenilirlik', score: (categoryScores as any).risk || 0 },
      ]
    : [
        { label: 'Performans', score: (categoryScores as any).performance || 0 },
        { label: 'Zeka & Navigasyon', score: (categoryScores as any).intelligence || 0 },
        { label: 'Piyasa Değeri', score: (categoryScores as any).market || 0 },
        { label: 'Güvenilirlik', score: (categoryScores as any).reliability || 0 },
      ];

  return (
    <div
      className={`bg-zinc-900 rounded-xl p-4 sm:p-6 border transition-all ${
        isWinner ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-zinc-800'
      }`}
    >
      {isWinner && (
        <div className="flex items-center gap-2 mb-4 text-amber-500">
          <span className="text-xl">👑</span>
          <span className="text-xs sm:text-sm font-bold">KAZANAN</span>
        </div>
      )}

      <h3 className="text-lg sm:text-xl font-bold text-zinc-100 mb-4">
        {isVehicle ? (product as Vehicle).name : (product as RobotVacuum).name}
      </h3>

      <div className="space-y-3 mb-6">
        {categories.map((cat) => (
          <CategoryBar key={cat.label} label={cat.label} score={cat.score} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <span className="text-xs sm:text-sm font-bold text-zinc-400">Final Skor</span>
        <span className={`text-xl sm:text-2xl font-black ${getScoreColor(analysis.finalScore || 0)}`}>
          {typeof analysis.finalScore === 'number' ? analysis.finalScore.toFixed(1) : '0.0'}
        </span>
      </div>

      {/* Warnings */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="text-xs font-bold text-red-400 mb-2">⚠️ UYARILAR</div>
          <ul className="text-xs text-red-300 space-y-1">
            {analysis.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="text-xs font-bold text-emerald-400 mb-2">✅ GÜÇLÜ YÖNLER</div>
          <ul className="text-xs text-emerald-300 space-y-1">
            {analysis.strengths.map((strength, idx) => (
              <li key={idx}>{strength}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CategoryBar({ label, score }: { label: string; score: number }) {
  const safeScore = typeof score === 'number' ? score : 0;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className={`text-xs font-black ${getScoreColor(safeScore)}`}>
          {safeScore.toFixed(1)}
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${getScoreColor(safeScore).replace('text-', 'bg-')} transition-all`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// DETAILED COMPARISON TABLE
// ============================================================================

interface DetailedComparisonTableProps {
  analysis1: VehicleAnalysis | VacuumAnalysis;
  analysis2: VehicleAnalysis | VacuumAnalysis;
  isVehicle: boolean;
}

function DetailedComparisonTable({ analysis1, analysis2, isVehicle }: DetailedComparisonTableProps) {
  if (isVehicle) {
    const v1 = (analysis1 as VehicleAnalysis).vehicle;
    const v2 = (analysis2 as VehicleAnalysis).vehicle;
    const n1 = (analysis1 as VehicleAnalysis).normalizedScores;
    const n2 = (analysis2 as VehicleAnalysis).normalizedScores;
    const c1 = (analysis1 as VehicleAnalysis).categoryScores;
    const c2 = (analysis2 as VehicleAnalysis).categoryScores;

    return (
      <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
        <div className="p-4 sm:p-6 border-b border-zinc-800">
          <h3 className="text-lg sm:text-xl font-bold text-zinc-100">Detaylı Karşılaştırma</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <tbody className="divide-y divide-zinc-800">
              <TableSectionHeader title="MÜHENDİSLİK & PERFORMANS" />
              <ComparisonRow
                label="Motor Gücü"
                value1={v1.engineering.hp}
                value2={v2.engineering.hp}
                score1={n1.hpScore}
                score2={n2.hpScore}
                unit="HP"
                higherIsBetter
              />
              <ComparisonRow
                label="Tork"
                value1={v1.engineering.torque}
                value2={v2.engineering.torque}
                score1={n1.torqueScore}
                score2={n2.torqueScore}
                unit="Nm"
                higherIsBetter
              />
              <ComparisonRow
                label="0-100 km/h"
                value1={v1.engineering.zeroToHundred}
                value2={v2.engineering.zeroToHundred}
                score1={n1.accelerationScore}
                score2={n2.accelerationScore}
                unit="sn"
                higherIsBetter={false}
              />
              <ComparisonRow
                label="Ağırlık"
                value1={v1.engineering.weight}
                value2={v2.engineering.weight}
                score1={n1.weightScore}
                score2={n2.weightScore}
                unit="kg"
                higherIsBetter={false}
              />
              <TextComparisonRow
                label="Şanzıman"
                value1={v1.engineering.transmission}
                value2={v2.engineering.transmission}
                score1={n1.transmissionScore}
                score2={n2.transmissionScore}
              />
              <ComparisonRow
                label="Yakıt Tüketimi"
                value1={v1.engineering.fuelConsumption}
                value2={v2.engineering.fuelConsumption}
                score1={n1.fuelScore}
                score2={n2.fuelScore}
                unit="L/100km"
                higherIsBetter={false}
                decimals={1}
              />
              <ComparisonRow
                label="Bagaj Hacmi"
                value1={v1.engineering.trunkCapacity}
                value2={v2.engineering.trunkCapacity}
                score1={n1.trunkScore}
                score2={n2.trunkScore}
                unit="L"
                higherIsBetter
              />

              <TableSectionHeader title="PİYASA & FİNANSAL ANALİZ" />
              <ComparisonRow
                label="Güncel Liste Fiyatı"
                value1={v1.market.listPrice}
                value2={v2.market.listPrice}
                score1={50}
                score2={50}
                unit="TL"
                format="currency"
              />
              <ComparisonRow
                label="Piyasa Likidite Skoru"
                value1={v1.market.liquidityScore}
                value2={v2.market.liquidityScore}
                score1={n1.liquidityScore}
                score2={n2.liquidityScore}
                unit="/10"
                higherIsBetter
              />
              <ComparisonRow
                label="2. El Değer Koruma"
                value1={v1.market.resaleValue}
                value2={v2.market.resaleValue}
                score1={n1.resaleScore}
                score2={n2.resaleScore}
                unit="/10"
                higherIsBetter
              />
              <ComparisonRow
                label="Servis Ağı"
                value1={v1.market.serviceNetwork}
                value2={v2.market.serviceNetwork}
                score1={n1.serviceScore}
                score2={n2.serviceScore}
                unit="/10"
                higherIsBetter
              />

              <TableSectionHeader title="KALİTE & KONİOR" />
              <ComparisonRow
                label="Malzeme Kalitesi"
                value1={v1.quality.materialQuality}
                value2={v2.quality.materialQuality}
                score1={n1.materialScore}
                score2={n2.materialScore}
                unit="/10"
                higherIsBetter
              />
              <ComparisonRow
                label="Ses Yalıtımı"
                value1={v1.quality.soundInsulation}
                value2={v2.quality.soundInsulation}
                score1={n1.soundScore}
                score2={n2.soundScore}
                unit="/10"
                higherIsBetter
              />
              <ComparisonRow
                label="Sürüş Konforu"
                value1={v1.quality.rideComfort}
                value2={v2.quality.rideComfort}
                score1={n1.comfortScore}
                score2={n2.comfortScore}
                unit="/10"
                higherIsBetter
              />
              <ComparisonRow
                label="Prestij Skoru"
                value1={v1.quality.prestigeScore}
                value2={v2.quality.prestigeScore}
                score1={n1.prestigeScore}
                score2={n2.prestigeScore}
                unit="/10"
                higherIsBetter
              />

              <TableSectionHeader title="KATEGORİ SKORLARI" />
              <ComparisonRow
                label="Mühendislik Skoru"
                value1={c1.engineering}
                value2={c2.engineering}
                score1={c1.engineering}
                score2={c2.engineering}
                unit="/100"
                higherIsBetter
                decimals={1}
              />
              <ComparisonRow
                label="Piyasa Değeri"
                value1={c1.market}
                value2={c2.market}
                score1={c1.market}
                score2={c2.market}
                unit="/100"
                higherIsBetter
                decimals={1}
              />
              <ComparisonRow
                label="Kalite & Prestij"
                value1={c1.quality}
                value2={c2.quality}
                score1={c1.quality}
                score2={c2.quality}
                unit="/100"
                higherIsBetter
                decimals={1}
              />
              <ComparisonRow
                label="Güvenilirlik"
                value1={c1.risk}
                value2={c2.risk}
                score1={c1.risk}
                score2={c2.risk}
                unit="/100"
                higherIsBetter
                decimals={1}
              />
            </tbody>
          </table>
        </div>
      </div>
    );
  } else {
    // Vacuum comparison table
    const v1 = (analysis1 as VacuumAnalysis).vacuum;
    const v2 = (analysis2 as VacuumAnalysis).vacuum;
    const n1 = (analysis1 as VacuumAnalysis).normalizedScores;
    const n2 = (analysis2 as VacuumAnalysis).normalizedScores;
    const c1 = (analysis1 as VacuumAnalysis).categoryScores;
    const c2 = (analysis2 as VacuumAnalysis).categoryScores;

    return (
      <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
        <div className="p-4 sm:p-6 border-b border-zinc-800">
          <h3 className="text-lg sm:text-xl font-bold text-zinc-100">Detaylı Karşılaştırma</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <tbody className="divide-y divide-zinc-800">
              <TableSectionHeader title="PERFORMANS & TEKNOLOJİ" />
              <ComparisonRow
                label="Emiş Gücü"
                value1={v1.specs.suctionPower}
                value2={v2.specs.suctionPower}
                score1={n1.suctionScore}
                score2={n2.suctionScore}
                unit="Pa"
                higherIsBetter
              />
              <ComparisonRow
                label="Batarya Kapasitesi"
                value1={v1.specs.batteryCapacity}
                value2={v2.specs.batteryCapacity}
                score1={n1.batteryScore}
                score2={n2.batteryScore}
                unit="mAh"
                higherIsBetter
              />
              <ComparisonRow
                label="Gürültü Seviyesi"
                value1={v1.specs.noiseLevel}
                value2={v2.specs.noiseLevel}
                score1={n1.noiseScore}
                score2={n2.noiseScore}
                unit="dB"
                higherIsBetter={false}
              />
              <ComparisonRow
                label="Toz Haznesi"
                value1={v1.specs.dustCapacity}
                value2={v2.specs.dustCapacity}
                score1={n1.dustCapacityScore}
                score2={n2.dustCapacityScore}
                unit="L"
                higherIsBetter
                decimals={2}
              />
              <TextComparisonRow
                label="Haritalama Teknolojisi"
                value1={v1.specs.mappingTech}
                value2={v2.specs.mappingTech}
                score1={n1.mappingScore}
                score2={n2.mappingScore}
              />
              <TextComparisonRow
                label="Paspas Özelliği"
                value1={v1.specs.mopFeature ? 'Var' : 'Yok'}
                value2={v2.specs.mopFeature ? 'Var' : 'Yok'}
                score1={n1.mopScore}
                score2={n2.mopScore}
              />

              <TableSectionHeader title="PİYASA & FİNANSAL ANALİZ" />
              <ComparisonRow
                label="Güncel Liste Fiyatı"
                value1={v1.market.listPrice}
                value2={v2.market.listPrice}
                score1={50}
                score2={50}
                unit="TL"
                format="currency"
              />
              <ComparisonRow
                label="Piyasa Likidite Skoru"
                value1={v1.market.liquidityScore}
                value2={v2.market.liquidityScore}
                score1={n1.liquidityScore}
                score2={n2.liquidityScore}
                unit="/10"
                higherIsBetter
              />
              <ComparisonRow
                label="2. El Değer Koruma"
                value1={v1.market.resaleValue}
                value2={v2.market.resaleValue}
                score1={n1.resaleScore}
                score2={n2.resaleScore}
                unit="/10"
                higherIsBetter
              />
              <ComparisonRow
                label="Servis Ağı"
                value1={v1.market.serviceNetwork}
                value2={v2.market.serviceNetwork}
                score1={n1.serviceScore}
                score2={n2.serviceScore}
                unit="/10"
                higherIsBetter
              />

              <TableSectionHeader title="KATEGORİ SKORLARI" />
              <ComparisonRow
                label="Performans Skoru"
                value1={c1.performance}
                value2={c2.performance}
                score1={c1.performance}
                score2={c2.performance}
                unit="/100"
                higherIsBetter
                decimals={1}
              />
              <ComparisonRow
                label="Zeka & Navigasyon"
                value1={c1.intelligence}
                value2={c2.intelligence}
                score1={c1.intelligence}
                score2={c2.intelligence}
                unit="/100"
                higherIsBetter
                decimals={1}
              />
              <ComparisonRow
                label="Piyasa Değeri"
                value1={c1.market}
                value2={c2.market}
                score1={c1.market}
                score2={c2.market}
                unit="/100"
                higherIsBetter
                decimals={1}
              />
              <ComparisonRow
                label="Güvenilirlik"
                value1={c1.reliability}
                value2={c2.reliability}
                score1={c1.reliability}
                score2={c2.reliability}
                unit="/100"
                higherIsBetter
                decimals={1}
              />
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

function TableSectionHeader({ title }: { title: string }) {
  return (
    <tr className="bg-zinc-800/50">
      <td colSpan={3} className="px-3 sm:px-4 py-2 text-xs font-black text-amber-500">
        {title}
      </td>
    </tr>
  );
}

interface ComparisonRowProps {
  label: string;
  value1: number;
  value2: number;
  score1: number;
  score2: number;
  unit: string;
  higherIsBetter?: boolean;
  decimals?: number;
  format?: 'number' | 'currency';
}

function ComparisonRow({
  label,
  value1,
  value2,
  score1,
  score2,
  unit,
  higherIsBetter = true,
  decimals = 0,
  format = 'number',
}: ComparisonRowProps) {
  // Type-safe value handling
  const s1 = typeof score1 === 'number' ? score1 : 0;
  const s2 = typeof score2 === 'number' ? score2 : 0;

  const formatValue = (val: any) => {
    if (val === undefined || val === null) return '-';
    if (typeof val !== 'number') return val;
    return format === 'currency' ? formatCurrency(val) : val.toFixed(decimals);
  };

  // Winner determination - ONLY highlight if there's a REAL difference (>5 points)
  const scoreDiff = Math.abs(s1 - s2);
  const hasSignificantDifference = scoreDiff > 5;
  
  const winner1 = hasSignificantDifference && s1 > s2;
  const winner2 = hasSignificantDifference && s2 > s1;

  return (
    <tr className="hover:bg-zinc-800/30 transition-colors">
      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-zinc-400 w-1/3">{label}</td>
      <td
        className={`px-3 sm:px-4 py-3 text-xs sm:text-sm text-right font-mono ${
          winner1 ? 'text-emerald-400 font-bold' : 'text-zinc-300'
        }`}
      >
        {formatValue(value1)} {unit}
      </td>
      <td
        className={`px-3 sm:px-4 py-3 text-xs sm:text-sm text-right font-mono ${
          winner2 ? 'text-emerald-400 font-bold' : 'text-zinc-300'
        }`}
      >
        {formatValue(value2)} {unit}
      </td>
    </tr>
  );
}

function TextComparisonRow({
  label,
  value1,
  value2,
  score1,
  score2,
}: {
  label: string;
  value1: string;
  value2: string;
  score1: number;
  score2: number;
}) {
  // Type-safe score handling
  const s1 = typeof score1 === 'number' ? score1 : 0;
  const s2 = typeof score2 === 'number' ? score2 : 0;

  // Winner determination - ONLY highlight if there's a REAL difference (>5 points)
  const scoreDiff = Math.abs(s1 - s2);
  const hasSignificantDifference = scoreDiff > 5;
  
  const winner1 = hasSignificantDifference && s1 > s2;
  const winner2 = hasSignificantDifference && s2 > s1;

  return (
    <tr className="hover:bg-zinc-800/30 transition-colors">
      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-zinc-400 w-1/3">{label}</td>
      <td
        className={`px-3 sm:px-4 py-3 text-xs sm:text-sm text-right ${
          winner1 ? 'text-emerald-400 font-bold' : 'text-zinc-300'
        }`}
      >
        {value1}
      </td>
      <td
        className={`px-3 sm:px-4 py-3 text-xs sm:text-sm text-right ${
          winner2 ? 'text-emerald-400 font-bold' : 'text-zinc-300'
        }`}
      >
        {value2}
      </td>
    </tr>
  );
}