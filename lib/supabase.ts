// ============================================================================
// RATIO.RUN — SUPABASE CLIENT (HOTFIX)
// Vercel env vars yoksa fallback key kullanır — build asla patlamaz.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://srypulfxbckherkmrjgs.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeXB1bGZ4YmNraGVya21yamdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTczMDcsImV4cCI6MjA4NjczMzMwN30.gEYVh5tjSrO3sgc5rsnYgVrIy6YdK3I5qU5S6FwkX-I';

// ✅ Frontend client — sadece ANON KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Tipler ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  category_id: string;
  name: string;
  brand: string;
  model: string;
  price: number | null;
  currency: string;
  image_url: string | null;
  source_url: string;
  source_name: string;
  specifications: Record<string, any> | null;
  comparison_score: number | null;
  is_active: boolean;
  stock_status: string;
  scraped_at: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Sorgu Fonksiyonları ──────────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) { console.error('[supabase] Kategoriler:', error.message); return []; }
  return (data as Category[]) ?? [];
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();

  if (catError || !category) {
    console.error(`[supabase] Kategori bulunamadı: ${categorySlug}`);
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', category.id)
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) { console.error('[supabase] Ürünler:', error.message); return []; }
  return (data as Product[]) ?? [];
}

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) { console.error('[supabase] Tüm ürünler:', error.message); return []; }
  return (data as Product[]) ?? [];
}

export function convertToVehicle(product: Product): any {
  const s = product.specifications ?? {};
  return {
    id: product.id, name: product.name, brand: product.brand, model: product.model,
    year: s.year || 2024, segment: s.segment || 'D',
    sourceUrl: product.source_url, verificationStatus: 'verified', affiliateLinks: [],
    engineering: {
      hp: s.hp || 150, torque: s.torque || 250, zeroToHundred: s.zeroToHundred || 8.5,
      weight: s.weight || 1500, transmission: s.transmission || 'Otomatik',
      fuelConsumption: s.fuelConsumption || 6.5, trunkCapacity: s.trunkCapacity || 450,
      engineDisplacement: s.engineDisplacement || 1500,
    },
    market: {
      listPrice: product.price || 2000000, marketAverage: s.marketAverage || product.price || 2000000,
      liquidityScore: s.liquidityScore || 8, resaleValue: s.resaleValue || 8, serviceNetwork: s.serviceNetwork || 8,
    },
    quality: {
      materialQuality: s.materialQuality || 7, soundInsulation: s.soundInsulation || 7,
      rideComfort: s.rideComfort || 7, prestigeScore: s.prestigeScore || 7, trimLevel: s.trimLevel || 'Dolu',
    },
    risk: { chronicIssueRisk: s.chronicIssueRisk || 3 },
    documentedStrengths: s.strengths || [], documentedWeaknesses: s.weaknesses || [],
  };
}

export function convertToVacuum(product: Product): any {
  const s = product.specifications ?? {};
  return {
    id: product.id, name: product.name, brand: product.brand, category: 'ROBOT_VACUUM',
    sourceUrl: product.source_url, verificationStatus: 'verified', affiliateLinks: [],
    specs: {
      suctionPower: s.suctionPower || 5000, batteryCapacity: s.batteryCapacity || 5200,
      noiseLevel: s.noiseLevel || 68, dustCapacity: s.dustCapacity || 0.4,
      mappingTech: s.mappingTech || 'Lidar', mopFeature: s.mopFeature ?? true,
    },
    market: {
      listPrice: product.price || 20000, marketAverage: s.marketAverage || product.price || 20000,
      liquidityScore: s.liquidityScore || 8, resaleValue: s.resaleValue || 7, serviceNetwork: s.serviceNetwork || 7,
    },
    risk: { chronicIssueRisk: s.chronicIssueRisk || 3 },
    documentedStrengths: s.strengths || [], documentedWeaknesses: s.weaknesses || [],
  };
}
