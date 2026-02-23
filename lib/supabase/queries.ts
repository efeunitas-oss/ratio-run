// ============================================================================
// RATIO.RUN — SUPABASE QUERIES v2.1 (HOTFIX)
// .env.local yoksa bile çalışır — anahtarlar fallback olarak gömülü
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { Product, Category, SuggestedProduct } from '@/lib/types';
import { calculateRatioScore } from '@/lib/ratio-engine';
import { getSpecConfig } from '@/lib/spec-config';

// ✅ Env var varsa onu kullan, yoksa hardcoded fallback — site her koşulda açılır
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://srypulfxbckherkmrjgs.supabase.co';

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeXB1bGZ4YmNraGVya21yamdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTczMDcsImV4cCI6MjA4NjczMzMwN30.gEYVh5tjSrO3sgc5rsnYgVrIy6YdK3I5qU5S6FwkX-I';

export const supabase = createClient(supabaseUrl, supabaseKey);
// ─── Veri Temizleyici ─────────────────────────────────────────────────────────
// Trendyol/Amazon'dan gelen bozuk değerleri düzeltir
function sanitizeProduct(product: Product): Product {
  if (!product.specifications) return product;
  const s = { ...product.specifications } as Record<string, any>;

  // screen_inch: 600008 gibi saçma değer → null (max gerçekçi 100 inç)
  if (s.screen_inch != null && s.screen_inch > 100) s.screen_inch = null;

  // storage_gb: 2 gelmiş ama TB ise 2048 GB olmalı
  if (s.storage_gb != null && s.storage_gb > 0 && s.storage_gb <= 4) {
    s.storage_gb = s.storage_gb * 1024;
  }

  // spec_labels: null string değerleri temizle
  if (s.spec_labels && typeof s.spec_labels === 'object') {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(s.spec_labels)) {
      if (v != null && v !== 'null' && v !== '') cleaned[k] = String(v);
    }
    s.spec_labels = cleaned;
  }

  return { ...product, specifications: s };
}



const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Slug Alias Haritası ───────────────────────────────────────────────────────
// "araba" URL'i → DB'de "otomobil" olarak aranır
const SLUG_ALIASES: Record<string, string> = {
  'araba':         'otomobil',
  'robot-supurge': 'robot-supurge',
  'kulaklik':      'kulaklik',
  'telefon':       'telefon',
  'saat':          'saat',
  'tv':            'tv',
  'laptop':        'laptop',
  'tablet':        'tablet',
};

function resolveSlug(slug: string): string {
  if (!slug) return slug;
  return SLUG_ALIASES[slug.toLowerCase()] ?? slug.toLowerCase();
}

// ── Get Product By ID ─────────────────────────────────────────────────────────
export async function getProductById(
  productId: string,
  categoryId?: string
): Promise<Product | null> {
  if (!productId || !UUID_REGEX.test(productId)) return null;
  try {
    let builder = supabase
      .from('products')
      .select('*, categories(*)')
      .eq('id', productId);

    if (categoryId && UUID_REGEX.test(categoryId)) {
      builder = builder.eq('category_id', categoryId);
    }

    const { data, error } = await builder.single();
    if (error) { console.error('[queries] getProductById:', error.message); return null; }
    return sanitizeProduct(data as Product);
  } catch (err) { console.error('[queries] getProductById exception:', err); return null; }
}

// ── Get Category By Slug ──────────────────────────────────────────────────────
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!slug) return null;
  const resolvedSlug = resolveSlug(slug);
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', resolvedSlug)
      .maybeSingle();

    if (error) {
      console.error(`[queries] getCategoryBySlug (slug: ${resolvedSlug}):`, error.message ?? JSON.stringify(error));
      return null;
    }
    if (!data) {
      console.warn(`[queries] Kategori bulunamadı: "${slug}" → "${resolvedSlug}"`);
    }
    return data as Category | null;
  } catch (err) { console.error('[queries] getCategoryBySlug exception:', err); return null; }
}

// ── Get Products By Category ──────────────────────────────────────────────────
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
      .eq('is_active', true)
      .order('price', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) { console.error('[queries] getProductsByCategory:', error.message); return []; }
    return ((data as Product[]) ?? []).map(sanitizeProduct);
  } catch (err) { console.error('[queries] getProductsByCategory exception:', err); return []; }
}

// ── Get Suggested Products ────────────────────────────────────────────────────
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
      .eq('is_active', true)
      .limit(10);

    if (excludeProductIds.length > 0) {
      builder = builder.not('id', 'in', `(${excludeProductIds.join(',')})`);
    }

    const { data: products, error } = await builder;
    if (error || !products) { console.error('[queries] getSuggestedProducts:', error?.message); return []; }

    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .maybeSingle();

    if (!category) return [];

    const config = getSpecConfig(category.slug);
    const maxPrice = Math.max(...products.map((p: Product) => p.price ?? 0), 1);

    const scored = products.map((product: Product) => {
      const ratio = calculateRatioScore(product, config.weights, maxPrice);
      return {
        product,
        ratio_score: ratio.normalized_score,
        match_reason:
          ratio.normalized_score >= 85 ? 'Olağanüstü fiyat/performans' :
          ratio.normalized_score >= 70 ? 'Mükemmel değer dengesi' :
          'Kategoride popüler',
      };
    });

    return scored
      .sort((a: SuggestedProduct, b: SuggestedProduct) => b.ratio_score - a.ratio_score)
      .slice(0, 3);
  } catch (err) { console.error('[queries] getSuggestedProducts exception:', err); return []; }
}

// ── Search Products ───────────────────────────────────────────────────────────
export async function searchProducts(query: string, categoryId?: string): Promise<Product[]> {
  if (!query) return [];
  try {
    let builder = supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`)
      .eq('is_active', true)
      .order('price', { ascending: true })
      .limit(20);

    if (categoryId && UUID_REGEX.test(categoryId)) {
      builder = builder.eq('category_id', categoryId);
    }

    const { data, error } = await builder;
    if (error) { console.error('[queries] searchProducts:', error.message); return []; }
    return ((data as Product[]) ?? []).map(sanitizeProduct);
  } catch (err) { console.error('[queries] searchProducts exception:', err); return []; }
}

// ── Get All Categories ────────────────────────────────────────────────────────
export async function getAllCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) { console.error('[queries] getAllCategories:', error.message); return []; }
    return (data as Category[]) ?? [];
  } catch (err) { console.error('[queries] getAllCategories exception:', err); return []; }
}

// ── Get Products By IDs ───────────────────────────────────────────────────────
export async function getProductsByIds(productIds: string[]): Promise<Product[]> {
  const valid = productIds.filter((id) => UUID_REGEX.test(id));
  if (valid.length === 0) return [];
  try {
    const { data, error } = await supabase.from('products').select('*').in('id', valid);
    if (error) { console.error('[queries] getProductsByIds:', error.message); return []; }
    return (data as Product[]) ?? [];
  } catch (err) { console.error('[queries] getProductsByIds exception:', err); return []; }
}
