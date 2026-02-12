// RATIO.RUN - Type Definitions
// Sistemin Anayasası: Araç ve Süpürge Tanımları

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  segment: string;
  affiliateUrl?: string;
  engineering: {
    hp: number;
    torque: number;
    zeroToHundred: number;
    weight: number;
    transmission: TransmissionType;
    fuelConsumption: number;
    trunkCapacity: number;
    engineDisplacement: number;
  };
  market: {
    listPrice: number;
    marketAverage: number;
    liquidityScore: number;
    resaleValue: number;
    serviceNetwork: number;
  };
  quality: {
    materialQuality: number;
    soundInsulation: number;
    rideComfort: number;
    prestigeScore: number;
    trimLevel: TrimLevel;
  };
  risk: {
    chronicIssueRisk: number;
  };
}

export interface RobotVacuum {
  id: string;
  name: string;
  brand: string;
  category: 'ROBOT_VACUUM';
  affiliateUrl?: string;
  specs: {
    suctionPower: number;
    batteryCapacity: number;
    noiseLevel: number;
    dustCapacity: number;
    mappingTech: string;
    mopFeature: boolean;
  };
  market: {
    listPrice: number;
    marketAverage: number;
    liquidityScore: number;
    resaleValue: number;
    serviceNetwork: number;
  };
  risk: {
    chronicIssueRisk: number;
  };
}

// ============================================================================
// TYPE UNIONS & GUARDS (Production Safety)
// ============================================================================

export type Product = Vehicle | RobotVacuum;

// Type Guard Functions
export function isVehicle(product: Product): product is Vehicle {
  return 'engineering' in product;
}

export function isRobotVacuum(product: Product): product is RobotVacuum {
  return 'specs' in product;
}

export type TransmissionType = 'Manuel' | 'Otomatik' | 'DSG' | 'CVT' | 'ZF' | 'Şanzıman';
export type TrimLevel = 'Boş' | 'Orta' | 'Dolu' | 'Gırtlak Dolu';

export interface VehicleAnalysis {
  vehicle: Vehicle;
  normalizedScores: NormalizedScores;
  categoryScores: CategoryScores;
  finalScore: number;
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface NormalizedScores {
  hpScore: number;
  torqueScore: number;
  accelerationScore: number;
  weightScore: number;
  powerToWeightScore: number;
  transmissionScore: number;
  fuelScore: number;
  trunkScore: number;
  liquidityScore: number;
  resaleScore: number;
  serviceScore: number;
  priceValueScore: number;
  materialScore: number;
  soundScore: number;
  comfortScore: number;
  prestigeScore: number;
  trimScore: number;
  reliabilityScore: number;
  hillScore: number;
}

export interface CategoryScores {
  engineering: number;
  market: number;
  quality: number;
  risk: number;
}

export interface ComparisonResult {
  vehicle1: VehicleAnalysis;
  vehicle2: VehicleAnalysis;
  winner: 'vehicle1' | 'vehicle2';
  verdict: string;
  detailedReasons: string[];
  scoreDifference: number;
  segmentWarning?: string;
}

export interface ScoringWeights {
  liquidityAndResale: number;
  torqueAndPerformance: number;
  prestigeAndQuality: number;
  priceAdvantage: number;
  reliability: number;
  fuelEconomy: number;
  features: number;
}

export interface NormalizationBounds {
  hp: { min: number; max: number };
  torque: { min: number; max: number };
  zeroToHundred: { min: number; max: number };
  weight: { min: number; max: number };
  fuelConsumption: { min: number; max: number };
  trunkCapacity: { min: number; max: number };
  engineDisplacement: { min: number; max: number };
  listPrice: { min: number; max: number };
  marketAverage: { min: number; max: number };
}