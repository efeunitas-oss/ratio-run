// ============================================================================
// RATIO.RUN - SPECIFICATION CONFIG
// Category-based intelligent column system with fallback parsers
// ============================================================================

import { SpecConfig } from './types';

export const SPEC_CONFIGS: Record<string, SpecConfig> = {
  // ========== AUTOMOTIVE ==========
  automotive: {
    category: 'automotive',
    display_name: 'Otomobil',
    columns: [
      {
        key: 'horsepower',
        label: 'Beygir Gücü',
        unit: 'HP',
        format: 'number',
        parse_from_title: /(\d+)\s*(hp|beygir|bhp)/i,
        priority: 'high',
      },
      {
        key: 'torque',
        label: 'Tork',
        unit: 'Nm',
        format: 'number',
        parse_from_title: /(\d+)\s*(nm|tork)/i,
        priority: 'high',
      },
      {
        key: 'fuel_consumption',
        label: 'Yakıt Tüketimi',
        unit: 'L/100km',
        format: 'number',
        parse_from_title: /(\d+\.?\d*)\s*(l\/100km|mpg)/i,
        priority: 'high',
      },
      {
        key: 'year',
        label: 'Model Yılı',
        format: 'number',
        parse_from_title: /(20\d{2})/,
        priority: 'medium',
      },
      {
        key: 'engine_type',
        label: 'Motor Tipi',
        format: 'text',
        priority: 'medium',
      },
    ],
    weights: {
      performance: 0.35,
      fuel_efficiency: 0.25,
      build_quality: 0.25,
      features: 0.15,
    },
    brand_colors: {
      'bmw': { primary: '#1C69D4', glow: 'rgba(28, 105, 212, 0.3)', accent: '#00A4E4' },
      'mercedes': { primary: '#00ADEF', glow: 'rgba(0, 173, 239, 0.3)', accent: '#FFFFFF' },
      'audi': { primary: '#BB0A30', glow: 'rgba(187, 10, 48, 0.3)', accent: '#FFFFFF' },
      'tesla': { primary: '#E82127', glow: 'rgba(232, 33, 39, 0.3)', accent: '#FFFFFF' },
    },
  },

  // ========== LAPTOPS ==========
  laptop: {
    category: 'laptop',
    display_name: 'Laptop',
    columns: [
      {
        key: 'processor_gen',
        label: 'İşlemci Nesil',
        format: 'text',
        parse_from_title: /(i\d|ryzen\s*\d+|m\d)/i,
        priority: 'high',
      },
      {
        key: 'ram_type',
        label: 'RAM Tipi',
        format: 'text',
        parse_from_title: /(ddr\d+|lpddr\d+)/i,
        priority: 'high',
      },
      {
        key: 'ram_size',
        label: 'RAM',
        unit: 'GB',
        format: 'number',
        parse_from_title: /(\d+)\s*gb\s*(ram|memory)/i,
        priority: 'high',
      },
      {
        key: 'display_brightness',
        label: 'Ekran Parlaklığı',
        unit: 'nits',
        format: 'number',
        parse_from_title: /(\d+)\s*nits?/i,
        priority: 'high',
      },
      {
        key: 'storage',
        label: 'Depolama',
        unit: 'GB',
        format: 'number',
        parse_from_title: /(\d+)\s*(gb|tb)\s*(ssd|nvme)/i,
        priority: 'medium',
      },
      {
        key: 'screen_size',
        label: 'Ekran Boyutu',
        unit: 'inch',
        format: 'number',
        parse_from_title: /(\d+\.?\d*)\s*(inch|"|inç)/i,
        priority: 'medium',
      },
    ],
    weights: {
      performance: 0.40,
      display: 0.25,
      battery: 0.20,
      build_quality: 0.15,
    },
    brand_colors: {
      'apple': { primary: '#F5F5F7', glow: 'rgba(245, 245, 247, 0.2)', accent: '#06C' },
      'dell': { primary: '#007DB8', glow: 'rgba(0, 125, 184, 0.3)', accent: '#FFFFFF' },
      'hp': { primary: '#0096D6', glow: 'rgba(0, 150, 214, 0.3)', accent: '#FFFFFF' },
      'lenovo': { primary: '#E2231A', glow: 'rgba(226, 35, 26, 0.3)', accent: '#FFFFFF' },
      'asus': { primary: '#000000', glow: 'rgba(0, 0, 0, 0.4)', accent: '#FFD100' },
    },
  },

  // ========== SMARTPHONES ==========
  smartphone: {
    category: 'smartphone',
    display_name: 'Akıllı Telefon',
    columns: [
      {
        key: 'chipset',
        label: 'İşlemci',
        format: 'text',
        parse_from_title: /(snapdragon\s*\d+|a\d+\s*bionic|exynos\s*\d+|tensor\s*g\d+)/i,
        priority: 'high',
      },
      {
        key: 'ram',
        label: 'RAM',
        unit: 'GB',
        format: 'number',
        parse_from_title: /(\d+)\s*gb/i,
        priority: 'high',
      },
      {
        key: 'display_refresh',
        label: 'Yenileme Hızı',
        unit: 'Hz',
        format: 'number',
        parse_from_title: /(\d+)\s*hz/i,
        priority: 'high',
      },
      {
        key: 'camera_mp',
        label: 'Ana Kamera',
        unit: 'MP',
        format: 'number',
        parse_from_title: /(\d+)\s*mp/i,
        priority: 'medium',
      },
      {
        key: 'battery',
        label: 'Batarya',
        unit: 'mAh',
        format: 'number',
        parse_from_title: /(\d+)\s*mah/i,
        priority: 'high',
      },
    ],
    weights: {
      performance: 0.30,
      camera: 0.25,
      battery: 0.20,
      display: 0.15,
      build_quality: 0.10,
    },
    brand_colors: {
      'apple': { primary: '#F5F5F7', glow: 'rgba(245, 245, 247, 0.2)', accent: '#06C' },
      'samsung': { primary: '#1428A0', glow: 'rgba(20, 40, 160, 0.3)', accent: '#FFFFFF' },
      'google': { primary: '#4285F4', glow: 'rgba(66, 133, 244, 0.3)', accent: '#EA4335' },
      'oneplus': { primary: '#F50514', glow: 'rgba(245, 5, 20, 0.3)', accent: '#FFFFFF' },
      'xiaomi': { primary: '#FF6900', glow: 'rgba(255, 105, 0, 0.3)', accent: '#FFFFFF' },
    },
  },

  // ========== HEADPHONES ==========
  headphones: {
    category: 'headphones',
    display_name: 'Kulaklık',
    columns: [
      {
        key: 'driver_size',
        label: 'Sürücü Boyutu',
        unit: 'mm',
        format: 'number',
        parse_from_title: /(\d+)\s*mm/i,
        priority: 'high',
      },
      {
        key: 'frequency_response',
        label: 'Frekans Aralığı',
        format: 'text',
        priority: 'medium',
      },
      {
        key: 'noise_cancellation',
        label: 'Gürültü Engelleme',
        format: 'text',
        priority: 'high',
      },
      {
        key: 'battery_life',
        label: 'Batarya Ömrü',
        unit: 'saat',
        format: 'number',
        parse_from_title: /(\d+)\s*(h|hour|saat|sa)/i,
        priority: 'high',
      },
      {
        key: 'connectivity',
        label: 'Bağlantı',
        format: 'text',
        priority: 'low',
      },
    ],
    weights: {
      audio_quality: 0.40,
      noise_cancellation: 0.25,
      battery: 0.20,
      build_quality: 0.15,
    },
    brand_colors: {
      'sony': { primary: '#000000', glow: 'rgba(0, 0, 0, 0.4)', accent: '#FF0000' },
      'bose': { primary: '#000000', glow: 'rgba(0, 0, 0, 0.4)', accent: '#FFFFFF' },
      'apple': { primary: '#F5F5F7', glow: 'rgba(245, 245, 247, 0.2)', accent: '#06C' },
      'sennheiser': { primary: '#000000', glow: 'rgba(0, 0, 0, 0.4)', accent: '#FFCC00' },
    },
  },

  // ========== TABLETS ==========
  tablet: {
    category: 'tablet',
    display_name: 'Tablet',
    columns: [
      {
        key: 'processor',
        label: 'İşlemci',
        format: 'text',
        parse_from_title: /(snapdragon\s*\d+|a\d+\s*bionic|m\d+)/i,
        priority: 'high',
      },
      {
        key: 'screen_size',
        label: 'Ekran Boyutu',
        unit: 'inch',
        format: 'number',
        parse_from_title: /(\d+\.?\d*)\s*(inch|"|inç)/i,
        priority: 'high',
      },
      {
        key: 'ram',
        label: 'RAM',
        unit: 'GB',
        format: 'number',
        parse_from_title: /(\d+)\s*gb/i,
        priority: 'high',
      },
      {
        key: 'storage',
        label: 'Depolama',
        unit: 'GB',
        format: 'number',
        priority: 'medium',
      },
      {
        key: 'refresh_rate',
        label: 'Yenileme Hızı',
        unit: 'Hz',
        format: 'number',
        parse_from_title: /(\d+)\s*hz/i,
        priority: 'medium',
      },
    ],
    weights: {
      performance: 0.35,
      display: 0.30,
      battery: 0.20,
      build_quality: 0.15,
    },
    brand_colors: {
      'apple': { primary: '#F5F5F7', glow: 'rgba(245, 245, 247, 0.2)', accent: '#06C' },
      'samsung': { primary: '#1428A0', glow: 'rgba(20, 40, 160, 0.3)', accent: '#FFFFFF' },
      'microsoft': { primary: '#00A4EF', glow: 'rgba(0, 164, 239, 0.3)', accent: '#FFFFFF' },
    },
  },
};

/**
 * Get spec config for a category
 * @param categorySlug - URL-safe category name
 * @returns SpecConfig or default config
 */
export function getSpecConfig(categorySlug: string): SpecConfig {
  const config = SPEC_CONFIGS[categorySlug.toLowerCase()];
  
  if (!config) {
    // Default fallback config
    return {
      category: categorySlug,
      display_name: categorySlug,
      columns: [
        { key: 'brand', label: 'Marka', format: 'text', priority: 'high' },
        { key: 'model', label: 'Model', format: 'text', priority: 'high' },
        { key: 'year', label: 'Yıl', format: 'number', priority: 'medium' },
      ],
      weights: {
        performance: 0.40,
        quality: 0.30,
        features: 0.30,
      },
      brand_colors: {},
    };
  }
  
  return config;
}

/**
 * Extract brand from product title
 * @param title - Product title
 * @returns Detected brand name (lowercase)
 */
export function extractBrand(title: string | undefined | null): string {
  if (!title) return 'default';
  
  const brands = [
    'apple', 'samsung', 'google', 'oneplus', 'xiaomi',
    'dell', 'hp', 'lenovo', 'asus', 'acer',
    'bmw', 'mercedes', 'audi', 'tesla', 'ford',
    'sony', 'bose', 'sennheiser', 'jbl',
    'microsoft', 'huawei', 'oppo', 'vivo',
  ];
  
  const titleLower = title.toLowerCase();
  
  for (const brand of brands) {
    if (titleLower.includes(brand)) {
      return brand;
    }
  }
  
  return 'default';
}
