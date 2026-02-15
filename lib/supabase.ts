// lib/supabase.ts
// Supabase client helper

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://srypulfxbckherkmrjgs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeXB1bGZ4YmNraGVya21yamdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTczMDcsImV4cCI6MjA4NjczMzMwN30.gEYVh5tjSrO3sgc5rsnYgVrIy6YdK3I5qU5S6FwkX-I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Product type from Supabase
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
  specifications: any;
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

// Helper functions
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data as Category[];
}

export async function getProductsByCategory(categorySlug: string) {
  // First get category ID
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (!category) {
    return [];
  }

  // Then get products
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', category.id)
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data as Product[];
}

export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data as Product[];
}
// Supabase Product'ı Vehicle/RobotVacuum formatına çevir
export function convertToVehicle(product: Product): any {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    model: product.model,
    year: product.specifications?.year || 2024,
    segment: product.specifications?.segment || 'D',
    sourceUrl: product.source_url,
    verificationStatus: 'verified',
    affiliateLinks: [],
    engineering: {
      hp: product.specifications?.hp || 150,
      torque: product.specifications?.torque || 250,
      zeroToHundred: product.specifications?.zeroToHundred || 8.5,
      weight: product.specifications?.weight || 1500,
      transmission: product.specifications?.transmission || 'Otomatik',
      fuelConsumption: product.specifications?.fuelConsumption || 6.5,
      trunkCapacity: product.specifications?.trunkCapacity || 450,
      engineDisplacement: 1500,
    },
    market: {
      listPrice: product.price || 2000000,
      marketAverage: product.specifications?.marketAverage || product.price || 2000000,
      liquidityScore: product.specifications?.liquidityScore || 8,
      resaleValue: product.specifications?.resaleValue || 8,
      serviceNetwork: 8,
    },
    quality: {
      materialQuality: 7,
      soundInsulation: 7,
      rideComfort: 7,
      prestigeScore: 7,
      trimLevel: 'Dolu',
    },
    risk: { chronicIssueRisk: 3 },
    documentedStrengths: product.specifications?.strengths || [],
    documentedWeaknesses: product.specifications?.weaknesses || [],
  };
}

export function convertToVacuum(product: Product): any {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: 'ROBOT_VACUUM',
    sourceUrl: product.source_url,
    verificationStatus: 'verified',
    affiliateLinks: [],
    specs: {
      suctionPower: product.specifications?.suctionPower || 5000,
      batteryCapacity: product.specifications?.batteryCapacity || 5200,
      noiseLevel: product.specifications?.noiseLevel || 68,
      dustCapacity: product.specifications?.dustCapacity || 0.4,
      mappingTech: product.specifications?.mappingTech || 'Lidar',
      mopFeature: product.specifications?.mopFeature || true,
    },
    market: {
      listPrice: product.price || 20000,
      marketAverage: product.specifications?.marketAverage || product.price || 20000,
      liquidityScore: product.specifications?.liquidityScore || 8,
      resaleValue: product.specifications?.resaleValue || 7,
      serviceNetwork: 7,
    },
    risk: { chronicIssueRisk: 3 },
    documentedStrengths: product.specifications?.strengths || [],
    documentedWeaknesses: product.specifications?.weaknesses || [],
  };
}