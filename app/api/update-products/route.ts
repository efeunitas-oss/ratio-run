import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// RATIO.RUN — WEBHOOK HANDLER v3 (PRODUCTION FIX)
// Düzeltmeler:
//   1. price: {value, currency} → price.value doğru parse ediliyor
//   2. name: Amazon başlığından temiz marka+model çıkarılıyor
//   3. brand: title'ın ilk kelimesinden extract ediliyor
//   4. specifications: title'dan kategori bazlı özellikler parse ediliyor
//   5. upsert: ASIN bazlı güncelleme (tekrar run edilince fiyat güncellenir)
// ============================================================================

interface ApifyWebhookPayload {
  userId: string;
  createdAt: string;
  eventType: string;
  actorId: string;
  actorRunId?: string;
  category?: string;
  eventData: {
    status: string;
    datasetId?: string;
    category?: string;
    actorRunId?: string;
    actorId?: string;
    actorTaskId?: string;
  };
}

// Apify'ın gerçek çıktı formatı
interface ApifyProduct {
  title?: string;
  brand?: string;
  asin?: string;
  price?: { value?: number; currency?: string } | number | string | null;
  thumbnailImage?: string;
  url?: string;
  stars?: number | string;
  reviewsCount?: number | string;
  breadCrumbs?: string[];
  description?: string;
  images?: string[];
}

interface SupabaseProduct {
  category_id: string;
  name: string;
  brand: string;
  model: string;
  price: number | null;
  currency: string;
  image_url: string | null;
  source_url: string;
  source_name: string;
  specifications: Record<string, any>;
  is_active: boolean;
  stock_status: string;
  scraped_at: string;
}

// ── Fiyat Parser ──────────────────────────────────────────────────────────────
// Apify price: {value: 22599, currency: "TL"} veya number veya string
function parsePrice(raw: any): number | null {
  if (!raw) return null;

  // Apify price objesi: {value: 22.599, currency: "TL"}
  // Türk formatında nokta binlik ayırıcı → 22.599 = 22599 TL
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    const num = Number(raw.value);
    if (isNaN(num) || num <= 0) return null;
    // 3 ondalık hane varsa → Türk binlik formatı (7.912 → 7912)
    const str = String(raw.value);
    const dotIdx = str.indexOf('.');
    if (dotIdx !== -1 && str.length - dotIdx - 1 === 3) {
      return Math.round(num * 1000);
    }
    // 2 ondalık hane → gerçek ondalık (normal float)
    return num;
  }

  if (typeof raw === 'number') {
    if (raw <= 0) return null;
    const str = String(raw);
    const dotIdx = str.indexOf('.');
    if (dotIdx !== -1 && str.length - dotIdx - 1 === 3) {
      return Math.round(raw * 1000);
    }
    return raw;
  }

  if (typeof raw === 'string') {
    const clean = raw.replace(/[^\d.,]/g, '');
    if (!clean) return null;
    // "22.599" veya "22.599,00" formatı
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

// ── İsim Temizleyici ──────────────────────────────────────────────────────────
// "Samsung Galaxy A56 5G, Android Akıllı Telefon, 256GB..." → "Samsung Galaxy A56 5G"
function cleanName(title: string): string {
  if (!title) return '';
  // Virgül, pipe, tire+büyük harf, parantez öncesinde kes
  const cleaned = title
    .split(/,|\s*\|\s*|\s+-\s+(?=[A-Z])/)[0]
    .trim();
  // Maksimum 60 karakter
  return cleaned.length > 60 ? cleaned.substring(0, 57) + '...' : cleaned;
}

// ── Marka Extractor ───────────────────────────────────────────────────────────
function extractBrand(title: string, apifyBrand?: string): string {
  if (apifyBrand && apifyBrand.length > 1 && !apifyBrand.startsWith('Marka:')) {
    return apifyBrand;
  }
  const knownBrands = [
    'Apple', 'Samsung', 'Huawei', 'Xiaomi', 'OPPO', 'OnePlus', 'Sony',
    'LG', 'Philips', 'Dyson', 'Bosch', 'Tefal', 'Rowenta', 'Ecovacs',
    'Roborock', 'Dreame', 'iRobot', 'Homend', 'Lenovo', 'ASUS', 'HP',
    'Dell', 'Acer', 'MSI', 'Toshiba', 'JBL', 'Bose', 'Sennheiser',
    'AKG', 'Jabra', 'Beats', 'Anker', 'Garmin', 'Fitbit', 'Amazfit',
    'TCL', 'Hisense', 'Vestel', 'Arçelik', 'Grundig', 'Panasonic',
    'Mercedes-Benz', 'Mercedes', 'BMW', 'Toyota', 'MG',
  ];
  for (const brand of knownBrands) {
    if (title.toLowerCase().startsWith(brand.toLowerCase())) return brand;
  }
  return title.split(' ')[0] || '';
}

// ── Sayısal Güvenli Parser ────────────────────────────────────────────────────
function safeNum(val: any): number {
  if (typeof val === 'number') return val;
  const n = parseFloat(String(val || 0));
  return isNaN(n) ? 0 : n;
}
function safeInt(val: any): number {
  const n = parseInt(String(val || 0));
  return isNaN(n) ? 0 : n;
}

// ============================================================================
// KATEGORI BAZLI SKOR + SPEC PARSER'LAR
// ============================================================================

function processPhone(item: ApifyProduct, stars: number, reviewCount: number) {
  const t = (item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  // Spec extraction from title
  const ramMatch    = t.match(/(\d+)\s*gb\s*ram/i);
  const storageArr  = [...t.matchAll(/(\d+)\s*gb/gi)];
  const screenMatch = t.match(/(\d+[,.]?\d*)\s*in[çc]/i) || t.match(/(\d+[,.]?\d*)["\u2033]/);
  const mpMatch     = d.match(/(\d+)\s*mp/i) || t.match(/(\d+)\s*mp/i);
  const mAhMatch    = d.match(/(\d+)\s*mah/i) || t.match(/(\d+)\s*mah/i);

  const ram     = ramMatch ? parseInt(ramMatch[1]) : null;
  const storage = storageArr.length > 1 ? parseInt(storageArr[storageArr.length - 1][1]) : null;
  const screen  = screenMatch ? parseFloat(screenMatch[1].replace(',', '.')) : null;
  const mp      = mpMatch ? parseInt(mpMatch[1]) : null;
  const mAh     = mAhMatch ? parseInt(mAhMatch[1]) : null;

  // Scores
  let camera_score = Math.min(10, Math.round(stars * 1.9));
  if (mp) camera_score = mp >= 108 ? 10 : mp >= 64 ? 8 : mp >= 48 ? 7 : 6;

  let performance_score = Math.min(10, Math.round(stars * 1.8));
  if (t.includes('snapdragon 8') || t.includes('a17') || t.includes('a18')) performance_score = 10;
  else if (t.includes('snapdragon 7') || t.includes('a16') || t.includes('dimensity 9')) performance_score = 9;
  else if (t.includes('snapdragon 6') || t.includes('a15') || t.includes('dimensity 8')) performance_score = 7;

  let battery_score = Math.min(10, Math.round(stars * 1.7));
  if (mAh) battery_score = mAh >= 5000 ? 10 : mAh >= 4500 ? 9 : mAh >= 4000 ? 7 : 5;

  let display_score = Math.min(10, Math.round(stars * 1.8));
  if (d.includes('amoled') || d.includes('oled') || t.includes('amoled')) display_score = 9;
  if (d.includes('120hz') || d.includes('144hz') || t.includes('120hz')) display_score = Math.min(10, display_score + 1);

  const overall_score = Math.round(
    camera_score * 0.30 + performance_score * 0.30 +
    battery_score * 0.20 + display_score * 0.20
  );

  return {
    specs: {
      ram_gb: ram, storage_gb: storage, screen_inch: screen,
      camera_mp: mp, battery_mah: mAh,
      has_5g: t.includes('5g'), has_nfc: d.includes('nfc'),
    },
    scores: {
      camera_score, performance_score, battery_score, display_score, overall_score,
    },
    spec_labels: {
      'RAM': ram ? `${ram} GB` : null,
      'Depolama': storage ? `${storage} GB` : null,
      'Ekran': screen ? `${screen} inç` : null,
      'Kamera': mp ? `${mp} MP` : null,
      'Batarya': mAh ? `${mAh} mAh` : null,
      '5G': t.includes('5g') ? 'Evet' : 'Hayır',
    },
  };
}

function processLaptop(item: ApifyProduct, stars: number, reviewCount: number) {
  const t = (item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  const ramMatch     = t.match(/(\d+)\s*gb(?:\s*ddr\d*)?\s*ram/i) || t.match(/(\d+)\s*gb\s*(?:unified|birleşik)/i);
  const ssdMatch     = t.match(/(\d+)\s*(?:gb|tb)\s*ssd/i) || t.match(/(\d+)\s*tb\s*ssd/i);
  const screenMatch  = t.match(/(\d+[,.]?\d*)\s*in[çc]/i) || t.match(/(\d+[,.]?\d*)["\u2033]/);
  const hzMatch      = t.match(/(\d+)\s*hz/i);

  const ram    = ramMatch ? parseInt(ramMatch[1]) : null;
  let ssd: number | null = null;
  if (ssdMatch) {
    ssd = parseInt(ssdMatch[1]);
    if (ssdMatch[0].toLowerCase().includes('tb')) ssd *= 1000;
  }
  const screen = screenMatch ? parseFloat(screenMatch[1].replace(',', '.')) : null;
  const hz     = hzMatch ? parseInt(hzMatch[1]) : null;

  let performance_score = Math.min(10, Math.round(stars * 2));
  if (t.includes('m4') || t.includes('i9') || t.includes('ryzen 9')) performance_score = 10;
  else if (t.includes('m3') || t.includes('i7') || t.includes('ryzen 7')) performance_score = 9;
  else if (t.includes('m2') || t.includes('i5') || t.includes('ryzen 5')) performance_score = 7;
  else if (t.includes('m1') || t.includes('i3') || t.includes('ryzen 3')) performance_score = 6;

  let ram_score = 5;
  if (ram) ram_score = ram >= 32 ? 10 : ram >= 16 ? 8 : ram >= 8 ? 6 : 4;

  let display_score = Math.min(10, Math.round(stars * 1.8));
  if (d.includes('oled') || t.includes('oled')) display_score = 10;
  else if (d.includes('retina') || d.includes('ips') || t.includes('ips')) display_score = 8;
  if (hz && hz >= 144) display_score = Math.min(10, display_score + 1);

  let build_quality = reviewCount > 500 ? 9 : reviewCount > 100 ? 7 : 6;

  const overall_score = Math.round(
    performance_score * 0.35 + ram_score * 0.25 +
    display_score * 0.25 + build_quality * 0.15
  );

  return {
    specs: { ram_gb: ram, ssd_gb: ssd, screen_inch: screen, refresh_hz: hz },
    scores: { performance_score, ram_score, display_score, build_quality, overall_score },
    spec_labels: {
      'RAM': ram ? `${ram} GB` : null,
      'SSD': ssd ? (ssd >= 1000 ? `${ssd/1000} TB` : `${ssd} GB`) : null,
      'Ekran': screen ? `${screen} inç` : null,
      'Yenileme Hızı': hz ? `${hz} Hz` : null,
    },
  };
}

function processRobotVacuum(item: ApifyProduct, stars: number, reviewCount: number) {
  const t = (item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  const paMatch    = d.match(/(\d[\d.]*)\s*pa/i) || t.match(/(\d[\d.]*)\s*pa/i);
  const mahMatch   = d.match(/(\d+)\s*mah/i) || t.match(/(\d+)\s*mah/i);
  const dbMatch    = d.match(/(\d+)\s*db/i) || t.match(/(\d+)\s*db/i);
  const minMatch   = d.match(/(\d+)\s*(?:dk|dak|min)/i) || t.match(/(\d+)\s*(?:dk|dak|min)/i);

  const pa   = paMatch ? parseInt(paMatch[1]) : null;
  const mAh  = mahMatch ? parseInt(mahMatch[1]) : null;
  const db   = dbMatch ? parseInt(dbMatch[1]) : null;
  const mins = minMatch ? parseInt(minMatch[1]) : null;

  const hasLidar = d.includes('lidar') || t.includes('lidar');
  const hasMop   = d.includes('mop') || d.includes('ıslak') || t.includes('ıslak') || t.includes('moplu');
  const hasAuto  = d.includes('otomatik boşaltma') || d.includes('auto-empty') || t.includes('otomatik boşaltma');

  let suction_score = Math.min(10, Math.round(stars * 1.5));
  if (pa) suction_score = pa >= 8000 ? 10 : pa >= 6000 ? 9 : pa >= 4000 ? 7 : pa >= 2000 ? 5 : 3;

  let navigation_score = Math.min(10, Math.round(stars * 1.7));
  if (hasLidar) navigation_score = 10;
  else if (d.includes('laser') || d.includes('ai')) navigation_score = 9;
  else if (d.includes('camera') || d.includes('kamera')) navigation_score = 7;

  let battery_score = Math.min(10, Math.round(stars * 1.8));
  if (mAh) battery_score = mAh >= 5200 ? 10 : mAh >= 4500 ? 8 : mAh >= 3000 ? 6 : 4;
  else if (mins) battery_score = mins >= 200 ? 10 : mins >= 120 ? 8 : mins >= 90 ? 6 : 4;

  let noise_score = Math.min(10, Math.round(stars * 1.6));
  if (db) noise_score = db <= 60 ? 10 : db <= 65 ? 9 : db <= 70 ? 7 : 5;

  const overall_score = Math.round(
    suction_score * 0.35 + navigation_score * 0.30 +
    battery_score * 0.20 + noise_score * 0.15
  );

  return {
    specs: { suction_pa: pa, battery_mah: mAh, noise_db: db, runtime_min: mins, has_lidar: hasLidar, has_mop: hasMop, has_auto_empty: hasAuto },
    scores: { suction_score, navigation_score, battery_score, noise_score, overall_score },
    spec_labels: {
      'Emiş Gücü': pa ? `${pa} Pa` : null,
      'Batarya': mAh ? `${mAh} mAh` : null,
      'Gürültü': db ? `${db} dB` : null,
      'Çalışma Süresi': mins ? `${mins} dk` : null,
      'Navigasyon': hasLidar ? 'LiDAR' : d.includes('laser') ? 'Lazer' : 'Standart',
      'Paspas': hasMop ? 'Var' : 'Yok',
    },
  };
}

function processHeadphone(item: ApifyProduct, stars: number, reviewCount: number) {
  const t = (item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  const hoursMatch = d.match(/(\d+)\s*sa(?:at)?/i) || d.match(/(\d+)\s*hour/i) || t.match(/(\d+)\s*sa(?:at)?/i);
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : null;

  const hasANC    = d.includes('anc') || d.includes('active noise') || d.includes('gürültü engelleme') || t.includes('anc');
  const isWireless = !d.includes('kablolu') && (d.includes('bluetooth') || d.includes('kablosuz') || t.includes('tws'));
  const hasHiRes  = d.includes('hi-res') || d.includes('high resolution');

  let sound_quality = Math.min(10, Math.round(stars * 2));
  if (hasHiRes) sound_quality = Math.min(10, sound_quality + 1);

  let noise_cancelling = isWireless ? 5 : 3;
  if (hasANC) noise_cancelling = 10;

  let battery_score = 5;
  if (hours) battery_score = hours >= 40 ? 10 : hours >= 30 ? 9 : hours >= 20 ? 7 : hours >= 10 ? 5 : 3;
  else if (!isWireless) battery_score = 10;
  else battery_score = Math.min(10, Math.round(stars * 1.8));

  let comfort_score = Math.min(10, Math.round(stars * 1.9));

  const overall_score = Math.round(
    sound_quality * 0.35 + noise_cancelling * 0.25 +
    battery_score * 0.20 + comfort_score * 0.20
  );

  return {
    specs: { battery_hours: hours, has_anc: hasANC, is_wireless: isWireless, has_hi_res: hasHiRes },
    scores: { sound_quality, noise_cancelling, battery_score, comfort_score, overall_score },
    spec_labels: {
      'Pil Ömrü': hours ? `${hours} saat` : (!isWireless ? 'Kablolu' : null),
      'ANC': hasANC ? 'Var' : 'Yok',
      'Bağlantı': isWireless ? 'Kablosuz' : 'Kablolu',
      'Hi-Res': hasHiRes ? 'Evet' : 'Hayır',
    },
  };
}

function processSmartwatch(item: ApifyProduct, stars: number, reviewCount: number) {
  const t = (item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  const dayMatch  = d.match(/(\d+)\s*g[üu]n/i) || d.match(/(\d+)\s*day/i) || t.match(/(\d+)\s*g[üu]n/i);
  const sizeMatch = t.match(/(\d+[,.]?\d*)\s*mm/i);
  const days  = dayMatch ? parseInt(dayMatch[1]) : null;
  const size  = sizeMatch ? parseFloat(sizeMatch[1].replace(',','.')) : null;

  const hasGPS    = d.includes('gps') || t.includes('gps');
  const hasECG    = d.includes('ecg') || d.includes('ekg') || d.includes('elektrokardiyogram');
  const hasAMOLED = d.includes('amoled') || d.includes('super retina');
  const hasSpO2   = d.includes('spo2') || d.includes('kan oksijen') || d.includes('oksimetre');

  let battery_score = Math.min(10, Math.round(stars * 1.8));
  if (days) battery_score = days >= 14 ? 10 : days >= 10 ? 9 : days >= 7 ? 8 : days >= 5 ? 6 : days >= 3 ? 5 : 4;

  let display_score = Math.min(10, Math.round(stars * 1.7));
  if (hasAMOLED) display_score = Math.min(10, display_score + 2);

  let fitness_score = Math.min(10, Math.round(stars * 1.9));
  if (hasGPS) fitness_score = Math.min(10, fitness_score + 1);

  let health_features = 7;
  if (hasECG) health_features = Math.min(10, health_features + 2);
  if (hasSpO2) health_features = Math.min(10, health_features + 1);

  const overall_score = Math.round(
    fitness_score * 0.30 + battery_score * 0.25 +
    display_score * 0.25 + health_features * 0.20
  );

  return {
    specs: { battery_days: days, size_mm: size, has_gps: hasGPS, has_ecg: hasECG, has_amoled: hasAMOLED, has_spo2: hasSpO2 },
    scores: { battery_score, display_score, fitness_score, health_features, overall_score },
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

function processTablet(item: ApifyProduct, stars: number, reviewCount: number) {
  const t = (item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  const ramMatch     = t.match(/(\d+)\s*gb(?:\s*birleşik)?\s*(?:bellek|ram|memory)/i);
  const storageMatch = t.match(/(\d+)\s*(?:gb|tb)\s*(?:ssd|depolama|storage)/i);
  const screenMatch  = t.match(/(\d+[,.]?\d*)\s*in[çc]/i);
  const mahMatch     = d.match(/(\d+)\s*mah/i);

  const ram    = ramMatch ? parseInt(ramMatch[1]) : null;
  const storage = storageMatch ? parseInt(storageMatch[1]) : null;
  const screen = screenMatch ? parseFloat(screenMatch[1].replace(',','.')) : null;
  const mAh   = mahMatch ? parseInt(mahMatch[1]) : null;

  let performance_score = Math.min(10, Math.round(stars * 1.9));
  if (t.includes('m4') || t.includes('snapdragon 8 gen')) performance_score = 10;
  else if (t.includes('m3') || t.includes('m2') || t.includes('a17')) performance_score = 9;
  else if (t.includes('m1') || t.includes('a15') || t.includes('snapdragon 7')) performance_score = 8;

  let display_score = screen ? (screen >= 12 ? 9 : screen >= 10 ? 8 : 7) : Math.min(10, Math.round(stars * 1.8));
  if (d.includes('oled') || d.includes('liquid retina')) display_score = Math.min(10, display_score + 1);

  let battery_score = Math.min(10, Math.round(stars * 1.7));
  if (mAh) battery_score = mAh >= 10000 ? 10 : mAh >= 8000 ? 9 : mAh >= 6000 ? 7 : 5;

  let ram_score = 5;
  if (ram) ram_score = ram >= 16 ? 10 : ram >= 8 ? 8 : ram >= 6 ? 6 : 4;

  const overall_score = Math.round(
    performance_score * 0.30 + display_score * 0.30 +
    battery_score * 0.20 + ram_score * 0.20
  );

  return {
    specs: { ram_gb: ram, storage_gb: storage, screen_inch: screen, battery_mah: mAh },
    scores: { performance_score, display_score, battery_score, ram_score, overall_score },
    spec_labels: {
      'RAM': ram ? `${ram} GB` : null,
      'Depolama': storage ? `${storage} GB` : null,
      'Ekran': screen ? `${screen} inç` : null,
      'Batarya': mAh ? `${mAh} mAh` : null,
    },
  };
}

function processTV(item: ApifyProduct, stars: number, reviewCount: number) {
  const t = (item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  const sizeMatch = t.match(/(\d+)["\u2033\s]inç?/i) || t.match(/(\d+)\s*["']/) || d.match(/(\d+)\s*inch/i);
  const hzMatch   = d.match(/(\d+)\s*hz/i) || t.match(/(\d+)\s*hz/i);

  const size = sizeMatch ? parseInt(sizeMatch[1]) : null;
  const hz   = hzMatch ? parseInt(hzMatch[1]) : null;

  const is4K   = d.includes('4k') || d.includes('uhd') || t.includes('4k');
  const is8K   = d.includes('8k') || t.includes('8k');
  const isOLED = d.includes('oled') || t.includes('oled');
  const isQLED = d.includes('qled') || t.includes('qled');
  const hasDolby = d.includes('dolby vision') || d.includes('dolby atmos');
  const smartOS = d.includes('google tv') || d.includes('webos') || d.includes('tizen') || d.includes('android tv');

  let picture_quality = Math.min(10, Math.round(stars * 1.8));
  if (is8K) picture_quality = 10;
  else if (isOLED) picture_quality = 10;
  else if (isQLED) picture_quality = 9;
  else if (is4K) picture_quality = 8;

  let screen_size_score = size ? (size >= 75 ? 10 : size >= 65 ? 9 : size >= 55 ? 8 : size >= 43 ? 7 : 6) : 6;
  let smart_score = smartOS ? 9 : 6;
  if (hz && hz >= 120) smart_score = Math.min(10, smart_score + 1);
  let sound_score = Math.min(10, Math.round(stars * 1.7));
  if (hasDolby) sound_score = Math.min(10, sound_score + 1);
  let hdr_score = hasDolby ? 10 : is4K ? 8 : 6;

  const overall_score = Math.round(
    picture_quality * 0.35 + screen_size_score * 0.25 +
    smart_score * 0.20 + sound_score * 0.10 + hdr_score * 0.10
  );

  return {
    specs: { screen_inch: size, refresh_hz: hz, is_4k: is4K, is_oled: isOLED, is_qled: isQLED, has_dolby: hasDolby, smart_os: smartOS },
    scores: { picture_quality, screen_size_score, smart_score, sound_score, hdr_score, overall_score },
    spec_labels: {
      'Ekran Boyutu': size ? `${size} inç` : null,
      'Çözünürlük': is8K ? '8K' : is4K ? '4K UHD' : 'Full HD',
      'Panel': isOLED ? 'OLED' : isQLED ? 'QLED' : 'LED',
      'Yenileme Hızı': hz ? `${hz} Hz` : null,
      'HDR': hasDolby ? 'Dolby Vision' : is4K ? 'HDR10' : 'Yok',
      'Smart TV': smartOS ? 'Evet' : 'Hayır',
    },
  };
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('🎯 === WEBHOOK BAŞLADI ===');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://srypulfxbckherkmrjgs.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeXB1bGZ4YmNraGVya21yamdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE1NzMwNywiZXhwIjoyMDg2NzMzMzA3fQ.2k9r-KEWjTXmQjTkFm1wMztoquQGVhz2aiUD1R_UJz4';

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: ApifyWebhookPayload = await request.json();

    const { eventData } = body;
    const categorySlug = body.category || eventData?.category || 'robot-supurge';
    const runId        = body.actorRunId || eventData?.actorRunId;

    if (!runId) {
      return NextResponse.json({ error: 'Actor Run ID bulunamadı' }, { status: 400 });
    }

    console.log(`📂 Kategori: ${categorySlug} | Run: ${runId}`);

    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken) {
      return NextResponse.json({ error: 'APIFY_TOKEN eksik' }, { status: 500 });
    }

    // Apify'dan dataset ID al
    const runDetailsRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
    if (!runDetailsRes.ok) throw new Error(`Apify Run Details: ${runDetailsRes.status}`);
    const runDetails = await runDetailsRes.json();
    const datasetId  = runDetails.data?.defaultDatasetId;
    if (!datasetId) return NextResponse.json({ error: 'Dataset ID bulunamadı' }, { status: 400 });

    // Ürünleri çek
    const apifyRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&limit=200`);
    if (!apifyRes.ok) throw new Error(`Apify Dataset: ${apifyRes.status}`);
    const rawProducts: ApifyProduct[] = await apifyRes.json();

    console.log(`✅ ${rawProducts.length} ürün alındı`);

    if (rawProducts.length === 0) {
      return NextResponse.json({ success: true, message: 'Ürün bulunamadı', inserted: 0 });
    }

    // Kategori ID'sini al
    const { data: category, error: catErr } = await supabase
      .from('categories').select('id').eq('slug', categorySlug).single();

    if (catErr || !category) {
      console.error(`Kategori bulunamadı: ${categorySlug}`);
      return NextResponse.json({ error: `Kategori bulunamadı: ${categorySlug}` }, { status: 500 });
    }

    const allProducts: SupabaseProduct[] = rawProducts
      .filter((item) => item.asin && item.title)
      .map((item) => {
        const stars       = safeNum(item.stars);
        const reviewCount = safeInt(item.reviewsCount);
        const price       = parsePrice(item.price);
        const name        = cleanName(item.title || '');
        const brand       = extractBrand(item.title || '', item.brand);

        // Kategori bazlı işleme
        let processed: any;
        switch (categorySlug) {
          case 'telefon':      processed = processPhone(item, stars, reviewCount);     break;
          case 'laptop':       processed = processLaptop(item, stars, reviewCount);    break;
          case 'robot-supurge':processed = processRobotVacuum(item, stars, reviewCount); break;
          case 'kulaklik':     processed = processHeadphone(item, stars, reviewCount); break;
          case 'saat':         processed = processSmartwatch(item, stars, reviewCount); break;
          case 'tablet':       processed = processTablet(item, stars, reviewCount);    break;
          case 'tv':           processed = processTV(item, stars, reviewCount);        break;
          default:
            processed = {
              specs: {},
              scores: { overall_score: Math.min(10, Math.round(stars * 2)) },
              spec_labels: {},
            };
        }

        return {
          category_id:    category.id,
          name,
          brand,
          model:          item.asin!,
          price,
          currency:       'TRY',
          image_url:      item.thumbnailImage || (item.images?.[0]) || null,
          source_url:     item.url || '',
          source_name:    'Amazon TR',
          specifications: {
            stars,
            reviewsCount: reviewCount,
            ...processed.specs,
            ...processed.scores,
            spec_labels: processed.spec_labels,
          },
          is_active:   true,
          stock_status: price ? 'in_stock' : 'price_unavailable',
          scraped_at:  new Date().toISOString(),
        };
      });

    // ASIN bazlı upsert — her run'da fiyat ve özellikler güncellenir
    const BATCH = 20;
    let upsertedCount = 0;
    let errorCount    = 0;

    for (let i = 0; i < allProducts.length; i += BATCH) {
      const batch = allProducts.slice(i, i + BATCH);
      const { error } = await supabase
        .from('products')
        .upsert(batch, { onConflict: 'model', ignoreDuplicates: false });

      if (error) {
        console.error(`Batch ${i} upsert hatası:`, error.message);
        errorCount += batch.length;
      } else {
        upsertedCount += batch.length;
      }
    }

    console.log(`💾 ${upsertedCount} ürün upsert edildi, ${errorCount} hata`);
    console.log('🎉 === WEBHOOK TAMAMLANDI ===');

    return NextResponse.json({
      success:   true,
      upserted:  upsertedCount,
      errors:    errorCount,
      category:  categorySlug,
      total:     allProducts.length,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Bilinmeyen hata';
    console.error('❌ WEBHOOK HATASI:', msg);
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
