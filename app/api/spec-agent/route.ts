// ============================================================================
// app/api/spec-agent/route.ts
// ratio.run — Spec Agent Cron Job Endpoint
//
// Bu endpoint Vercel Cron tarafından her 6 saatte bir çağrılır.
// Ayrıca ?secret=xxx ile elle de çalıştırılabilir.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { runSpecAgent } from '@/lib/spec-agent';

// Vercel Cron Job için GET metodu
export async function GET(request: NextRequest) {
  // Güvenlik: Vercel Cron veya gizli key ile çağrılmalı
  const authHeader = request.headers.get('authorization');
  const secretParam = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  const isVercelCron = authHeader === `Bearer ${cronSecret}`;
  const isManualTrigger = secretParam === cronSecret || !cronSecret;

  if (!isVercelCron && !isManualTrigger) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  // Hangi kategori? (isteğe bağlı parametre)
  const category = request.nextUrl.searchParams.get('category') || undefined;
  const batchSize = parseInt(request.nextUrl.searchParams.get('batch') || '5');

  console.log(`🤖 [spec-agent] Çalışıyor — Kategori: ${category || 'TÜMÜ'}, Batch: ${batchSize}`);

  try {
    const result = await runSpecAgent({
      categorySlug: category,
      batchSize: Math.min(batchSize, 10), // Maksimum 10 ürün per çalışma
      maxProducts: 50,
    });

    console.log(`✅ [spec-agent] Tamamlandı:`, result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      category: category || 'all',
      ...result,
    });

  } catch (err: any) {
    console.error('❌ [spec-agent] Hata:', err.message);
    return NextResponse.json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Elle POST ile de tetiklenebilir (test için)
export async function POST(request: NextRequest) {
  return GET(request);
}
