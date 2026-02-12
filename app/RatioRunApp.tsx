'use client';

// RATIO.RUN - Ultimate Decision Engine
// Premium Dark Theme - Integrated Multi-Category Edition
// [Production Edition with Full Type Safety]

import React, { useState, useMemo } from 'react';
import { Vehicle, ComparisonResult, VehicleAnalysis, RobotVacuum, Product } from './types';
import { SAMPLE_VEHICLES, SAMPLE_VACUUMS } from './data';
import { 
  compareVehicles, 
  compareVacuums, 
  formatCurrency, 
  getScoreColor, 
  getScoreLabel 
} from './algorithm';
import { SmartBuyButton } from '../components/SmartBuyButton';

type Category = 'CAR' | 'VACUUM';

export default function RatioRunApp() {
  // --- KATEGORİ VE VERİ YÖNETİMİ (Type-Safe) ---
  const [category, setCategory] = useState<Category>('CAR');
  
  // Type-safe veri seti seçimi
  const currentData: Product[] = category === 'CAR' ? SAMPLE_VEHICLES : SAMPLE_VACUUMS;

  const [selectedProduct1, setSelectedProduct1] = useState<string>(SAMPLE_VEHICLES[0].id);
  const [selectedProduct2, setSelectedProduct2] = useState<string>(SAMPLE_VEHICLES[1].id);
  const [showDetails, setShowDetails] = useState<boolean>(true);

  // Kategori değiştiğinde seçimleri resetle
  const handleCategoryChange = (newCat: Category) => {
    setCategory(newCat);
    const newData = newCat === 'CAR' ? SAMPLE_VEHICLES : SAMPLE_VACUUMS;
    setSelectedProduct1(newData[0].id);
    setSelectedProduct2(newData[1].id);
  };
  
  // --- KARAR MOTORU (Type-Safe Comparison) ---
  const comparison = useMemo<ComparisonResult | null>(() => {
    const p1 = currentData.find((v) => v.id === selectedProduct1);
    const p2 = currentData.find((v) => v.id === selectedProduct2);
    
    if (!p1 || !p2) return null;
    
    // Type guard ile doğru fonksiyonu çağır
    if (category === 'CAR') {
      return compareVehicles(p1 as Vehicle, p2 as Vehicle);
    } else {
      return compareVacuums(p1 as RobotVacuum, p2 as RobotVacuum) as unknown as ComparisonResult;
    }
  }, [selectedProduct1, selectedProduct2, category, currentData]);
  
  if (!comparison) return null;
  
  const isVehicleCategory = category === 'CAR';
  const winnerProduct = currentData.find(p => 
    p.id === (comparison.winner === 'vehicle1' ? selectedProduct1 : selectedProduct2)
  );
  
  const winnerAnalysis = isVehicleCategory 
    ? (comparison.winner === 'vehicle1' ? comparison.vehicle1 : comparison.vehicle2)
    : null;
  
  return (
    <div className="min-h-screen bg-black text-gray-100 selection:bg-amber-500/30">
      {/* Header - Premium Gold Accent */}
      <header className="border-b border-amber-500/20 bg-gradient-to-r from-black via-zinc-900 to-black">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent tracking-tight">
                RATIO.RUN
              </h1>
              <p className="text-sm text-zinc-400 mt-2 tracking-widest uppercase font-bold">
                Ultimate Decision Engine · Midas Whale Edition
              </p>
            </div>
            
            {/* KATEGORİ SEÇİCİ */}
            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 shadow-2xl">
              <button 
                onClick={() => handleCategoryChange('CAR')}
                className={`px-8 py-2 rounded-lg text-xs font-black transition-all ${category === 'CAR' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}
              >OTOMOBİL</button>
              <button 
                onClick={() => handleCategoryChange('VACUUM')}
                className={`px-8 py-2 rounded-lg text-xs font-black transition-all ${category === 'VACUUM' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}
              >ROBOT SÜPÜRGE</button>
            </div>

            <div className="text-right hidden md:block">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Powered by</div>
              <div className="text-amber-400 font-black text-lg">Ağırlıklı Matris AI</div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Selector Section */}
      <section className="border-b border-zinc-800 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-black">
                Aday 1
              </label>
              <select
                value={selectedProduct1}
                onChange={(e) => setSelectedProduct1(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-bold"
              >
                {currentData.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({formatCurrency(v.market.listPrice)})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-black">
                Aday 2
              </label>
              <select
                value={selectedProduct2}
                onChange={(e) => setSelectedProduct2(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-bold"
              >
                {currentData.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({formatCurrency(v.market.listPrice)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>
      
      {/* Verdict Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          {isVehicleCategory && comparison.segmentWarning && (
            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-orange-300 text-sm font-bold italic">{comparison.segmentWarning}</p>
            </div>
          )}
          
          {/* Main Verdict Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-amber-500/30 rounded-2xl p-8 shadow-2xl shadow-amber-500/10">
            <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-8">
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest text-amber-500 mb-2 font-black">
                  Executive Decision
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight text-white tracking-tighter">
                  {comparison.verdict.split('\n')[0]}
                </h2>
                
                <div className="space-y-4 mt-6">
                  {comparison.verdict.split('\n').slice(1).map((line: string, i: number) => (
                    line.trim() && (
                      <p key={i} className="text-zinc-300 text-lg leading-relaxed font-medium">
                        {line}
                      </p>
                    )
                  ))}
                </div>
              </div>
              
              <div className="md:ml-6 text-right bg-white/5 p-6 rounded-2xl border border-white/5 min-w-[200px]">
                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1 font-black">
                  Final Score
                </div>
                <div className="text-6xl font-black text-amber-500 italic tracking-tighter">
                  {isVehicleCategory && winnerAnalysis ? winnerAnalysis.finalScore.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-zinc-400 mt-2 font-bold uppercase tracking-widest">
                  {isVehicleCategory && winnerAnalysis ? getScoreLabel(winnerAnalysis.finalScore) : 'Analiz Tamamlandı'}
                </div>
              </div>
            </div>
            
            {/* Detailed Reasons List */}
            {comparison.detailedReasons.length > 0 && (
              <div className="mt-8 pt-8 border-t border-zinc-800">
                <h3 className="text-xs uppercase tracking-wider text-zinc-400 mb-4 font-black tracking-[0.2em]">
                  Analiz Detayları
                </h3>
                <ul className="grid md:grid-cols-2 gap-4">
                  {comparison.detailedReasons.map((reason: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-base text-zinc-200 font-semibold group transition-all">
                      <span className="text-amber-500 group-hover:scale-125 transition-transform">▸</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* TYPE-SAFE SMART BUY BUTTON */}
          {winnerProduct && (
            <div className="mt-8 flex justify-center">
              <SmartBuyButton product={winnerProduct} />
            </div>
          )}
        </div>
      </section>
      
      {/* Score Comparison Cards - Sadece Araba Kategorisi */}
      {isVehicleCategory && (
        <section className="bg-zinc-950 border-y border-zinc-800">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid md:grid-cols-2 gap-8">
              <ScoreCard analysis={comparison.vehicle1} isWinner={comparison.winner === 'vehicle1'} />
              <ScoreCard analysis={comparison.vehicle2} isWinner={comparison.winner === 'vehicle2'} />
            </div>
          </div>
        </section>
      )}
      
      {/* Detailed Comparison Table */}
      {isVehicleCategory && (
        <section className="bg-black">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black text-white tracking-tighter">Teknik Karşılaştırma Matrisi</h2>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-black transition-all uppercase tracking-widest border border-white/5"
              >
                {showDetails ? '[-] Matrisi Gizle' : '[+] Matrisi Göster'}
              </button>
            </div>
            
            {showDetails && (
              <DetailedComparisonTable 
                vehicle1={comparison.vehicle1} 
                vehicle2={comparison.vehicle2} 
              />
            )}
          </div>
        </section>
      )}
      
      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-black py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-zinc-500 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-black text-xl tracking-tighter">RATIO.RUN</span> 
              <span className="text-zinc-800">|</span> 
              <span>© 2024 · Midas Whale Algorithm</span>
            </div>
            <div className="italic text-zinc-400">
              Decide with Math, not Emotions.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS (Değişiklik yok)
// ============================================================================

function ScoreCard({ analysis, isWinner }: { analysis: VehicleAnalysis; isWinner: boolean }) {
  const { vehicle, categoryScores, finalScore, strengths, weaknesses, warnings } = analysis;
  
  return (
    <div className={`
      relative bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-8 border
      ${isWinner ? 'border-amber-500/50 shadow-2xl shadow-amber-500/10' : 'border-zinc-800'}
      transition-all duration-500 hover:scale-[1.01]
    `}>
      {isWinner && (
        <div className="absolute -top-4 -right-4 bg-amber-500 text-black px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
          KAZANAN ADAY
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-3xl font-black text-white mb-2 tracking-tighter">{vehicle.name}</h3>
        <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
          <span>{vehicle.year} MODEL</span>
          <span className="text-amber-500">/</span>
          <span>SEGMENT {vehicle.segment}</span>
          <span className="text-amber-500">/</span>
          <span className="text-amber-400">{formatCurrency(vehicle.market.listPrice)}</span>
        </div>
      </div>
      
      <div className="mb-8 pb-8 border-b border-zinc-800 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-black">Grup Skoru</div>
          <div className={`text-5xl font-black italic tracking-tighter ${getScoreColor(finalScore)}`}>
            {finalScore.toFixed(1)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-zinc-300 uppercase italic">
            {getScoreLabel(finalScore)}
          </div>
        </div>
      </div>
      
      <div className="space-y-5 mb-8">
        <CategoryBar label="Piyasa Gücü & Likidite" score={categoryScores.market} />
        <CategoryBar label="Mühendislik & Performans" score={categoryScores.engineering} />
        <CategoryBar label="Premium Kalite & Prestij" score={categoryScores.quality} />
        <CategoryBar label="Güvenilirlik & Risk" score={categoryScores.risk} />
      </div>
      
      {warnings.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-black">Kritik Uyarılar</div>
          <ul className="space-y-1.5">
            {warnings.map((warning, i) => (
              <li key={i} className="text-xs text-red-300 font-semibold">• {warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-3 font-black underline decoration-2 underline-offset-4">Artılar</div>
          <ul className="space-y-2">
            {strengths.slice(0, 3).map((s, i) => (
              <li key={i} className="text-[11px] text-emerald-300 font-bold leading-tight uppercase tracking-tight">+ {s}</li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10">
          <div className="text-[10px] uppercase tracking-widest text-orange-400 mb-3 font-black underline decoration-2 underline-offset-4">Eksiler</div>
          <ul className="space-y-2">
            {weaknesses.slice(0, 3).map((w, i) => (
              <li key={i} className="text-[11px] text-orange-300 font-bold leading-tight uppercase tracking-tight">- {w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CategoryBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
        <span className={`text-xs font-black ${getScoreColor(score)}`}>{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            score >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
            score >= 60 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
            'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function DetailedComparisonTable({ vehicle1, vehicle2 }: { vehicle1: VehicleAnalysis; vehicle2: VehicleAnalysis }) {
  const v1 = vehicle1.vehicle; const v2 = vehicle2.vehicle;
  const n1 = vehicle1.normalizedScores; const n2 = vehicle2.normalizedScores;
  
  return (
    <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 border-b border-zinc-800">
          <tr className="text-center">
            <th className="text-left p-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Metrikler</th>
<th className="p-2 md:p-6 text-white font-black text-[11px] md:text-lg tracking-tighter text-center">
                  <span className="block whitespace-normal break-words max-w-[90px] md:max-w-none mx-auto">
                    {v1.name}
                  </span>
                </th>
<th className="p-2 md:p-6 text-white font-black text-[11px] md:text-lg tracking-tighter text-center border-l border-white/5">
                  <span className="block whitespace-normal break-words max-w-[90px] md:max-w-none mx-auto">
                    {v2.name}
                  </span>
                </th>
            <th className="p-6 text-zinc-500 font-black uppercase text-[10px] tracking-widest">Fark</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900">
          <TableSectionHeader title="MÜHENDİSLİK VERİLERİ" />
          <ComparisonRow label="Beygir Gücü" value1={v1.engineering.hp} value2={v2.engineering.hp} score1={n1.hpScore} score2={n2.hpScore} unit="HP" higherIsBetter />
          <ComparisonRow label="Maksimum Tork" value1={v1.engineering.torque} value2={v2.engineering.torque} score1={n1.torqueScore} score2={n2.torqueScore} unit="Nm" higherIsBetter />
          <ComparisonRow label="0-100 Hızlanma" value1={v1.engineering.zeroToHundred} value2={v2.engineering.zeroToHundred} score1={n1.accelerationScore} score2={n2.accelerationScore} unit="sn" higherIsBetter={false} />
          <ComparisonRow label="Ağırlık" value1={v1.engineering.weight} value2={v2.engineering.weight} score1={n1.weightScore} score2={n2.weightScore} unit="kg" higherIsBetter={false} />
          <ComparisonRow label="Güç / Ağırlık Oranı" value1={v1.engineering.hp / (v1.engineering.weight / 1000)} value2={v2.engineering.hp / (v2.engineering.weight / 1000)} score1={n1.powerToWeightScore} score2={n2.powerToWeightScore} unit="HP/Ton" higherIsBetter decimals={1} />
          <TextComparisonRow label="Şanzıman Tipi" value1={v1.engineering.transmission} value2={v2.engineering.transmission} score1={n1.transmissionScore} score2={n2.transmissionScore} />
          <ComparisonRow label="Yakıt Tüketimi (Karma)" value1={v1.engineering.fuelConsumption} value2={v2.engineering.fuelConsumption} score1={n1.fuelScore} score2={n2.fuelScore} unit="L/100km" higherIsBetter={false} decimals={1} />
          <ComparisonRow label="Bagaj Kapasitesi" value1={v1.engineering.trunkCapacity} value2={v2.engineering.trunkCapacity} score1={n1.trunkScore} score2={n2.trunkScore} unit="Litre" higherIsBetter />
          
          <TableSectionHeader title="PİYASA & FİNANSAL ANALİZ" />
          <ComparisonRow label="Güncel Liste Fiyatı" value1={v1.market.listPrice} value2={v2.market.listPrice} score1={50} score2={50} unit="TL" format="currency" />
          <ComparisonRow label="Piyasa Likidite Skoru" value1={v1.market.liquidityScore} value2={v2.market.liquidityScore} score1={n1.liquidityScore} score2={n2.liquidityScore} unit="/10" higherIsBetter />
          <ComparisonRow label="2. El Değer Koruma" value1={v1.market.resaleValue} value2={v2.market.resaleValue} score1={n1.resaleScore} score2={n2.resaleScore} unit="/10" higherIsBetter />
          <ComparisonRow label="Servis & Yedek Parça" value1={v1.market.serviceNetwork} value2={v2.market.serviceNetwork} score1={n1.serviceScore} score2={n2.serviceScore} unit="/10" higherIsBetter />
          
          <TableSectionHeader title="KONFOR & KALİTE ALGISI" />
          <ComparisonRow label="İç Mekan Kalitesi" value1={v1.quality.materialQuality} value2={v2.quality.materialQuality} score1={n1.materialScore} score2={n2.materialScore} unit="/10" higherIsBetter />
          <ComparisonRow label="Ses Yalıtımı" value1={v1.quality.soundInsulation} value2={v2.quality.soundInsulation} score1={n1.soundScore} score2={n2.soundScore} unit="/10" higherIsBetter />
          <ComparisonRow label="Sürüş Konforu" value1={v1.quality.rideComfort} value2={v2.quality.rideComfort} score1={n1.comfortScore} score2={n2.comfortScore} unit="/10" higherIsBetter />
          <ComparisonRow label="Marka Prestiji" value1={v1.quality.prestigeScore} value2={v2.quality.prestigeScore} score1={n1.prestigeScore} score2={n2.prestigeScore} unit="/10" higherIsBetter />
          <TextComparisonRow label="Donanım Seviyesi" value1={v1.quality.trimLevel} value2={v2.quality.trimLevel} score1={n1.trimScore} score2={n2.trimScore} />
          
          <TableSectionHeader title="RİSK VE KARAR PARAMETRELERİ" />
          <ComparisonRow label="Kronik Arıza Riski" value1={v1.risk.chronicIssueRisk} value2={v2.risk.chronicIssueRisk} score1={n1.reliabilityScore} score2={n2.reliabilityScore} unit="/10" higherIsBetter={false} reverseHighlight />
          <ComparisonRow label="Yokuş Performans Endeksi" value1={n1.hillScore} value2={n2.hillScore} score1={n1.hillScore} score2={n2.hillScore} unit="/100" higherIsBetter decimals={1} />
        </tbody>
      </table>
    </div>
  );
}

function TableSectionHeader({ title }: { title: string }) {
  return (
    <tr className="bg-zinc-900/80">
      <td colSpan={4} className="p-4">
        <div className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-black text-center">
          {title}
        </div>
      </td>
    </tr>
  );
}

function ComparisonRow({ label, value1, value2, score1, score2, unit = '', higherIsBetter = true, format = 'number', decimals = 0 }: any) {
  const formatValue = (val: number) => format === 'currency' ? formatCurrency(val) : val.toFixed(decimals);
  const winner = score1 > score2 ? 1 : score1 < score2 ? 2 : 0;
  const difference = Math.abs(value1 - value2);
  const percentDiff = value1 && value2 ? ((difference / Math.min(value1, value2)) * 100).toFixed(0) : '0';
  
  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="p-5 text-zinc-400 font-bold text-xs uppercase tracking-tight">{label}</td>
      <td className={`p-5 text-center font-black ${winner === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500'}`}>
        {formatValue(value1)} <span className="text-[10px] font-normal opacity-50">{unit}</span>
      </td>
      <td className={`p-5 text-center font-black ${winner === 2 ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500'}`}>
        {formatValue(value2)} <span className="text-[10px] font-normal opacity-50">{unit}</span>
      </td>
      <td className="p-5 text-center text-zinc-600 text-[10px] font-black group-hover:text-zinc-400 transition-colors">
        {difference > 0 ? `${percentDiff}%` : '—'}
      </td>
    </tr>
  );
}

function TextComparisonRow({ label, value1, value2, score1, score2 }: any) {
  const winner = score1 > score2 ? 1 : score1 < score2 ? 2 : 0;
  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="p-5 text-zinc-400 font-bold text-xs uppercase tracking-tight">{label}</td>
      <td className={`p-5 text-center font-black ${winner === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500'}`}>{value1}</td>
      <td className={`p-5 text-center font-black ${winner === 2 ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500'}`}>{value2}</td>
      <td className="p-5 text-center text-zinc-600 text-[10px] font-black group-hover:text-zinc-400 transition-colors">
        {score1 !== score2 ? (score1 > score2 ? '← SEÇİM' : 'SEÇİM →') : 'EŞİT'}
      </td>
    </tr>
  );
}