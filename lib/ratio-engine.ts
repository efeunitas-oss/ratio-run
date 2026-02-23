// ============================================================================
// RATIO.RUN — DECISION ENGINE v4
// Düzeltmeler:
// - normalizeToHundred: DB'den gelen 0-10 skorlar artık 0-100'e çevriliyor
// - Tie yok: her zaman net kazanan belirleniyor
// - getSpecValue: spec_labels'dan da okuma
// ============================================================================

import { Product, RatioScore, RatioComparisonResult, ScoreWeights } from '@/lib/types';
import { getSpecConfig } from '@/lib/spec-config';

// ─── 0-10 skalasını 0-100'e normalize et ─────────────────────────────────────
// Apify scraper performance_score, display_score vb. 0-10 olarak yazıyor.
// 6 gelince 60 olması lazım — yoksa final ratio skoru 4.5 çıkıyor.
function normalizeToHundred(val: number): number {
  if (val <= 0) return 0;
  if (val <= 10) return val * 10;  // 0-10 → 0-100
  return Math.min(val, 100);        // zaten 100 skalasındaysa dokunma
}

// ─── specifications JSON'dan skor oku + normalize et ─────────────────────────
function resolveScore(product: Product, key: string): number {
  const specs = product.specifications ?? {};

  const topLevel = (product as any)[key];
  if (topLevel != null && typeof topLevel === 'number') return normalizeToHundred(topLevel);

  const fromSpecs = specs[key];
  if (fromSpecs != null && typeof fromSpecs === 'number') return normalizeToHundred(fromSpecs);

  return 0;
}

// ─── Ana Hesaplama Fonksiyonu ──────────────────────────────────────────────────
export function calculateRatioScore(
  product: Product,
  weights: ScoreWeights,
  maxPrice: number
): RatioScore {
  const specs = product.specifications ?? {};

  const scoreMap: Record<string, number> = {
    performance:        resolveScore(product, 'performance_score'),
    battery:            resolveScore(product, 'battery_score'),
    camera:             resolveScore(product, 'camera_score'),
    display:            resolveScore(product, 'display_score'),
    build_quality:      resolveScore(product, 'build_quality'),
    suction:            resolveScore(product, 'suction_score'),
    navigation:         resolveScore(product, 'navigation_score'),
    noise:              resolveScore(product, 'noise_score'),
    audio_quality:      resolveScore(product, 'sound_quality'),
    noise_cancellation: resolveScore(product, 'noise_cancelling'),
    ram:                resolveScore(product, 'ram_score'),
    health:             resolveScore(product, 'health_score'),
    fitness:            resolveScore(product, 'fitness_score'),
    picture_quality:    resolveScore(product, 'picture_quality'),
    smart_features:     resolveScore(product, 'smart_features'),
    overall:            normalizeToHundred(specs.overall_score ?? 0),
  };

  let weightedSum = 0;
  let totalWeight = 0;
  const individualScores: Record<string, number> = {};
  const explanations: string[] = [];

  for (const [weightKey, weight] of Object.entries(weights)) {
    if (weight == null) continue;
    const w = weight as number;
    const score = scoreMap[weightKey] ?? 0;

    if (score > 0) {
      weightedSum += w * score;
      totalWeight += w;
      individualScores[weightKey] = score;
      explanations.push(
        `${weightKeyToLabel(weightKey)}: ${score.toFixed(0)}/100 (ağırlık %${(w * 100).toFixed(0)})`
      );
    }
  }

  // Hiç spesifik skor yoksa overall ile devam et
  if (totalWeight === 0 && scoreMap.overall > 0) {
    weightedSum = scoreMap.overall;
    totalWeight = 1;
    individualScores['overall'] = scoreMap.overall;
    explanations.push(`Genel skor: ${scoreMap.overall.toFixed(0)}/100`);
  }

  // Ağırlıklar tam 1.0 değilse normalize et
  if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.01) {
    weightedSum = weightedSum / totalWeight;
  }

  // Fiyat faktörü — pahalı ürün ceza alır (max %30 ceza, eskisi %50'ydi)
  const safePrice = Math.max(product.price ?? 1, 1);
  const safeMax   = Math.max(maxPrice ?? safePrice, safePrice);
  const priceNormalized = Math.log10(safePrice + 1) / Math.log10(safeMax + 1);
  const priceFactor = 1 - priceNormalized * 0.3;

  const priceAdvantage = ((1 - priceNormalized) * 100).toFixed(0);
  explanations.push(
    `Fiyat avantajı: Kategorideki en yüksek fiyata göre %${priceAdvantage} tasarruf faktörü`
  );

  const rawScore        = weightedSum * priceFactor;
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
  const config   = getSpecConfig(categorySlug);
  const maxPrice = Math.max(productA.price ?? 0, productB.price ?? 0);
  const ratioA   = calculateRatioScore(productA, config.weights, maxPrice);
  const ratioB   = calculateRatioScore(productB, config.weights, maxPrice);

  const diff = Math.abs(ratioA.normalized_score - ratioB.normalized_score);

  // Tie yok — her zaman net kazanan
  let winner: 'a' | 'b' | 'tie';
  let advantagePercentage = 0;

  if (ratioA.normalized_score > ratioB.normalized_score) {
    winner = 'a';
    advantagePercentage =
      ((ratioA.normalized_score - ratioB.normalized_score) /
        Math.max(ratioB.normalized_score, 1)) * 100;
  } else if (ratioB.normalized_score > ratioA.normalized_score) {
    winner = 'b';
    advantagePercentage =
      ((ratioB.normalized_score - ratioA.normalized_score) /
        Math.max(ratioA.normalized_score, 1)) * 100;
  } else {
    // Birebir eşit (nadir) — ucuz olan kazanır
    winner = (productA.price ?? 0) <= (productB.price ?? 0) ? 'a' : 'b';
    advantagePercentage = 0.1;
  }

  // Üst sınır: maksimum %99 — veri eksikliğinden kaynaklanan %843 gibi saçma rakamları önler
  advantagePercentage = Math.min(advantagePercentage, 99);
  const isCrushingVictory = advantagePercentage > 15;
  const winnerProduct = winner === 'a' ? productA : productB;
  const loserProduct  = winner === 'a' ? productB : productA;
  const winnerRatio   = winner === 'a' ? ratioA : ratioB;

  let recommendation = '';
  if (isCrushingVictory) {
    recommendation = `EZİCİ ÜSTÜNLÜK: ${winnerProduct.name ?? 'Kazanan'} rakibine göre %${advantagePercentage.toFixed(1)} daha iyi bir fiyat/performans dengesi sunuyor.`;
  } else if (diff < 5) {
    recommendation = `${winnerProduct.name ?? 'Bu ürün'}, ${loserProduct.name ?? 'rakibine'} göre çok yakın bir yarışta %${advantagePercentage.toFixed(1)} ile öne çıkıyor.`;
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
  if (score >= 70) return { text: 'MÜKEMMEL SEÇİM',   color: 'text-blue-400',    bgColor: 'bg-blue-500/20'    };
  if (score >= 55) return { text: 'İYİ DEĞER',         color: 'text-amber-400',   bgColor: 'bg-amber-500/20'   };
  if (score >= 40) return { text: 'MAKUL',              color: 'text-gray-400',    bgColor: 'bg-gray-500/20'    };
  return                   { text: 'ZAYIF DEĞER',       color: 'text-red-400',     bgColor: 'bg-red-500/20'     };
}

// ─── Spesifikasyon Ayrıştırıcı ────────────────────────────────────────────────
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

// ─── Spesifikasyon Değeri Oku ─────────────────────────────────────────────────
// Öncelik: specifications[key] → spec_labels → regex
export function getSpecValue(
  product: Product,
  specKey: string,
  categorySlug: string
): string | number | null {
  const specs = product.specifications ?? {};

  // 1. Doğrudan field
  if (specs[specKey] != null) return specs[specKey] as string | number;

  // 2. spec_labels (Trendyol/Amazon scraper buraya yazar)
  const labels = specs.spec_labels as Record<string, string> | undefined;
  if (labels) {
    const labelMap: Record<string, string[]> = {
      ram_size:           ['RAM', 'Ram', 'Bellek'],
      storage:            ['SSD', 'HDD', 'Depolama', 'Dahili Depolama', 'Kapasite'],
      screen_size:        ['Ekran', 'Ekran Boyutu'],
      display_brightness: ['Parlaklık', 'Brightness'],
      battery:            ['Batarya', 'Pil', 'Battery'],
      ram:                ['RAM', 'Ram'],
      camera_mp:          ['Kamera', 'Arka Kamera', 'Ana Kamera'],
      battery_life:       ['Batarya Ömrü', 'Kullanım Süresi'],
      noise_cancellation: ['ANC', 'Gürültü Önleme'],
    };
    const keys = labelMap[specKey] ?? [];
    for (const k of keys) {
      const v = labels[k];
      if (v != null && v !== '' && v !== 'null') {
        const num = parseFloat(v);
        if (!isNaN(num)) return num;
        return v;
      }
    }
  }

  // 3. Ürün adından regex
  const parsed = parseSpecsFromTitle(product.name, categorySlug);
  return (parsed[specKey] as string | number) ?? null;
}

// ─── Weight key → okunabilir etiket ──────────────────────────────────────────
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
