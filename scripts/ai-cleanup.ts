// ============================================================================
// RATIO.RUN — AI CLEANUP
// Yanlış kategorideki ürünleri Haiku ile tespit edip is_active=false yapar.
//
// Kullanım:
//   npx ts-node --skip-project scripts/ai-cleanup.ts --category telefon
//   npx ts-node --skip-project scripts/ai-cleanup.ts  (tüm kategoriler)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Her kategori için hangi ürünler GEÇERLİ, hangileri DEĞİL
const CATEGORY_RULES: Record<string, { valid: string; invalid: string }> = {
  telefon:        { valid: 'Akıllı telefon, cep telefonu',                         invalid: 'Kılıf, aksesuar, şarj aleti, kablo, ekran koruyucu, tutucu, stand, tablet, dizüstü, robot süpürge, TV, kulaklık, saat, oyuncak, uzaktan kumanda, kapı rampası, el süpürgesi, filtre, torba' },
  laptop:         { valid: 'Dizüstü bilgisayar, laptop, notebook',                 invalid: 'Kılıf, çanta, soğutucu, stand, klavye, mouse, ekran koruyucu, aksesuar, tablet, telefon, monitör' },
  tablet:         { valid: 'Tablet bilgisayar',                                    invalid: 'Kılıf, ekran koruyucu, kalem aksesuar, stand, tutucu, telefon, laptop, oyuncak tablet, dijital çerçeve, mikroskop, güvenlik kamerası' },
  saat:           { valid: 'Akıllı saat, smartwatch, fitness bilekliği',           invalid: 'Kol saati bandı, şarj aleti, ekran koruyucu, yüzük, çocuk oyuncağı, klasik kol saati' },
  kulaklik:       { valid: 'Kulaklık (kablolu, kablosuz, bluetooth, in-ear, over-ear)', invalid: 'Kablo adaptörü, dönüştürücü, kulaklık kılıfı, mikrofon, hoparlör, ses kartı' },
  'robot-supurge':{ valid: 'Robot süpürge (otonom, kendi kendine süpüren)',         invalid: 'Yedek parça, toz torbası, filtre, fırça, mop bezi, paspas, zemin mati, el süpürgesi, şarj istasyonu yedek parçası, aksesuarlar' },
  tv:             { valid: 'Televizyon, smart TV, LED TV, OLED TV, QLED TV',        invalid: 'Uzaktan kumanda, TV askısı, stand, ekran koruyucu, HDMI kablo, TV kutusu, monitör, projeksiyon, ses sistemi' },
};

const SLUG_MAP: Record<string, string> = {
  smartphone: 'telefon', telefon: 'telefon',
  laptop: 'laptop',
  tablet: 'tablet',
  smartwatch: 'saat', saat: 'saat',
  headphones: 'kulaklik', kulaklik: 'kulaklik',
  'robot-vacuum': 'robot-supurge', 'robot-supurge': 'robot-supurge',
  television: 'tv', tv: 'tv',
};

async function checkBatch(
  products: { id: string; name: string }[],
  catKey: string
): Promise<string[]> {
  const rules = CATEGORY_RULES[catKey];
  const list  = products.map((p, i) => `${i + 1}. ID:"${p.id}" | "${p.name}"`).join('\n');

  const prompt = `Aşağıdaki ürünleri incele. Her biri "${catKey}" kategorisinde mi, yoksa yanlış kategoride mi?

GEÇERLİ ürünler: ${rules.valid}
GEÇERSİZ ürünler (bunlar yanlış kategoride): ${rules.invalid}

Ürünler:
${list}

SADECE GEÇERSİZ olan ürünlerin ID'lerini JSON listesi olarak döndür.
Eğer hepsi geçerliyse boş liste döndür.
Format: {"invalid_ids": ["id1", "id2", ...]}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { type: string; text: string }).text ?? '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.invalid_ids ?? [];
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const args        = process.argv.slice(2);
  const categoryArg = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;
  const dryRun      = args.includes('--dry-run');
  const limitArg    = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 1000;
  const batchSize   = 25;

  console.log('🧹 ratio.run AI Cleanup');
  console.log(`   Kategori : ${categoryArg ?? 'TÜMÜ'}`);
  console.log(`   Mod      : ${dryRun ? 'DRY-RUN (veritabanı değişmez)' : 'CANLI'}\n`);

  const catsToProcess = categoryArg
    ? [SLUG_MAP[categoryArg] ?? categoryArg]
    : Object.keys(CATEGORY_RULES);

  let totalDeactivated = 0, totalChecked = 0;

  for (const catKey of catsToProcess) {
    if (!CATEGORY_RULES[catKey]) continue;

    const slugsToTry = [catKey, ...Object.entries(SLUG_MAP).filter(([,v]) => v === catKey).map(([k]) => k)];
    const { data: dbCats } = await supabase
      .from('categories').select('id,name').in('slug', slugsToTry);
    if (!dbCats?.length) { console.log(`⚠️  ${catKey}: DB'de yok`); continue; }

    const catId = dbCats[0].id;
    console.log(`📦 ${dbCats[0].name ?? catKey}`);

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('category_id', catId)
      .eq('is_active', true)
      .limit(limitArg);

    if (error || !products) { console.log(`   ❌ ${error?.message}`); continue; }
    console.log(`   ${products.length} aktif ürün kontrol edilecek`);

    let catDeactivated = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      process.stdout.write(`   [${i + 1}-${Math.min(i + batchSize, products.length)}/${products.length}] kontrol ediliyor...`);

      try {
        const invalidIds = await checkBatch(
          batch.map(p => ({ id: p.id, name: p.name ?? '' })),
          catKey
        );

        if (invalidIds.length === 0) {
          process.stdout.write(' ✅ Hepsi geçerli\n');
        } else {
          process.stdout.write(` ⚠️  ${invalidIds.length} geçersiz ürün bulundu\n`);

          for (const id of invalidIds) {
            const product = batch.find(p => p.id === id);
            console.log(`      ❌ "${product?.name ?? id}"`);

            if (!dryRun) {
              await supabase.from('products').update({ is_active: false }).eq('id', id);
            }
            catDeactivated++;
            totalDeactivated++;
          }
        }

        totalChecked += batch.length;
        await sleep(500);
      } catch (err: any) {
        process.stdout.write(` ❌ Hata: ${err.message}\n`);
      }
    }

    console.log(`   → ${catDeactivated} ürün pasife alındı\n`);
  }

  console.log('─'.repeat(50));
  console.log(`🔍 Kontrol edilen : ${totalChecked}`);
  console.log(`❌ Pasife alınan  : ${totalDeactivated}`);
  if (dryRun) console.log('⚠️  DRY-RUN: Hiçbir değişiklik yapılmadı');
}

main().catch(console.error);
