// RATIO.RUN - Algorithm & Calculation Engine
// The Brain: Ağırlıklı matris sistemi ve tüm hesaplamalar
// [Executive Summary Edition - No Omissions]

import {
  Vehicle,
  VehicleAnalysis,
  ComparisonResult,
  NormalizedScores,
  CategoryScores,
  ScoringWeights,
  NormalizationBounds,
  TransmissionType,
  TrimLevel,
  RobotVacuum, // Yeni kategori entegrasyonu
} from './types';

// ============================================================================
// ADIM 1: NORMALİZASYON FONKSİYONLARI (Hard Specs to 0-100)
// ============================================================================

function normalizeHigherIsBetter(value: number, min: number, max: number): number {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

function normalizeLowerIsBetter(value: number, min: number, max: number): number {
  if (max === min) return 50;
  const normalized = ((max - value) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

function scoreTransmission(type: TransmissionType): number {
  const scores: Record<TransmissionType, number> = {
    'ZF': 95,           // BMW/Mercedes standardı
    'DSG': 85,          // Hızlı ama riskli
    'Manuel': 80,       // Güvenilir
    'Otomatik': 75,     // Klasik
    'Şanzıman': 70,     // Belirsiz
    'CVT': 40,          // Hissiz ve riskli
  };
  return scores[type] || 50;
}

function scoreTrimLevel(trim: TrimLevel): number {
  const scores: Record<TrimLevel, number> = {
    'Gırtlak Dolu': 100,
    'Dolu': 80,
    'Orta': 50,
    'Boş': 20,
  };
  return scores[trim];
}

function calculatePowerToWeight(hp: number, weight: number): number {
  return hp / (weight / 1000); // HP per Ton
}

function calculateHillPerformance(torque: number, weight: number): number {
  const torqueToWeight = torque / weight;
  // 0.25+ = Mükemmel, 0.10- = Kötü
  const score = ((torqueToWeight - 0.10) / (0.25 - 0.10)) * 100;
  return Math.max(0, Math.min(100, score));
}

function calculatePriceValue(listPrice: number, marketAverage: number): number {
  if (marketAverage === 0) return 50;
  const difference = ((marketAverage - listPrice) / marketAverage) * 100;
  const score = 50 + (difference * 2.5);
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// ADIM 2: STRATEJİK AĞIRLIKLANDIRMA (Midas Whale Standard)
// ============================================================================

export const DEFAULT_WEIGHTS: ScoringWeights = {
  liquidityAndResale: 0.25,      // %25 - Piyasa hızı
  torqueAndPerformance: 0.20,    // %20 - Mühendislik
  prestigeAndQuality: 0.20,      // %20 - Prestij
  priceAdvantage: 0.15,          // %15 - Fiyat
  reliability: 0.10,             // %10 - Sorunsuzluk
  fuelEconomy: 0.05,             // %05 - Ekonomi
  features: 0.05,                // %05 - Donanım
};

// ============================================================================
// ADIM 3: ARAÇ ANALİZ MOTORU
// ============================================================================

export function analyzeVehicle(
  vehicle: Vehicle,
  bounds: NormalizationBounds,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): VehicleAnalysis {
  const { engineering, market, quality, risk } = vehicle;
  
  const normalizedScores: NormalizedScores = {
    hpScore: normalizeHigherIsBetter(engineering.hp, bounds.hp.min, bounds.hp.max),
    torqueScore: normalizeHigherIsBetter(engineering.torque, bounds.torque.min, bounds.torque.max),
    accelerationScore: normalizeLowerIsBetter(engineering.zeroToHundred, bounds.zeroToHundred.min, bounds.zeroToHundred.max),
    weightScore: normalizeLowerIsBetter(engineering.weight, bounds.weight.min, bounds.weight.max),
    powerToWeightScore: normalizeHigherIsBetter(calculatePowerToWeight(engineering.hp, engineering.weight), 40, 200),
    transmissionScore: scoreTransmission(engineering.transmission),
    fuelScore: normalizeLowerIsBetter(engineering.fuelConsumption, bounds.fuelConsumption.min, bounds.fuelConsumption.max),
    trunkScore: normalizeHigherIsBetter(engineering.trunkCapacity, bounds.trunkCapacity.min, bounds.trunkCapacity.max),
    liquidityScore: market.liquidityScore * 10,
    resaleScore: market.resaleValue * 10,
    serviceScore: market.serviceNetwork * 10,
    priceValueScore: calculatePriceValue(market.listPrice, market.marketAverage),
    materialScore: quality.materialQuality * 10,
    soundScore: quality.soundInsulation * 10,
    comfortScore: quality.rideComfort * 10,
    prestigeScore: quality.prestigeScore * 10,
    trimScore: scoreTrimLevel(quality.trimLevel),
    reliabilityScore: (10 - risk.chronicIssueRisk) * 10,
    hillScore: calculateHillPerformance(engineering.torque, engineering.weight),
  };
  
  const categoryScores: CategoryScores = {
    engineering: (normalizedScores.hpScore * 0.15 + normalizedScores.torqueScore * 0.25 + normalizedScores.accelerationScore * 0.20 + normalizedScores.powerToWeightScore * 0.15 + normalizedScores.transmissionScore * 0.10 + normalizedScores.fuelScore * 0.05 + normalizedScores.trunkScore * 0.10),
    market: (normalizedScores.liquidityScore * 0.35 + normalizedScores.resaleScore * 0.35 + normalizedScores.serviceScore * 0.15 + normalizedScores.priceValueScore * 0.15),
    quality: (normalizedScores.materialScore * 0.20 + normalizedScores.soundScore * 0.15 + normalizedScores.comfortScore * 0.20 + normalizedScores.prestigeScore * 0.30 + normalizedScores.trimScore * 0.15),
    risk: (normalizedScores.reliabilityScore * 0.60 + normalizedScores.hillScore * 0.40),
  };
  
  const finalScore = (categoryScores.market * weights.liquidityAndResale + categoryScores.engineering * weights.torqueAndPerformance + categoryScores.quality * weights.prestigeAndQuality + normalizedScores.priceValueScore * weights.priceAdvantage + categoryScores.risk * weights.reliability + normalizedScores.fuelScore * weights.fuelEconomy + normalizedScores.trimScore * weights.features);
  
  const warnings: string[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Yargıç Hükümleri
  if (normalizedScores.hillScore < 30) warnings.push('⚠️ Yokuşta bayılma yapar, klima açıkken üzer.');
  if (market.liquidityScore < 4) warnings.push('🔴 Bu araç "evlat" olur; alırsın ama zor satarsın.');
  if (engineering.transmission === 'CVT') warnings.push('⚙️ CVT şanzıman riskli; hissiz sürüş ve masraf riski.');
  if (risk.chronicIssueRisk > 7) warnings.push('🔧 Servise abone yapar; kronik sorunlu ünite.');
  if (market.resaleValue >= 8) strengths.push('Paranı koruyan, 2. elde altın gibi araç.');
  
  return { vehicle, normalizedScores, categoryScores, finalScore, warnings, strengths, weaknesses };
}

// ============================================================================
// ADIM 4: YARGIÇ KARŞILAŞTIRMA (NO TIES ALLOWED)
// ============================================================================

export function compareVehicles(
  vehicle1: Vehicle,
  vehicle2: Vehicle,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ComparisonResult {
  const bounds: NormalizationBounds = {
    hp: { min: Math.min(vehicle1.engineering.hp, vehicle2.engineering.hp), max: Math.max(vehicle1.engineering.hp, vehicle2.engineering.hp) },
    torque: { min: Math.min(vehicle1.engineering.torque, vehicle2.engineering.torque), max: Math.max(vehicle1.engineering.torque, vehicle2.engineering.torque) },
    zeroToHundred: { min: Math.min(vehicle1.engineering.zeroToHundred, vehicle2.engineering.zeroToHundred), max: Math.max(vehicle1.engineering.zeroToHundred, vehicle2.engineering.zeroToHundred) },
    weight: { min: Math.min(vehicle1.engineering.weight, vehicle2.engineering.weight), max: Math.max(vehicle1.engineering.weight, vehicle2.engineering.weight) },
    fuelConsumption: { min: Math.min(vehicle1.engineering.fuelConsumption, vehicle2.engineering.fuelConsumption), max: Math.max(vehicle1.engineering.fuelConsumption, vehicle2.engineering.fuelConsumption) },
    trunkCapacity: { min: Math.min(vehicle1.engineering.trunkCapacity, vehicle2.engineering.trunkCapacity), max: Math.max(vehicle1.engineering.trunkCapacity, vehicle2.engineering.trunkCapacity) },
    engineDisplacement: { min: Math.min(vehicle1.engineering.engineDisplacement, vehicle2.engineering.engineDisplacement), max: Math.max(vehicle1.engineering.engineDisplacement, vehicle2.engineering.engineDisplacement) },
    listPrice: { min: Math.min(vehicle1.market.listPrice, vehicle2.market.listPrice), max: Math.max(vehicle1.market.listPrice, vehicle2.market.listPrice) },
    marketAverage: { min: Math.min(vehicle1.market.marketAverage, vehicle2.market.marketAverage), max: Math.max(vehicle1.market.marketAverage, vehicle2.market.marketAverage) },
  };
  
  const analysis1 = analyzeVehicle(vehicle1, bounds, weights);
  const analysis2 = analyzeVehicle(vehicle2, bounds, weights);
  
  const scoreDifference = Math.abs(analysis1.finalScore - analysis2.finalScore);
  
  // Tie-breaker: "Tercih size kalmış" YASAK.
  let winner: 'vehicle1' | 'vehicle2';
  if (scoreDifference < 3) {
    winner = analysis1.vehicle.market.liquidityScore >= analysis2.vehicle.market.liquidityScore ? 'vehicle1' : 'vehicle2';
  } else {
    winner = analysis1.finalScore > analysis2.finalScore ? 'vehicle1' : 'vehicle2';
  }

  const winnerAnal = winner === 'vehicle1' ? analysis1 : analysis2;
  const loserAnal = winner === 'vehicle1' ? analysis2 : analysis1;
  
  let verdict = `🏆 KESİN KARAR: ${winnerAnal.vehicle.name}`;
  const reasons: string[] = [];

  if (scoreDifference < 3) reasons.push("Başa baş mücadelede piyasa hızı ve likidite farkıyla rakibini eliyor.");
  if (winnerAnal.categoryScores.engineering > loserAnal.categoryScores.engineering + 5) reasons.push("Mühendislik ve tork verimliliği ile rakibini eziyor.");
  if (winnerAnal.categoryScores.market > loserAnal.categoryScores.market + 5) reasons.push("Paranızı en iyi koruyacak, satış riski olmayan seçenek.");
  if (winnerAnal.categoryScores.risk > loserAnal.categoryScores.risk + 5) reasons.push("Kronik arıza riski olmayan, güvenli liman.");

  verdict += `\n\nANALİZ: ${reasons.join(' ')}. Bu bütçede macera aramanın anlamı yok.`;

  return {
    vehicle1: analysis1, vehicle2: analysis2, winner, verdict,
    detailedReasons: [...reasons, ...winnerAnal.strengths.slice(0, 2)],
    scoreDifference,
  };
}

// ============================================================================
// ROBOT SÜPÜRGE YARGICI (Judge for Vacuums)
// ============================================================================

export function analyzeVacuum(vacuum: RobotVacuum): number {
  const { specs, market, risk } = vacuum;
  // Performans %40 + Piyasa %40 + Güvenilirlik %20
  const suctionScore = (specs.suctionPower / 8000) * 100;
  const batteryScore = (specs.batteryCapacity / 6500) * 100;
  const performanceScore = (suctionScore * 0.7) + (batteryScore * 0.3);
  const marketScore = (market.liquidityScore * 50) + (market.resaleValue * 50);
  const reliabilityScore = (10 - risk.chronicIssueRisk) * 10;
  return (performanceScore * 0.4) + (marketScore * 0.4) + (reliabilityScore * 0.2);
}

export function compareVacuums(v1: RobotVacuum, v2: RobotVacuum) {
  const s1 = analyzeVacuum(v1);
  const s2 = analyzeVacuum(v2);
  const winner = s1 >= s2 ? v1 : v2;
  const scoreDiff = Math.abs(s1 - s2);
  const reasons: string[] = [];

  if (winner.specs.suctionPower > (winner === v1 ? v2 : v1).specs.suctionPower) reasons.push("Daha yüksek emiş gücüyle halılarda derin temizlik.");
  if (winner.market.liquidityScore > 7) reasons.push("Marka bilinirliği yüksek, elden çıkarması kolay.");
  if (winner.risk.chronicIssueRisk < 3) reasons.push("Yazılım stabilitesi kanıtlanmış, haritalama hatası yapmayan ünite.");

  let verdict = `🏆 YARGIÇ KARARI: ${winner.name}`;
  verdict += scoreDiff < 5 
    ? `\n\nDonanım olarak çok yakın olsalar da ${winner.name} stabilite farkıyla kazanıyor.` 
    : `\n\nNet bir mühendislik üstünlüğü var. Mantıklı olan bu cihazdır.`;

  return {
    vehicle1: { vehicle: v1, finalScore: s1 },
    vehicle2: { vehicle: v2, finalScore: s2 },
    winner: winner === v1 ? 'vehicle1' : 'vehicle2',
    verdict,
    detailedReasons: reasons,
    scoreDifference: scoreDiff
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Mükemmel';
  if (score >= 75) return 'İyi';
  if (score >= 60) return 'Orta';
  return 'Zayıf';
}