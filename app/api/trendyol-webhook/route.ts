// app/api/trendyol-webhook/route.ts
// Trendyol → Apify → ratio.run webhook handler

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── Trendyol ürün formatı (Apify çıktısı) ────────────────────────────────────
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
  category?: string;
  categoryName?: string;
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

// ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────────

function parseTrendyolPrice(raw: any): number | null {
  if (!raw) return null;
  if (typeof raw === 'number') return raw > 0 ? raw : null;
  if (typeof raw === 'string') {
    // "1.299,00 TL" veya "1299.00" veya "1.299"
    const clean = raw.replace(/[^\d.,]/g, '');
    if (!clean) return null;
    // Türk formatı: 1.299,00
    if (clean.includes(',')) {
      const n = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
      return isNaN(n) || n <= 0 ? null : n;
    }
    // 1.299 → binlik nokta
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
  // Öncelik: indirimli fiyat > satış fiyatı > normal fiyat
  return (
    parseTrendyolPrice(item.discountedPrice) ||
    parseTrendyolPrice(item.salePrice) ||
    parseTrendyolPrice(item.price) ||
    parseTrendyolPrice(item.listPrice) ||
    parseTrendyolPrice(item.originalPrice) ||
    null
  );
}

function getProductId(item: TrendyolProduct): string | null {
  const raw = item.id || item.productId || item.contentId;
  if (!raw) return null;
  return `trendyol_${String(raw)}`;
}

function getProductUrl(item: TrendyolProduct): string {
  return item.url || item.link || item.productUrl || '';
}

function getImage(item: TrendyolProduct): string | null {
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
  // İsimden marka çıkar
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

// ── Özellik çıkarıcılar ───────────────────────────────────────────────────────

function getAttributeValue(item: TrendyolProduct, keys: string[]): string | null {
  if (!item.attributes) return null;
  for (const attr of item.attributes) {
    const attrKey = (attr.key || attr.name || '').toLowerCase();
    for (const key of keys) {
      if (attrKey.includes(key.toLowerCase())) {
        return attr.value || null;
      }
    }
  }
  return null;
}

function processPhoneSpecs(item: TrendyolProduct, stars: number) {
  const t = (item.name || item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  const ramAttr     = getAttributeValue(item, ['ram', 'bellek']);
  const storageAttr = getAttributeValue(item, ['depolama', 'hafıza', 'storage', 'dahili']);
  const screenAttr  = getAttributeValue(item, ['ekran', 'screen', 'display']);

  const ramMatch     = (ramAttr || t).match(/(\d+)\s*gb\s*ram/i) || t.match(/(\d+)\s*gb/i);
  const storageMatch = (storageAttr || t).match(/(\d+)\s*(gb|tb)/i);
  const mAhMatch     = d.match(/(\d+)\s*mah/i) || t.match(/(\d+)\s*mah/i);
  const mpMatch      = d.match(/(\d+)\s*mp/i) || t.match(/(\d+)\s*mp/i);

  const ram     = ramMatch ? parseInt(ramMatch[1]) : null;
  const storage = storageMatch ? parseInt(storageMatch[1]) : null;
  const mAh     = mAhMatch ? parseInt(mAhMatch[1]) : null;
  const mp      = mpMatch ? parseInt(mpMatch[1]) : null;

  const camera_score      = mp ? (mp >= 108 ? 10 : mp >= 64 ? 8 : mp >= 48 ? 7 : 6) : Math.min(10, Math.round(stars * 2));
  const battery_score     = mAh ? (mAh >= 5000 ? 10 : mAh >= 4500 ? 9 : mAh >= 4000 ? 7 : 5) : Math.min(10, Math.round(stars * 1.8));
  const performance_score = Math.min(10, Math.round(stars * 1.9));
  const display_score     = (d.includes('amoled') || d.includes('oled')) ? 9 : Math.min(10, Math.round(stars * 1.8));
  const overall_score     = Math.round(camera_score * 0.30 + performance_score * 0.30 + battery_score * 0.20 + display_score * 0.20);

  return {
    ram_gb: ram, storage_gb: storage, battery_mah: mAh, camera_mp: mp,
    camera_score, battery_score, performance_score, display_score, overall_score,
    spec_labels: {
      'RAM':       ram ? `${ram} GB` : null,
      'Depolama':  storage ? `${storage} GB` : null,
      'Batarya':   mAh ? `${mAh} mAh` : null,
      'Kamera':    mp ? `${mp} MP` : null,
      'Ekran':     screenAttr || null,
    }
  };
}

function processLaptopSpecs(item: TrendyolProduct, stars: number) {
  const t = (item.name || item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  const ramMatch     = t.match(/(\d+)\s*gb\s*ram/i) || t.match(/(\d+)\s*gb/i);
  const storageMatch = t.match(/(\d+)\s*(gb|tb)\s*(ssd|hdd)/i);
  const screenMatch  = t.match(/(\d+[.,]?\d*)\s*[""\u2033]?\s*inç?/i);
  const cpuAttr      = getAttributeValue(item, ['işlemci', 'cpu', 'processor']);
  const gpuAttr      = getAttributeValue(item, ['ekran kartı', 'gpu', 'graphics']);

  const ram     = ramMatch ? parseInt(ramMatch[1]) : null;
  const storage = storageMatch ? parseInt(storageMatch[1]) : null;
  const screen  = screenMatch ? parseFloat(screenMatch[1].replace(',', '.')) : null;

  const hasNvidia = d.includes('rtx') || d.includes('gtx') || d.includes('nvidia');
  const hasAMD    = d.includes('radeon') || d.includes('amd');

  const performance_score = Math.min(10, Math.round(stars * 1.9));
  const display_score     = screen ? (screen >= 17 ? 9 : screen >= 15 ? 8 : 7) : 7;
  const gpu_score         = hasNvidia ? 9 : hasAMD ? 8 : 6;
  const overall_score     = Math.round(performance_score * 0.35 + display_score * 0.25 + gpu_score * 0.25 + Math.min(10, Math.round(stars * 2)) * 0.15);

  return {
    ram_gb: ram, storage_gb: storage, screen_inch: screen,
    performance_score, display_score, gpu_score, overall_score,
    spec_labels: {
      'İşlemci':  cpuAttr || null,
      'RAM':      ram ? `${ram} GB` : null,
      'SSD':      storage ? `${storage} GB` : null,
      'Ekran':    screen ? `${screen} inç` : null,
      'GPU':      gpuAttr || (hasNvidia ? 'NVIDIA' : hasAMD ? 'AMD Radeon' : null),
    }
  };
}

function processGenericSpecs(item: TrendyolProduct, stars: number) {
  const overall_score = Math.min(10, Math.round(stars * 2));
  return { overall_score, spec_labels: {} };
}

// ── Ana webhook handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log('🛍️ === TRENDYOL WEBHOOK BAŞLADI ===');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();

    // Kategori slug ve run ID
    const categorySlug = body.category || body.eventData?.category || 'telefon';
    const runId        = body.actorRunId || body.eventData?.actorRunId;

    if (!runId) {
      return NextResponse.json({ error: 'Actor Run ID bulunamadı' }, { status: 400 });
    }

    console.log(`📂 Kategori: ${categorySlug} | Run: ${runId}`);

    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken) {
      return NextResponse.json({ error: 'APIFY_TOKEN eksik' }, { status: 500 });
    }

    // Apify'dan run detayları al
    const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
    if (!runRes.ok) throw new Error(`Apify Run: ${runRes.status}`);
    const runData   = await runRes.json();
    const datasetId = runData.data?.defaultDatasetId;
    if (!datasetId) return NextResponse.json({ error: 'Dataset ID bulunamadı' }, { status: 400 });

    // Ürünleri çek — limit 500 (Trendyol daha fazla ürün döndürüyor)
    const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&limit=500`);
    if (!dataRes.ok) throw new Error(`Apify Dataset: ${dataRes.status}`);
    const rawProducts: TrendyolProduct[] = await dataRes.json();

    console.log(`✅ ${rawProducts.length} Trendyol ürünü alındı`);

    if (rawProducts.length === 0) {
      return NextResponse.json({ success: true, message: 'Ürün bulunamadı', inserted: 0 });
    }

    // Kategori ID
    const { data: category, error: catErr } = await supabase
      .from('categories').select('id').eq('slug', categorySlug).single();

    if (catErr || !category) {
      return NextResponse.json({ error: `Kategori bulunamadı: ${categorySlug}` }, { status: 500 });
    }

    // Ürünleri işle
    const products: SupabaseProduct[] = rawProducts
      .filter(item => getProductId(item) && (item.name || item.title))
      .map(item => {
        const stars       = getStars(item);
        const reviewCount = getReviewCount(item);
        const price       = getBestPrice(item);
        const name        = cleanProductName(item);
        const brand       = getBrand(item, name);
        const productId   = getProductId(item)!;
        const url         = getProductUrl(item);
        const image       = getImage(item);

        let specs: any;
        switch (categorySlug) {
          case 'telefon': specs = processPhoneSpecs(item, stars); break;
          case 'laptop':  specs = processLaptopSpecs(item, stars); break;
          default:        specs = processGenericSpecs(item, stars); break;
        }

        return {
          category_id:    category.id,
          name,
          brand,
          model:          productId,
          price,
          currency:       'TRY',
          image_url:      image,
          source_url:     url,
          source_name:    'Trendyol',
          specifications: {
            stars,
            reviewsCount: reviewCount,
            listPrice:    parseTrendyolPrice(item.listPrice || item.originalPrice),
            ...specs,
          },
          is_active:    true,
          stock_status: price ? 'in_stock' : 'price_unavailable',
          scraped_at:   new Date().toISOString(),
        };
      });

    // 20'şer batch upsert
    const BATCH = 20;
    let upserted = 0;
    let errors   = 0;

    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH);
      const { error } = await supabase
        .from('products')
        .upsert(batch, { onConflict: 'model', ignoreDuplicates: false });

      if (error) {
        console.error(`Batch ${i} hatası:`, error.message);
        errors += batch.length;
      } else {
        upserted += batch.length;
      }
    }

    console.log(`💾 ${upserted} Trendyol ürünü eklendi, ${errors} hata`);

    return NextResponse.json({
      success:  true,
      upserted,
      errors,
      category: categorySlug,
      total:    products.length,
      source:   'Trendyol',
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
    console.error('❌ TRENDYOL WEBHOOK HATASI:', msg);
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
