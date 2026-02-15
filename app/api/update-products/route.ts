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
  specifications: {
    stars: number | null;
    reviewsCount: number | null;
    categories: string[];
    description: string | null;
  };
  is_active: boolean;
  stock_status: string;
  scraped_at: string;
}

export async function POST(request: NextRequest) {
  console.log('🎯 === WEBHOOK BAŞLADI ===');
  
  // DEBUG: Environment variable'ları kontrol et
  console.log('🔍 ENV CHECK:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'MEVCUT ✅' : 'YOK ❌');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'MEVCUT ✅' : 'YOK ❌');
  console.log('APIFY_TOKEN:', process.env.APIFY_TOKEN ? 'MEVCUT ✅' : 'YOK ❌');
  
  try {
    // Supabase client'ı runtime'da oluştur
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔍 supabaseUrl:', supabaseUrl ? 'BULUNDU' : 'BULUNAMADI');
    console.log('🔍 supabaseKey:', supabaseKey ? 'BULUNDU' : 'BULUNAMADI');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials bulunamadı!');
      console.error('supabaseUrl:', supabaseUrl);
      console.error('supabaseKey:', supabaseKey ? 'EXISTS' : 'NULL');
      return NextResponse.json(
        { error: 'Supabase yapılandırılmamış' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client oluşturuldu');

    const body: ApifyWebhookPayload = await request.json();
    console.log('📥 Gelen veri:', JSON.stringify(body, null, 2));

    const { eventData, actorRunId } = body;
    
    console.log('🔍 eventData:', eventData);
    console.log('🔍 actorRunId:', actorRunId);

    const datasetId = eventData?.datasetId;
    
    if (!datasetId) {
      console.error('❌ Dataset ID bulunamadı!');
      return NextResponse.json(
        { error: 'Dataset ID bulunamadı', receivedData: body },
        { status: 400 }
      );
    }

    console.log(`📦 Dataset ID: ${datasetId}`);

    const apifyToken = process.env.APIFY_TOKEN;
    
    if (!apifyToken) {
      console.error('❌ APIFY_TOKEN bulunamadı!');
      return NextResponse.json(
        { error: 'APIFY_TOKEN yapılandırılmamış' },
        { status: 500 }
      );
    }

    const apifyUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`;
    console.log('📡 Apify API çağrısı yapılıyor...');

    const apifyResponse = await fetch(apifyUrl);
    
    if (!apifyResponse.ok) {
      console.error(`❌ Apify API hatası: ${apifyResponse.status}`);
      const errorText = await apifyResponse.text();
      console.error('Hata detayı:', errorText);
      throw new Error(`Apify API hatası: ${apifyResponse.status}`);
    }

    const rawProducts: ApifyProduct[] = await apifyResponse.json();
    console.log(`✅ Apify'dan ${rawProducts.length} ürün alındı`);

    if (rawProducts.length === 0) {
      console.log('ℹ️ Ürün bulunamadı');
      return NextResponse.json({ 
        success: true, 
        message: 'Ürün bulunamadı',
        inserted: 0 
      });
    }

    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'robot-supurge')
      .single();

    if (categoryError || !category) {
      console.error('❌ Robot süpürge kategorisi bulunamadı!', categoryError);
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 500 }
      );
    }

    console.log(`✅ Kategori ID: ${category.id}`);

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
        reviewsCount = typeof item.reviewsCount === 'number' ? item.reviewsCount : parseInt(String(item.reviewsCount)) || null;
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
        },
        is_active: true,
        stock_status: 'in_stock',
        scraped_at: new Date().toISOString(),
      };
    });

    console.log(`📝 ${products.length} ürün formatlandı`);

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
      message: `${products.length} ürün başarıyla güncellendi`
    });

  } catch (error) {
    console.error('❌ === HATA OLUŞTU ===');
    
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Hata:', errorMessage);
    console.error('Stack:', errorStack);
    
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}