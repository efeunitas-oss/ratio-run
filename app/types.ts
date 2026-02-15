// ============================================================================
// RATIO.RUN - UNIVERSAL TYPE SYSTEM
// ============================================================================

// Base Product Interface - Tüm kategoriler için ortak
export interface BaseProduct {
  id: string;
  category: string;
  name: string;
  brand: string;
  sourceUrl: string;
  verificationStatus?: string;
  affiliateLinks?: AffiliateLink[];
  market: Market;
  risk?: Risk;
  documentedStrengths?: string[];
  documentedWeaknesses?: string[];
}

export interface AffiliateLink {
  provider: string;
  url: string;
  price?: string;
  isFeatured?: boolean;
}

export interface Market {
  listPrice: number;
  marketAverage?: number;
  liquidityScore?: number;
  resaleValue?: number;
  serviceNetwork?: number;
}

export interface Risk {
  chronicIssueRisk?: number;
}

// ============================================================================
// VEHICLE TYPES
// ============================================================================

export interface Vehicle extends BaseProduct {
  category: 'VEHICLE';
  model: string;
  year: number;
  segment: string;
  engineering: Engineering;
  quality: Quality;
}

export interface Engineering {
  hp: number;
  torque: number;
  zeroToHundred: number;
  weight: number;
  transmission: string;
  fuelConsumption: number;
  trunkCapacity: number;
  engineDisplacement?: number;
}

export interface Quality {
  materialQuality: number;
  soundInsulation: number;
  rideComfort: number;
  prestigeScore: number;
  trimLevel: string;
}

export interface VehicleAnalysis {
  vehicle: Vehicle;
  normalizedScores: VehicleNormalizedScores;
  categoryScores: VehicleCategoryScores;
  finalScore: number;
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface VehicleNormalizedScores {
  hpScore: number;
  torqueScore: number;
  accelerationScore: number;
  weightScore: number;
  transmissionScore: number;
  fuelScore: number;
  trunkScore: number;
  liquidityScore: number;
  resaleScore: number;
  serviceScore: number;
  materialScore: number;
  soundScore: number;
  comfortScore: number;
  prestigeScore: number;
}

export interface VehicleCategoryScores {
  engineering: number;
  market: number;
  quality: number;
  risk: number;
}

// ============================================================================
// ROBOT VACUUM TYPES
// ============================================================================

export interface RobotVacuum extends BaseProduct {
  category: 'ROBOT_VACUUM';
  specs: VacuumSpecs;
}

export interface VacuumSpecs {
  suctionPower: number;
  batteryCapacity: number;
  noiseLevel: number;
  dustCapacity: number;
  mappingTech: string;
  mopFeature: boolean;
}

export interface VacuumAnalysis {
  vacuum: RobotVacuum;
  normalizedScores: VacuumNormalizedScores;
  categoryScores: VacuumCategoryScores;
  finalScore: number;
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface VacuumNormalizedScores {
  suctionScore: number;
  batteryScore: number;
  noiseScore: number;
  dustCapacityScore: number;
  mappingScore: number;
  mopScore: number;
  liquidityScore: number;
  resaleScore: number;
  serviceScore: number;
}

export interface VacuumCategoryScores {
  performance: number;
  intelligence: number;
  market: number;
  reliability: number;
}

// ============================================================================
// GENERIC PRODUCT TYPES (Laptop, Phone, Headphone, Watch)
// ============================================================================

export interface GenericProduct extends BaseProduct {
  category: 'LAPTOP' | 'PHONE' | 'HEADPHONE' | 'WATCH' | 'TABLET' | 'TV';
  specifications: Record<string, any>;
}

export interface GenericAnalysis {
  product: GenericProduct;
  categoryScores: Record<string, number>;
  finalScore: number;
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
}

// ============================================================================
// COMPARISON RESULT TYPES
// ============================================================================

export interface ComparisonResult {
  product1: any;
  product2: any;
  winner: string;
  verdict: string;
}

// Legacy aliases
export type Product = Vehicle | RobotVacuum | GenericProduct;
export type { VehicleAnalysis as VehicleComparisonResult };
export type { VacuumAnalysis as VacuumComparisonResult };