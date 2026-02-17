// ============================================================================
// RATIO.RUN - TEK TİP DOSYASI
// ============================================================================

// ─── Supabase Tipleri ─────────────────────────────────────────────────────────
export interface Product {
  id: string;
  category_id: string;
  title: string | null;
  asin: string;
  price: number;
  currency?: string;
  rating?: number;
  reviews_count?: number;
  image_url?: string | null;
  url?: string;
  overall_score?: number;
  performance_score?: number;
  battery_score?: number;
  camera_score?: number;
  display_score?: number;
  build_quality_score?: number;
  specifications?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at: string;
}

export interface SuggestedProduct {
  product: Product;
  ratio_score: number;
  match_reason: string;
}

// ─── Ratio Engine Tipleri ─────────────────────────────────────────────────────
export interface RatioScore {
  raw_score: number;
  normalized_score: number;
  breakdown: {
    weighted_performance: number;
    price_factor: number;
    individual_scores: Record<string, number>;
  };
}

export interface RatioComparisonResult {
  product_a: Product;
  product_b: Product;
  ratio_a: RatioScore;
  ratio_b: RatioScore;
  winner: 'a' | 'b' | 'tie';
  advantage_percentage: number;
  is_crushing_victory: boolean;
  recommendation: string;
}

export interface SpecConfig {
  category: string;
  display_name: string;
  columns: SpecColumn[];
  weights: ScoreWeights;
  brand_colors: Record<string, BrandColor>;
}

export interface SpecColumn {
  key: string;
  label: string;
  unit?: string;
  format?: 'number' | 'text' | 'percentage' | 'currency';
  parse_from_title?: RegExp;
  priority: 'high' | 'medium' | 'low';
}

export interface ScoreWeights {
  [key: string]: number | undefined;
}

export interface BrandColor {
  primary: string;
  glow: string;
  accent: string;
}

// ─── Algorithm Tipleri (algorithm.ts için) ────────────────────────────────────
export interface Vehicle extends Product {
  brand: string;
  name: string;
  category: 'VEHICLE';
  engineering: { hp: number; torque: number; [key: string]: any };
  market: { listPrice: number; liquidityScore?: number; [key: string]: any };
  quality: { rideComfort?: number; [key: string]: any };
  risk?: { chronicIssueRisk?: number; [key: string]: any };
}

export interface RobotVacuum extends Product {
  brand: string;
  name: string;
  category: 'ROBOT_VACUUM';
  specs: { suctionPower: number; batteryCapacity: number; mappingTech: string; noiseLevel: number; [key: string]: any };
  market: { listPrice: number; liquidityScore?: number; [key: string]: any };
  risk?: { chronicIssueRisk?: number; [key: string]: any };
}

export interface GenericProduct extends Product {
  brand: string;
  name: string;
  market: { listPrice: number; liquidityScore?: number; [key: string]: any };
}

export interface VehicleAnalysis {
  vehicle: Vehicle;
  normalizedScores: Record<string, number>;
  categoryScores: Record<string, number>;
  finalScore: number;
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface VacuumAnalysis {
  vacuum: RobotVacuum;
  normalizedScores: Record<string, number>;
  categoryScores: Record<string, number>;
  finalScore: number;
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface GenericAnalysis {
  product: GenericProduct;
  categoryScores: Record<string, number>;
  finalScore: number;
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
}

// algorithm.ts'in döndürdüğü tip
export interface ComparisonResult {
  product1: VehicleAnalysis | VacuumAnalysis | GenericAnalysis;
  product2: VehicleAnalysis | VacuumAnalysis | GenericAnalysis;
  winner: 'product1' | 'product2';
  verdict: string;
}
