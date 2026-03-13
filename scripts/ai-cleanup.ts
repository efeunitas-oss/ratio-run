// ============================================================================
// RATIO.RUN — AI Ürün Temizleyici
// Çalıştır: npx tsx scripts/ai-cleanup.ts
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// Geçerli kategoriler ve Türkçe açıklamaları
const KATEGORILER = {
  'telefon':       'Akıllı telefonlar ve cep telefonları',
  'laptop':        'Dizüstü bilgisayarlar',
  'tablet':        'Tablet bilgisayarlar',
  'saat':          'Akıllı saatler ve smartwatch',
  'kulaklik':      'Kulaklıklar (kablolu/kablosuz)',
  'tv':            'Televizyonlar',
  'robot-supurge': 'Robot süpürgeler',
  'otomobil':      'Otomobiller ve arabalar',
};

// Kullanıcıya sor
async function sor(soru: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(soru, ans => { rl.close(); resolve(ans.trim()); }));
}

// Claude'a sor — 20 ürünü tek seferde analiz et
async function claudeAnaliz(urunler: any[]): Promise<any[]> {
  const liste = urunler.map((u, i) =>
    `${i + 1}. ID: ${u.id} | Mevcut: ${u.kategori_slug} | Ad: "${u.name}" | Marka: ${u.brand ?? '?'} | Fiyat: ${u.price ? u.price + '₺' : '?'}`
  ).join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `Sen bir e-ticaret ürün editörüsün. Türkçe ürünleri analiz ediyorsun.

Geçerli kategoriler: ${Object.entries(KATEGORILER).map(([k,v]) => `"${k}" (${v})`).join(', ')}

Her ürün için şunu belirle:
1. DOGRU_KATEGORI: Doğru kategori slug'u (yukarıdakilerden biri)
2. TEMIZ_AD: Düzeltilmiş ürün adı (marka + model + 1-2 özellik, max 80 karakter)
3. ISLEM: "guncelle" (kategori veya ad yanlışsa), "sil" (çöp/alakasız ürünse), "tamam" (her şey doğruysa)

ÇÖP ÜRÜN örnekleri: kılıf, şarj kablosu, aksesuar, yedek parça, "test ürün", anlamsız isimler.
YANLIŞ KATEGORİ örnekleri: akıllı saat → telefon kategorisinde, tablet → telefon kategorisinde.

Sadece JSON döndür:
[{"id":"uuid","dogru_kategori":"slug","temiz_ad":"ad","islem":"tamam|guncelle|sil","sebep":"1 cümle"}]`,
      messages: [{ role: 'user', content: `Bu ${urunler.length} ürünü analiz et:\n\n${liste}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API hatası: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? '[]';
  const clean = raw.replace(/```json\n?|```\n?/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    console.error('JSON parse hatası, ham yanıt:', raw.slice(0, 300));
    return [];
  }
}

// ── Ana fonksiyon ─────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🤖 RATIO.RUN — AI Ürün Temizleyici\n');
  console.log('Bu script ürünlerinizi Claude AI ile analiz eder.');
  console.log('Yanlış kategori → taşır | Çöp ürün → siler | Yanlış ad → düzeltir\n');

  // Kategori seçimi
  console.log('Hangi kategoriyi temizleyelim?');
  console.log('0. Tüm kategoriler');
  Object.keys(KATEGORILER).forEach((k, i) => console.log(`${i + 1}. ${k}`));
  const secim = await sor('\nSeçim (0-8): ');
  const sluglar = Object.keys(KATEGORILER);
  const secilenSlug = secim === '0' ? null : sluglar[parseInt(secim) - 1];

  // Kaç ürün işlensin?
  const limitStr = await sor('Kaç ürün işlensin? (Öneri: 50, max 500): ');
  const limit = Math.min(parseInt(limitStr) || 50, 500);

  // Kaç ürün var?
  let query = supabase
    .from('products')
    .select('id, name, brand, price, category_id, categories!inner(slug, id)', { count: 'exact' })
    .eq('is_active', true)
    .limit(limit);

  if (secilenSlug) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', secilenSlug).maybeSingle();
    if (cat) query = query.eq('category_id', cat.id);
  }

  const { data: urunler, count } = await query;

  if (!urunler || urunler.length === 0) {
    console.log('Ürün bulunamadı.');
    return;
  }

  console.log(`\n${urunler.length} ürün bulundu. Analiz başlıyor...\n`);

  // Tüm kategorileri yükle (category_id → slug için)
  const { data: tumKategoriler } = await supabase.from('categories').select('id, slug');
  const catIdToSlug: Record<string, string> = {};
  const catSlugToId: Record<string, string> = {};
  tumKategoriler?.forEach((c: any) => {
    catIdToSlug[c.id] = c.slug;
    catSlugToId[c.slug] = c.id;
  });

  const urunListesi = urunler.map((u: any) => ({
    id: u.id,
    name: u.name ?? '',
    brand: u.brand ?? null,
    price: u.price ?? null,
    kategori_slug: (u.categories as any)?.slug ?? 'bilinmiyor',
    kategori_id: u.category_id,
  }));

  // 20'li batch'ler halinde işle
  const BATCH = 20;
  const tumSonuclar: any[] = [];

  for (let i = 0; i < urunListesi.length; i += BATCH) {
    const batch = urunListesi.slice(i, i + BATCH);
    const batchNo = Math.floor(i / BATCH) + 1;
    const toplamBatch = Math.ceil(urunListesi.length / BATCH);
    process.stdout.write(`Batch ${batchNo}/${toplamBatch} işleniyor...`);

    try {
      const sonuclar = await claudeAnaliz(batch);
      tumSonuclar.push(...sonuclar);
      console.log(` ✓ (${sonuclar.length} sonuç)`);
    } catch (err: any) {
      console.log(` ✗ HATA: ${err.message}`);
    }

    // Rate limit: her batch arası 600ms bekle
    if (i + BATCH < urunListesi.length) {
      await new Promise(r => setTimeout(r, 600));
    }
  }

  // Sonuçları grupla
  const guncellenecek = tumSonuclar.filter(r => r.islem === 'guncelle');
  const silinecek     = tumSonuclar.filter(r => r.islem === 'sil');
  const tamam         = tumSonuclar.filter(r => r.islem === 'tamam');

  console.log('\n─────────────────────────────────────────');
  console.log(`📊 ANALİZ SONUCU (${tumSonuclar.length} ürün)`);
  console.log(`  ✅ Sorunsuz: ${tamam.length}`);
  console.log(`  ✏️  Güncellenecek: ${guncellenecek.length}`);
  console.log(`  🗑️  Silinecek: ${silinecek.length}`);
  console.log('─────────────────────────────────────────');

  if (guncellenecek.length > 0) {
    console.log('\n✏️  GÜNCELLENECEKLER (ilk 10):');
    guncellenecek.slice(0, 10).forEach(r => {
      const orijinal = urunListesi.find(u => u.id === r.id);
      const katDegisim = orijinal?.kategori_slug !== r.dogru_kategori
        ? ` [KATEGORİ: ${orijinal?.kategori_slug} → ${r.dogru_kategori}]`
        : '';
      console.log(`  • ${orijinal?.name?.slice(0, 50)} →${katDegisim}`);
      console.log(`    Yeni ad: ${r.temiz_ad}`);
      console.log(`    Sebep: ${r.sebep}`);
    });
    if (guncellenecek.length > 10) console.log(`  ... ve ${guncellenecek.length - 10} tane daha`);
  }

  if (silinecek.length > 0) {
    console.log('\n🗑️  SİLİNECEKLER (ilk 10):');
    silinecek.slice(0, 10).forEach(r => {
      const orijinal = urunListesi.find(u => u.id === r.id);
      console.log(`  • ${orijinal?.name?.slice(0, 60)} — ${r.sebep}`);
    });
    if (silinecek.length > 10) console.log(`  ... ve ${silinecek.length - 10} tane daha`);
  }

  if (guncellenecek.length === 0 && silinecek.length === 0) {
    console.log('\n🎉 Tüm ürünler temiz, yapılacak bir şey yok!');
    return;
  }

  // Onay al
  const onay = await sor('\nBu değişiklikleri uygulayayım mı? (evet/hayır): ');
  if (onay.toLowerCase() !== 'evet') {
    console.log('\nİptal edildi. Hiçbir şey değiştirilmedi.');
    return;
  }

  // Güncelle
  let guncellendi = 0;
  let silindi = 0;
  const hatalar: string[] = [];

  for (const r of guncellenecek) {
    const orijinal = urunListesi.find(u => u.id === r.id);
    if (!orijinal) continue;

    const payload: Record<string, any> = {};
    if (orijinal.kategori_slug !== r.dogru_kategori && catSlugToId[r.dogru_kategori]) {
      payload.category_id = catSlugToId[r.dogru_kategori];
    }
    if (r.temiz_ad && r.temiz_ad !== orijinal.name) {
      payload.name = r.temiz_ad;
    }
    if (Object.keys(payload).length === 0) continue;

    const { error } = await supabase.from('products').update(payload).eq('id', r.id);
    if (error) hatalar.push(`Güncelleme hatası ${r.id}: ${error.message}`);
    else guncellendi++;
  }

  for (const r of silinecek) {
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', r.id);
    if (error) hatalar.push(`Silme hatası ${r.id}: ${error.message}`);
    else silindi++;
  }

  console.log('\n─────────────────────────────────────────');
  console.log('✅ TAMAMLANDI');
  console.log(`  Güncellendi: ${guncellendi}`);
  console.log(`  Silindi (pasif): ${silindi}`);
  if (hatalar.length > 0) {
    console.log(`  Hata: ${hatalar.length}`);
    hatalar.forEach(h => console.log(`    ! ${h}`));
  }
  console.log('─────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
