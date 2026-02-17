// ============================================================================
// RATIO.RUN — SUPABASE CLIENT
// Düzeltme: Hardcoded anahtarlar kaldırıldı, .env.local'dan okunuyor.
// .env.local içinde şunlar OLMALI:
//   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
//   SUPABASE_SERVICE_ROLE_KEY=eyJ...  (sadece server-side route'larda kullan)
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase.ts] NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
    '.env.local dosyasında tanımlı değil.'
  );
}

// Frontend (public) client — sadece ANON KEY kullanır
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

// ─── Kategori Sorguları ───────────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[supabase] Kategoriler alınamadı:', error.message);
    return [];
  }
  return (data as Category[]) ?? [];
}

// ─── Kategoriye Göre Ürünler ──────────────────────────────────────────────────
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

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

  if (error) {
    console.error('[supabase] Ürünler alınamadı:', error.message);
    return [];
  }
  return (data as Product[]) ?? [];
}

// ─── Tüm Ürünler ──────────────────────────────────────────────────────────────
export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[supabase] Ürünler alınamadı:', error.message);
    return [];
  }
  return (data as Product[]) ?? [];
}

// ─── Dönüştürücüler ───────────────────────────────────────────────────────────
// Supabase Product → algorithm.ts'in beklediği Vehicle formatı
export function convertToVehicle(product: Product): any {
  const s = product.specifications ?? {};
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    model: product.model,
    year: s.year || 2024,
    segment: s.segment || 'D',
    sourceUrl: product.source_url,
    verificationStatus: 'verified',
    affiliateLinks: [],
    engineering: {
      hp:               s.hp               || 150,
      torque:           s.torque           || 250,
      zeroToHundred:    s.zeroToHundred    || 8.5,
      weight:           s.weight           || 1500,
      transmission:     s.transmission     || 'Otomatik',
      fuelConsumption:  s.fuelConsumption  || 6.5,
      trunkCapacity:    s.trunkCapacity    || 450,
      engineDisplacement: s.engineDisplacement || 1500,
    },
    market: {
      listPrice:      product.price       || 2000000,
      marketAverage:  s.marketAverage     || product.price || 2000000,
      liquidityScore: s.liquidityScore    || 8,
      resaleValue:    s.resaleValue       || 8,
      serviceNetwork: s.serviceNetwork    || 8,
    },
    quality: {
      materialQuality:  s.materialQuality  || 7,
      soundInsulation:  s.soundInsulation  || 7,
      rideComfort:      s.rideComfort      || 7,
      prestigeScore:    s.prestigeScore    || 7,
      trimLevel:        s.trimLevel        || 'Dolu',
    },
    risk: { chronicIssueRisk: s.chronicIssueRisk || 3 },
    documentedStrengths: s.strengths  || [],
    documentedWeaknesses:s.weaknesses || [],
  };
}

// Supabase Product → algorithm.ts'in beklediği RobotVacuum formatı
export function convertToVacuum(product: Product): any {
  const s = product.specifications ?? {};
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: 'ROBOT_VACUUM',
    sourceUrl: product.source_url,
    verificationStatus: 'verified',
    affiliateLinks: [],
    specs: {
      suctionPower:   s.suctionPower   || 5000,
      batteryCapacity:s.batteryCapacity|| 5200,
      noiseLevel:     s.noiseLevel     || 68,
      dustCapacity:   s.dustCapacity   || 0.4,
      mappingTech:    s.mappingTech    || 'Lidar',
      mopFeature:     s.mopFeature     ?? true,
    },
    market: {
      listPrice:      product.price    || 20000,
      marketAverage:  s.marketAverage  || product.price || 20000,
      liquidityScore: s.liquidityScore || 8,
      resaleValue:    s.resaleValue    || 7,
      serviceNetwork: s.serviceNetwork || 7,
    },
    risk: { chronicIssueRisk: s.chronicIssueRisk || 3 },
    documentedStrengths: s.strengths  || [],
    documentedWeaknesses:s.weaknesses || [],
  };
}
