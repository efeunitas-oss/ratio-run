// ============================================================================
// RATIO.RUN - DECISION ENGINE v2 (null-safe)
// ============================================================================

import { Product, RatioScore, RatioComparisonResult, ScoreWeights } from '@/lib/types';
import { getSpecConfig } from '@/lib/spec-config';

export function calculateRatioScore(
  product: Product,
  weights: ScoreWeights,
  maxPrice: number
): RatioScore {
  const scores: Record<string, number> = {
    performance: product.performance_score ?? 0,
    battery: product.battery_score ?? 0,
    camera: product.camera_score ?? 0,
    display: product.display_score ?? 0,
    build_quality: product.build_quality_score ?? 0,
  };

  let weightedSum = 0;
  let totalWeight = 0;
  const individualScores: Record<string, number> = {};

  for (const [key, weight] of Object.entries(weights)) {
    if (weight == null) continue;
    const w = weight as number;
    const score = scores[key] ?? 0;
    if (score > 0) {
      const weightedScore = w * score;
      weightedSum += weightedScore;
      totalWeight += w;
      individualScores[key] = weightedScore;
    }
  }

  if (totalWeight > 0 && totalWeight !== 1.0) {
    weightedSum = weightedSum / totalWeight;
  }

  const safePrice = Math.max(product.price ?? 1, 1);
  const safeMax = Math.max(maxPrice ?? safePrice, safePrice);
  const priceNormalized = Math.log10(safePrice + 1) / Math.log10(safeMax + 1);
  const priceFactor = 1 - priceNormalized * 0.5;
  const rawScore = weightedSum * priceFactor;
  const normalizedScore = Math.min(Math.max(rawScore, 0), 100);

  return {
    raw_score: rawScore,
    normalized_score: normalizedScore,
    breakdown: {
      weighted_performance: weightedSum,
      price_factor: priceFactor,
      individual_scores: individualScores,
    },
  };
}

export function compareProducts(
  productA: Product,
  productB: Product,
  categorySlug: string
): RatioComparisonResult {
  const config = getSpecConfig(categorySlug);
  const maxPrice = Math.max(productA.price ?? 0, productB.price ?? 0);
  const ratioA = calculateRatioScore(productA, config.weights, maxPrice);
  const ratioB = calculateRatioScore(productB, config.weights, maxPrice);

  let winner: 'a' | 'b' | 'tie';
  let advantagePercentage = 0;

  const diff = Math.abs(ratioA.normalized_score - ratioB.normalized_score);

  if (diff < 2) {
    winner = 'tie';
  } else if (ratioA.normalized_score > ratioB.normalized_score) {
    winner = 'a';
    advantagePercentage = ((ratioA.normalized_score - ratioB.normalized_score) / Math.max(ratioB.normalized_score, 1)) * 100;
  } else {
    winner = 'b';
    advantagePercentage = ((ratioB.normalized_score - ratioA.normalized_score) / Math.max(ratioA.normalized_score, 1)) * 100;
  }

  const isCrushingVictory = advantagePercentage > 15;
  const winnerProduct = winner === 'a' ? productA : winner === 'b' ? productB : productA;
  const loserProduct = winner === 'a' ? productB : productA;
  const winnerRatio = winner === 'a' ? ratioA : ratioB;

  let recommendation = '';
  if (winner === 'tie') {
    recommendation = `Bu iki ürün neredeyse eşit performans/fiyat oranına sahip.`;
  } else if (isCrushingVictory) {
    recommendation = `🏆 EZİCİ ÜSTÜNLÜK! ${winnerProduct.title ?? 'Kazanan'} rakibine göre %${advantagePercentage.toFixed(1)} daha iyi. Ratio: ${winnerRatio.normalized_score.toFixed(1)}/100`;
  } else {
    recommendation = `${winnerProduct.title ?? 'Bu ürün'}, ${loserProduct.title ?? 'rakibine'} göre %${advantagePercentage.toFixed(1)} daha iyi bir denge sunuyor.`;
  }

  return {
    product_a: productA,
    product_b: productB,
    ratio_a: ratioA,
    ratio_b: ratioB,
    winner,
    advantage_percentage: advantagePercentage,
    is_crushing_victory: isCrushingVictory,
    recommendation,
  };
}

export function getValueBadge(score: number): { text: string; color: string; bgColor: string } {
  if (score >= 85) return { text: 'OLAĞANÜSTÜ DEĞER', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' };
  if (score >= 70) return { text: 'MÜKEMMEL SEÇİM', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
  if (score >= 55) return { text: 'İYİ DEĞER', color: 'text-amber-400', bgColor: 'bg-amber-500/20' };
  return { text: 'MAKUL', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
}

export function parseSpecsFromTitle(
  title: string | undefined | null,
  categorySlug: string
): Record<string, unknown> {
  if (!title) return {};
  const config = getSpecConfig(categorySlug);
  const specs: Record<string, unknown> = {};
  for (const column of config.columns) {
    if (column.parse_from_title) {
      const match = title.match(column.parse_from_title);
      if (match?.[1]) {
        specs[column.key] = column.format === 'number' ? parseFloat(match[1]) : match[1];
      }
    }
  }
  return specs;
}

export function getSpecValue(
  product: Product,
  specKey: string,
  categorySlug: string
): string | number | null {
  if (product.specifications?.[specKey] != null) {
    return product.specifications[specKey] as string | number;
  }
  const parsed = parseSpecsFromTitle(product.title, categorySlug);
  return (parsed[specKey] as string | number) ?? null;
}
