import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
  
  let performance_score = 5;
  if (title.includes('i9') || title.includes('ryzen 9')) performance_score = 10;
  else if (title.includes('i7') || title.includes('ryzen 7')) performance_score = 9;
  else if (title.includes('i5') || title.includes('ryzen 5')) performance_score = 7;
  else if (title.includes('i3') || title.includes('ryzen 3')) performance_score = 5;
  else performance_score = Math.min(10, Math.round(stars * 2));
  
  let ram_score = 5;
  const ramMatch = description.match(/(\d+)\s*gb\s*ram/i) || title.match(/(\d+)\s*gb\s*ram/i);
  if (ramMatch) {
    const ram = parseInt(ramMatch[1]);
    ram_score = ram >= 32 ? 10 : ram >= 16 ? 9 : ram >= 8 ? 7 : 5;
  } else {
    ram_score = Math.min(10, Math.round(stars * 1.7));
  }
  
  let display_score = Math.min(10, Math.round(stars * 1.8));
  if (description.includes('4k') || description.includes('oled')) display_score = 10;
  else if (description.includes('fhd') || description.includes('1080p')) display_score = 8;
  
  let battery_score = Math.min(10, Math.round(stars * 1.7));
  let build_quality = reviewCount > 500 ? 9 : reviewCount > 100 ? 7 : 6;
  
  const overall_score = Math.round(
    (performance_score * 0.35) + (ram_score * 0.2) + 
    (display_score * 0.2) + (battery_score * 0.15) + (build_quality * 0.1)
  );
  
  return {
    performance_score: Math.min(10, Math.max(1, performance_score)),
    ram_score: Math.min(10, Math.max(1, ram_score)),
    display_score: Math.min(10, Math.max(1, display_score)),
    battery_score: Math.min(10, Math.max(1, battery_score)),
    build_quality: Math.min(10, Math.max(1, build_quality)),
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

function calculatePhoneScores(product: ApifyProduct): ProductScores {
  const stars = parseFloat(String(product.stars || 0));
  const reviewCount = parseInt(String(product.reviewsCount || 0));
  const description = (product.description || '').toLowerCase();
  const title = (product.title || '').toLowerCase();
  
  let camera_score = Math.min(10, Math.round(stars * 1.9));
  if (description.includes('108mp') || description.includes('200mp')) camera_score = 10;
  else if (description.includes('64mp') || description.includes('50mp')) camera_score = 8;
  else if (description.includes('48mp')) camera_score = 7;
  
  let performance_score = 5;
  if (title.includes('snapdragon 8') || title.includes('a17') || title.includes('a16')) performance_score = 10;
  else if (title.includes('snapdragon 7') || title.includes('a15')) performance_score = 8;
  else performance_score = Math.min(10, Math.round(stars * 1.8));
  
  let battery_score = 5;
  const batteryMatch = description.match(/(\d+)\s*mah/i) || title.match(/(\d+)\s*mah/i);
  if (batteryMatch) {
    const mah = parseInt(batteryMatch[1]);
    battery_score = mah >= 5000 ? 10 : mah >= 4500 ? 9 : mah >= 4000 ? 7 : 5;
  } else {
    battery_score = Math.min(10, Math.round(stars * 1.7));
  }
  
  let display_score = Math.min(10, Math.round(stars * 1.8));
  if (description.includes('amoled') || description.includes('oled')) display_score = 9;
  if (description.includes('120hz') || description.includes('144hz')) display_score = Math.min(10, display_score + 1);
  
  const overall_score = Math.round(
    (camera_score * 0.3) + (performance_score * 0.3) + 
    (battery_score * 0.2) + (display_score * 0.2)
  );
  
  return {
    camera_score: Math.min(10, Math.max(1, camera_score)),
    performance_score: Math.min(10, Math.max(1, performance_score)),
    battery_score: Math.min(10, Math.max(1, battery_score)),
    display_score: Math.min(10, Math.max(1, display_score)),
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

function calculateHeadphoneScores(product: ApifyProduct): ProductScores {
  const stars = parseFloat(String(product.stars || 0));
  const reviewCount = parseInt(String(product.reviewsCount || 0));
  const description = (product.description || '').toLowerCase();
  const title = (product.title || '').toLowerCase();
  
  let sound_quality = Math.min(10, Math.round(stars * 2));
  if (description.includes('hi-res') || description.includes('high-res')) sound_quality = Math.min(10, sound_quality + 1);
  
  let noise_cancelling = 5;
  if (description.includes('anc') || description.includes('active noise') || description.includes('noise cancel')) {
    noise_cancelling = 10;
  } else if (description.includes('passive noise')) {
    noise_cancelling = 6;
  }
  
  let battery_score = 5;
  const batteryMatch = description.match(/(\d+)\s*hours?/i) || title.match(/(\d+)\s*hours?/i);
  if (batteryMatch) {
    const hours = parseInt(batteryMatch[1]);
    battery_score = hours >= 40 ? 10 : hours >= 30 ? 9 : hours >= 20 ? 7 : 5;
  } else {
    battery_score = Math.min(10, Math.round(stars * 1.8));
  }
  
  let comfort_score = Math.min(10, Math.round(stars * 1.9));
  const reviewBonus = reviewCount > 1000 ? 1 : 0;
  comfort_score = Math.min(10, comfort_score + reviewBonus);
  
  const overall_score = Math.round(
    (sound_quality * 0.35) + (noise_cancelling * 0.25) + 
    (battery_score * 0.2) + (comfort_score * 0.2)
  );
  
  return {
    sound_quality: Math.min(10, Math.max(1, sound_quality)),
    noise_cancelling: Math.min(10, Math.max(1, noise_cancelling)),
    battery_score: Math.min(10, Math.max(1, battery_score)),
    comfort_score: Math.min(10, Math.max(1, comfort_score)),
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

function calculateSmartWatchScores(product: ApifyProduct): ProductScores {
  const stars = parseFloat(String(product.stars || 0));
  const reviewCount = parseInt(String(product.reviewsCount || 0));
  const description = (product.description || '').toLowerCase();
  const title = (product.title || '').toLowerCase();
  
  let fitness_tracking = Math.min(10, Math.round(stars * 1.9));
  if (description.includes('gps')) fitness_tracking = Math.min(10, fitness_tracking + 1);
  
  let battery_score = 5;
  const batteryMatch = description.match(/(\d+)\s*day/i) || title.match(/(\d+)\s*day/i);
  if (batteryMatch) {
    const days = parseInt(batteryMatch[1]);
    battery_score = days >= 14 ? 10 : days >= 7 ? 9 : days >= 5 ? 7 : days >= 3 ? 6 : 5;
  } else {
    battery_score = Math.min(10, Math.round(stars * 1.8));
  }
  
  let display_score = Math.min(10, Math.round(stars * 1.7));
  if (description.includes('amoled') || description.includes('oled')) display_score = Math.min(10, display_score + 1);
  
  let health_features = 7;
  if (description.includes('ecg') || description.includes('ekg')) health_features += 2;
  if (description.includes('spo2') || description.includes('blood oxygen')) health_features += 1;
  health_features = Math.min(10, health_features);
  
  const overall_score = Math.round(
    (fitness_tracking * 0.3) + (battery_score * 0.25) + 
    (display_score * 0.25) + (health_features * 0.2)
  );
  
  return {
    fitness_tracking: Math.min(10, Math.max(1, fitness_tracking)),
    battery_score: Math.min(10, Math.max(1, battery_score)),
    display_score: Math.min(10, Math.max(1, display_score)),
    health_features: Math.min(10, Math.max(1, health_features)),
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

function calculateTabletScores(product: ApifyProduct): ProductScores {
  const stars = parseFloat(String(product.stars || 0));
  const reviewCount = parseInt(String(product.reviewsCount || 0));
  const description = (product.description || '').toLowerCase();
  const title = (product.title || '').toLowerCase();
  
  let performance_score = 5;
  if (title.includes('m2') || title.includes('m1') || title.includes('snapdragon 8')) {
    performance_score = 10;
  } else if (title.includes('a15') || title.includes('a14')) {
    performance_score = 9;
  } else {
    performance_score = Math.min(10, Math.round(stars * 1.9));
  }
  
  let display_score = 5;
  const screenMatch = description.match(/(\d+\.?\d*)\s*inch/i) || title.match(/(\d+\.?\d*)\s*inch/i);
  if (screenMatch) {
    const inches = parseFloat(screenMatch[1]);
    display_score = inches >= 12 ? 9 : inches >= 10 ? 8 : inches >= 8 ? 7 : 6;
  } else {
    display_score = Math.min(10, Math.round(stars * 1.8));
  }
  
  if (description.includes('oled') || description.includes('amoled')) {
    display_score = Math.min(10, display_score + 1);
  }
  if (description.includes('120hz')) {
    display_score = Math.min(10, display_score + 1);
  }
  
  let battery_score = 5;
  const batteryMatch = description.match(/(\d+)\s*mah/i) || title.match(/(\d+)\s*mah/i);
  if (batteryMatch) {
    const mah = parseInt(batteryMatch[1]);
    battery_score = mah >= 10000 ? 10 : mah >= 8000 ? 9 : mah >= 7000 ? 7 : 6;
  } else {
    battery_score = Math.min(10, Math.round(stars * 1.7));
  }
  
  let storage_score = 5;
  const storageMatch = description.match(/(\d+)\s*gb/i) || title.match(/(\d+)\s*gb/i);
  if (storageMatch) {
    const storage = parseInt(storageMatch[1]);
    storage_score = storage >= 256 ? 10 : storage >= 128 ? 8 : storage >= 64 ? 6 : 5;
  } else {
    storage_score = Math.min(10, Math.round(stars * 1.6));
  }
  
  let build_quality = reviewCount > 500 ? 9 : reviewCount > 200 ? 7 : 6;
  
  const overall_score = Math.round(
    (performance_score * 0.3) + (display_score * 0.3) + 
    (battery_score * 0.2) + (storage_score * 0.15) + (build_quality * 0.05)
  );
  
  return {
    performance_score: Math.min(10, Math.max(1, performance_score)),
    display_score: Math.min(10, Math.max(1, display_score)),
    battery_score: Math.min(10, Math.max(1, battery_score)),
    storage_score: Math.min(10, Math.max(1, storage_score)),
    build_quality: Math.min(10, Math.max(1, build_quality)),
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

function calculateTVScores(product: ApifyProduct): ProductScores {
  const stars = parseFloat(String(product.stars || 0));
  const reviewCount = parseInt(String(product.reviewsCount || 0));
  const description = (product.description || '').toLowerCase();
  const title = (product.title || '').toLowerCase();
  
  let picture_quality = 5;
  if (description.includes('8k')) {
    picture_quality = 10;
  } else if (description.includes('4k') || description.includes('uhd')) {
    picture_quality = 9;
  } else if (description.includes('qled') || description.includes('oled')) {
    picture_quality = 9;
  } else if (description.includes('full hd') || description.includes('1080p')) {
    picture_quality = 7;
  } else {
    picture_quality = Math.min(10, Math.round(stars * 1.8));
  }
  
  let hdr_support = 5;
  if (description.includes('dolby vision') || description.includes('hdr10+')) {
    hdr_support = 10;
  } else if (description.includes('hdr10') || description.includes('hdr')) {
    hdr_support = 8;
  } else {
    hdr_support = Math.min(10, Math.round(stars * 1.6));
  }
  
  let screen_size_score = 5;
  const sizeMatch = description.match(/(\d+)\s*inch/i) || title.match(/(\d+)\s*"/);
  if (sizeMatch) {
    const inches = parseInt(sizeMatch[1]);
    screen_size_score = inches >= 75 ? 10 : inches >= 65 ? 9 : inches >= 55 ? 8 : inches >= 43 ? 7 : 6;
  } else {
    screen_size_score = Math.min(10, Math.round(stars * 1.5));
  }
  
  let smart_features = 7;
  if (description.includes('webos') || description.includes('tizen') || description.includes('android tv') || description.includes('google tv')) {
    smart_features = 9;
  }
  if (description.includes('120hz') || description.includes('144hz')) {
    smart_features = Math.min(10, smart_features + 1);
  }
  
  let sound_quality = Math.min(10, Math.round(stars * 1.7));
  if (description.includes('dolby atmos')) sound_quality = Math.min(10, sound_quality + 1);
  
  const overall_score = Math.round(
    (picture_quality * 0.35) + (hdr_support * 0.2) + 
    (screen_size_score * 0.2) + (smart_features * 0.15) + (sound_quality * 0.1)
  );
  
  return {
    picture_quality: Math.min(10, Math.max(1, picture_quality)),
    hdr_support: Math.min(10, Math.max(1, hdr_support)),
    screen_size_score: Math.min(10, Math.max(1, screen_size_score)),
    smart_features: Math.min(10, Math.max(1, smart_features)),
    sound_quality: Math.min(10, Math.max(1, sound_quality)),
    overall_score: Math.min(10, Math.max(1, overall_score)),
  };
}

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

    const { eventData } = body;
    const categorySlug = body.category || eventData?.category || 'robot-supurge';
    const runId = body.actorRunId || eventData?.actorRunId;
    
    if (!runId) {
      console.error('❌ Actor Run ID bulunamadı!');
      return NextResponse.json(
        { error: 'Actor Run ID bulunamadı' },
        { status: 400 }
      );
    }

    console.log(`🎬 Actor Run ID: ${runId}`);
    console.log(`📂 Kategori: ${categorySlug}`);

    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken) {
      console.error('❌ APIFY_TOKEN bulunamadı!');
      return NextResponse.json(
        { error: 'APIFY_TOKEN yapılandırılmamış' },
        { status: 500 }
      );
    }

    const runDetailsUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`;
    const runDetailsResponse = await fetch(runDetailsUrl);
    
    if (!runDetailsResponse.ok) {
      console.error(`❌ Apify Run Details hatası: ${runDetailsResponse.status}`);
      throw new Error(`Apify Run Details hatası: ${runDetailsResponse.status}`);
    }

    const runDetails = await runDetailsResponse.json();
    const datasetId = runDetails.data?.defaultDatasetId;

    if (!datasetId) {
      console.error('❌ Dataset ID run details\'da bulunamadı!');
      return NextResponse.json(
        { error: 'Dataset ID bulunamadı' },
        { status: 400 }
      );
    }

    console.log(`📦 Dataset ID: ${datasetId}`);

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

    const allProducts: SupabaseProduct[] = rawProducts.map((item: ApifyProduct) => {
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
        case 'tablet':
          scores = calculateTabletScores(item);
          break;
        case 'tv':
          scores = calculateTVScores(item);
          break;
        default:
          console.warn(`⚠️ Bilinmeyen kategori: ${categorySlug}, varsayılan skorlama kullanılıyor`);
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
          ...scores,
        },
        is_active: true,
        stock_status: 'in_stock',
        scraped_at: new Date().toISOString(),
      };
    });

    console.log(`📝 ${allProducts.length} ürün formatlandı (skorlarla)`);

    const uniqueProducts = allProducts.filter((product, index, self) =>
      index === self.findIndex((p) => p.model === product.model)
    );
    console.log(`🔄 ${allProducts.length} üründen ${uniqueProducts.length} unique ürün (ASIN bazlı)`);

    const { error: upsertError } = await supabase
      .from('products')
      .upsert(uniqueProducts, {
        onConflict: 'model'
      });

    if (upsertError) {
      console.error('❌ Supabase hatası:', upsertError);
      throw upsertError;
    }

    console.log(`💾 ${uniqueProducts.length} ürün Supabase'e kaydedildi`);
    console.log('🎉 === WEBHOOK TAMAMLANDI ===');

    return NextResponse.json({ 
      success: true,
      inserted: uniqueProducts.length,
      category: categorySlug,
      message: `${uniqueProducts.length} ürün (${categorySlug}) başarıyla güncellendi`
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
