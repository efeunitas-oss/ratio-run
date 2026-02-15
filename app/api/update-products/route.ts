import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const rawData = await req.json();
    
    const formattedData = rawData.map((item: any) => ({
      name: item.title,
      brand: item.brand,
      price: typeof item.price === 'object' ? item.price.value : item.price,
      image_url: item.thumbnailImage,
      source_url: item.url,
      source_name: 'Amazon',
      category_slug: 'robot-supurge', // Bunu sabit tutuyoruz, otomatik eşleşecek
      specifications: {
        asin: item.asin,
        stars: item.stars,
        reviews: item.reviewsCount
      }
    }));

    const { error } = await supabase
      .from('products')
      .upsert(formattedData, { onConflict: 'source_name, source_url' });

    if (error) throw error;
    return NextResponse.json({ success: true, count: formattedData.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}