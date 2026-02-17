// ============================================================================
// RATIO.RUN - COMPARISON PAGE
// Path: app/compare/[category]/[productId1]/vs/[productId2]/page.tsx
// ============================================================================

import { ComparisonView } from '@/components/comparison/ComparisonView';
import {
  getProductById,
  getCategoryBySlug,
  getSuggestedProducts,
} from '@/lib/supabase/queries';
import { compareProducts } from '@/lib/ratio-engine';
import { ProductCard } from '@/components/ui/ProductCard';
import Link from 'next/link';
import { Product } from '@/lib/types';

// Next.js 15: params is a Promise
interface PageProps {
  params: Promise<{
    category: string;
    productId1: string;
    productId2: string;
  }>;
}

export default async function ComparePage({ params }: PageProps) {
  const { category, productId1, productId2 } = await params;

  const categoryData = await getCategoryBySlug(category);
  if (!categoryData) return <CategoryNotFound categorySlug={category} />;

  const [productA, productB] = await Promise.all([
    getProductById(productId1, categoryData.id),
    getProductById(productId2, categoryData.id),
  ]);

  if (!productA || !productB) {
    return (
      <ProductNotFound
        categoryId={categoryData.id}
        categorySlug={category}
        missingProductId={!productA ? productId1 : productId2}
      />
    );
  }

  const comparison = compareProducts(productA, productB, category);
  return <ComparisonView comparison={comparison} categorySlug={category} />;
}

// ─── Category Not Found ───────────────────────────────────────────────────────
function CategoryNotFound({ categorySlug }: { categorySlug: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
      <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-800/50 rounded-2xl p-12 text-center max-w-xl">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-100 mb-4">Kategori Bulunamadı</h1>
        <p className="text-gray-400 mb-8">
          <code className="px-2 py-1 bg-gray-800 rounded text-red-400">{categorySlug}</code>{' '}
          kategorisi sistemde kayıtlı değil.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all hover:opacity-90">
          ← Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}

// ─── Product Not Found ────────────────────────────────────────────────────────
async function ProductNotFound({
  categoryId,
  categorySlug,
  missingProductId,
}: {
  categoryId: string;
  categorySlug: string;
  missingProductId: string;
}) {
  const suggestions = await getSuggestedProducts(categoryId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-12">
      <div className="container mx-auto max-w-6xl">
        {/* Error Banner */}
        <div className="backdrop-blur-xl bg-gray-900/40 border border-gray-800/50 rounded-2xl p-8 mb-12 flex items-start gap-4">
          <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-1">Ürün Bulunamadı</h1>
            <p className="text-gray-400">
              <code className="px-2 py-1 bg-gray-800 rounded text-amber-400">{missingProductId}</code>
              {' '}bu kategoride mevcut değil.
            </p>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <>
            <h2 className="text-3xl font-bold text-gray-100 mb-2">En Yüksek Ratio Puanlı Ürünler</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((s) => (
                <Link key={s.product.id} href={`/product/${categorySlug}/${s.product.id}`}>
                  <div className="relative group">
                    <ProductCard
                      product={s.product}
                      ratioScore={{
                        raw_score: s.ratio_score,
                        normalized_score: s.ratio_score,
                        breakdown: { weighted_performance: 0, price_factor: 0, individual_scores: {} },
                      }}
                      categorySlug={categorySlug}
                    />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-xs font-bold text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {s.match_reason}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="mt-12 text-center">
          <Link href={`/category/${categorySlug}`} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900/60 border border-gray-700 text-gray-300 font-semibold rounded-xl transition-all hover:bg-gray-800/60">
            ← Kategoriye Geri Dön
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps) {
  const { category, productId1, productId2 } = await params;
  const categoryData = await getCategoryBySlug(category);
  if (!categoryData) return { title: 'Kategori Bulunamadı - Ratio.Run' };

  const [pA, pB] = await Promise.all([
    getProductById(productId1, categoryData.id),
    getProductById(productId2, categoryData.id),
  ]);

  if (!pA || !pB) return { title: `${categoryData.name} - Ratio.Run` };

  const tA = (pA.title ?? '').split(' ').slice(0, 5).join(' ');
  const tB = (pB.title ?? '').split(' ').slice(0, 5).join(' ');

  return {
    title: `${tA} vs ${tB} - Ratio.Run`,
    description: `${tA} ve ${tB} ürünlerinin akıllı karşılaştırması.`,
  };
}
