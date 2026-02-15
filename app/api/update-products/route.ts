import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

interface ApifyWebhookPayload {
  userId: string;
  createdAt: string;
  eventType: string;
  actorId: string;
  actorRunId: string;
  eventData: {
    status: string;
    datasetId: string;
    category?: string; // Webhook'tan gelen kategori
  };
}

interface ApifyProduct {
  title?: string;
  brand?: string;
  asin?: string;
  price?: number | string;
  thumbnailImage?: string;
  url?: string;
  stars?: number | string;
  reviewsCount?: number | string;
  breadCrumbs?: string[];
  description?: string;
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
  specifications: any;
  is_active: boolean;
  stock_status: string;
  scraped_at: string;
}

// ============================================
// SKOR HESAPLAMA FONKSİYONLARI
// ============================================

interface ProductScores {
  [key: string]: number;
}

function calculateRobotVacuumScores(product: ApifyProduct): ProductScores {
  const stars = parseFloat(String(product.stars || 0));
  const reviewCount = parseInt(String(product.reviewsCount || 0));
  const description = (product.description || '').toLowerCase();
  const title = (product.title || '').toLowerCase();
  
  let battery_score = 5;
  const batteryMatch = description.match(/(\d+)\s*mah/i) || title.match(/(\d+)\s*mah/i);
  if (batteryMatch) {
    const mah = parseInt(batteryMatch[1]);
    battery_score = mah >= 5200 ? 10 : mah >= 4500 ? 8 : mah >= 3500 ? 6 : 4;
  } else {
    battery_score = Math.min(10, Math.round(stars * 1.8));
  }
  
  let suction_score = 5;
  const suctionMatch = description.match(/(\d+)\s*pa/i) || title.match(/(\d+)\s*pa/i);
  if (suctionMatch) {
    const pa = parseInt(suctionMatch[1]);
    suction_score = pa >= 8000 ? 10 : pa >= 6000 ? 9 : pa >= 5000 ? 7 : pa >= 3000 ? 5 : 3;
  } else {
    const reviewBonus = reviewCount > 1000 ? 2 : reviewCount > 500 ? 1 : 0;
    suction_score = Math.min(10, Math.round(stars * 1.5) + reviewBonus);
  }
  
  let noise_score = 5;
  const noiseMatch = description.match(/(\d+)\s*db/i) || title.match(/(\d+)\s*db/i);
  if (noiseMatch) {
    const db = parseInt(noiseMatch[1]);
    noise_score = db <= 60 ? 10 : db <= 65 ? 9 : db <= 70 ? 7 : db <= 75 ? 5 : 3;
  } else {
    noise_score = Math.min(10, Math.round(stars * 1.6));
  }
  
  let navigation_score = 5;
  if (description.includes('lidar') || title.includes('lidar')) {
    navigation_score = 10;
  } else if (description.includes('laser') || description.includes('ai')) {
    navigation_score = 9;
  } else if (description.includes('camera')) {
    navigation_score = 7;
  } else {
    navigation_score = Math.min(10, Math.round(stars * 1.7));
  }
  
  const overall_score = Math.round(
    (suction_score * 0.35) + (battery_score * 0.25) + 
    (navigation_score * 0.25) + (noise_score * 0.15)
  );
  
  return {
    battery_score: Math.min(10, Math.max(1, battery_score)),
    suction_score: Math.min(10, Math.max(1, suction_score)),
    noise_score: Math.min(10, Math.max(1, noise_score)),
    navigation_score: Math.min(10, Math.max(1, navigation_score)),
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

function calculateLaptopScores(product: ApifyProduct): ProductScores {
  const stars = parseFloat(String(product.stars || 0));
  const reviewCount = parseInt(String(product.reviewsCount || 0));
  const description = (product.description || '').toLowerCase();
  const title = (product.title || '').toLowerCase();
  
  // Performans skoru (işlemci bazlı)
  let performance_score = 5;
  if (title.includes('i9') || title.includes('ryzen 9')) performance_score = 10;
  else if (title.includes('i7') || title.includes('ryzen 7')) performance_score = 9;
  else if (title.includes('i5') || title.includes('ryzen 5')) performance_score = 7;
  else if (title.includes('i3') || title.includes('ryzen 3')) performance_score = 5;
  else performance_score = Math.min(10, Math.round(stars * 2));
  
  // Ekran skoru
  let display_score = Math.min(10, Math.round(stars * 1.8));
  if (description.includes('4k') || description.includes('oled')) display_score = 10;
  else if (description.includes('fhd') || description.includes('1080p')) display_score = 8;
  
  // Batarya skoru
  let battery_score = Math.min(10, Math.round(stars * 1.7));
  
  // Build kalite skoru
  let build_quality = reviewCount > 500 ? 8 : reviewCount > 100 ? 7 : 6;
  
  const overall_score = Math.round(
    (performance_score * 0.4) + (display_score * 0.25) + 
    (battery_score * 0.2) + (build_quality * 0.15)
  );
  
  return {
    performance_score,
    display_score,
    battery_score,
    build_quality,
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

function calculatePhoneScores(product: ApifyProduct): ProductScores {
  const stars = parseFloat(String(product.stars || 0));
  const reviewCount = parseInt(String(product.reviewsCount || 0));
  const description = (product.description || '').toLowerCase();
  
  let camera_score = Math.min(10, Math.round(stars * 1.9));
  if (description.includes('108mp') || description.includes('200mp')) camera_score = 10;
  else if (description.includes('64mp') || description.includes('50mp')) camera_score = 8;
  
  let performance_score = Math.min(10, Math.round(stars * 1.8));
  let battery_score = Math.min(10, Math.round(stars * 1.7));
  let display_score = Math.min(10, Math.round(stars * 1.8));
  
  const overall_score = Math.round(
    (camera_score * 0.3) + (performance_score * 0.3) + 
    (battery_score * 0.2) + (display_score * 0.2)
  );
  
  return {
    camera_score,
    performance_score,
    battery_score,
    display_score,
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

function calculateHeadphoneScores(product: ApifyProduct): ProductScores {
  const stars = parseFloat(String(product.stars || 0));
  const description = (product.description || '').toLowerCase();
  
  let sound_quality = Math.min(10, Math.round(stars * 2));
  let noise_cancelling = description.includes('anc') || description.includes('noise cancel') ? 10 : 5;
  let battery_score = Math.min(10, Math.round(stars * 1.8));
  let comfort_score = Math.min(10, Math.round(stars * 1.9));
  
  const overall_score = Math.round(
    (sound_quality * 0.35) + (noise_cancelling * 0.25) + 
    (battery_score * 0.2) + (comfort_score * 0.2)
  );
  
  return {
    sound_quality,
    noise_cancelling,
    battery_score,
    comfort_score,
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

function calculateSmartWatchScores(product: ApifyProduct): ProductScores {
  const stars = parseFloat(String(product.stars || 0));
  const description = (product.description || '').toLowerCase();
  
  let fitness_tracking = Math.min(10, Math.round(stars * 1.9));
  let battery_score = Math.min(10, Math.round(stars * 1.8));
  let display_score = Math.min(10, Math.round(stars * 1.7));
  let health_features = description.includes('ecg') || description.includes('spo2') ? 10 : 7;
  
  const overall_score = Math.round(
    (fitness_tracking * 0.3) + (battery_score * 0.25) + 
    (display_score * 0.25) + (health_features * 0.2)
  );
  
  return {
    fitness_tracking,
    battery_score,
    display_score,
    health_features,
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

// ============================================
// WEBHOOK ENDPOINT
// ============================================

export async function POST(request: NextRequest) {
  console.log('🎯 === WEBHOOK BAŞLADI ===');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials bulunamadı!');
      return NextResponse.json(
        { error: 'Supabase yapılandırılmamış' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: ApifyWebhookPayload = await request.json();
    console.log('📥 Gelen veri:', JSON.stringify(body, null, 2));

    const { eventData, actorRunId } = body;
    const datasetId = eventData?.datasetId;
    const categorySlug = eventData?.category || 'robot-supurge'; // Varsayılan
    
    if (!datasetId) {
      console.error('❌ Dataset ID bulunamadı!');
      return NextResponse.json(
        { error: 'Dataset ID bulunamadı' },
        { status: 400 }
      );
    }

    console.log(`📦 Dataset ID: ${datasetId}`);
    console.log(`📂 Kategori: ${categorySlug}`);

    // Apify'dan ürünleri çek
    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken) {
      console.error('❌ APIFY_TOKEN bulunamadı!');
      return NextResponse.json(
        { error: 'APIFY_TOKEN yapılandırılmamış' },
        { status: 500 }
      );
    }

    const apifyUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`;
    const apifyResponse = await fetch(apifyUrl);
    
    if (!apifyResponse.ok) {
      console.error(`❌ Apify API hatası: ${apifyResponse.status}`);
      throw new Error(`Apify API hatası: ${apifyResponse.status}`);
    }

    const rawProducts: ApifyProduct[] = await apifyResponse.json();
    console.log(`✅ Apify'dan ${rawProducts.length} ürün alındı`);

    if (rawProducts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Ürün bulunamadı',
        inserted: 0 
      });
    }

    // Kategoriyi Supabase'den bul
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (categoryError || !category) {
      console.error(`❌ Kategori bulunamadı: ${categorySlug}`, categoryError);
      return NextResponse.json(
        { error: `Kategori bulunamadı: ${categorySlug}` },
        { status: 500 }
      );
    }

    console.log(`✅ Kategori ID: ${category.id} (${categorySlug})`);

    // Ürünleri formatla ve skorları hesapla
    const products: SupabaseProduct[] = rawProducts.map((item: ApifyProduct) => {
      let price: number | null = null;
      if (item.price) {
        const priceStr = String(item.price).replace(/[^0-9.]/g, '');
        price = parseFloat(priceStr) || null;
      }

      let stars: number | null = null;
      if (item.stars) {
        stars = typeof item.stars === 'number' ? item.stars : parseFloat(String(item.stars)) || null;
      }

      let reviewsCount: number | null = null;
      if (item.reviewsCount) {
        reviewsCount = typeof item.reviewsCount === 'number' 
          ? item.reviewsCount 
          : parseInt(String(item.reviewsCount)) || null;
      }

      // Kategoriye göre skor hesapla
      let scores: ProductScores = {};
      switch (categorySlug) {
        case 'robot-supurge':
          scores = calculateRobotVacuumScores(item);
          break;
        case 'laptop':
          scores = calculateLaptopScores(item);
          break;
        case 'telefon':
          scores = calculatePhoneScores(item);
          break;
        case 'kulaklik':
          scores = calculateHeadphoneScores(item);
          break;
        case 'saat':
          scores = calculateSmartWatchScores(item);
          break;
        default:
          // Varsayılan skor: yıldız bazlı
          scores = {
            overall_score: Math.min(10, Math.round((stars || 0) * 2))
          };
      }

      return {
        category_id: category.id,
        name: item.title || '',
        brand: item.brand || '',
        model: item.asin || '',
        price: price,
        currency: 'TRY',
        image_url: item.thumbnailImage || null,
        source_url: item.url || '',
        source_name: 'Amazon',
        specifications: {
          stars: stars,
          reviewsCount: reviewsCount,
          categories: item.breadCrumbs || [],
          description: item.description || null,
          ...scores, // Skorları ekle
        },
        is_active: true,
        stock_status: 'in_stock',
        scraped_at: new Date().toISOString(),
      };
    });

    console.log(`📝 ${products.length} ürün formatlandı (skorlarla)`);

    // Supabase'e kaydet
    const { data, error } = await supabase
      .from('products')
      .upsert(products, {
        onConflict: 'source_name,source_url'
      });

    if (error) {
      console.error('❌ Supabase hatası:', error);
      throw error;
    }

    console.log(`💾 ${products.length} ürün Supabase'e kaydedildi`);
    console.log('🎉 === WEBHOOK TAMAMLANDI ===');

    return NextResponse.json({ 
      success: true,
      inserted: products.length,
      category: categorySlug,
      message: `${products.length} ürün (${categorySlug}) başarıyla güncellendi`
    });

  } catch (error) {
    console.error('❌ === HATA OLUŞTU ===');
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    console.error('Hata:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}
