// ============================================================================
// RATIO.RUN - SUPABASE QUERIES
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { Product, Category, SuggestedProduct } from '@/lib/types';
import { calculateRatioScore } from '@/lib/ratio-engine';
import { getSpecConfig } from '@/lib/spec-config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Get Product By ID ────────────────────────────────────────────────────────
export async function getProductById(
  productId: string,
  categoryId?: string
): Promise<Product | null> {
  if (!productId || !UUID_REGEX.test(productId)) {
    console.warn('Geçersiz ürün ID:', productId);
    return null;
  }
  try {
    // .single() must come LAST — after all .eq() filters
    let builder = supabase
      .from('products')
      .select('*, categories(*)')
      .eq('id', productId);

    if (categoryId && UUID_REGEX.test(categoryId)) {
      builder = builder.eq('category_id', categoryId);
    }

    const { data, error } = await builder.single();

    if (error) {
      console.error('Ürün hatası:', error.message);
      return null;
    }
    return data as Product;
  } catch (err) {
    console.error('Exception getProductById:', err);
    return null;
  }
}

// ─── Get Category By Slug ─────────────────────────────────────────────────────
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!slug) return null;
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Kategori hatası:', error.message);
      return null;
    }
    return data as Category;
  } catch (err) {
    console.error('Exception getCategoryBySlug:', err);
    return null;
  }
}

// ─── Get Products By Category ─────────────────────────────────────────────────
export async function getProductsByCategory(
  categoryId: string,
  limit = 20,
  offset = 0
): Promise<Product[]> {
  if (!categoryId || !UUID_REGEX.test(categoryId)) return [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) { console.error('getProductsByCategory:', error.message); return []; }
    return (data as Product[]) ?? [];
  } catch (err) {
    console.error('Exception getProductsByCategory:', err);
    return [];
  }
}

// ─── Get Suggested Products (highest ratio score) ─────────────────────────────
export async function getSuggestedProducts(
  categoryId: string,
  excludeProductIds: string[] = []
): Promise<SuggestedProduct[]> {
  if (!categoryId || !UUID_REGEX.test(categoryId)) return [];
  try {
    let builder = supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('rating', { ascending: false })
      .limit(10);

    if (excludeProductIds.length > 0) {
      builder = builder.not('id', 'in', `(${excludeProductIds.join(',')})`);
    }

    const { data: products, error } = await builder;
    if (error || !products) { console.error('getSuggestedProducts:', error?.message); return []; }

    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (!category) return [];

    const config = getSpecConfig(category.slug);
    const maxPrice = Math.max(...products.map((p: Product) => p.price ?? 0), 1);

    const scored = products.map((product: Product) => {
      const ratio = calculateRatioScore(product, config.weights, maxPrice);
      return {
        product,
        ratio_score: ratio.normalized_score,
        match_reason: ratio.normalized_score >= 85
          ? 'Olağanüstü fiyat/performans'
          : ratio.normalized_score >= 70
          ? 'Mükemmel değer dengesi'
          : 'Kategoride popüler',
      };
    });

    return scored.sort((a: SuggestedProduct, b: SuggestedProduct) => b.ratio_score - a.ratio_score).slice(0, 3);
  } catch (err) {
    console.error('Exception getSuggestedProducts:', err);
    return [];
  }
}

// ─── Search Products ──────────────────────────────────────────────────────────
export async function searchProducts(query: string, categoryId?: string): Promise<Product[]> {
  if (!query) return [];
  try {
    let builder = supabase
      .from('products')
      .select('*')
      .or(`title.ilike.%${query}%,asin.ilike.%${query}%`)
      .order('rating', { ascending: false })
      .limit(20);

    if (categoryId && UUID_REGEX.test(categoryId)) {
      builder = builder.eq('category_id', categoryId);
    }

    const { data, error } = await builder;
    if (error) { console.error('searchProducts:', error.message); return []; }
    return (data as Product[]) ?? [];
  } catch (err) {
    console.error('Exception searchProducts:', err);
    return [];
  }
}

// ─── Get All Categories ───────────────────────────────────────────────────────
export async function getAllCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) { console.error('getAllCategories:', error.message); return []; }
    return (data as Category[]) ?? [];
  } catch (err) {
    console.error('Exception getAllCategories:', err);
    return [];
  }
}

// ─── Get Products By IDs ──────────────────────────────────────────────────────
export async function getProductsByIds(productIds: string[]): Promise<Product[]> {
  const valid = productIds.filter(id => UUID_REGEX.test(id));
  if (valid.length === 0) return [];
  try {
    const { data, error } = await supabase.from('products').select('*').in('id', valid);
    if (error) { console.error('getProductsByIds:', error.message); return []; }
    return (data as Product[]) ?? [];
  } catch (err) {
    console.error('Exception getProductsByIds:', err);
    return [];
  }
}
