// RATIO.RUN - Type Definitions
// Complete type system for dual-category comparison platform
// [UPDATED: Affiliate Links Support]

// ============================================================================
// AFFILIATE LINK SYSTEM
// ============================================================================

export interface AffiliateLink {
  provider: 'Amazon' | 'Trendyol' | 'Hepsiburada' | 'Resmi Site';
  url: string;
  price?: string;
  isFeatured?: boolean; // En yüksek komisyonlu link (genelde Amazon)
}

// ============================================================================
// CORE PRODUCT TYPES
// ============================================================================

export type Category = 'VEHICLE' | 'ROBOT_VACUUM';
export type TransmissionType = 'ZF' | 'DSG' | 'Manuel' | 'Otomatik' | 'Şanzıman' | 'CVT';
export type TrimLevel = 'Gırtlak Dolu' | 'Dolu' | 'Orta' | 'Boş';
export type VerificationStatus = 'verified' | 'pending' | 'unverified';

// ============================================================================
// VEHICLE TYPES
// ============================================================================

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  segment: string;
  category?: 'VEHICLE';
  sourceUrl?: string;
  verificationStatus?: VerificationStatus;
  affiliateUrl?: string; // DEPRECATED - kullanma artık
  affiliateLinks?: AffiliateLink[]; // YENİ: Çoklu link desteği
  engineering: VehicleEngineering;
  market: MarketData;
  quality: VehicleQuality;
  risk: RiskData;
  documentedStrengths?: string[];
  documentedWeaknesses?: string[];
}

export interface VehicleEngineering {
  hp: number;
  torque: number;
  zeroToHundred: number;
  weight: number;
  transmission: TransmissionType;
  fuelConsumption: number;
  trunkCapacity: number;
  engineDisplacement: number;
}

export interface VehicleQuality {
  materialQuality: number;
  soundInsulation: number;
  rideComfort: number;
  prestigeScore: number;
  trimLevel: TrimLevel;
}

// ============================================================================
// ROBOT VACUUM TYPES
// ============================================================================

export interface RobotVacuum {
  id: string;
  name: string;
  brand: string;
  category: 'ROBOT_VACUUM';
  sourceUrl?: string;
  verificationStatus?: VerificationStatus;
  affiliateUrl?: string; // DEPRECATED - kullanma artık
  affiliateLinks?: AffiliateLink[]; // YENİ: Çoklu link desteği
  specs: VacuumSpecs;
  market: MarketData;
  risk: RiskData;
  documentedStrengths?: string[];
  documentedWeaknesses?: string[];
}

export interface VacuumSpecs {
  suctionPower: number;
  batteryCapacity: number;
  noiseLevel: number;
  dustCapacity: number;
  mappingTech: string;
  mopFeature: boolean;
}

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface MarketData {
  listPrice: number;
  marketAverage: number;
  liquidityScore: number;
  resaleValue: number;
  serviceNetwork: number;
}

export interface RiskData {
  chronicIssueRisk: number;
}

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

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
  reliabilityScore: number;
}

export interface VacuumCategoryScores {
  performance: number;
  intelligence: number;
  market: number;
  reliability: number;
}

// ============================================================================
// COMPARISON RESULT TYPE
// ============================================================================

export interface ComparisonResult {
  vehicle1: VehicleAnalysis | VacuumAnalysis;
  vehicle2: VehicleAnalysis | VacuumAnalysis;
  winner: 'vehicle1' | 'vehicle2';
  verdict: string;
  detailedReasons: string[];
  scoreDifference: number;
}

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

export interface ScoringWeights {
  liquidityAndResale: number;
  torqueAndPerformance: number;
  prestigeAndQuality: number;
  priceAdvantage: number;
  reliability: number;
  fuelEconomy: number;
  features: number;
}

// ============================================================================
// NORMALIZATION BOUNDS
// ============================================================================

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

export interface VacuumNormalizationBounds {
  suctionPower: { min: number; max: number };
  batteryCapacity: { min: number; max: number };
  noiseLevel: { min: number; max: number };
  dustCapacity: { min: number; max: number };
  listPrice: { min: number; max: number };
}

// ============================================================================
// UNION TYPES & TYPE GUARDS
// ============================================================================

export type Product = Vehicle | RobotVacuum;
export type Analysis = VehicleAnalysis | VacuumAnalysis;

// Type guard functions
export function isVehicle(product: Product): product is Vehicle {
  return !('category' in product) || product.category !== 'ROBOT_VACUUM';
}

export function isRobotVacuum(product: Product): product is RobotVacuum {
  return 'category' in product && product.category === 'ROBOT_VACUUM';
}

export function isVehicleAnalysis(analysis: Analysis): analysis is VehicleAnalysis {
  return 'vehicle' in analysis;
}

export function isVacuumAnalysis(analysis: Analysis): analysis is VacuumAnalysis {
  return 'vacuum' in analysis;
}