// ============================================================================
// RATIO.RUN — SPEC CONFIG v2
// Düzeltmeler: Tüm DB slug'ları destekleniyor, Türkçe encoding düzeltildi
// ============================================================================

import { SpecConfig } from './types';

// ─── Slug Alias Haritası ───────────────────────────────────────────────────────
// route.ts'in kullandığı slug'ları spec config key'lerine çevirir.
// Bu harita sayesinde 'robot-supurge' → 'robot-vacuum' config'e gider.
const SLUG_ALIASES: Record<string, string> = {
  // route.ts slugları           → config key
  'robot-supurge':               'robot-vacuum',
  'kulaklik':                    'headphones',
  'telefon':                     'smartphone',
  'saat':                        'smartwatch',
  'araba':                       'automotive',
  'otomobil':                    'automotive',
  'tv':                          'television',
  'televizyon':                  'television',
  // Direkt eşleşenler (değişmesine gerek yok)
  'laptop':                      'laptop',
  'tablet':                      'tablet',
};

// ─── Konfigürasyonlar ──────────────────────────────────────────────────────────
export const SPEC_CONFIGS: Record<string, SpecConfig> = {

  // ═══ OTOMOBİL ═══════════════════════════════════════════════════════════════
  automotive: {
    category: 'automotive',
    display_name: 'Otomobil',
    columns: [
      { key: 'hp',               label: 'Beygir Gücü',      unit: 'HP',      format: 'number', parse_from_title: /(\d+)\s*(hp|beygir|bhp)/i,         priority: 'high'   },
      { key: 'torque',           label: 'Tork',              unit: 'Nm',      format: 'number', parse_from_title: /(\d+)\s*(nm|tork)/i,               priority: 'high'   },
      { key: 'fuelConsumption',  label: 'Yakıt Tüketimi',   unit: 'L/100km', format: 'number', parse_from_title: /(\d+\.?\d*)\s*(l\/100km)/i,        priority: 'high'   },
      { key: 'year',             label: 'Model Yılı',                         format: 'number', parse_from_title: /(20\d{2})/,                        priority: 'medium' },
      { key: 'transmission',     label: 'Şanzıman',                           format: 'text',                                                         priority: 'medium' },
    ],
    weights: {
      performance:    0.35,
      fuel_efficiency:0.25,
      build_quality:  0.25,
      features:       0.15,
    },
    brand_colors: {
      'bmw':      { primary: '#1C69D4', glow: 'rgba(28,105,212,0.3)',  accent: '#00A4E4' },
      'mercedes': { primary: '#00ADEF', glow: 'rgba(0,173,239,0.3)',   accent: '#FFFFFF' },
      'audi':     { primary: '#BB0A30', glow: 'rgba(187,10,48,0.3)',   accent: '#FFFFFF' },
      'tesla':    { primary: '#E82127', glow: 'rgba(232,33,39,0.3)',   accent: '#FFFFFF' },
      'toyota':   { primary: '#EB0A1E', glow: 'rgba(235,10,30,0.3)',   accent: '#FFFFFF' },
      'honda':    { primary: '#CC0000', glow: 'rgba(204,0,0,0.3)',     accent: '#FFFFFF' },
    },
  },

  // ═══ ROBOT SÜPÜRGE ════════════════════════════════════════════════════════════
  'robot-vacuum': {
    category: 'robot-vacuum',
    display_name: 'Robot Süpürge',
    columns: [
      { key: 'suctionPower',  label: 'Emme Gücü',      unit: 'Pa',    format: 'number', parse_from_title: /(\d+)\s*pa/i,         priority: 'high'   },
      { key: 'batteryCapacity',label: 'Batarya',        unit: 'mAh',  format: 'number', parse_from_title: /(\d+)\s*mah/i,        priority: 'high'   },
      { key: 'noiseLevel',    label: 'Ses Seviyesi',    unit: 'dB',   format: 'number', parse_from_title: /(\d+)\s*db/i,         priority: 'medium' },
      { key: 'mappingTech',   label: 'Haritalama',                    format: 'text',                                             priority: 'high'   },
      { key: 'dustCapacity',  label: 'Toz Haznesi',    unit: 'L',    format: 'number',                                           priority: 'low'    },
    ],
    weights: {
      suction:    0.35,
      battery:    0.25,
      navigation: 0.25,
      noise:      0.15,
    },
    brand_colors: {
      'roborock': { primary: '#E8424C', glow: 'rgba(232,66,76,0.3)',  accent: '#FFFFFF' },
      'irobot':   { primary: '#009BDE', glow: 'rgba(0,155,222,0.3)',  accent: '#FFFFFF' },
      'dreame':   { primary: '#6366F1', glow: 'rgba(99,102,241,0.3)', accent: '#FFFFFF' },
      'ecovacs':  { primary: '#00B0E8', glow: 'rgba(0,176,232,0.3)',  accent: '#FFFFFF' },
    },
  },

  // ═══ LAPTOP ═══════════════════════════════════════════════════════════════════
  laptop: {
    category: 'laptop',
    display_name: 'Laptop',
    columns: [
      { key: 'processor_gen',     label: 'İşlemci',             format: 'text',   parse_from_title: /(i\d|ryzen\s*\d+|m\d)/i,         priority: 'high'   },
      { key: 'ram_size',          label: 'RAM',     unit: 'GB', format: 'number', parse_from_title: /(\d+)\s*gb\s+(?:ram|lpddr|ddr|memory)/i,      priority: 'high'   },
      { key: 'display_brightness',label: 'Parlaklık',unit:'nits',format: 'number', parse_from_title: /(\d+)\s*nits?/i,                  priority: 'high'   },
      { key: 'storage',           label: 'Depolama',unit: 'GB', format: 'number', parse_from_title: /(\d+)\s*(?:tb|gb)?\s*(?:ssd|nvme|emmc|hdd)/i,  priority: 'high'   },
      { key: 'screen_size',       label: 'Ekran',  unit: 'inch',format: 'number', parse_from_title: /(\d+\.?\d*)\s*(inch|")/i,         priority: 'medium' },
    ],
    weights: {
      performance:  0.40,
      display:      0.25,
      battery:      0.20,
      build_quality:0.15,
    },
    brand_colors: {
      'apple':  { primary: '#F5F5F7', glow: 'rgba(245,245,247,0.2)', accent: '#06C'    },
      'dell':   { primary: '#007DB8', glow: 'rgba(0,125,184,0.3)',   accent: '#FFFFFF' },
      'hp':     { primary: '#0096D6', glow: 'rgba(0,150,214,0.3)',   accent: '#FFFFFF' },
      'lenovo': { primary: '#E2231A', glow: 'rgba(226,35,26,0.3)',   accent: '#FFFFFF' },
      'asus':   { primary: '#000000', glow: 'rgba(0,0,0,0.4)',       accent: '#FFD100' },
      'msi':    { primary: '#D12730', glow: 'rgba(209,39,48,0.3)',   accent: '#FFFFFF' },
    },
  },

  // ═══ AKILLI TELEFON ═══════════════════════════════════════════════════════════
  smartphone: {
    category: 'smartphone',
    display_name: 'Akıllı Telefon',
    columns: [
      { key: 'chipset',        label: 'İşlemci',               format: 'text',   parse_from_title: /(snapdragon\s*\d+|a\d+\s*bionic|exynos\s*\d+|tensor\s*g\d+)/i, priority: 'high'   },
      { key: 'ram',            label: 'RAM',       unit: 'GB', format: 'number', parse_from_title: /(\d+)\s*gb\s*ram/i,                                           priority: 'high'   },
      { key: 'display_refresh',label: 'Ekran Hz',  unit: 'Hz', format: 'number', parse_from_title: /(\d+)\s*hz/i,                                                  priority: 'high'   },
      { key: 'camera_mp',      label: 'Kamera',    unit: 'MP', format: 'number', parse_from_title: /(\d+)\s*mp/i,                                                  priority: 'medium' },
      { key: 'battery',        label: 'Batarya', unit: 'mAh', format: 'number', parse_from_title: /(\d+)\s*mah/i,                                                 priority: 'high'   },
    ],
    weights: {
      performance:  0.30,
      camera:       0.25,
      battery:      0.20,
      display:      0.15,
      build_quality:0.10,
    },
    brand_colors: {
      'apple':   { primary: '#F5F5F7', glow: 'rgba(245,245,247,0.2)', accent: '#06C'    },
      'samsung': { primary: '#1428A0', glow: 'rgba(20,40,160,0.3)',   accent: '#FFFFFF' },
      'google':  { primary: '#4285F4', glow: 'rgba(66,133,244,0.3)',  accent: '#EA4335' },
      'oneplus': { primary: '#F50514', glow: 'rgba(245,5,20,0.3)',    accent: '#FFFFFF' },
      'xiaomi':  { primary: '#FF6900', glow: 'rgba(255,105,0,0.3)',   accent: '#FFFFFF' },
    },
  },

  // ═══ KULALIK ════════════════════════════════════════════════════════════════
  headphones: {
    category: 'headphones',
    display_name: 'Kulaklık',
    columns: [
      { key: 'driver_size',      label: 'Sürücü',    unit: 'mm',   format: 'number', parse_from_title: /(\d+)\s*mm/i,                                                      priority: 'high'   },
      { key: 'battery_life',     label: 'Batarya',   unit: 'saat', format: 'number', parse_from_title: /(\d+)\s*(h|hour|saat|sa)\b/i,                                      priority: 'high'   },
      { key: 'noise_cancellation',label: 'ANC',                    format: 'text',                                                                                           priority: 'high'   },
      { key: 'connectivity',     label: 'Bağlantı',                format: 'text',                                                                                           priority: 'low'    },
    ],
    weights: {
      audio_quality:      0.40,
      noise_cancellation: 0.25,
      battery:            0.20,
      build_quality:      0.15,
    },
    brand_colors: {
      'sony':       { primary: '#000000', glow: 'rgba(0,0,0,0.4)',     accent: '#FF0000' },
      'bose':       { primary: '#000000', glow: 'rgba(0,0,0,0.4)',     accent: '#FFFFFF' },
      'apple':      { primary: '#F5F5F7', glow: 'rgba(245,245,247,0.2)',accent: '#06C'  },
      'sennheiser': { primary: '#000000', glow: 'rgba(0,0,0,0.4)',     accent: '#FFCC00' },
      'jbl':        { primary: '#FF6B00', glow: 'rgba(255,107,0,0.3)', accent: '#FFFFFF' },
    },
  },

  // ═══ TABLET ═══════════════════════════════════════════════════════════════════
  tablet: {
    category: 'tablet',
    display_name: 'Tablet',
    columns: [
      { key: 'processor',    label: 'İşlemci',               format: 'text',   parse_from_title: /(snapdragon\s*\d+|a\d+\s*bionic|m\d+)/i, priority: 'high'   },
      { key: 'screen_size',  label: 'Ekran',   unit: 'inch', format: 'number', parse_from_title: /(\d+\.?\d*)\s*(inch|")/i,                priority: 'high'   },
      { key: 'ram',          label: 'RAM',     unit: 'GB',   format: 'number', parse_from_title: /(\d+)\s*gb\s*ram/i,                      priority: 'high'   },
      { key: 'storage',      label: 'Depolama',unit: 'GB',   format: 'number',                                                             priority: 'medium' },
      { key: 'refresh_rate', label: 'Hz',      unit: 'Hz',   format: 'number', parse_from_title: /(\d+)\s*hz/i,                           priority: 'medium' },
    ],
    weights: {
      performance:  0.35,
      display:      0.30,
      battery:      0.20,
      build_quality:0.15,
    },
    brand_colors: {
      'apple':     { primary: '#F5F5F7', glow: 'rgba(245,245,247,0.2)', accent: '#06C'    },
      'samsung':   { primary: '#1428A0', glow: 'rgba(20,40,160,0.3)',   accent: '#FFFFFF' },
      'microsoft': { primary: '#00A4EF', glow: 'rgba(0,164,239,0.3)',   accent: '#FFFFFF' },
    },
  },

  // ═══ AKILLI SAAT ══════════════════════════════════════════════════════════════
  smartwatch: {
    category: 'smartwatch',
    display_name: 'Akıllı Saat',
    columns: [
      { key: 'battery_life', label: 'Batarya',    unit: 'gün',  format: 'number', parse_from_title: /(\d+)\s*(day|gün|gun)\b/i,           priority: 'high'   },
      { key: 'screen_size',  label: 'Ekran',      unit: 'mm',   format: 'number', parse_from_title: /(\d+)\s*mm/i,                        priority: 'medium' },
      { key: 'os',           label: 'İşletim Sistemi',          format: 'text',                                                            priority: 'medium' },
      { key: 'sensors',      label: 'Sensörler',                format: 'text',                                                            priority: 'high'   },
    ],
    weights: {
      health:       0.35,
      battery:      0.30,
      fitness:      0.20,
      build_quality:0.15,
    },
    brand_colors: {
      'apple':   { primary: '#F5F5F7', glow: 'rgba(245,245,247,0.2)', accent: '#06C'    },
      'samsung': { primary: '#1428A0', glow: 'rgba(20,40,160,0.3)',   accent: '#FFFFFF' },
      'garmin':  { primary: '#007CC3', glow: 'rgba(0,124,195,0.3)',   accent: '#FFFFFF' },
      'fitbit':  { primary: '#00B0B9', glow: 'rgba(0,176,185,0.3)',   accent: '#FFFFFF' },
    },
  },

  // ═══ TELEVİZYON ══════════════════════════════════════════════════════════════
  television: {
    category: 'television',
    display_name: 'Televizyon',
    columns: [
      { key: 'screen_size',   label: 'Ekran',      unit: 'inch', format: 'number', parse_from_title: /(\d+)\s*(inch|"|\s*inç)/i,          priority: 'high'   },
      { key: 'resolution',    label: 'Çözünürlük',               format: 'text',   parse_from_title: /(4k|8k|1080p|uhd)/i,                priority: 'high'   },
      { key: 'refresh_rate',  label: 'Hz',          unit: 'Hz',  format: 'number', parse_from_title: /(\d+)\s*hz/i,                       priority: 'high'   },
      { key: 'panel_type',    label: 'Panel',                    format: 'text',   parse_from_title: /(oled|qled|led|amoled)/i,           priority: 'medium' },
      { key: 'smart_os',      label: 'İşletim Sistemi',          format: 'text',                                                          priority: 'medium' },
    ],
    weights: {
      picture_quality:0.40,
      smart_features: 0.25,
      build_quality:  0.20,
      audio_quality:  0.15,
    },
    brand_colors: {
      'samsung': { primary: '#1428A0', glow: 'rgba(20,40,160,0.3)',   accent: '#FFFFFF' },
      'lg':      { primary: '#A50034', glow: 'rgba(165,0,52,0.3)',    accent: '#FFFFFF' },
      'sony':    { primary: '#000000', glow: 'rgba(0,0,0,0.4)',       accent: '#FF0000' },
      'philips': { primary: '#0A2240', glow: 'rgba(10,34,64,0.3)',    accent: '#FFFFFF' },
    },
  },
};

// ─── Kategori Config Getir ────────────────────────────────────────────────────
export function getSpecConfig(categorySlug: string): SpecConfig {
  if (!categorySlug) return buildDefaultConfig(categorySlug);

  const normalized = categorySlug.toLowerCase().trim();

  // Önce direkt eşleşme dene
  if (SPEC_CONFIGS[normalized]) return SPEC_CONFIGS[normalized];

  // Alias haritasında ara
  const aliasKey = SLUG_ALIASES[normalized];
  if (aliasKey && SPEC_CONFIGS[aliasKey]) return SPEC_CONFIGS[aliasKey];

  // Hiçbiri bulunamazsa default döner
  console.warn(`[spec-config] Bilinmeyen slug: "${categorySlug}" — default config kullanılıyor.`);
  return buildDefaultConfig(categorySlug);
}

function buildDefaultConfig(slug: string): SpecConfig {
  return {
    category: slug,
    display_name: slug,
    columns: [
      { key: 'brand', label: 'Marka', format: 'text',   priority: 'high'   },
      { key: 'model', label: 'Model', format: 'text',   priority: 'high'   },
      { key: 'year',  label: 'Yıl',   format: 'number', priority: 'medium' },
    ],
    weights: {
      performance: 0.40,
      build_quality:0.30,
      features:    0.30,
    },
    brand_colors: {},
  };
}

// ─── Marka Çıkarımı ──────────────────────────────────────────────────────────
export function extractBrand(title: string | undefined | null): string {
  if (!title) return 'default';

  const brands = [
    'apple', 'samsung', 'google', 'oneplus', 'xiaomi', 'huawei', 'oppo', 'vivo',
    'dell', 'hp', 'lenovo', 'asus', 'acer', 'msi', 'microsoft',
    'bmw', 'mercedes', 'audi', 'tesla', 'toyota', 'honda', 'ford', 'volkswagen',
    'sony', 'bose', 'sennheiser', 'jbl', 'beats',
    'roborock', 'irobot', 'dreame', 'ecovacs',
    'garmin', 'fitbit',
    'lg', 'philips', 'tcl', 'hisense',
  ];

  const lower = title.toLowerCase();
  for (const brand of brands) {
    if (lower.includes(brand)) return brand;
  }
  return 'default';
}
