// ============================================================================
// RATIO.RUN — ICECAT SPEC FETCHER v5
// Amazon: ASIN ile direkt Icecat sorgusu
// Trendyol: Haiku ile MPN kodu çıkar, Icecat'e gönder
//
// .env.local:
//   ICECAT_USERNAME=ibrahimcm
//   ICECAT_API_TOKEN=...
//   ICECAT_CONTENT_TOKEN=...
//
// Kullanım:
//   npx ts-node --skip-project scripts/icecat-specs.ts --category telefon --limit 10
//   npx ts-node --skip-project scripts/icecat-specs.ts
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL          = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY          = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ICECAT_USER           = process.env.ICECAT_USERNAME!;
const ICECAT_API_TOKEN      = process.env.ICECAT_API_TOKEN!;
const ICECAT_CONTENT_TOKEN  = process.env.ICECAT_CONTENT_TOKEN!;
const ANTHROPIC_KEY         = process.env.ANTHROPIC_API_KEY!;

const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ── Kategori → spec alanları ──────────────────────────────────────────────────
interface FieldDef { icecatName: string | string[]; ourKey: string; type: 'number' | 'text' }

const FIELD_MAP: Record<string, FieldDef[]> = {
  telefon: [
    { icecatName: ['RAM', 'Internal RAM'],                               ourKey: 'ram',               type: 'number' },
    { icecatName: ['Internal storage', 'Storage capacity'],              ourKey: 'storage',            type: 'number' },
    { icecatName: ['Display diagonal', 'Screen size'],                   ourKey: 'screen_size',        type: 'number' },
    { icecatName: ['Rear camera resolution', 'Main camera'],             ourKey: 'camera_mp',          type: 'number' },
    { icecatName: ['Battery capacity'],                                  ourKey: 'battery_mah',        type: 'number' },
    { icecatName: ['Display refresh rate', 'Refresh rate'],              ourKey: 'display_refresh',    type: 'number' },
    { icecatName: ['Processor', 'Chipset', 'SoC model'],                 ourKey: 'chipset',            type: 'text'   },
  ],
  laptop: [
    { icecatName: ['RAM', 'Internal memory'],                            ourKey: 'ram_size',           type: 'number' },
    { icecatName: ['SSD capacity', 'Storage capacity', 'HDD capacity'],  ourKey: 'storage',            type: 'number' },
    { icecatName: ['Display diagonal', 'Screen size'],                   ourKey: 'screen_size',        type: 'number' },
    { icecatName: ['Processor', 'CPU model'],                            ourKey: 'processor_gen',      type: 'text'   },
    { icecatName: ['Brightness', 'Typical brightness'],                  ourKey: 'display_brightness', type: 'number' },
    { icecatName: ['Battery life'],                                      ourKey: 'battery_life',       type: 'number' },
  ],
  tablet: [
    { icecatName: ['RAM', 'Internal RAM'],                               ourKey: 'ram',                type: 'number' },
    { icecatName: ['Internal storage', 'Storage capacity'],              ourKey: 'storage',            type: 'number' },
    { icecatName: ['Display diagonal', 'Screen size'],                   ourKey: 'screen_size',        type: 'number' },
    { icecatName: ['Battery capacity'],                                  ourKey: 'battery_mah',        type: 'number' },
    { icecatName: ['Processor', 'Chipset'],                              ourKey: 'processor',          type: 'text'   },
  ],
  saat: [
    { icecatName: ['Battery life', 'Battery run time'],                  ourKey: 'battery_life',       type: 'number' },
    { icecatName: ['Display diagonal', 'Screen size'],                   ourKey: 'screen_size',        type: 'number' },
    { icecatName: ['Operating system', 'OS'],                            ourKey: 'os',                 type: 'text'   },
    { icecatName: ['Water resistance', 'IP rating'],                     ourKey: 'waterproof',         type: 'text'   },
  ],
  kulaklik: [
    { icecatName: ['Battery life', 'Playback time'],                     ourKey: 'battery_life',       type: 'number' },
    { icecatName: ['Driver unit', 'Driver size'],                        ourKey: 'driver_size',        type: 'number' },
    { icecatName: ['Noise-cancelling', 'Active noise cancellation'],     ourKey: 'noise_cancellation', type: 'text'   },
    { icecatName: ['Connectivity technology', 'Wireless technology'],    ourKey: 'connection',         type: 'text'   },
  ],
  'robot-supurge': [
    { icecatName: ['Suction power', 'Suction'],                          ourKey: 'suctionPower',       type: 'number' },
    { icecatName: ['Battery capacity', 'Battery life'],                  ourKey: 'batteryCapacity',    type: 'number' },
    { icecatName: ['Noise level', 'Sound level'],                        ourKey: 'noiseLevel',         type: 'number' },
    { icecatName: ['Navigation system', 'Mapping technology'],           ourKey: 'mappingTech',        type: 'text'   },
  ],
  tv: [
    { icecatName: ['Display diagonal', 'Screen size'],                   ourKey: 'screen_size',        type: 'number' },
    { icecatName: ['Display resolution', 'Resolution'],                  ourKey: 'resolution',         type: 'text'   },
    { icecatName: ['Display refresh rate', 'Motion rate'],               ourKey: 'refresh_rate',       type: 'number' },
    { icecatName: ['Panel type', 'Display type'],                        ourKey: 'panel_type',         type: 'text'   },
  ],
};

const SLUG_MAP: Record<string, string> = {
  smartphone: 'telefon', telefon: 'telefon',
  laptop: 'laptop', tablet: 'tablet',
  smartwatch: 'saat', saat: 'saat',
  headphones: 'kulaklik', kulaklik: 'kulaklik',
  'robot-vacuum': 'robot-supurge', 'robot-supurge': 'robot-supurge',
  television: 'tv', tv: 'tv',
};

// ── Haiku: Trendyol ürünleri için MPN kodu çıkar ─────────────────────────────
async function extractMPNsWithAI(
  products: { id: string; name: string; brand: string }[]
): Promise<Map<string, { brand: string; mpn: string }>> {
  const list = products.map((p, i) => `${i + 1}. ID:"${p.id}" | Marka:"${p.brand}" | Ad:"${p.name}"`).join('\n');

  const prompt = `Aşağıdaki ürünlerin üretici model kodunu (MPN) çıkar.
MPN = üreticinin ürüne verdiği teknik model kodu. Ürün adında geçen harf+rakam kombinasyonu.

Laptop/bilgisayar MPN örnekleri (genellikle ürün adının sonunda):
- "MSI VECTOR 16 HX AI A2XWHG-091XTR" → mpn: "A2XWHG-091XTR"
- "ASUS TUF Gaming F16 FX608JHR-RV048" → mpn: "FX608JHR-RV048"
- "Lenovo IdeaPad Slim 3 83K10062TR" → mpn: "83K10062TR"
- "HP 250 G10 B39W4AT" → mpn: "B39W4AT"
- "Dell VOSTRO 3530 N1611pvnb3530" → mpn: "N1611pvnb3530"
- "Acer Nitro 5 NH.QZAEY.002" → mpn: "NH.QZAEY.002"

Telefon/tablet örnekleri:
- "Samsung SM-S931B Galaxy S25" → mpn: "SM-S931B"
- "Apple MYE03TU/A iPhone 16" → mpn: "MYE03TU/A"
- "Samsung Galaxy S25 256 GB Buz Mavisi" → mpn: null

Diğer ürünler:
- "Sony WH-1000XM5 Kablosuz Kulaklık" → mpn: "WH-1000XM5"
- "LG OLED55C3 55 inç 4K TV" → mpn: "OLED55C3"
- "Roborock S8 Pro Ultra Robot Süpürge" → mpn: "S8 Pro Ultra"
- "Xiaomi Mi 13T Pro 512GB" → mpn: null

Emin değilsen null döndür.

Ürünler:
${list}

SADECE JSON:
{"results":[{"id":"uuid","brand":"Marka","mpn":"KOD_VEYA_NULL"},...]}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { type: string; text: string }).text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return new Map();

  const parsed = JSON.parse(jsonMatch[0]);
  const map = new Map<string, { brand: string; mpn: string }>();
  for (const item of parsed.results ?? []) {
    if (item.id && item.brand && item.mpn && item.mpn !== 'null') {
      map.set(item.id, { brand: item.brand, mpn: item.mpn });
    }
  }
  return map;
}

// ── Icecat: brand + productcode ile spec çek ─────────────────────────────────
async function fetchIcecatSpecs(brand: string, productCode: string, catKey: string): Promise<Record<string, any> | null> {
  const fields = FIELD_MAP[catKey];
  if (!fields || !productCode) return null;

  const url = `https://live.icecat.biz/api?shopname=${ICECAT_USER}&lang=EN&brand=${encodeURIComponent(brand)}&productcode=${encodeURIComponent(productCode)}&content=`;

  try {
    const res = await fetch(url, {
      headers: {
        'api-token':     ICECAT_API_TOKEN,
        'content-token': ICECAT_CONTENT_TOKEN,
      },
    });
    if (!res.ok) return null;

    const data: any = await res.json();
    if (!data?.data || data.data === false) return null;

    // Tüm feature'ları düzleştir
    const allFeatures: Array<{ name: string; value: string }> = [];
    for (const group of data.data?.FeaturesGroups ?? []) {
      for (const feat of group?.Features ?? []) {
        const name  = feat?.Feature?.Name?.Value ?? '';
        const value = feat?.Value ?? feat?.LocalValue ?? '';
        if (name && value) allFeatures.push({ name, value });
      }
    }
    if (!allFeatures.length) return null;

    // Field map ile eşleştir
    const result: Record<string, any> = {};
    for (const fd of fields) {
      const names = Array.isArray(fd.icecatName) ? fd.icecatName : [fd.icecatName];
      for (const searchName of names) {
        const found = allFeatures.find(f => f.name.toLowerCase().includes(searchName.toLowerCase()));
        if (!found) continue;
        const raw = found.value.replace(/[^\d.,a-zA-Z\s-]/g, '').trim();
        if (fd.type === 'number') {
          const num = parseFloat(raw.replace(',', '.'));
          if (!isNaN(num)) { result[fd.ourKey] = num; break; }
        } else {
          if (raw) { result[fd.ourKey] = raw; break; }
        }
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const args        = process.argv.slice(2);
  const categoryArg = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;
  const limitArg    = args.includes('--limit')    ? parseInt(args[args.indexOf('--limit') + 1]) : 500;
  const aiBatchSize = 20;

  if (!ICECAT_API_TOKEN) {
    console.error('❌ .env.local\'e ICECAT_API_TOKEN ekle!');
    process.exit(1);
  }

  console.log('🧊 ratio.run Icecat Spec Fetcher v5');
  console.log(`   Kategori : ${categoryArg ?? 'TÜMÜ'}`);
  console.log(`   Limit    : ${limitArg}\n`);

  const catsToProcess = categoryArg
    ? [SLUG_MAP[categoryArg] ?? categoryArg]
    : Object.keys(FIELD_MAP);

  let totalUpdated = 0, totalNotFound = 0, totalFailed = 0;

  for (const catKey of catsToProcess) {
    if (!FIELD_MAP[catKey]) continue;

    const slugsToTry = [catKey, ...Object.entries(SLUG_MAP).filter(([,v]) => v === catKey).map(([k]) => k)];
    const { data: dbCats } = await supabase.from('categories').select('id,name').in('slug', slugsToTry);
    if (!dbCats?.length) { console.log(`⚠️  ${catKey}: DB'de yok`); continue; }

    const catId = dbCats[0].id;
    console.log(`📦 ${dbCats[0].name ?? catKey}`);

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, brand, model, specifications')
      .eq('category_id', catId)
      .eq('is_active', true)
      .limit(limitArg);

    if (error || !products) { console.log(`   ❌ ${error?.message}`); continue; }

    const fields     = FIELD_MAP[catKey];
    const needsSpecs = products.filter(p => {
      const s = (p.specifications as Record<string, any>) ?? {};
      return !fields.some(f => s[f.ourKey] != null);
    });

    console.log(`   ${products.length} ürün → ${needsSpecs.length} spec gerektiriyor`);
    if (!needsSpecs.length) { console.log('   ✅ Hepsi dolu\n'); continue; }

    // Tüm ürünler için Haiku ile MPN çıkar (hem Amazon hem Trendyol)
    console.log(`   🤖 MPN kodları çıkarılıyor...`);
    const mpnMap = new Map<string, { brand: string; mpn: string }>();
    for (let i = 0; i < needsSpecs.length; i += aiBatchSize) {
      const batch = needsSpecs.slice(i, i + aiBatchSize);
      try {
        const result = await extractMPNsWithAI(batch.map(p => ({ id: p.id, name: p.name ?? '', brand: p.brand ?? '' })));
        result.forEach((v, k) => mpnMap.set(k, v));
        await sleep(300);
      } catch (e: any) {
        console.log(`   ⚠️  AI hatası: ${e.message}`);
      }
    }
    console.log(`   ✅ ${mpnMap.size}/${needsSpecs.length} ürün için MPN bulundu\n`);

    for (let i = 0; i < needsSpecs.length; i++) {
      const p = needsSpecs[i];

      const mpnInfo = mpnMap.get(p.id);
      let brand: string;
      let productCode: string;

      if (!mpnInfo) {
        process.stdout.write(`   [${i + 1}/${needsSpecs.length}] ${(p.name ?? '').slice(0, 35).padEnd(35)} ⚪ MPN yok\n`);
        totalNotFound++;
        continue;
      }

      brand       = mpnInfo.brand;
      productCode = mpnInfo.mpn;

      const label = `${brand} ${productCode}`.slice(0, 35).padEnd(35);
      process.stdout.write(`   [${i + 1}/${needsSpecs.length}] ${label} `);

      const specs = await fetchIcecatSpecs(brand, productCode, catKey);
      await sleep(300);

      if (!specs) {
        process.stdout.write('⚪ Icecat\'te yok\n');
        totalNotFound++;
      } else {
        const existing = (p.specifications as Record<string, any>) ?? {};
        const merged   = { ...existing, ...specs };
        const { error: uErr } = await supabase.from('products').update({ specifications: merged }).eq('id', p.id);
        if (uErr) { process.stdout.write('❌ DB hatası\n'); totalFailed++; }
        else { process.stdout.write(`✅ ${Object.keys(specs).join(', ')}\n`); totalUpdated++; }
      }
    }
    console.log('');
  }

  console.log('─'.repeat(50));
  console.log(`✅ Güncellenen : ${totalUpdated}`);
  console.log(`⚪ Bulunamayan : ${totalNotFound}`);
  console.log(`❌ Hata        : ${totalFailed}`);
}

main().catch(console.error);
