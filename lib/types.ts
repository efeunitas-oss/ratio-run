// ============================================================================
// RATIO.RUN — TYPES v2.1 (FINAL)
// RatioRunApp.tsx ve TechSpecsTable.tsx ile tam uyumlu
// ============================================================================

// ─── Gerçek Supabase DB Şeması ────────────────────────────────────────────────
export interface Product {
  id: string;
  category_id: string;

  // DB kolonları (webhook'un yazdığı isimler)
  name: string;
  brand: string;
  model: string;

  price: number | null;
  currency: string;

  image_url: string | null;
  source_url: string;
  source_name: string;

  // Tüm skorlar + teknik özellikler burada
  specifications: Record<string, any> | null;

  comparison_score?: number | null;
  is_active: boolean;
  stock_status: string;

  scraped_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  display_order?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SuggestedProduct {
  product: Product;
  ratio_score: number;
  match_reason: string;
}

// ─── Ratio Engine Tipleri ──────────────────────────────────────────────────────
export interface RatioScore {
  raw_score: number;
  normalized_score: number;
  breakdown: {
    weighted_performance: number;
    price_factor: number;
    individual_scores: Record<string, number>;
    explanations: string[];
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

// ─── Algorithm Tipleri ─────────────────────────────────────────────────────────
// NOT: Bu tipler algorithm.ts tarafından kullanılır.
// DB'den gelen Product convertToVehicle() ile bu formata çevrilir.
// "?" ile işaretli alanlar DB'de yoktur, algorithm.ts içinde doldurulur.
export interface Vehicle extends Product {
  category?: 'VEHICLE';
  year?: number;
  segment?: string;
  engineering: {
    hp: number;
    torque: number;
    zeroToHundred?: number;
    weight?: number;
    transmission?: string;
    fuelConsumption?: number;
    trunkCapacity?: number;
    engineDisplacement?: number;
    [key: string]: any;
  };
  market: {
    listPrice: number;
    marketAverage?: number;
    liquidityScore?: number;
    resaleValue?: number;
    serviceNetwork?: number;
    [key: string]: any;
  };
  quality?: {
    materialQuality?: number;
    soundInsulation?: number;
    rideComfort?: number;
    prestigeScore?: number;
    trimLevel?: string;
    [key: string]: any;
  };
  risk?: { chronicIssueRisk?: number; [key: string]: any };
  documentedStrengths?: string[];
  documentedWeaknesses?: string[];
}

export interface RobotVacuum extends Product {
  category?: 'ROBOT_VACUUM';
  specs: {
    suctionPower: number;
    batteryCapacity: number;
    mappingTech: string;
    noiseLevel: number;
    dustCapacity?: number;
    mopFeature?: boolean;
    [key: string]: any;
  };
  market: {
    listPrice: number;
    marketAverage?: number;
    liquidityScore?: number;
    resaleValue?: number;
    serviceNetwork?: number;
    [key: string]: any;
  };
  risk?: { chronicIssueRisk?: number; [key: string]: any };
  documentedStrengths?: string[];
  documentedWeaknesses?: string[];
}

export interface GenericProduct extends Product {
  market: {
    listPrice: number;
    liquidityScore?: number;
    [key: string]: any;
  };
}

// ─── Analysis Tipleri ──────────────────────────────────────────────────────────
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

export interface ComparisonResult {
  product1: VehicleAnalysis | VacuumAnalysis | GenericAnalysis;
  product2: VehicleAnalysis | VacuumAnalysis | GenericAnalysis;
  winner: 'product1' | 'product2';
  verdict: string;
}
