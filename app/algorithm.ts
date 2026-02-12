// RATIO.RUN - Algorithm & Calculation Engine
// The Brain: Ağırlıklı matris sistemi ve tüm hesaplamalar
// [Executive Summary Edition - Vacuum Enhanced]

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
  RobotVacuum,
} from './types';

// ============================================================================
// VACUUM ANALYSIS TYPES
// ============================================================================

export interface VacuumAnalysis {
  vacuum: RobotVacuum;
  normalizedScores: VacuumNormalizedScores;
  categoryScores: VacuumCategoryScores;
  finalScore: number;
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
}

interface VacuumNormalizedScores {
  suctionScore: number;
  batteryScore: number;
  noiseScore: number;
  dustCapacityScore: number;
  mappingScore: number;
  mopScore: number;
  liquidityScore: number;
  resaleScore: number;
  serviceScore: number;
  reliabilityScore: number;
}

interface VacuumCategoryScores {
  performance: number;  // Performans (emiş, batarya)
  intelligence: number; // Zeka (haritalama, AI)
  market: number;       // Piyasa (likidite, resale)
  reliability: number;  // Dayanıklılık
}

interface VacuumNormalizationBounds {
  suctionPower: { min: number; max: number };
  batteryCapacity: { min: number; max: number };
  noiseLevel: { min: number; max: number };
  dustCapacity: { min: number; max: number };
  listPrice: { min: number; max: number };
}

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
    'ZF': 95,
    'DSG': 85,
    'Manuel': 80,
    'Otomatik': 75,
    'Şanzıman': 70,
    'CVT': 40,
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

function scoreMappingTech(tech: string): number {
  const scores: Record<string, number> = {
    'Lidar + AI Camera': 100,
    'Lidar + AI': 95,
    'Lidar + 3D': 90,
    'Lidar': 85,
    '360 Camera': 75,
    'V-SLAM': 80,
    'Gyroscope': 40,
  };
  return scores[tech] || 50;
}

function calculatePowerToWeight(hp: number, weight: number): number {
  return hp / (weight / 1000);
}

function calculateHillPerformance(torque: number, weight: number): number {
  const torqueToWeight = torque / weight;
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
  liquidityAndResale: 0.25,
  torqueAndPerformance: 0.20,
  prestigeAndQuality: 0.20,
  priceAdvantage: 0.15,
  reliability: 0.10,
  fuelEconomy: 0.05,
  features: 0.05,
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
  
  if (normalizedScores.hillScore < 30) warnings.push('⚠️ Yokuşta bayılma yapar, klima açıkken üzer.');
  if (market.liquidityScore < 4) warnings.push('🔴 Bu araç "evlat" olur; alırsın ama zor satarsın.');
  if (engineering.transmission === 'CVT') warnings.push('⚙️ CVT şanzıman riskli; hissiz sürüş ve masraf riski.');
  if (risk.chronicIssueRisk > 7) warnings.push('🔧 Servise abone yapar; kronik sorunlu ünite.');
  if (market.resaleValue >= 8) strengths.push('Paranı koruyan, 2. elde altın gibi araç.');
  
  return { vehicle, normalizedScores, categoryScores, finalScore, warnings, strengths, weaknesses };
}

// ============================================================================
// ADIM 4: VACUUM ANALİZ MOTORU
// ============================================================================

export function analyzeVacuum(
  vacuum: RobotVacuum,
  bounds: VacuumNormalizationBounds
): VacuumAnalysis {
  const { specs, market, risk } = vacuum;
  
  const normalizedScores: VacuumNormalizedScores = {
    suctionScore: normalizeHigherIsBetter(specs.suctionPower, bounds.suctionPower.min, bounds.suctionPower.max),
    batteryScore: normalizeHigherIsBetter(specs.batteryCapacity, bounds.batteryCapacity.min, bounds.batteryCapacity.max),
    noiseScore: normalizeLowerIsBetter(specs.noiseLevel, bounds.noiseLevel.min, bounds.noiseLevel.max),
    dustCapacityScore: normalizeHigherIsBetter(specs.dustCapacity, bounds.dustCapacity.min, bounds.dustCapacity.max),
    mappingScore: scoreMappingTech(specs.mappingTech),
    mopScore: specs.mopFeature ? 100 : 0,
    liquidityScore: market.liquidityScore * 10,
    resaleScore: market.resaleValue * 10,
    serviceScore: market.serviceNetwork * 10,
    reliabilityScore: (10 - risk.chronicIssueRisk) * 10,
  };
  
  const categoryScores: VacuumCategoryScores = {
    performance: (
      normalizedScores.suctionScore * 0.50 +
      normalizedScores.batteryScore * 0.30 +
      normalizedScores.dustCapacityScore * 0.20
    ),
    intelligence: (
      normalizedScores.mappingScore * 0.70 +
      normalizedScores.mopScore * 0.30
    ),
    market: (
      normalizedScores.liquidityScore * 0.40 +
      normalizedScores.resaleScore * 0.40 +
      normalizedScores.serviceScore * 0.20
    ),
    reliability: (
      normalizedScores.reliabilityScore * 0.70 +
      normalizedScores.noiseScore * 0.30
    ),
  };
  
  const finalScore = (
    categoryScores.performance * 0.35 +
    categoryScores.intelligence * 0.25 +
    categoryScores.market * 0.25 +
    categoryScores.reliability * 0.15
  );
  
  const warnings: string[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (normalizedScores.suctionScore < 30) warnings.push('⚠️ Düşük emiş gücü; halılarda yetersiz kalabilir.');
  if (specs.mappingTech === 'Gyroscope') warnings.push('🗺️ Navigasyon primitif; evi ezberlemiyor, her seferinde keşfediyor.');
  if (market.liquidityScore < 5) warnings.push('🔴 Az bilinen marka; satış zorluğu yaşarsınız.');
  if (risk.chronicIssueRisk > 6) warnings.push('🔧 Yazılım güncellemesi beklentili; haritalama hataları biliniyor.');
  
  if (normalizedScores.suctionScore >= 80) strengths.push('Halı ve kilimde derin temizlik gücü');
  if (normalizedScores.mappingScore >= 90) strengths.push('Yapay zeka destekli akıllı navigasyon');
  if (market.resaleValue >= 8) strengths.push('İkinci el değer koruması yüksek');
  if (specs.mopFeature) strengths.push('Paspas özelliği ile ıslak temizlik');
  
  if (normalizedScores.batteryScore < 40) weaknesses.push('Düşük batarya kapasitesi');
  if (normalizedScores.noiseScore < 40) weaknesses.push('Yüksek gürültü seviyesi');
  if (!specs.mopFeature) weaknesses.push('Paspas özelliği yok');
  
  return { vacuum, normalizedScores, categoryScores, finalScore, warnings, strengths, weaknesses };
}

// ============================================================================
// ADIM 5: YARGIÇ KARŞILAŞTIRMA (Vehicles)
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
    vehicle1: analysis1, 
    vehicle2: analysis2, 
    winner, 
    verdict,
    detailedReasons: [...reasons, ...winnerAnal.strengths.slice(0, 2)],
    scoreDifference,
  };
}

// ============================================================================
// ADIM 6: YARGIÇ KARŞILAŞTIRMA (Vacuums)
// ============================================================================

export function compareVacuums(v1: RobotVacuum, v2: RobotVacuum) {
  const bounds: VacuumNormalizationBounds = {
    suctionPower: { min: Math.min(v1.specs.suctionPower, v2.specs.suctionPower), max: Math.max(v1.specs.suctionPower, v2.specs.suctionPower) },
    batteryCapacity: { min: Math.min(v1.specs.batteryCapacity, v2.specs.batteryCapacity), max: Math.max(v1.specs.batteryCapacity, v2.specs.batteryCapacity) },
    noiseLevel: { min: Math.min(v1.specs.noiseLevel, v2.specs.noiseLevel), max: Math.max(v1.specs.noiseLevel, v2.specs.noiseLevel) },
    dustCapacity: { min: Math.min(v1.specs.dustCapacity, v2.specs.dustCapacity), max: Math.max(v1.specs.dustCapacity, v2.specs.dustCapacity) },
    listPrice: { min: Math.min(v1.market.listPrice, v2.market.listPrice), max: Math.max(v1.market.listPrice, v2.market.listPrice) },
  };
  
  const analysis1 = analyzeVacuum(v1, bounds);
  const analysis2 = analyzeVacuum(v2, bounds);
  
  const scoreDifference = Math.abs(analysis1.finalScore - analysis2.finalScore);
  
  let winner: 'vehicle1' | 'vehicle2';
  if (scoreDifference < 3) {
    winner = analysis1.vacuum.market.liquidityScore >= analysis2.vacuum.market.liquidityScore ? 'vehicle1' : 'vehicle2';
  } else {
    winner = analysis1.finalScore > analysis2.finalScore ? 'vehicle1' : 'vehicle2';
  }
  
  const winnerAnal = winner === 'vehicle1' ? analysis1 : analysis2;
  const loserAnal = winner === 'vehicle1' ? analysis2 : analysis1;
  
  let verdict = `🏆 KESİN KARAR: ${winnerAnal.vacuum.name}`;
  const reasons: string[] = [];
  
  if (scoreDifference < 3) reasons.push("Başa baş mücadelede marka bilinirliği ve satış kolaylığı farkıyla öne çıkıyor.");
  if (winnerAnal.categoryScores.performance > loserAnal.categoryScores.performance + 5) reasons.push(`Emiş gücü (${winnerAnal.vacuum.specs.suctionPower}Pa) ve batarya performansı ile rakibini eziyor.`);
  if (winnerAnal.categoryScores.intelligence > loserAnal.categoryScores.intelligence + 5) reasons.push(`${winnerAnal.vacuum.specs.mappingTech} teknolojisi ile çok daha akıllı navigasyon.`);
  if (winnerAnal.categoryScores.market > loserAnal.categoryScores.market + 5) reasons.push("Piyasa değeri koruma ve satış kolaylığı garantili.");
  if (winnerAnal.categoryScores.reliability > loserAnal.categoryScores.reliability + 5) reasons.push("Yazılım stabilitesi kanıtlanmış, haritalama hatası yapmayan sistem.");
  
  verdict += `\n\nANALİZ: ${reasons.join(' ')} Bu bütçede deneme yanılmaya gerek yok.`;
  
  return {
    vehicle1: analysis1,
    vehicle2: analysis2,
    winner,
    verdict,
    detailedReasons: [...reasons, ...winnerAnal.strengths.slice(0, 2)],
    scoreDifference,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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