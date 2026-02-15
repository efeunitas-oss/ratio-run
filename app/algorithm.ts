import {
  Vehicle,
  VehicleAnalysis,
  RobotVacuum,
  VacuumAnalysis,
  GenericProduct,
  GenericAnalysis,
  ComparisonResult,
} from './types';

// ============================================================================
// VEHICLE COMPARISON - SIMPLIFIED
// ============================================================================

export function compareVehicles(v1: Vehicle, v2: Vehicle): ComparisonResult {
  const score1 = calculateVehicleScore(v1);
  const score2 = calculateVehicleScore(v2);

  const analysis1: VehicleAnalysis = {
    vehicle: v1,
    normalizedScores: {} as any,
    categoryScores: {
      engineering: score1.engineering,
      market: score1.market,
      quality: score1.quality,
      risk: score1.risk,
    },
    finalScore: score1.final,
    warnings: score1.warnings,
    strengths: score1.strengths,
    weaknesses: [],
  };

  const analysis2: VehicleAnalysis = {
    vehicle: v2,
    normalizedScores: {} as any,
    categoryScores: {
      engineering: score2.engineering,
      market: score2.market,
      quality: score2.quality,
      risk: score2.risk,
    },
    finalScore: score2.final,
    warnings: score2.warnings,
    strengths: score2.strengths,
    weaknesses: [],
  };

  return {
    product1: analysis1,
    product2: analysis2,
    winner: score1.final > score2.final ? 'product1' : 'product2',
    verdict: `${score1.final > score2.final ? v1.name : v2.name} daha iyi bir seçim.`,
  };
}

function calculateVehicleScore(v: Vehicle) {
  const engineering = (v.engineering.hp / 10 + v.engineering.torque / 10) / 2;
  const market = (v.market.liquidityScore || 7) * 10;
  const quality = (v.quality.rideComfort || 7) * 10;
  const risk = 100 - (v.risk?.chronicIssueRisk || 3) * 10;

  return {
    engineering: Math.min(engineering, 100),
    market: Math.min(market, 100),
    quality: Math.min(quality, 100),
    risk: Math.min(risk, 100),
    final: (engineering + market + quality + risk) / 4,
    warnings: v.market.listPrice > 3000000 ? ['Çok pahalı'] : [],
    strengths: [`${v.brand} kalitesi`, `${v.engineering.hp} HP güç`],
  };
}

// ============================================================================
// VACUUM COMPARISON - SIMPLIFIED
// ============================================================================

export function compareVacuums(v1: RobotVacuum, v2: RobotVacuum): ComparisonResult {
  const score1 = calculateVacuumScore(v1);
  const score2 = calculateVacuumScore(v2);

  const analysis1: VacuumAnalysis = {
    vacuum: v1,
    normalizedScores: {} as any,
    categoryScores: {
      performance: score1.performance,
      intelligence: score1.intelligence,
      market: score1.market,
      reliability: score1.reliability,
    },
    finalScore: score1.final,
    warnings: score1.warnings,
    strengths: score1.strengths,
    weaknesses: [],
  };

  const analysis2: VacuumAnalysis = {
    vacuum: v2,
    normalizedScores: {} as any,
    categoryScores: {
      performance: score2.performance,
      intelligence: score2.intelligence,
      market: score2.market,
      reliability: score2.reliability,
    },
    finalScore: score2.final,
    warnings: score2.warnings,
    strengths: score2.strengths,
    weaknesses: [],
  };

  return {
    product1: analysis1,
    product2: analysis2,
    winner: score1.final > score2.final ? 'product1' : 'product2',
    verdict: `${score1.final > score2.final ? v1.name : v2.name} daha iyi bir seçim.`,
  };
}

function calculateVacuumScore(v: RobotVacuum) {
  const performance = (v.specs.suctionPower / 100 + v.specs.batteryCapacity / 100) / 2;
  const intelligence = v.specs.mappingTech === 'Lidar' ? 90 : 70;
  const market = (v.market.liquidityScore || 7) * 10;
  const reliability = 100 - (v.risk?.chronicIssueRisk || 3) * 10;

  return {
    performance: Math.min(performance, 100),
    intelligence,
    market: Math.min(market, 100),
    reliability: Math.min(reliability, 100),
    final: (performance + intelligence + market + reliability) / 4,
    warnings: v.specs.noiseLevel > 70 ? ['Gürültülü'] : [],
    strengths: [`${v.specs.suctionPower}Pa emiş`, v.specs.mappingTech],
  };
}

// ============================================================================
// GENERIC COMPARISON - SIMPLIFIED
// ============================================================================

export function compareGeneric(p1: GenericProduct, p2: GenericProduct): ComparisonResult {
  const score1 = calculateGenericScore(p1);
  const score2 = calculateGenericScore(p2);

  const analysis1: GenericAnalysis = {
    product: p1,
    categoryScores: {
      performance: score1.performance,
      quality: score1.quality,
      market: score1.market,
      value: score1.value,
    },
    finalScore: score1.final,
    warnings: score1.warnings,
    strengths: score1.strengths,
    weaknesses: [],
  };

  const analysis2: GenericAnalysis = {
    product: p2,
    categoryScores: {
      performance: score2.performance,
      quality: score2.quality,
      market: score2.market,
      value: score2.value,
    },
    finalScore: score2.final,
    warnings: score2.warnings,
    strengths: score2.strengths,
    weaknesses: [],
  };

  return {
    product1: analysis1,
    product2: analysis2,
    winner: score1.final > score2.final ? 'product1' : 'product2',
    verdict: `${score1.final > score2.final ? p1.name : p2.name} daha iyi bir seçim.`,
  };
}

function calculateGenericScore(p: GenericProduct) {
  const specs = p.specifications || {};
  const performance = (specs.performance_score || 7) * 10;
  const quality = (specs.quality_score || 7) * 10;
  const market = (p.market.liquidityScore || 7) * 10;
  const value = (specs.value_score || 7) * 10;

  return {
    performance: Math.min(performance, 100),
    quality: Math.min(quality, 100),
    market: Math.min(market, 100),
    value: Math.min(value, 100),
    final: (performance + quality + market + value) / 4,
    warnings: p.market.listPrice > 50000 ? ['Pahalı'] : [],
    strengths: [`${p.brand} kalitesi`],
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(value);
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Mükemmel';
  if (score >= 75) return 'Çok İyi';
  if (score >= 60) return 'İyi';
  if (score >= 50) return 'Orta';
  return 'Zayıf';
}