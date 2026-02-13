// RATIO.RUN - Algorithm & Calculation Engine
// The Brain: Ağırlıklı matris sistemi ve tüm hesaplamalar
// [Production Edition - Type-Safe & Calibrated]

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
// TYPE GUARDS - RUNTIME SAFETY
// ============================================================================

function safeNumber(value: any, fallback: number = 0): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return value;
}

function safeString(value: any, fallback: string = ''): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  return value;
}

function safeBoolean(value: any, fallback: boolean = false): boolean {
  if (typeof value !== 'boolean') {
    return fallback;
  }
  return value;
}

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
  performance: number;
  intelligence: number;
  market: number;
  reliability: number;
}

interface VacuumNormalizationBounds {
  suctionPower: { min: number; max: number };
  batteryCapacity: { min: number; max: number };
  noiseLevel: { min: number; max: number };
  dustCapacity: { min: number; max: number };
  listPrice: { min: number; max: number };
}

// ============================================================================
// NORMALIZATION FUNCTIONS (Type-Safe)
// ============================================================================

function normalizeHigherIsBetter(value: number, min: number, max: number): number {
  // Type safety
  const safeValue = safeNumber(value, 0);
  const safeMin = safeNumber(min, 0);
  const safeMax = safeNumber(max, 100);
  
  if (safeMax === safeMin) return 50;
  
  const normalized = ((safeValue - safeMin) / (safeMax - safeMin)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

function normalizeLowerIsBetter(value: number, min: number, max: number): number {
  // Type safety
  const safeValue = safeNumber(value, 100);
  const safeMin = safeNumber(min, 0);
  const safeMax = safeNumber(max, 100);
  
  if (safeMax === safeMin) return 50;
  
  const normalized = ((safeMax - safeValue) / (safeMax - safeMin)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

// ============================================================================
// CALIBRATED SCORING FUNCTIONS
// ============================================================================

function scoreTransmission(type: TransmissionType): number {
  // HASSAS KALİBRASYON: ZF vs Otomatik farkı artırıldı
  const scores: Record<TransmissionType, number> = {
    'ZF': 100,          // BMW ZF 8HP - sektör standardı
    'DSG': 90,          // VW/Audi DSG - hızlı ama mekatronik riski
    'Manuel': 75,       // Eski teknoloji ama güvenilir
    'Otomatik': 70,     // Genel otomatik - ZF olmayan
    'Şanzıman': 65,     // Belirsiz otomatik
    'CVT': 35,          // Hissiz sürüş - Toyota/Honda
  };
  
  const score = scores[type];
  return safeNumber(score, 50);
}

function scoreTrimLevel(trim: TrimLevel): number {
  const scores: Record<TrimLevel, number> = {
    'Gırtlak Dolu': 100,
    'Dolu': 80,
    'Orta': 50,
    'Boş': 20,
  };
  
  const score = scores[trim];
  return safeNumber(score, 50);
}

function scoreMappingTech(tech: string): number {
  // Type-safe string handling
  const safeTech = safeString(tech, 'Unknown');
  
  const scores: Record<string, number> = {
    'Lidar + AI Camera': 100,
    'Lidar + AI': 95,
    'Lidar + 3D': 90,
    'Lidar': 85,
    'V-SLAM': 80,
    '360 Camera': 75,
    'Gyroscope': 40,
  };
  
  const score = scores[safeTech];
  return safeNumber(score, 50);
}

function calculatePowerToWeight(hp: number, weight: number): number {
  const safeHP = safeNumber(hp, 0);
  const safeWeight = safeNumber(weight, 1000);
  
  if (safeWeight === 0) return 0;
  
  return safeHP / (safeWeight / 1000);
}

function calculateHillPerformance(torque: number, weight: number): number {
  const safeTorque = safeNumber(torque, 0);
  const safeWeight = safeNumber(weight, 1000);
  
  if (safeWeight === 0) return 0;
  
  const torqueToWeight = safeTorque / safeWeight;
  
  // Kalibrasyon: 0.10 = zayıf, 0.25 = mükemmel
  const score = ((torqueToWeight - 0.10) / (0.25 - 0.10)) * 100;
  return Math.max(0, Math.min(100, score));
}

function calculatePriceValue(listPrice: number, marketAverage: number): number {
  const safeList = safeNumber(listPrice, 0);
  const safeMarket = safeNumber(marketAverage, 0);
  
  if (safeMarket === 0) return 50;
  
  const difference = ((safeMarket - safeList) / safeMarket) * 100;
  
  // Fiyat avantajı: %10 indirim = +25 puan
  const score = 50 + (difference * 2.5);
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// STRATEGIC WEIGHTING (Midas Whale Standard)
// ============================================================================

export const DEFAULT_WEIGHTS: ScoringWeights = {
  liquidityAndResale: 0.25,    // En önemli - satış kolaylığı
  torqueAndPerformance: 0.20,  // Mühendislik kalitesi
  prestigeAndQuality: 0.20,    // İç mekan ve marka
  priceAdvantage: 0.15,        // Pazarlık fırsatı
  reliability: 0.10,           // Kronik arıza riski
  fuelEconomy: 0.05,           // Yakıt tasarrufu
  features: 0.05,              // Donanım seviyesi
};

// ============================================================================
// VEHICLE ANALYSIS ENGINE (Type-Safe)
// ============================================================================

export function analyzeVehicle(
  vehicle: Vehicle,
  bounds: NormalizationBounds,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): VehicleAnalysis {
  // Type-safe destructuring with fallbacks
  const engineering = vehicle.engineering || {} as any;
  const market = vehicle.market || {} as any;
  const quality = vehicle.quality || {} as any;
  const risk = vehicle.risk || {} as any;
  
  // Normalized scores with type safety
  const normalizedScores: NormalizedScores = {
    hpScore: normalizeHigherIsBetter(
      safeNumber(engineering.hp, 0),
      safeNumber(bounds.hp?.min, 0),
      safeNumber(bounds.hp?.max, 500)
    ),
    torqueScore: normalizeHigherIsBetter(
      safeNumber(engineering.torque, 0),
      safeNumber(bounds.torque?.min, 0),
      safeNumber(bounds.torque?.max, 1000)
    ),
    accelerationScore: normalizeLowerIsBetter(
      safeNumber(engineering.zeroToHundred, 15),
      safeNumber(bounds.zeroToHundred?.min, 5),
      safeNumber(bounds.zeroToHundred?.max, 20)
    ),
    weightScore: normalizeLowerIsBetter(
      safeNumber(engineering.weight, 2000),
      safeNumber(bounds.weight?.min, 1000),
      safeNumber(bounds.weight?.max, 3000)
    ),
    powerToWeightScore: normalizeHigherIsBetter(
      calculatePowerToWeight(
        safeNumber(engineering.hp, 0),
        safeNumber(engineering.weight, 1000)
      ),
      40,
      200
    ),
    transmissionScore: scoreTransmission(engineering.transmission || 'Otomatik'),
    fuelScore: normalizeLowerIsBetter(
      safeNumber(engineering.fuelConsumption, 10),
      safeNumber(bounds.fuelConsumption?.min, 3),
      safeNumber(bounds.fuelConsumption?.max, 15)
    ),
    trunkScore: normalizeHigherIsBetter(
      safeNumber(engineering.trunkCapacity, 300),
      safeNumber(bounds.trunkCapacity?.min, 200),
      safeNumber(bounds.trunkCapacity?.max, 800)
    ),
    liquidityScore: safeNumber(market.liquidityScore, 5) * 10,
    resaleScore: safeNumber(market.resaleValue, 5) * 10,
    serviceScore: safeNumber(market.serviceNetwork, 5) * 10,
    priceValueScore: calculatePriceValue(
      safeNumber(market.listPrice, 1000000),
      safeNumber(market.marketAverage, 1000000)
    ),
    materialScore: safeNumber(quality.materialQuality, 5) * 10,
    soundScore: safeNumber(quality.soundInsulation, 5) * 10,
    comfortScore: safeNumber(quality.rideComfort, 5) * 10,
    prestigeScore: safeNumber(quality.prestigeScore, 5) * 10,
    trimScore: scoreTrimLevel(quality.trimLevel || 'Orta'),
    reliabilityScore: (10 - safeNumber(risk.chronicIssueRisk, 5)) * 10,
    hillScore: calculateHillPerformance(
      safeNumber(engineering.torque, 0),
      safeNumber(engineering.weight, 1000)
    ),
  };
  
  // Category scores with weighted formulas
  const categoryScores: CategoryScores = {
    engineering: (
      normalizedScores.hpScore * 0.15 +
      normalizedScores.torqueScore * 0.25 +
      normalizedScores.accelerationScore * 0.20 +
      normalizedScores.powerToWeightScore * 0.15 +
      normalizedScores.transmissionScore * 0.10 +
      normalizedScores.fuelScore * 0.05 +
      normalizedScores.trunkScore * 0.10
    ),
    market: (
      normalizedScores.liquidityScore * 0.35 +
      normalizedScores.resaleScore * 0.35 +
      normalizedScores.serviceScore * 0.15 +
      normalizedScores.priceValueScore * 0.15
    ),
    quality: (
      normalizedScores.materialScore * 0.20 +
      normalizedScores.soundScore * 0.15 +
      normalizedScores.comfortScore * 0.20 +
      normalizedScores.prestigeScore * 0.30 +
      normalizedScores.trimScore * 0.15
    ),
    risk: (
      normalizedScores.reliabilityScore * 0.60 +
      normalizedScores.hillScore * 0.40
    ),
  };
  
  // Final score with strategic weights
  const finalScore = (
    categoryScores.market * safeNumber(weights.liquidityAndResale, 0.25) +
    categoryScores.engineering * safeNumber(weights.torqueAndPerformance, 0.20) +
    categoryScores.quality * safeNumber(weights.prestigeAndQuality, 0.20) +
    normalizedScores.priceValueScore * safeNumber(weights.priceAdvantage, 0.15) +
    categoryScores.risk * safeNumber(weights.reliability, 0.10) +
    normalizedScores.fuelScore * safeNumber(weights.fuelEconomy, 0.05) +
    normalizedScores.trimScore * safeNumber(weights.features, 0.05)
  );
  
  // Warning generation
  const warnings: string[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (normalizedScores.hillScore < 30) {
    warnings.push('⚠️ Yokuşta bayılma yapar, klima açıkken üzer.');
  }
  if (safeNumber(market.liquidityScore, 10) < 4) {
    warnings.push('🔴 Bu araç "evlat" olur; alırsın ama zor satarsın.');
  }
  if (engineering.transmission === 'CVT') {
    warnings.push('⚙️ CVT şanzıman riskli; hissiz sürüş ve masraf riski.');
  }
  if (safeNumber(risk.chronicIssueRisk, 0) > 7) {
    warnings.push('🔧 Servise abone yapar; kronik sorunlu ünite.');
  }
  
  if (safeNumber(market.resaleValue, 0) >= 8) {
    strengths.push('Paranı koruyan, 2. elde altın gibi araç.');
  }
  if (normalizedScores.transmissionScore >= 90) {
    strengths.push('Premium şanzıman - ZF/DSG kalitesi.');
  }
  if (safeNumber(market.liquidityScore, 0) >= 9) {
    strengths.push('Satış kolaylığı - her yerde alıcısı var.');
  }
  
  return {
    vehicle,
    normalizedScores,
    categoryScores,
    finalScore: safeNumber(finalScore, 0),
    warnings,
    strengths,
    weaknesses
  };
}

// ============================================================================
// VACUUM ANALYSIS ENGINE (Type-Safe)
// ============================================================================

export function analyzeVacuum(
  vacuum: RobotVacuum,
  bounds: VacuumNormalizationBounds
): VacuumAnalysis {
  // Type-safe destructuring
  const specs = vacuum.specs || {} as any;
  const market = vacuum.market || {} as any;
  const risk = vacuum.risk || {} as any;
  
  const normalizedScores: VacuumNormalizedScores = {
    suctionScore: normalizeHigherIsBetter(
      safeNumber(specs.suctionPower, 0),
      safeNumber(bounds.suctionPower?.min, 2000),
      safeNumber(bounds.suctionPower?.max, 12000)
    ),
    batteryScore: normalizeHigherIsBetter(
      safeNumber(specs.batteryCapacity, 0),
      safeNumber(bounds.batteryCapacity?.min, 2600),
      safeNumber(bounds.batteryCapacity?.max, 6400)
    ),
    noiseScore: normalizeLowerIsBetter(
      safeNumber(specs.noiseLevel, 70),
      safeNumber(bounds.noiseLevel?.min, 60),
      safeNumber(bounds.noiseLevel?.max, 80)
    ),
    dustCapacityScore: normalizeHigherIsBetter(
      safeNumber(specs.dustCapacity, 0),
      safeNumber(bounds.dustCapacity?.min, 0.2),
      safeNumber(bounds.dustCapacity?.max, 0.6)
    ),
    mappingScore: scoreMappingTech(safeString(specs.mappingTech, 'Gyroscope')),
    mopScore: safeBoolean(specs.mopFeature, false) ? 100 : 0,
    liquidityScore: safeNumber(market.liquidityScore, 5) * 10,
    resaleScore: safeNumber(market.resaleValue, 5) * 10,
    serviceScore: safeNumber(market.serviceNetwork, 5) * 10,
    reliabilityScore: (10 - safeNumber(risk.chronicIssueRisk, 5)) * 10,
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
  
  if (normalizedScores.suctionScore < 30) {
    warnings.push('⚠️ Düşük emiş gücü; halılarda yetersiz kalabilir.');
  }
  if (specs.mappingTech === 'Gyroscope') {
    warnings.push('🗺️ Navigasyon primitif; evi ezberlemiyor, her seferinde keşfediyor.');
  }
  if (safeNumber(market.liquidityScore, 10) < 5) {
    warnings.push('🔴 Az bilinen marka; satış zorluğu yaşarsınız.');
  }
  if (safeNumber(risk.chronicIssueRisk, 0) > 6) {
    warnings.push('🔧 Yazılım güncellemesi beklentili; haritalama hataları biliniyor.');
  }
  
  if (normalizedScores.suctionScore >= 80) {
    strengths.push('Halı ve kilimde derin temizlik gücü');
  }
  if (normalizedScores.mappingScore >= 90) {
    strengths.push('Yapay zeka destekli akıllı navigasyon');
  }
  if (safeNumber(market.resaleValue, 0) >= 8) {
    strengths.push('İkinci el değer koruması yüksek');
  }
  if (specs.mopFeature) {
    strengths.push('Paspas özelliği ile ıslak temizlik');
  }
  
  if (normalizedScores.batteryScore < 40) {
    weaknesses.push('Düşük batarya kapasitesi');
  }
  if (normalizedScores.noiseScore < 40) {
    weaknesses.push('Yüksek gürültü seviyesi');
  }
  if (!specs.mopFeature) {
    weaknesses.push('Paspas özelliği yok');
  }
  
  return {
    vacuum,
    normalizedScores,
    categoryScores,
    finalScore: safeNumber(finalScore, 0),
    warnings,
    strengths,
    weaknesses
  };
}

// ============================================================================
// COMPARISON ENGINE - VEHICLES (Type-Safe)
// ============================================================================

export function compareVehicles(
  vehicle1: Vehicle,
  vehicle2: Vehicle,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ComparisonResult {
  // Type-safe bounds calculation
  const bounds: NormalizationBounds = {
    hp: {
      min: Math.min(
        safeNumber(vehicle1.engineering?.hp, 0),
        safeNumber(vehicle2.engineering?.hp, 0)
      ),
      max: Math.max(
        safeNumber(vehicle1.engineering?.hp, 500),
        safeNumber(vehicle2.engineering?.hp, 500)
      )
    },
    torque: {
      min: Math.min(
        safeNumber(vehicle1.engineering?.torque, 0),
        safeNumber(vehicle2.engineering?.torque, 0)
      ),
      max: Math.max(
        safeNumber(vehicle1.engineering?.torque, 1000),
        safeNumber(vehicle2.engineering?.torque, 1000)
      )
    },
    zeroToHundred: {
      min: Math.min(
        safeNumber(vehicle1.engineering?.zeroToHundred, 5),
        safeNumber(vehicle2.engineering?.zeroToHundred, 5)
      ),
      max: Math.max(
        safeNumber(vehicle1.engineering?.zeroToHundred, 20),
        safeNumber(vehicle2.engineering?.zeroToHundred, 20)
      )
    },
    weight: {
      min: Math.min(
        safeNumber(vehicle1.engineering?.weight, 1000),
        safeNumber(vehicle2.engineering?.weight, 1000)
      ),
      max: Math.max(
        safeNumber(vehicle1.engineering?.weight, 3000),
        safeNumber(vehicle2.engineering?.weight, 3000)
      )
    },
    fuelConsumption: {
      min: Math.min(
        safeNumber(vehicle1.engineering?.fuelConsumption, 3),
        safeNumber(vehicle2.engineering?.fuelConsumption, 3)
      ),
      max: Math.max(
        safeNumber(vehicle1.engineering?.fuelConsumption, 15),
        safeNumber(vehicle2.engineering?.fuelConsumption, 15)
      )
    },
    trunkCapacity: {
      min: Math.min(
        safeNumber(vehicle1.engineering?.trunkCapacity, 200),
        safeNumber(vehicle2.engineering?.trunkCapacity, 200)
      ),
      max: Math.max(
        safeNumber(vehicle1.engineering?.trunkCapacity, 800),
        safeNumber(vehicle2.engineering?.trunkCapacity, 800)
      )
    },
    engineDisplacement: {
      min: Math.min(
        safeNumber(vehicle1.engineering?.engineDisplacement, 0),
        safeNumber(vehicle2.engineering?.engineDisplacement, 0)
      ),
      max: Math.max(
        safeNumber(vehicle1.engineering?.engineDisplacement, 5000),
        safeNumber(vehicle2.engineering?.engineDisplacement, 5000)
      )
    },
    listPrice: {
      min: Math.min(
        safeNumber(vehicle1.market?.listPrice, 500000),
        safeNumber(vehicle2.market?.listPrice, 500000)
      ),
      max: Math.max(
        safeNumber(vehicle1.market?.listPrice, 10000000),
        safeNumber(vehicle2.market?.listPrice, 10000000)
      )
    },
    marketAverage: {
      min: Math.min(
        safeNumber(vehicle1.market?.marketAverage, 500000),
        safeNumber(vehicle2.market?.marketAverage, 500000)
      ),
      max: Math.max(
        safeNumber(vehicle1.market?.marketAverage, 10000000),
        safeNumber(vehicle2.market?.marketAverage, 10000000)
      )
    },
  };
  
  const analysis1 = analyzeVehicle(vehicle1, bounds, weights);
  const analysis2 = analyzeVehicle(vehicle2, bounds, weights);
  
  const scoreDifference = Math.abs(
    safeNumber(analysis1.finalScore, 0) - safeNumber(analysis2.finalScore, 0)
  );
  
  let winner: 'vehicle1' | 'vehicle2';
  if (scoreDifference < 3) {
    // Tie-breaker: liquidity
    winner = safeNumber(analysis1.vehicle.market?.liquidityScore, 0) >= 
             safeNumber(analysis2.vehicle.market?.liquidityScore, 0) 
             ? 'vehicle1' : 'vehicle2';
  } else {
    winner = safeNumber(analysis1.finalScore, 0) > safeNumber(analysis2.finalScore, 0) 
             ? 'vehicle1' : 'vehicle2';
  }
  
  const winnerAnal = winner === 'vehicle1' ? analysis1 : analysis2;
  const loserAnal = winner === 'vehicle1' ? analysis2 : analysis1;
  
  let verdict = `🏆 KESİN KARAR: ${winnerAnal.vehicle.name}`;
  const reasons: string[] = [];
  
  if (scoreDifference < 3) {
    reasons.push("Başa baş mücadelede piyasa hızı ve likidite farkıyla rakibini eliyor.");
  }
  if (safeNumber(winnerAnal.categoryScores.engineering, 0) > 
      safeNumber(loserAnal.categoryScores.engineering, 0) + 5) {
    reasons.push("Mühendislik ve tork verimliliği ile rakibini eziyor.");
  }
  if (safeNumber(winnerAnal.categoryScores.market, 0) > 
      safeNumber(loserAnal.categoryScores.market, 0) + 5) {
    reasons.push("Paranızı en iyi koruyacak, satış riski olmayan seçenek.");
  }
  if (safeNumber(winnerAnal.categoryScores.risk, 0) > 
      safeNumber(loserAnal.categoryScores.risk, 0) + 5) {
    reasons.push("Kronik arıza riski olmayan, güvenli liman.");
  }
  
  verdict += `\n\nANALİZ: ${reasons.join(' ')} Bu bütçede macera aramanın anlamı yok.`;
  
  return {
    vehicle1: analysis1,
    vehicle2: analysis2,
    winner,
    verdict,
    detailedReasons: [...reasons, ...winnerAnal.strengths.slice(0, 2)],
    scoreDifference: safeNumber(scoreDifference, 0),
  };
}

// ============================================================================
// COMPARISON ENGINE - VACUUMS (Type-Safe)
// ============================================================================

export function compareVacuums(v1: RobotVacuum, v2: RobotVacuum) {
  const bounds: VacuumNormalizationBounds = {
    suctionPower: {
      min: Math.min(
        safeNumber(v1.specs?.suctionPower, 2000),
        safeNumber(v2.specs?.suctionPower, 2000)
      ),
      max: Math.max(
        safeNumber(v1.specs?.suctionPower, 12000),
        safeNumber(v2.specs?.suctionPower, 12000)
      )
    },
    batteryCapacity: {
      min: Math.min(
        safeNumber(v1.specs?.batteryCapacity, 2600),
        safeNumber(v2.specs?.batteryCapacity, 2600)
      ),
      max: Math.max(
        safeNumber(v1.specs?.batteryCapacity, 6400),
        safeNumber(v2.specs?.batteryCapacity, 6400)
      )
    },
    noiseLevel: {
      min: Math.min(
        safeNumber(v1.specs?.noiseLevel, 60),
        safeNumber(v2.specs?.noiseLevel, 60)
      ),
      max: Math.max(
        safeNumber(v1.specs?.noiseLevel, 80),
        safeNumber(v2.specs?.noiseLevel, 80)
      )
    },
    dustCapacity: {
      min: Math.min(
        safeNumber(v1.specs?.dustCapacity, 0.2),
        safeNumber(v2.specs?.dustCapacity, 0.2)
      ),
      max: Math.max(
        safeNumber(v1.specs?.dustCapacity, 0.6),
        safeNumber(v2.specs?.dustCapacity, 0.6)
      )
    },
    listPrice: {
      min: Math.min(
        safeNumber(v1.market?.listPrice, 10000),
        safeNumber(v2.market?.listPrice, 10000)
      ),
      max: Math.max(
        safeNumber(v1.market?.listPrice, 100000),
        safeNumber(v2.market?.listPrice, 100000)
      )
    },
  };
  
  const analysis1 = analyzeVacuum(v1, bounds);
  const analysis2 = analyzeVacuum(v2, bounds);
  
  const scoreDifference = Math.abs(
    safeNumber(analysis1.finalScore, 0) - safeNumber(analysis2.finalScore, 0)
  );
  
  let winner: 'vehicle1' | 'vehicle2';
  if (scoreDifference < 3) {
    winner = safeNumber(analysis1.vacuum.market?.liquidityScore, 0) >= 
             safeNumber(analysis2.vacuum.market?.liquidityScore, 0) 
             ? 'vehicle1' : 'vehicle2';
  } else {
    winner = safeNumber(analysis1.finalScore, 0) > safeNumber(analysis2.finalScore, 0) 
             ? 'vehicle1' : 'vehicle2';
  }
  
  const winnerAnal = winner === 'vehicle1' ? analysis1 : analysis2;
  const loserAnal = winner === 'vehicle1' ? analysis2 : analysis1;
  
  let verdict = `🏆 KESİN KARAR: ${winnerAnal.vacuum.name}`;
  const reasons: string[] = [];
  
  if (scoreDifference < 3) {
    reasons.push("Başa baş mücadelede marka bilinirliği ve satış kolaylığı farkıyla öne çıkıyor.");
  }
  if (safeNumber(winnerAnal.categoryScores.performance, 0) > 
      safeNumber(loserAnal.categoryScores.performance, 0) + 5) {
    reasons.push(
      `Emiş gücü (${safeNumber(winnerAnal.vacuum.specs?.suctionPower, 0)}Pa) ve batarya performansı ile rakibini eziyor.`
    );
  }
  if (safeNumber(winnerAnal.categoryScores.intelligence, 0) > 
      safeNumber(loserAnal.categoryScores.intelligence, 0) + 5) {
    reasons.push(
      `${safeString(winnerAnal.vacuum.specs?.mappingTech, 'LiDAR')} teknolojisi ile çok daha akıllı navigasyon.`
    );
  }
  if (safeNumber(winnerAnal.categoryScores.market, 0) > 
      safeNumber(loserAnal.categoryScores.market, 0) + 5) {
    reasons.push("Piyasa değeri koruma ve satış kolaylığı garantili.");
  }
  if (safeNumber(winnerAnal.categoryScores.reliability, 0) > 
      safeNumber(loserAnal.categoryScores.reliability, 0) + 5) {
    reasons.push("Yazılım stabilitesi kanıtlanmış, haritalama hatası yapmayan sistem.");
  }
  
  verdict += `\n\nANALİZ: ${reasons.join(' ')} Bu bütçede deneme yanılmaya gerek yok.`;
  
  return {
    vehicle1: analysis1,
    vehicle2: analysis2,
    winner,
    verdict,
    detailedReasons: [...reasons, ...winnerAnal.strengths.slice(0, 2)],
    scoreDifference: safeNumber(scoreDifference, 0),
  };
}

// ============================================================================
// HELPER FUNCTIONS (Type-Safe)
// ============================================================================

export function formatCurrency(amount: number): string {
  const safeAmount = safeNumber(amount, 0);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(safeAmount);
}

export function getScoreColor(score: number): string {
  const safeScore = safeNumber(score, 0);
  
  if (safeScore >= 80) return 'text-emerald-400';
  if (safeScore >= 60) return 'text-yellow-400';
  if (safeScore >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreLabel(score: number): string {
  const safeScore = safeNumber(score, 0);
  
  if (safeScore >= 90) return 'Mükemmel';
  if (safeScore >= 75) return 'İyi';
  if (safeScore >= 60) return 'Orta';
  return 'Zayıf';
}