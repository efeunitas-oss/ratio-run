// ============================================================================
// RATIO.RUN — DECISION ENGINE v3
// Düzeltmeler: specifications JSON'dan skor okuma, Türkçe encoding, açıklama sistemi
// ============================================================================

import { Product, RatioScore, RatioComparisonResult, ScoreWeights } from '@/lib/types';
import { getSpecConfig } from '@/lib/spec-config';

// ─── Yardımcı: specifications JSON'dan skor oku ────────────────────────────────
// Sorun: Veritabanı skorları product.specifications.battery_score içinde saklıyor.
// Eski kod product.battery_score okuyordu → her zaman 0 çıkıyordu.
// Bu fonksiyon her iki yere de bakar, doğru olanı döner.
function resolveScore(product: Product, key: string): number {
  const specs = product.specifications ?? {};

  // Önce top-level'a bak (gelecekte doğrudan kolon eklenirse çalışır)
  const topLevel = (product as any)[key];
  if (topLevel != null && typeof topLevel === 'number') return topLevel;

  // Sonra specifications JSON'a bak
  const fromSpecs = specs[key];
  if (fromSpecs != null && typeof fromSpecs === 'number') return fromSpecs;

  return 0;
}

// ─── Ana Hesaplama Fonksiyonu ──────────────────────────────────────────────────
export function calculateRatioScore(
  product: Product,
  weights: ScoreWeights,
  maxPrice: number
): RatioScore {
  const specs = product.specifications ?? {};

  // Tüm olası skor alanlarını specifications'dan çek
  const scoreMap: Record<string, number> = {
    // Genel
    performance:      resolveScore(product, 'performance_score'),
    battery:          resolveScore(product, 'battery_score'),
    camera:           resolveScore(product, 'camera_score'),
    display:          resolveScore(product, 'display_score'),
    build_quality:    resolveScore(product, 'build_quality'),

    // Robot süpürge
    suction:          resolveScore(product, 'suction_score'),
    navigation:       resolveScore(product, 'navigation_score'),
    noise:            resolveScore(product, 'noise_score'),

    // Kulaklık
    audio_quality:    resolveScore(product, 'sound_quality'),
    noise_cancellation: resolveScore(product, 'noise_cancelling'),

    // Laptop
    ram:              resolveScore(product, 'ram_score'),

    // Akıllı Saat
    health:           resolveScore(product, 'health_score'),
    fitness:          resolveScore(product, 'fitness_score'),

    // TV
    picture_quality:  resolveScore(product, 'picture_quality'),
    smart_features:   resolveScore(product, 'smart_features'),

    // Genel fallback: overall_score * 10 (overall 1-10 ölçeğinde)
    overall:          (specs.overall_score ?? 0) * 10,
  };

  let weightedSum = 0;
  let totalWeight = 0;
  const individualScores: Record<string, number> = {};
  const explanations: string[] = [];

  for (const [weightKey, weight] of Object.entries(weights)) {
    if (weight == null) continue;
    const w = weight as number;

    // Weight key ile score map'i eşleştir
    const score = scoreMap[weightKey] ?? 0;

    if (score > 0) {
      const weightedScore = w * score;
      weightedSum += weightedScore;
      totalWeight += w;
      individualScores[weightKey] = score;
      explanations.push(`${weightKeyToLabel(weightKey)}: ${score.toFixed(0)}/100 (ağırlık %${(w * 100).toFixed(0)})`);
    }
  }

  // Eğer hiç spesifik skor yoksa, overall_score ile devam et
  if (totalWeight === 0 && scoreMap.overall > 0) {
    weightedSum = scoreMap.overall;
    totalWeight = 1;
    individualScores['overall'] = scoreMap.overall;
    explanations.push(`Genel skor: ${scoreMap.overall.toFixed(0)}/100`);
  }

  // Ağırlıklar 1.0'a toplamıyorsa normalize et
  if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.01) {
    weightedSum = weightedSum / totalWeight;
  }

  // Fiyat faktörü: pahalı ürün ceza alır (logaritmik)
  const safePrice = Math.max(product.price ?? 1, 1);
  const safeMax = Math.max(maxPrice ?? safePrice, safePrice);
  const priceNormalized = Math.log10(safePrice + 1) / Math.log10(safeMax + 1);
  const priceFactor = 1 - priceNormalized * 0.5;

  // Fiyat açıklaması
  const priceAdvantage = ((1 - priceNormalized) * 100).toFixed(0);
  explanations.push(`Fiyat avantajı: Kategorideki en yüksek fiyata göre %${priceAdvantage} tasarruf faktörü`);

  const rawScore = weightedSum * priceFactor;
  const normalizedScore = Math.min(Math.max(rawScore, 0), 100);

  return {
    raw_score: rawScore,
    normalized_score: normalizedScore,
    breakdown: {
      weighted_performance: weightedSum,
      price_factor: priceFactor,
      individual_scores: individualScores,
      explanations,
    },
  };
}

// ─── Karşılaştırma ─────────────────────────────────────────────────────────────
export function compareProducts(
  productA: Product,
  productB: Product,
  categorySlug: string
): RatioComparisonResult {
  const config = getSpecConfig(categorySlug);
  const maxPrice = Math.max(productA.price ?? 0, productB.price ?? 0);
  const ratioA = calculateRatioScore(productA, config.weights, maxPrice);
  const ratioB = calculateRatioScore(productB, config.weights, maxPrice);

  const diff = Math.abs(ratioA.normalized_score - ratioB.normalized_score);

  let winner: 'a' | 'b' | 'tie';
  let advantagePercentage = 0;

  if (diff < 0) { // tie yok, her zaman kazanan çıkar
    winner = 'tie';
  } else if (ratioA.normalized_score > ratioB.normalized_score) {
    winner = 'a';
    advantagePercentage =
      ((ratioA.normalized_score - ratioB.normalized_score) /
        Math.max(ratioB.normalized_score, 1)) * 100;
  } else {
    winner = 'b';
    advantagePercentage =
      ((ratioB.normalized_score - ratioA.normalized_score) /
        Math.max(ratioA.normalized_score, 1)) * 100;
  }

  const isCrushingVictory = advantagePercentage > 15;
  const winnerProduct  = winner === 'a' ? productA : winner === 'b' ? productB : productA;
  const loserProduct   = winner === 'a' ? productB : productA;
  const winnerRatio    = winner === 'a' ? ratioA : ratioB;

  let recommendation = '';
  if (winner === 'tie') {
    recommendation = 'Bu iki ürün neredeyse eşit performans/fiyat oranına sahip.';
  } else if (isCrushingVictory) {
    recommendation = `EZİCİ ÜSTÜNLÜK: ${winnerProduct.name ?? 'Kazanan'} rakibine göre %${advantagePercentage.toFixed(1)} daha iyi. Ratio: ${winnerRatio.normalized_score.toFixed(1)}/100`;
  } else {
    recommendation = `${winnerProduct.name ?? 'Bu ürün'}, ${loserProduct.name ?? 'rakibine'} göre %${advantagePercentage.toFixed(1)} daha iyi bir denge sunuyor.`;
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

// ─── Değer Rozeti ──────────────────────────────────────────────────────────────
export function getValueBadge(score: number): {
  text: string;
  color: string;
  bgColor: string;
} {
  if (score >= 85) return { text: 'OLAĞANÜSTÜ DEĞER', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' };
  if (score >= 70) return { text: 'MÜKEMMEL SEÇİM',  color: 'text-blue-400',    bgColor: 'bg-blue-500/20'    };
  if (score >= 55) return { text: 'İYİ DEĞER',        color: 'text-amber-400',   bgColor: 'bg-amber-500/20'   };
  return               { text: 'MAKUL',               color: 'text-gray-400',    bgColor: 'bg-gray-500/20'    };
}

// ─── Spesifikasyon Ayrıştırıcı ─────────────────────────────────────────────────
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
        specs[column.key] =
          column.format === 'number' ? parseFloat(match[1]) : match[1];
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
  const specs = product.specifications ?? {};
  if (specs[specKey] != null) return specs[specKey] as string | number;
  const parsed = parseSpecsFromTitle(product.name, categorySlug);
  return (parsed[specKey] as string | number) ?? null;
}

// ─── Yardımcı: Weight key → okunabilir etiket ─────────────────────────────────
function weightKeyToLabel(key: string): string {
  const labels: Record<string, string> = {
    performance:         'İşlemci / Performans',
    battery:             'Batarya',
    camera:              'Kamera',
    display:             'Ekran',
    build_quality:       'Yapı Kalitesi',
    suction:             'Emme Gücü',
    navigation:          'Navigasyon',
    noise:               'Ses Seviyesi',
    audio_quality:       'Ses Kalitesi',
    noise_cancellation:  'Gürültü Engelleme',
    ram:                 'RAM',
    fuel_efficiency:     'Yakıt Verimliliği',
    features:            'Özellikler',
    health:              'Sağlık Takibi',
    fitness:             'Fitness',
    picture_quality:     'Görüntü Kalitesi',
    smart_features:      'Akıllı Özellikler',
    overall:             'Genel Skor',
  };
  return labels[key] ?? key;
}
