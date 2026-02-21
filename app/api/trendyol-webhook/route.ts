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

// İsim normalizer — eşleştirme için
function normalizeForMatch(name: string, brand: string): string {
  return `${brand} ${name}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/(türkiye|turkey|garantili|garantisi|resmi|distribütör|ithalatçı|siyah|beyaz|gri|mavi|kırmızı|yeşil|altın|gümüş|\d+\s*ay)/gi, '')
    .trim()
    .substring(0, 60);
}

function processSpecs(item: TrendyolProduct, stars: number, categorySlug: string) {
  const t = (item.name || item.title || '').toLowerCase();
  const d = (item.description || '').toLowerCase();

  if (categorySlug === 'telefon') {
    const ramMatch     = t.match(/(\d+)\s*gb\s*ram/i);
    const storageMatch = t.match(/(\d+)\s*gb/gi);
    const mAhMatch     = d.match(/(\d+)\s*mah/i) || t.match(/(\d+)\s*mah/i);
    const mpMatch      = d.match(/(\d+)\s*mp/i) || t.match(/(\d+)\s*mp/i);
    const ram     = ramMatch ? parseInt(ramMatch[1]) : null;
    const storage = storageMatch ? parseInt(storageMatch[storageMatch.length - 1]) : null;
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
        'RAM': ram ? `${ram} GB` : null,
        'Depolama': storage ? `${storage} GB` : null,
        'Batarya': mAh ? `${mAh} mAh` : null,
        'Kamera': mp ? `${mp} MP` : null,
      }
    };
  }

  if (categorySlug === 'laptop') {
    const ramMatch     = t.match(/(\d+)\s*gb\s*ram/i) || t.match(/(\d+)\s*gb/i);
    const storageMatch = t.match(/(\d+)\s*(gb|tb)\s*(ssd|hdd)/i);
    const screenMatch  = t.match(/(\d+[.,]?\d*)\s*inç?/i);
    const ram     = ramMatch ? parseInt(ramMatch[1]) : null;
    const storage = storageMatch ? parseInt(storageMatch[1]) : null;
    const screen  = screenMatch ? parseFloat(screenMatch[1].replace(',', '.')) : null;
    const hasNvidia = d.includes('rtx') || d.includes('gtx') || d.includes('nvidia');
    const performance_score = Math.min(10, Math.round(stars * 1.9));
    const display_score     = screen ? (screen >= 17 ? 9 : screen >= 15 ? 8 : 7) : 7;
    const gpu_score         = hasNvidia ? 9 : 6;
    const overall_score     = Math.round(performance_score * 0.35 + display_score * 0.25 + gpu_score * 0.25 + Math.min(10, Math.round(stars * 2)) * 0.15);
    return {
      ram_gb: ram, storage_gb: storage, screen_inch: screen,
      performance_score, display_score, gpu_score, overall_score,
      spec_labels: {
        'RAM': ram ? `${ram} GB` : null,
        'SSD': storage ? `${storage} GB` : null,
        'Ekran': screen ? `${screen} inç` : null,
      }
    };
  }

  return { overall_score: Math.min(10, Math.round(stars * 2)), spec_labels: {} };
}

export async function POST(request: NextRequest) {
  console.log('🛍️ === TRENDYOL WEBHOOK BAŞLADI ===');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
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

    if (rawProducts.length === 0) return NextResponse.json({ success: true, inserted: 0 });

    const { data: category } = await supabase
      .from('categories').select('id').eq('slug', categorySlug).single();
    if (!category) return NextResponse.json({ error: `Kategori bulunamadı: ${categorySlug}` }, { status: 500 });

    // Mevcut ürünleri çek — eşleştirme için
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, name, brand, model, price, avg_price, sources')
      .eq('category_id', category.id);

    let inserted = 0;
    let merged   = 0;
    let errors   = 0;

    for (const item of rawProducts) {
      try {
        const name  = cleanProductName(item);
        const brand = getBrand(item, name);
        const price = getBestPrice(item);
        const stars = getStars(item);
        const url   = getProductUrl(item);
        const image = getImage(item);
        const specs = processSpecs(item, stars, categorySlug);

        if (!name || !price) continue;

        const normalizedNew = normalizeForMatch(name, brand);

        // Mevcut ürünlerle eşleştir
        const existing = existingProducts?.find(p => {
          const normalizedExisting = normalizeForMatch(p.name, p.brand);
          // İlk 30 karakter eşleşiyorsa aynı ürün say
          return normalizedExisting.substring(0, 30) === normalizedNew.substring(0, 30);
        });

        if (existing) {
          // Aynı ürün var — fiyat kaynağı ekle, ortalama güncelle
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
          const avgPrice  = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);

          const sources = Array.isArray(existing.sources) ? existing.sources : [];
          const trendyolSource = { name: 'Trendyol', url, price };
          const updatedSources = [...sources.filter((s: any) => s.name !== 'Trendyol'), trendyolSource];

          await supabase.from('products').update({
            avg_price: avgPrice,
            sources:   updatedSources,
          }).eq('id', existing.id);

          merged++;
        } else {
          // Yeni ürün — ekle
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

    console.log(`✅ ${inserted} yeni, ${merged} birleştirildi, ${errors} hata`);

    return NextResponse.json({
      success: true, inserted, merged, errors,
      category: categorySlug, total: rawProducts.length, source: 'Trendyol',
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
    console.error('❌ TRENDYOL WEBHOOK HATASI:', msg);
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
