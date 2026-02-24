// app/api/trendyol-webhook/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

interface TrendyolProduct {
  id?: string | number;
  productId?: string | number;
  contentId?: string | number;
  name?: string;
  title?: string;
  brand?: string;
  brandName?: string;
  price?: number | string;
  originalPrice?: number | string;
  discountedPrice?: number | string;
  salePrice?: number | string;
  listPrice?: number | string;
  images?: string[];
  image?: string;
  imageUrl?: string;
  url?: string;
  link?: string;
  productUrl?: string;
  rating?: number | string;
  ratingScore?: { averageRating?: number; totalCount?: number };
  starCount?: number;
  stars?: number;
  reviewCount?: number | string;
  commentCount?: number | string;
  description?: string;
  attributes?: Array<{ key?: string; value?: string; name?: string }>;
}

// ============================================================================
// KATEGORİ VALİDATÖRÜ — Yanlış ürünlerin DB'ye girmesini önler
// ============================================================================
const CATEGORY_RULES: Record<string, { required: RegExp[]; forbidden: RegExp[] }> = {
  // NOT: required listesi kasıtlı boş — Trendyol task'ı zaten doğru kategori URL'inden çekiyor.
  // Sadece forbidden ile aksesuar/yanlış ürünleri filtrele.
  telefon: {
    required: [],
    forbidden: [
      // Kulaklık
      /kulaklık|kulaklik|earpod|airpod|headphone|headset|\bbuds\b|gaming mikro/i,
      // Saat ve bileklik
      /akıllı saat|smart\s*watch|smartwatch|watch\s*(ultra|pro|plus|fit|se|gt)|band\s*\d/i,
      /bileklik|fitness\s*band/i,
      // Çocuk takip saatleri
      /sim\s*kart.*saat|çocuk.*saat|cocuk.*saat|takip.*saat|saat.*takip/i,
      // Robot ve aksesuarları
      /roborock|\brobot\b|mop\s*bezi|toz\s*torba|yan\s*fırça|ana\s*fırça|hepa\s*filtre/i,
      // TV ve aksesuarları
      /televizyon|\btv\b|kumanda|monitör|\bmonitor\b/i,
      // Tablet
      /\btablet\b|\btab\s+[a-z0-9]/i,
      // Cam silme / temizlik cihazları
      /cam\s*silme|pencere\s*temizle|püskürtme|püskürtmeli/i,
      // Stant ve aksesuar
      /\bstant\b|\bstand\b|araç\s*tutucu|masaüstü\s*tutucu/i,
      /kılıf|kilif|cam\s*koruyucu|ekran\s*koruyucu/i,
      /powerbank|power\s*bank|hoparlör/i,
    ],
  },
  laptop: {
    required: [],
    forbidden: [
      /soğutucu|sogutuc|webcam/i,
      /kulaklık|kulaklik/i,
      /kitap|roman|dergi/i,
      /\bmonitör\b|\bmonitor\b/i,
    ],
  },
  tablet: {
    required: [],
    forbidden: [
      /wacom|grafik tablet|çizim tablet|drawing pad|drawing tablet/i,
      /oyuncak|aktivite seti/i,
      /kitap|roman/i,
      /i2c|raspberry|arduino/i,
    ],
  },
  'robot-supurge': {
    required: [],
    forbidden: [
      /^yedek\s+/i,
      /^uyumlu\s+/i,
      /toz\s*torb/i,
      /pencere\s*temizle/i,
      /kapı\s*eşiği|kapi\s*esigi/i,
    ],
  },
  kulaklik: {
    required: [],
    forbidden: [
      /yedek\s*kulak\s*yast/i,
      /temizleme\s*seti/i,
    ],
  },
  saat: {
    required: [],
    forbidden: [
      /^yedek\s+kordon/i,
      /^kordon\s/i,
      /^kayış\s/i,
      /cam\s*koruyucu|ekran\s*koruyucu/i,
    ],
  },
  tv: {
    required: [],
    forbidden: [
      /ekran\s*koruyucu|tv\s*koruyucu/i,
      /north\s*bayou|duvar\s*askı|duvara\s*mont|tv\s*askı/i,
      /\bmonitör\b|\bmonitor\b/i,
      /karavan|\btekne\b/i,
      /kitap|roman|dergi/i,
    ],
  },
};

function isValidForCategory(name: string, categorySlug: string): boolean {
  const rules = CATEGORY_RULES[categorySlug];
  if (!rules) return true;

  const n = name.toLowerCase();

  for (const pattern of rules.forbidden) {
    if (pattern.test(n)) return false;
  }

  if (rules.required.length > 0) {
    const ok = rules.required.some((p) => p.test(n));
    if (!ok) return false;
  }

  return true;
}

// ============================================================================
// PRICE / FIELD HELPERS
// ============================================================================
function parseTrendyolPrice(raw: any): number | null {
  if (!raw) return null;
  if (typeof raw === 'number') return raw > 0 ? raw : null;
  if (typeof raw === 'string') {
    const clean = raw.replace(/[^\d.,]/g, '');
    if (!clean) return null;
    if (clean.includes(',')) {
      const n = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
      return isNaN(n) || n <= 0 ? null : n;
    }
    const parts = clean.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      return parseInt(clean.replace(/\./g, ''), 10) || null;
    }
    const n = parseFloat(clean);
    return isNaN(n) || n <= 0 ? null : n;
  }
  return null;
}

function getBestPrice(item: TrendyolProduct): number | null {
  return (
    parseTrendyolPrice(item.discountedPrice) ||
    parseTrendyolPrice(item.salePrice) ||
    parseTrendyolPrice(item.price) ||
    parseTrendyolPrice(item.listPrice) ||
    parseTrendyolPrice(item.originalPrice) ||
    null
  );
}

function getProductUrl(item: TrendyolProduct): string {
  return item.url || item.link || item.productUrl || '';
}

function getImage(item: TrendyolProduct): string | null {
  if (item.imageUrl) return item.imageUrl;
  if (item.images && item.images.length > 0) return item.images[0];
  return item.image || null;
}

function getStars(item: TrendyolProduct): number {
  if (item.ratingScore?.averageRating) return item.ratingScore.averageRating;
  const raw = item.rating || item.starCount || item.stars;
  const n = parseFloat(String(raw || 0));
  return isNaN(n) ? 0 : Math.min(5, n);
}

function getReviewCount(item: TrendyolProduct): number {
  const raw = item.ratingScore?.totalCount || item.reviewCount || item.commentCount;
  return parseInt(String(raw || 0)) || 0;
}

function getBrand(item: TrendyolProduct, name: string): string {
  const rawBrand = item.brand || item.brandName || '';
  if (rawBrand && rawBrand.length > 1) return rawBrand;
  const knownBrands = [
    'Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Huawei', 'OnePlus', 'Sony',
    'Lenovo', 'ASUS', 'HP', 'Dell', 'Acer', 'MSI', 'Toshiba',
    'JBL', 'Bose', 'Sennheiser', 'Jabra', 'Beats', 'Anker',
    'Garmin', 'Amazfit', 'Fitbit', 'Casio',
    'TCL', 'Hisense', 'Vestel', 'Arçelik', 'Grundig', 'Panasonic', 'LG', 'Philips',
    'Dyson', 'Roborock', 'Dreame', 'Ecovacs', 'iRobot',
  ];
  for (const b of knownBrands) {
    if (name.toLowerCase().startsWith(b.toLowerCase())) return b;
  }
  return name.split(' ')[0] || 'Diğer';
}

function cleanProductName(item: TrendyolProduct): string {
  const raw = item.name || item.title || '';
  if (!raw) return '';
  return raw.split(',')[0].split('|')[0].trim().substring(0, 80);
}

function normalizeForMatch(name: string, brand: string): string {
  return `${brand} ${name}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/(türkiye|turkey|garantili|garantisi|resmi|distribütör|ithalatçı|siyah|beyaz|gri|mavi|kırmızı|yeşil|altın|gümüş|\d+\s*ay)/gi, '')
    .trim()
    .substring(0, 60);
}

// ============================================================================
// SPEC + SKOR HESAPLAMA — Tüm Kategoriler
// ============================================================================
function processSpecs(item: TrendyolProduct, stars: number, categorySlug: string) {
  const t = (item.name || item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  // ── TELEFON ──────────────────────────────────────────────────────────────────
  if (categorySlug === 'telefon') {
    const ramMatch     = t.match(/(\d+)\s*gb\s*ram/i);
    const storageMatch = t.match(/(\d+)\s*gb/gi);
    const mAhMatch     = d.match(/(\d+)\s*mah/i) || t.match(/(\d+)\s*mah/i);
    const mpMatch      = d.match(/(\d+)\s*mp/i) || t.match(/(\d+)\s*mp/i);
    const hzMatch      = t.match(/(\d+)\s*hz/i);
    const ram     = ramMatch ? parseInt(ramMatch[1]) : null;
    const storage = storageMatch ? parseInt(storageMatch[storageMatch.length - 1]) : null;
    const mAh     = mAhMatch ? parseInt(mAhMatch[1]) : null;
    const mp      = mpMatch ? parseInt(mpMatch[1]) : null;
    const hz      = hzMatch ? parseInt(hzMatch[1]) : null;

    let perf = Math.min(10, Math.round(stars * 1.9));
    if (t.includes('snapdragon 8') || t.includes('a18') || t.includes('a17')) perf = 10;
    else if (t.includes('snapdragon 7') || t.includes('a16') || t.includes('dimensity 9')) perf = 9;
    else if (t.includes('snapdragon 6') || t.includes('a15') || t.includes('dimensity 8')) perf = 7;

    const camera  = mp ? (mp >= 108 ? 10 : mp >= 64 ? 8 : mp >= 48 ? 7 : 6) : Math.min(10, Math.round(stars * 2));
    const battery = mAh ? (mAh >= 5000 ? 10 : mAh >= 4500 ? 9 : mAh >= 4000 ? 7 : 5) : Math.min(10, Math.round(stars * 1.8));
    let display   = (d.includes('amoled') || d.includes('oled') || t.includes('amoled')) ? 9 : Math.min(10, Math.round(stars * 1.8));
    if (hz && hz >= 120) display = Math.min(10, display + 1);
    const overall = Math.round(camera * 0.30 + perf * 0.30 + battery * 0.20 + display * 0.20);

    return {
      ram_gb: ram, storage_gb: storage, battery_mah: mAh, camera_mp: mp, refresh_hz: hz,
      camera_score: camera, battery_score: battery, performance_score: perf, display_score: display, overall_score: overall,
      spec_labels: {
        'RAM': ram ? `${ram} GB` : null,
        'Depolama': storage ? `${storage} GB` : null,
        'Batarya': mAh ? `${mAh} mAh` : null,
        'Kamera': mp ? `${mp} MP` : null,
        'Ekran Hz': hz ? `${hz} Hz` : null,
      },
    };
  }

  // ── LAPTOP ───────────────────────────────────────────────────────────────────
  if (categorySlug === 'laptop') {
    const ramMatch    = t.match(/(\d+)\s*gb\s*(?:ram|ddr|lpddr)/i) || t.match(/(\d+)\s*gb(?!\s*ssd)/i);
    const ssdMatch    = t.match(/(\d+)\s*(tb|gb)\s*(ssd|nvme|emmc)/i);
    const screenMatch = t.match(/(\d+[.,]?\d*)\s*inç?/i);
    const hzMatch     = t.match(/(\d+)\s*hz/i);
    const ram    = ramMatch ? parseInt(ramMatch[1]) : null;
    let ssd: number | null = null;
    if (ssdMatch) {
      ssd = parseInt(ssdMatch[1]);
      if (ssdMatch[2].toLowerCase() === 'tb') ssd *= 1000;
    }
    const screen = screenMatch ? parseFloat(screenMatch[1].replace(',', '.')) : null;
    const hz     = hzMatch ? parseInt(hzMatch[1]) : null;

    let perf = Math.min(10, Math.round(stars * 1.9));
    if (t.includes('m4') || t.includes('i9') || t.includes('ryzen 9')) perf = 10;
    else if (t.includes('m3') || t.includes('i7') || t.includes('ryzen 7') || t.includes('i7')) perf = 9;
    else if (t.includes('m2') || t.includes('i5') || t.includes('ryzen 5') || t.includes('i5')) perf = 7;
    else if (t.includes('m1') || t.includes('i3') || t.includes('ryzen 3') || t.includes('n100') || t.includes('celeron')) perf = 5;

    const ramScore   = ram ? (ram >= 32 ? 10 : ram >= 16 ? 8 : ram >= 8 ? 6 : 4) : 5;
    const gpu        = (d.includes('rtx') || d.includes('gtx') || d.includes('nvidia') || t.includes('rtx')) ? 9 : 6;
    let display      = screen ? (screen >= 17 ? 9 : screen >= 15 ? 8 : 7) : 7;
    if (d.includes('oled') || t.includes('oled')) display = 10;
    if (hz && hz >= 144) display = Math.min(10, display + 1);
    const overall = Math.round(perf * 0.35 + ramScore * 0.25 + display * 0.25 + gpu * 0.15);

    return {
      ram_gb: ram, storage_gb: ssd, screen_inch: screen, refresh_hz: hz,
      performance_score: perf, ram_score: ramScore, display_score: display, gpu_score: gpu, overall_score: overall,
      spec_labels: {
        'RAM': ram ? `${ram} GB` : null,
        'SSD': ssd ? (ssd >= 1000 ? `${ssd / 1000} TB` : `${ssd} GB`) : null,
        'Ekran': screen ? `${screen} inç` : null,
        'Yenileme Hızı': hz ? `${hz} Hz` : null,
      },
    };
  }

  // ── ROBOT SÜPÜRGE ─────────────────────────────────────────────────────────────
  if (categorySlug === 'robot-supurge') {
    const paMatch   = d.match(/(\d[\d.]*)\s*pa/i) || t.match(/(\d[\d.]*)\s*pa/i);
    const mahMatch  = d.match(/(\d+)\s*mah/i) || t.match(/(\d+)\s*mah/i);
    const minMatch  = d.match(/(\d+)\s*(?:dk|dak|min)/i);
    const pa   = paMatch ? parseInt(paMatch[1]) : null;
    const mAh  = mahMatch ? parseInt(mahMatch[1]) : null;
    const mins = minMatch ? parseInt(minMatch[1]) : null;
    const hasLidar = d.includes('lidar') || t.includes('lidar');
    const hasMop   = d.includes('mop') || d.includes('ıslak') || t.includes('mop');
    const hasAuto  = d.includes('otomatik boşaltma') || d.includes('auto-empty');

    const suction  = pa ? (pa >= 8000 ? 10 : pa >= 6000 ? 9 : pa >= 4000 ? 7 : pa >= 2000 ? 5 : 3) : Math.min(10, Math.round(stars * 1.6));
    const nav      = hasLidar ? 10 : (d.includes('laser') || d.includes('ai')) ? 9 : 7;
    const batScore = mAh ? (mAh >= 5200 ? 10 : mAh >= 4500 ? 8 : mAh >= 3000 ? 6 : 4) : (mins ? (mins >= 180 ? 10 : mins >= 120 ? 8 : 6) : Math.min(10, Math.round(stars * 1.7)));
    const noise    = Math.min(10, Math.round(stars * 1.8));
    const overall  = Math.round(suction * 0.35 + nav * 0.30 + batScore * 0.20 + noise * 0.15);

    return {
      suction_pa: pa, battery_mah: mAh, has_lidar: hasLidar, has_mop: hasMop, has_auto_empty: hasAuto,
      suction_score: suction, navigation_score: nav, battery_score: batScore, noise_score: noise, overall_score: overall,
      spec_labels: {
        'Emme Gücü': pa ? `${pa} Pa` : null,
        'Batarya': mAh ? `${mAh} mAh` : null,
        'Navigasyon': hasLidar ? 'LiDAR' : 'Standart',
        'Paspas': hasMop ? 'Var' : 'Yok',
        'Oto Boşalt': hasAuto ? 'Var' : 'Yok',
      },
    };
  }

  // ── KULAKLIK ─────────────────────────────────────────────────────────────────
  if (categorySlug === 'kulaklik') {
    const hoursMatch = d.match(/(\d+)\s*sa(?:at)?/i) || d.match(/(\d+)\s*hour/i) || t.match(/(\d+)\s*sa(?:at)?/i);
    const hours      = hoursMatch ? parseInt(hoursMatch[1]) : null;
    const hasANC     = d.includes('anc') || d.includes('gürültü engelleme') || t.includes('anc');
    const isWireless = d.includes('bluetooth') || d.includes('kablosuz') || t.includes('tws') || t.includes('bluetooth');

    const sound   = Math.min(10, Math.round(stars * 2));
    const anc     = hasANC ? 10 : (isWireless ? 5 : 3);
    const batLife = hours ? (hours >= 40 ? 10 : hours >= 30 ? 9 : hours >= 20 ? 7 : hours >= 10 ? 5 : 3) : (isWireless ? Math.min(10, Math.round(stars * 1.8)) : 10);
    const comfort = Math.min(10, Math.round(stars * 1.9));
    const overall = Math.round(sound * 0.35 + anc * 0.25 + batLife * 0.20 + comfort * 0.20);

    return {
      battery_hours: hours, has_anc: hasANC, is_wireless: isWireless,
      sound_quality: sound, noise_cancelling: anc, battery_score: batLife, comfort_score: comfort, overall_score: overall,
      spec_labels: {
        'Pil Ömrü': hours ? `${hours} saat` : (!isWireless ? 'Kablolu' : null),
        'ANC': hasANC ? 'Var' : 'Yok',
        'Bağlantı': isWireless ? 'Kablosuz' : 'Kablolu',
      },
    };
  }

  // ── AKILLI SAAT ───────────────────────────────────────────────────────────────
  if (categorySlug === 'saat') {
    const dayMatch  = d.match(/(\d+)\s*g[üu]n/i) || t.match(/(\d+)\s*g[üu]n/i);
    const sizeMatch = t.match(/(\d+[,.]?\d*)\s*mm/i);
    const days = dayMatch ? parseInt(dayMatch[1]) : null;
    const size = sizeMatch ? parseFloat(sizeMatch[1].replace(',', '.')) : null;
    const hasGPS    = d.includes('gps') || t.includes('gps');
    const hasAMOLED = d.includes('amoled') || t.includes('amoled');
    const hasSpO2   = d.includes('spo2') || d.includes('kan oksijen');
    const hasECG    = d.includes('ecg') || d.includes('ekg');

    const bat     = days ? (days >= 14 ? 10 : days >= 10 ? 9 : days >= 7 ? 8 : days >= 5 ? 6 : 5) : Math.min(10, Math.round(stars * 1.8));
    const display = hasAMOLED ? Math.min(10, Math.round(stars * 1.7) + 2) : Math.min(10, Math.round(stars * 1.7));
    const fit     = hasGPS ? Math.min(10, Math.round(stars * 1.9) + 1) : Math.min(10, Math.round(stars * 1.9));
    const health  = 7 + (hasECG ? 2 : 0) + (hasSpO2 ? 1 : 0);
    const overall = Math.round(fit * 0.30 + bat * 0.25 + display * 0.25 + Math.min(10, health) * 0.20);

    return {
      battery_days: days, size_mm: size, has_gps: hasGPS, has_ecg: hasECG, has_amoled: hasAMOLED,
      battery_score: bat, display_score: display, fitness_score: fit, health_score: health, overall_score: overall,
      spec_labels: {
        'Pil Ömrü': days ? `${days} gün` : null,
        'Kasa Boyutu': size ? `${size} mm` : null,
        'GPS': hasGPS ? 'Var' : 'Yok',
        'ECG': hasECG ? 'Var' : 'Yok',
        'SpO2': hasSpO2 ? 'Var' : 'Yok',
        'Ekran': hasAMOLED ? 'AMOLED' : 'LCD',
      },
    };
  }

  // ── TABLET ─────────────────────────────────────────────────────────────────
  if (categorySlug === 'tablet') {
    const ramMatch     = t.match(/(\d+)\s*gb\s*(?:ram|memory|bellek)/i);
    const storageMatch = t.match(/(\d+)\s*(?:gb|tb)\s*(?:depolama|storage|rom)/i);
    const screenMatch  = t.match(/(\d+[.,]?\d*)\s*inç?/i);
    const mahMatch     = d.match(/(\d+)\s*mah/i);
    const ram    = ramMatch ? parseInt(ramMatch[1]) : null;
    const storage = storageMatch ? parseInt(storageMatch[1]) : null;
    const screen = screenMatch ? parseFloat(screenMatch[1].replace(',', '.')) : null;
    const mAh   = mahMatch ? parseInt(mahMatch[1]) : null;

    let perf = Math.min(10, Math.round(stars * 1.9));
    if (t.includes('m4') || t.includes('snapdragon 8')) perf = 10;
    else if (t.includes('m3') || t.includes('m2') || t.includes('a17')) perf = 9;
    else if (t.includes('m1') || t.includes('a15')) perf = 8;

    const display  = screen ? (screen >= 12 ? 9 : screen >= 10 ? 8 : 7) : Math.min(10, Math.round(stars * 1.8));
    const batScore = mAh ? (mAh >= 10000 ? 10 : mAh >= 8000 ? 9 : mAh >= 6000 ? 7 : 5) : Math.min(10, Math.round(stars * 1.7));
    const ramScore = ram ? (ram >= 16 ? 10 : ram >= 8 ? 8 : ram >= 6 ? 6 : 4) : 5;
    const overall  = Math.round(perf * 0.30 + display * 0.30 + batScore * 0.20 + ramScore * 0.20);

    return {
      ram_gb: ram, storage_gb: storage, screen_inch: screen, battery_mah: mAh,
      performance_score: perf, display_score: display, battery_score: batScore, ram_score: ramScore, overall_score: overall,
      spec_labels: {
        'RAM': ram ? `${ram} GB` : null,
        'Depolama': storage ? `${storage} GB` : null,
        'Ekran': screen ? `${screen} inç` : null,
        'Batarya': mAh ? `${mAh} mAh` : null,
      },
    };
  }

  // ── TV ──────────────────────────────────────────────────────────────────────
  if (categorySlug === 'tv') {
    const sizeMatch = t.match(/(\d+)\s*inç?/i) || t.match(/(\d+)[""]/);
    const hzMatch   = d.match(/(\d+)\s*hz/i) || t.match(/(\d+)\s*hz/i);
    const size = sizeMatch ? parseInt(sizeMatch[1]) : null;
    const hz   = hzMatch ? parseInt(hzMatch[1]) : null;
    const is4K    = d.includes('4k') || d.includes('uhd') || t.includes('4k');
    const is8K    = d.includes('8k') || t.includes('8k');
    const isOLED  = d.includes('oled') || t.includes('oled');
    const isQLED  = d.includes('qled') || t.includes('qled');
    const hasDolby = d.includes('dolby');
    const smartOS  = d.includes('google tv') || d.includes('webos') || d.includes('tizen');

    let pic = Math.min(10, Math.round(stars * 1.8));
    if (is8K || isOLED) pic = 10;
    else if (isQLED) pic = 9;
    else if (is4K) pic = 8;

    const sizeScore = size ? (size >= 75 ? 10 : size >= 65 ? 9 : size >= 55 ? 8 : size >= 43 ? 7 : 6) : 6;
    const smart     = smartOS ? (hz && hz >= 120 ? 10 : 9) : 6;
    const overall   = Math.round(pic * 0.35 + sizeScore * 0.25 + smart * 0.25 + Math.min(10, Math.round(stars * 1.7)) * 0.15);

    return {
      screen_inch: size, refresh_hz: hz, is_4k: is4K, is_oled: isOLED, is_qled: isQLED,
      picture_quality: pic, screen_size_score: sizeScore, smart_score: smart, overall_score: overall,
      spec_labels: {
        'Ekran': size ? `${size} inç` : null,
        'Çözünürlük': is8K ? '8K' : is4K ? '4K UHD' : 'Full HD',
        'Panel': isOLED ? 'OLED' : isQLED ? 'QLED' : 'LED',
        'Yenileme Hızı': hz ? `${hz} Hz` : null,
        'Smart TV': smartOS ? 'Evet' : 'Hayır',
      },
    };
  }

  // ── FALLBACK ────────────────────────────────────────────────────────────────
  return {
    overall_score: Math.min(10, Math.round(stars * 2)),
    spec_labels: {},
  };
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================
export async function POST(request: NextRequest) {
  console.log('🛍️ === TRENDYOL WEBHOOK BAŞLADI ===');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body         = await request.json();
    const categorySlug = body.category || body.eventData?.category || 'telefon';
    const runId        = body.actorRunId || body.eventData?.actorRunId;

    if (!runId) return NextResponse.json({ error: 'Actor Run ID bulunamadı' }, { status: 400 });

    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken) return NextResponse.json({ error: 'APIFY_TOKEN eksik' }, { status: 500 });

    const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
    if (!runRes.ok) throw new Error(`Apify Run: ${runRes.status}`);
    const runData   = await runRes.json();
    const datasetId = runData.data?.defaultDatasetId;
    if (!datasetId) return NextResponse.json({ error: 'Dataset ID bulunamadı' }, { status: 400 });

    const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&limit=500`);
    if (!dataRes.ok) throw new Error(`Apify Dataset: ${dataRes.status}`);
    const rawProducts: TrendyolProduct[] = await dataRes.json();

    console.log(`📦 [${categorySlug}] ${rawProducts.length} ürün alındı`);
    if (rawProducts.length === 0) return NextResponse.json({ success: true, inserted: 0 });

    const { data: category } = await supabase
      .from('categories').select('id').eq('slug', categorySlug).single();
    if (!category) return NextResponse.json({ error: `Kategori bulunamadı: ${categorySlug}` }, { status: 500 });

    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, name, brand, model, price, avg_price, sources')
      .eq('category_id', category.id);

    let inserted = 0;
    let merged   = 0;
    let rejected = 0;
    let errors   = 0;

    for (const item of rawProducts) {
      try {
        const name  = cleanProductName(item);
        const brand = getBrand(item, name);
        const price = getBestPrice(item);
        const stars = getStars(item);
        const url   = getProductUrl(item);
        const image = getImage(item);

        if (!name || !price) continue;

        // ── KATEGORİ VALİDASYONU ──
        if (!isValidForCategory(name, categorySlug)) {
          console.log(`⛔ Reddedildi [${categorySlug}]: ${name.substring(0, 60)}`);
          rejected++;
          continue;
        }

        const specs         = processSpecs(item, stars, categorySlug);
        const normalizedNew = normalizeForMatch(name, brand);

        const existing = existingProducts?.find(p => {
          const norm = normalizeForMatch(p.name, p.brand);
          return norm.substring(0, 30) === normalizedNew.substring(0, 30);
        });

        if (existing) {
          const { data: priceRows } = await supabase
            .from('product_prices')
            .select('price')
            .eq('product_id', existing.id);

          await supabase.from('product_prices').upsert({
            product_id:  existing.id,
            source_name: 'Trendyol',
            source_url:  url,
            price,
            currency:    'TRY',
            scraped_at:  new Date().toISOString(),
          }, { onConflict: 'product_id,source_name' });

          const allPrices = [...(priceRows || []).map(r => r.price), price].filter(Boolean);
          const avgPrice  = Math.round(allPrices.reduce((a: number, b: number) => a + b, 0) / allPrices.length);

          const sources       = Array.isArray(existing.sources) ? existing.sources : [];
          const updatedSources = [...sources.filter((s: any) => s.name !== 'Trendyol'), { name: 'Trendyol', url, price }];

          await supabase.from('products').update({
            avg_price: avgPrice,
            sources:   updatedSources,
          }).eq('id', existing.id);

          merged++;
        } else {
          const trendyolId = `trendyol_${item.id || item.productId || item.contentId || Date.now()}`;

          const { data: newProduct, error: insertErr } = await supabase
            .from('products')
            .upsert({
              category_id:    category.id,
              name,
              brand,
              model:          trendyolId,
              price,
              avg_price:      price,
              currency:       'TRY',
              image_url:      image,
              source_url:     url,
              source_name:    'Trendyol',
              sources:        [{ name: 'Trendyol', url, price }],
              specifications: {
                stars,
                reviewsCount: getReviewCount(item),
                ...specs,
              },
              is_active:    true,
              stock_status: 'in_stock',
              scraped_at:   new Date().toISOString(),
            }, { onConflict: 'model' })
            .select('id')
            .single();

          if (insertErr) {
            errors++;
          } else if (newProduct) {
            await supabase.from('product_prices').upsert({
              product_id:  newProduct.id,
              source_name: 'Trendyol',
              source_url:  url,
              price,
              currency:    'TRY',
              scraped_at:  new Date().toISOString(),
            }, { onConflict: 'product_id,source_name' });
            inserted++;
          }
        }
      } catch (e) {
        errors++;
      }
    }

    console.log(`✅ ${inserted} yeni | ${merged} birleştirildi | ${rejected} reddedildi | ${errors} hata`);

    return NextResponse.json({
      success: true, inserted, merged, rejected, errors,
      category: categorySlug, total: rawProducts.length, source: 'Trendyol',
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
    console.error('❌ TRENDYOL WEBHOOK HATASI:', msg);
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
