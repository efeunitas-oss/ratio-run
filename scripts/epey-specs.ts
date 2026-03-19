// ============================================================================
// RATIO.RUN — EPEY SPEC FETCHER
// Epey.com'dan ürün teknik özelliklerini çeker, Supabase'e yazar.
//
// Kullanım:
//   npx ts-node --skip-project scripts/epey-specs.ts --category telefon --limit 10
//   npx ts-node --skip-project scripts/epey-specs.ts
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ── Epey kategori slug'ları ───────────────────────────────────────────────────
const EPEY_CATEGORY_SLUGS: Record<string, string> = {
  telefon:        'akilli-telefonlar',
  laptop:         'dizustu-bilgisayarlar',
  tablet:         'tabletler',
  saat:           'akilli-saatler',
  kulaklik:       'kulakliklar',
  'robot-supurge':'robot-supurgeler',
  tv:             'televizyonlar',
};

// ── Kategori → çekilecek spec alanları ───────────────────────────────────────
interface FieldDef { epeyLabel: string | string[]; ourKey: string; type: 'number' | 'text' }

const FIELD_MAP: Record<string, FieldDef[]> = {
  telefon: [
    { epeyLabel: ['RAM', 'Dahili RAM', 'Bellek'],              ourKey: 'ram',             type: 'number' },
    { epeyLabel: ['Dahili Depolama', 'Depolama', 'Hafıza'],    ourKey: 'storage',         type: 'number' },
    { epeyLabel: ['Ekran Boyutu', 'Ekran'],                    ourKey: 'screen_size',     type: 'number' },
    { epeyLabel: ['Arka Kamera', 'Ana Kamera', 'Kamera'],      ourKey: 'camera_mp',       type: 'number' },
    { epeyLabel: ['Batarya Kapasitesi', 'Pil', 'Batarya'],     ourKey: 'battery_mah',     type: 'number' },
    { epeyLabel: ['Ekran Yenileme Hızı', 'Yenileme Hızı'],     ourKey: 'display_refresh', type: 'number' },
    { epeyLabel: ['İşlemci', 'Yonga Seti', 'Chipset'],         ourKey: 'chipset',         type: 'text'   },
  ],
  laptop: [
    { epeyLabel: ['RAM', 'Bellek'],                            ourKey: 'ram_size',            type: 'number' },
    { epeyLabel: ['SSD', 'Depolama', 'Disk'],                  ourKey: 'storage',             type: 'number' },
    { epeyLabel: ['Ekran Boyutu', 'Ekran'],                    ourKey: 'screen_size',         type: 'number' },
    { epeyLabel: ['İşlemci', 'CPU'],                           ourKey: 'processor_gen',       type: 'text'   },
    { epeyLabel: ['Ekran Parlaklığı', 'Parlaklık'],            ourKey: 'display_brightness',  type: 'number' },
    { epeyLabel: ['Pil Ömrü', 'Batarya Ömrü'],                 ourKey: 'battery_life',        type: 'number' },
  ],
  tablet: [
    { epeyLabel: ['RAM', 'Bellek'],                            ourKey: 'ram',         type: 'number' },
    { epeyLabel: ['Dahili Depolama', 'Depolama'],              ourKey: 'storage',     type: 'number' },
    { epeyLabel: ['Ekran Boyutu', 'Ekran'],                    ourKey: 'screen_size', type: 'number' },
    { epeyLabel: ['Batarya Kapasitesi', 'Batarya'],            ourKey: 'battery_mah', type: 'number' },
    { epeyLabel: ['İşlemci'],                                  ourKey: 'processor',   type: 'text'   },
  ],
  saat: [
    { epeyLabel: ['Pil Ömrü', 'Batarya Ömrü'],                ourKey: 'battery_life',  type: 'number' },
    { epeyLabel: ['Ekran Boyutu', 'Ekran'],                    ourKey: 'screen_size',   type: 'number' },
    { epeyLabel: ['İşletim Sistemi', 'OS'],                    ourKey: 'os',            type: 'text'   },
    { epeyLabel: ['Su Geçirmezlik', 'Su Direnci'],             ourKey: 'waterproof',    type: 'text'   },
  ],
  kulaklik: [
    { epeyLabel: ['Pil Ömrü', 'Oynatma Süresi'],              ourKey: 'battery_life',       type: 'number' },
    { epeyLabel: ['Sürücü Boyutu', 'Sürücü'],                 ourKey: 'driver_size',        type: 'number' },
    { epeyLabel: ['Gürültü Engelleme', 'ANC'],                ourKey: 'noise_cancellation', type: 'text'   },
    { epeyLabel: ['Bağlantı', 'Bluetooth'],                   ourKey: 'connection',         type: 'text'   },
  ],
  'robot-supurge': [
    { epeyLabel: ['Emme Gücü', 'Emiş Gücü'],                  ourKey: 'suctionPower',    type: 'number' },
    { epeyLabel: ['Batarya Kapasitesi', 'Batarya'],            ourKey: 'batteryCapacity', type: 'number' },
    { epeyLabel: ['Ses Seviyesi', 'Gürültü'],                  ourKey: 'noiseLevel',      type: 'number' },
    { epeyLabel: ['Navigasyon', 'Haritalama', 'Eşleme'],       ourKey: 'mappingTech',     type: 'text'   },
  ],
  tv: [
    { epeyLabel: ['Ekran Boyutu', 'Ekran'],                    ourKey: 'screen_size',  type: 'number' },
    { epeyLabel: ['Çözünürlük', 'Ekran Çözünürlüğü'],          ourKey: 'resolution',   type: 'text'   },
    { epeyLabel: ['Ekran Yenileme Hızı', 'Hz'],                ourKey: 'refresh_rate', type: 'number' },
    { epeyLabel: ['Panel Tipi', 'Panel'],                      ourKey: 'panel_type',   type: 'text'   },
  ],
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

// ── Haiku ile Epey URL slug'ı üret ───────────────────────────────────────────
async function generateEpeySlugs(
  products: { id: string; name: string }[],
  catKey: string
): Promise<Map<string, string>> {
  const epeyCategory = EPEY_CATEGORY_SLUGS[catKey];
  const list = products.map((p, i) => `${i + 1}. ID:"${p.id}" | "${p.name}"`).join('\n');

  const prompt = `Aşağıdaki ürün adlarından Epey.com URL slug'ı oluştur.
Kural: marka + model, küçük harf, boşluk yerine tire, Türkçe karakter yok.
Renk, GB, RAM gibi ekstralar dahil ETME.

Örnekler:
- "Samsung Galaxy S25 256 GB Buz Mavisi" → "samsung-galaxy-s25"
- "Apple iPhone 16 Plus 256GB" → "apple-iphone-16-plus"
- "Xiaomi Redmi Note 15 Pro 8GB+256GB" → "xiaomi-redmi-note-15-pro"
- "Roborock S8 Pro Ultra Robot Süpürge" → "roborock-s8-pro-ultra"
- "Sony WH-1000XM5 Kablosuz Kulaklık" → "sony-wh-1000xm5"
- "LG OLED55C3 55 inç 4K TV" → "lg-oled55c3"
- "Lenovo IdeaPad 3 15IAU7 i5 16GB 512GB" → "lenovo-ideapad-3-15iau7"
- "Roborock Qrevo Pro Islak Kuru Robot Süpürge" → "roborock-qrevo-pro"

Ürünler:
${list}

SADECE JSON ver:
{"results":[{"id":"uuid","slug":"epey-slug"},...]}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as any).text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSON yok');

  const parsed = JSON.parse(jsonMatch[0]);
  const map = new Map<string, string>();
  for (const item of parsed.results ?? []) {
    if (item.id && item.slug) {
      map.set(item.id, `https://www.epey.com/${epeyCategory}/${item.slug}.html`);
    }
  }
  return map;
}

// ── Epey sayfasını parse et ───────────────────────────────────────────────────
async function fetchEpeySpecs(url: string, catKey: string): Promise<Record<string, any> | null> {
  const fields = FIELD_MAP[catKey];
  if (!fields) return null;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Epey spec tablosunu regex ile parse et
    // <tr><td>RAM</td><td>8 GB</td></tr> formatında
    const result: Record<string, any> = {};

    // Tüm tablo satırlarını çek
    const rowMatches = html.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    const rows: Array<{ label: string; value: string }> = [];

    for (const match of rowMatches) {
      const row = match[0];
      // td'leri çek
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
        .map(m => m[1].replace(/<[^>]+>/g, '').trim());
      if (cells.length >= 2) {
        rows.push({ label: cells[0], value: cells[1] });
      }
    }

    if (!rows.length) return null;

    // Field map ile eşleştir
    for (const fd of fields) {
      const labels = Array.isArray(fd.epeyLabel) ? fd.epeyLabel : [fd.epeyLabel];
      for (const searchLabel of labels) {
        const found = rows.find(r =>
          r.label.toLowerCase().includes(searchLabel.toLowerCase())
        );
        if (!found || !found.value) continue;

        const raw = found.value;

        if (fd.type === 'number') {
          // Sayıyı çıkar: "8 GB" → 8, "6.2 inç" → 6.2, "4000 mAh" → 4000
          const numMatch = raw.match(/(\d+[\.,]?\d*)/);
          if (numMatch) {
            const num = parseFloat(numMatch[1].replace(',', '.'));
            if (!isNaN(num)) { result[fd.ourKey] = num; break; }
          }
        } else {
          if (raw && raw !== '-') { result[fd.ourKey] = raw; break; }
        }
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Ana fonksiyon ─────────────────────────────────────────────────────────────
async function main() {
  const args        = process.argv.slice(2);
  const categoryArg = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;
  const limitArg    = args.includes('--limit')    ? parseInt(args[args.indexOf('--limit') + 1]) : 500;
  const aiBatchSize = 20;

  console.log('🔍 ratio.run Epey Spec Fetcher');
  console.log(`   Kategori : ${categoryArg ?? 'TÜMÜ'}`);
  console.log(`   Limit    : ${limitArg}\n`);

  const catsToProcess = categoryArg
    ? [SLUG_MAP[categoryArg] ?? categoryArg]
    : Object.keys(FIELD_MAP);

  let totalUpdated = 0, totalNotFound = 0, totalFailed = 0;

  for (const catKey of catsToProcess) {
    if (!FIELD_MAP[catKey] || !EPEY_CATEGORY_SLUGS[catKey]) continue;

    const slugsToTry = [catKey, ...Object.entries(SLUG_MAP).filter(([,v]) => v === catKey).map(([k]) => k)];
    const { data: dbCats } = await supabase
      .from('categories').select('id,name').in('slug', slugsToTry);
    if (!dbCats?.length) { console.log(`⚠️  ${catKey}: DB'de yok`); continue; }

    const catId = dbCats[0].id;
    console.log(`📦 ${dbCats[0].name ?? catKey}`);

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, brand, specifications')
      .eq('category_id', catId)
      .eq('is_active', true)
      .limit(limitArg);

    if (error || !products) { console.log(`   ❌ ${error?.message}`); continue; }

    const fields     = FIELD_MAP[catKey];
    const needsSpecs = products.filter(p => {
      const s = (p.specifications as any) ?? {};
      return !fields.some(f => s[f.ourKey] != null);
    });

    console.log(`   ${products.length} ürün → ${needsSpecs.length} spec gerektiriyor`);
    if (!needsSpecs.length) { console.log('   ✅ Hepsi dolu\n'); continue; }

    // Adım 1: Haiku ile Epey URL üret
    console.log(`   🤖 Epey URL'leri üretiliyor...`);
    const urlMap = new Map<string, string>();
    for (let i = 0; i < needsSpecs.length; i += aiBatchSize) {
      const batch = needsSpecs.slice(i, i + aiBatchSize);
      try {
        const result = await generateEpeySlugs(batch.map(p => ({ id: p.id, name: p.name ?? '' })), catKey);
        result.forEach((v, k) => urlMap.set(k, v));
        await sleep(300);
      } catch (e: any) {
        console.log(`   ⚠️  AI batch hatası: ${e.message}`);
      }
    }
    console.log(`   ✅ ${urlMap.size} URL hazır\n`);

    // Adım 2: Her ürün için Epey'den spec çek
    for (let i = 0; i < needsSpecs.length; i++) {
      const p   = needsSpecs[i];
      const url = urlMap.get(p.id);

      if (!url) {
        process.stdout.write(`   [${i + 1}/${needsSpecs.length}] ${'?'.padEnd(38)} ⚪ URL üretilemedi\n`);
        totalNotFound++;
        continue;
      }

      const slug  = url.split('/').pop()?.replace('.html', '') ?? '';
      const label = slug.slice(0, 38).padEnd(38);
      process.stdout.write(`   [${i + 1}/${needsSpecs.length}] ${label} `);

      const specs = await fetchEpeySpecs(url, catKey);

      if (!specs) {
        process.stdout.write(`⚪ Bulunamadı (${url.split('/').pop()})\n`);
        totalNotFound++;
      } else {
        const existing = (p.specifications as any) ?? {};
        const merged   = { ...existing, ...specs };
        const { error: uErr } = await supabase
          .from('products').update({ specifications: merged }).eq('id', p.id);
        if (uErr) { process.stdout.write('❌ DB hatası\n'); totalFailed++; }
        else { process.stdout.write(`✅ ${Object.keys(specs).join(', ')}\n`); totalUpdated++; }
      }

      await sleep(600); // Epey'e nazik davran
    }
    console.log('');
  }

  console.log('─'.repeat(50));
  console.log(`✅ Güncellenen : ${totalUpdated}`);
  console.log(`⚪ Bulunamayan : ${totalNotFound}`);
  console.log(`❌ Hata        : ${totalFailed}`);
}

main().catch(console.error);
