// ============================================================================
// RATIO.RUN — AI Spec Çıkarıcı
// Ürün adından RAM, işlemci, kamera vb. çeker, Supabase'e yazar.
// Çalıştır: npx tsx scripts/ai-specs.ts
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

async function sor(soru: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(soru, ans => { rl.close(); resolve(ans.trim()); }));
}

// Her kategori için hangi spec'leri çıkaracağımız
const KATEGORI_SPEC: Record<string, string> = {
  telefon:       'ram_gb (sayı), storage_gb (sayı), screen_size (sayı, inch), camera_mp (sayı), battery_mah (sayı), processor (metin)',
  laptop:        'ram_gb (sayı), storage_gb (sayı), screen_size (sayı, inch), processor (metin), gpu (metin)',
  tablet:        'ram_gb (sayı), storage_gb (sayı), screen_size (sayı, inch), battery_mah (sayı), processor (metin)',
  saat:          'screen_size (sayı, mm), battery_days (sayı), os (metin)',
  kulaklik:      'battery_hours (sayı), anc (true/false), driver_mm (sayı), connection_type (metin: kablolu/kablosuz/tws)',
  tv:            'screen_size (sayı, inch), resolution (metin: HD/FHD/4K/8K), hz (sayı), panel_type (metin: LED/OLED/QLED)',
  'robot-supurge': 'suction_pa (sayı), battery_min (sayı), mapping (true/false)',
  otomobil:      'engine_cc (sayı), hp (sayı), fuel_type (metin: benzin/dizel/elektrik/hibrit)',
};

async function claudeSpecCikar(urunler: any[], kategoriSlug: string): Promise<any[]> {
  const specAlanlar = KATEGORI_SPEC[kategoriSlug] ?? 'ozellikler (metin)';

  const liste = urunler.map((u, i) =>
    `${i + 1}. ID: ${u.id} | Ad: "${u.name}" | Marka: ${u.brand ?? '?'}`
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
      system: `Sen bir e-ticaret spec çıkarıcısısın. Türkçe ürün adlarından teknik özellikleri çıkarıyorsun.

Sadece ürün adında AÇIKÇA yazan bilgileri çıkar. Tahmin etme, uydurma.
Bilgi yoksa o alanı null bırak.

Sadece JSON döndür, başka hiçbir şey yazma.`,
      messages: [{
        role: 'user',
        content: `"${kategoriSlug}" kategorisindeki bu ürünlerden şu alanları çıkar: ${specAlanlar}

${liste}

JSON formatı:
[{"id":"uuid", "specs": {"alan1": değer, "alan2": değer}}]`
      }],
    }),
  });

  if (!response.ok) throw new Error(`Claude hatası: ${response.status}`);

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? '[]';
  const clean = raw.replace(/```json\n?|```\n?/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    console.error('  JSON parse hatası');
    return [];
  }
}

async function main() {
  console.log('\n🔬 RATIO.RUN — AI Spec Çıkarıcı\n');
  console.log('Ürün adından RAM, ekran, batarya gibi bilgileri çeker.\n');

  console.log('Hangi kategori?');
  console.log('0. Tüm kategoriler');
  const sluglar = Object.keys(KATEGORI_SPEC);
  sluglar.forEach((s, i) => console.log(`${i + 1}. ${s}`));

  const secim = await sor('\nSeçim (0-8): ');
  const secilenSlug = secim === '0' ? null : sluglar[parseInt(secim) - 1];

  const limitStr = await sor('Kaç ürün? (Öneri: 100, max 2000): ');
  const limit = Math.min(parseInt(limitStr) || 100, 2000);

  // Ürünleri çek
  let query = supabase
    .from('products')
    .select('id, name, brand, category_id, specifications, categories!inner(slug)')
    .eq('is_active', true)
    .limit(limit);

  if (secilenSlug) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', secilenSlug).maybeSingle();
    if (cat) query = query.eq('category_id', cat.id);
  }

  const { data: urunler } = await query;
  if (!urunler || urunler.length === 0) { console.log('Ürün bulunamadı.'); return; }

  console.log(`\n${urunler.length} ürün bulundu. İşleniyor...\n`);

  // Kategoriye göre grupla
  const gruplar: Record<string, any[]> = {};
  urunler.forEach((u: any) => {
    const slug = (u.categories as any)?.slug ?? 'bilinmiyor';
    if (!gruplar[slug]) gruplar[slug] = [];
    gruplar[slug].push(u);
  });

  const BATCH = 20;
  let toplamGuncellendi = 0;
  let toplamHata = 0;

  for (const [slug, grup] of Object.entries(gruplar)) {
    console.log(`\n📦 ${slug} — ${grup.length} ürün`);

    for (let i = 0; i < grup.length; i += BATCH) {
      const batch = grup.slice(i, i + BATCH);
      const batchNo = Math.floor(i / BATCH) + 1;
      const toplamBatch = Math.ceil(grup.length / BATCH);
      process.stdout.write(`  Batch ${batchNo}/${toplamBatch}...`);

      try {
        const sonuclar = await claudeSpecCikar(batch, slug);

        for (const sonuc of sonuclar) {
          if (!sonuc.specs || Object.keys(sonuc.specs).length === 0) continue;

          // null olmayan değerleri filtrele
          const temizSpecs: Record<string, any> = {};
          for (const [k, v] of Object.entries(sonuc.specs)) {
            if (v !== null && v !== undefined && v !== '') temizSpecs[k] = v;
          }
          if (Object.keys(temizSpecs).length === 0) continue;

          // Mevcut specifications ile birleştir
          const mevcutUrun = batch.find((u: any) => u.id === sonuc.id);
          const mevcutSpecs = mevcutUrun?.specifications ?? {};
          const yeniSpecs = { ...mevcutSpecs, ...temizSpecs };

          const { error } = await supabase
            .from('products')
            .update({ specifications: yeniSpecs })
            .eq('id', sonuc.id);

          if (error) toplamHata++;
          else toplamGuncellendi++;
        }

        console.log(` ✓`);
      } catch (err: any) {
        console.log(` ✗ ${err.message}`);
        toplamHata++;
      }

      if (i + BATCH < grup.length) await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log('✅ TAMAMLANDI');
  console.log(`  Güncellendi: ${toplamGuncellendi} ürün`);
  if (toplamHata > 0) console.log(`  Hata: ${toplamHata}`);
  console.log('─────────────────────────────────────────\n');
}

main().catch(err => { console.error('Hata:', err); process.exit(1); });
