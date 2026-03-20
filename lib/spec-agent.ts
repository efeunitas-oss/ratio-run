// ============================================================================
// lib/spec-agent.ts v3
// ratio.run — Otonom Spec Tamamlama Ajanı
// Değişiklikler v3:
//   - Epey.com birincil kaynak olarak eklendi
//   - Haiku → Epey URL üret → Epey'den çek → bulamazsa title parsing
//   - Her ürün için kaynak spec_source'a yazılıyor (epey / title-parsing)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

interface AgentProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  category_slug: string;
  specifications: Record<string, any>;
  source_url: string;
}

interface AgentRunResult {
  processed: number;
  updated: number;
  failed: number;
  skipped: number;
  epey_hits: number;
  title_hits: number;
  errors: string[];
}

// ── Epey kategori slug'ları ───────────────────────────────────────────────────
const EPEY_CATEGORY_SLUGS: Record<string, string> = {
  telefon:          'akilli-telefonlar',
  laptop:           'dizustu-bilgisayarlar',
  tablet:           'tabletler',
  saat:             'akilli-saatler',
  kulaklik:         'kulakliklar',
  'robot-supurge':  'robot-supurgeler',
  tv:               'televizyonlar',
};

// ── Epey → DB field map ───────────────────────────────────────────────────────
interface FieldDef { epeyLabel: string[]; ourKey: string; type: 'number' | 'text' }

const EPEY_FIELD_MAP: Record<string, FieldDef[]> = {
  telefon: [
    { epeyLabel: ['RAM', 'Dahili RAM', 'Bellek'],               ourKey: 'ram',             type: 'number' },
    { epeyLabel: ['Dahili Depolama', 'Depolama', 'Hafıza'],     ourKey: 'storage',         type: 'number' },
    { epeyLabel: ['Ekran Boyutu', 'Ekran'],                     ourKey: 'screen_size',     type: 'number' },
    { epeyLabel: ['Arka Kamera', 'Ana Kamera', 'Kamera'],       ourKey: 'camera_mp',       type: 'number' },
    { epeyLabel: ['Batarya Kapasitesi', 'Pil', 'Batarya'],      ourKey: 'battery_mah',     type: 'number' },
    { epeyLabel: ['Ekran Yenileme Hızı', 'Yenileme Hızı'],      ourKey: 'display_refresh', type: 'number' },
    { epeyLabel: ['İşlemci', 'Yonga Seti', 'Chipset'],          ourKey: 'chipset',         type: 'text'   },
  ],
  laptop: [
    { epeyLabel: ['RAM', 'Bellek'],                             ourKey: 'ram_size',           type: 'number' },
    { epeyLabel: ['SSD', 'Depolama', 'Disk'],                   ourKey: 'storage',            type: 'number' },
    { epeyLabel: ['Ekran Boyutu', 'Ekran'],                     ourKey: 'screen_size',        type: 'number' },
    { epeyLabel: ['İşlemci', 'CPU'],                            ourKey: 'processor_gen',      type: 'text'   },
    { epeyLabel: ['Ekran Parlaklığı', 'Parlaklık'],             ourKey: 'display_brightness', type: 'number' },
    { epeyLabel: ['Pil Ömrü', 'Batarya Ömrü'],                  ourKey: 'battery_life',       type: 'number' },
    { epeyLabel: ['Ekran Yenileme Hızı', 'Yenileme Hızı'],      ourKey: 'refresh_hz',         type: 'number' },
  ],
  tablet: [
    { epeyLabel: ['RAM', 'Bellek'],                             ourKey: 'ram',         type: 'number' },
    { epeyLabel: ['Dahili Depolama', 'Depolama'],               ourKey: 'storage',     type: 'number' },
    { epeyLabel: ['Ekran Boyutu', 'Ekran'],                     ourKey: 'screen_size', type: 'number' },
    { epeyLabel: ['Batarya Kapasitesi', 'Batarya'],             ourKey: 'battery_mah', type: 'number' },
    { epeyLabel: ['İşlemci'],                                   ourKey: 'processor',   type: 'text'   },
  ],
  saat: [
    { epeyLabel: ['Pil Ömrü', 'Batarya Ömrü'],                 ourKey: 'battery_life', type: 'number' },
    { epeyLabel: ['Ekran Boyutu', 'Ekran'],                     ourKey: 'screen_size',  type: 'number' },
    { epeyLabel: ['İşletim Sistemi', 'OS'],                     ourKey: 'os',           type: 'text'   },
    { epeyLabel: ['Su Geçirmezlik', 'Su Direnci'],              ourKey: 'waterproof',   type: 'text'   },
  ],
  kulaklik: [
    { epeyLabel: ['Pil Ömrü', 'Oynatma Süresi'],               ourKey: 'battery_life',       type: 'number' },
    { epeyLabel: ['Sürücü Boyutu', 'Sürücü'],                  ourKey: 'driver_size',        type: 'number' },
    { epeyLabel: ['Gürültü Engelleme', 'ANC'],                  ourKey: 'noise_cancellation', type: 'text'   },
    { epeyLabel: ['Bağlantı', 'Bluetooth'],                     ourKey: 'connection',         type: 'text'   },
  ],
  'robot-supurge': [
    { epeyLabel: ['Emme Gücü', 'Emiş Gücü'],                   ourKey: 'suctionPower',    type: 'number' },
    { epeyLabel: ['Batarya Kapasitesi', 'Batarya'],             ourKey: 'batteryCapacity', type: 'number' },
    { epeyLabel: ['Ses Seviyesi', 'Gürültü'],                   ourKey: 'noiseLevel',      type: 'number' },
    { epeyLabel: ['Navigasyon', 'Haritalama', 'Eşleme'],        ourKey: 'mappingTech',     type: 'text'   },
  ],
  tv: [
    { epeyLabel: ['Ekran Boyutu', 'Ekran'],                     ourKey: 'screen_size',  type: 'number' },
    { epeyLabel: ['Çözünürlük', 'Ekran Çözünürlüğü'],           ourKey: 'resolution',   type: 'text'   },
    { epeyLabel: ['Ekran Yenileme Hızı', 'Hz'],                 ourKey: 'refresh_rate', type: 'number' },
    { epeyLabel: ['Panel Tipi', 'Panel'],                        ourKey: 'panel_type',   type: 'text'   },
  ],
};

// ── Kategori → zorunlu spec alanları ─────────────────────────────────────────
const REQUIRED_SPEC_KEYS: Record<string, string[]> = {
  telefon:          ['ram', 'storage', 'battery_mah', 'camera_mp'],
  laptop:           ['ram_size', 'storage', 'screen_size', 'processor_gen'],
  tablet:           ['ram', 'storage', 'battery_mah', 'screen_size'],
  saat:             ['battery_life', 'screen_size'],
  kulaklik:         ['battery_life', 'connection'],
  'robot-supurge':  ['suctionPower', 'batteryCapacity'],
  tv:               ['screen_size', 'resolution'],
};

// ── Spec eksik mi? ────────────────────────────────────────────────────────────
function needsSpecs(product: AgentProduct): boolean {
  const keys = REQUIRED_SPEC_KEYS[product.category_slug] || [];
  if (keys.length === 0) return false;
  const specs = product.specifications || {};
  return keys.some(k => specs[k] == null || specs[k] === '');
}

// ── Garip alanları temizle ────────────────────────────────────────────────────
function cleanSpecs(specs: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(specs)) {
    if (/^\d+$/.test(key)) continue;
    if (String(value) === '[object Object]') continue;
    cleaned[key] = value;
  }
  return cleaned;
}

// ── Haiku ile Epey URL üret ───────────────────────────────────────────────────
async function generateEpeyUrl(
  anthropic: Anthropic,
  product: AgentProduct
): Promise<string | null> {
  const epeyCategory = EPEY_CATEGORY_SLUGS[product.category_slug];
  if (!epeyCategory) return null;

  const prompt = `Ürün adından Epey.com URL slug'ı oluştur.
Kural: marka + model, küçük harf, boşluk yerine tire, Türkçe karakter yok.
Renk, GB, RAM, garantisi, ithalatçı gibi ekstralar dahil ETME.

Örnekler:
- "Samsung Galaxy S25 256 GB Buz Mavisi" → "samsung-galaxy-s25"
- "Apple iPhone 16 Plus 256GB" → "apple-iphone-16-plus"
- "Xiaomi Redmi Note 15 Pro 8GB+256GB" → "xiaomi-redmi-note-15-pro"
- "Sony WH-1000XM5 Kablosuz Kulaklık" → "sony-wh-1000xm5"
- "LG OLED55C3 55 inç 4K TV" → "lg-oled55c3"
- "Roborock S8 Pro Ultra Robot Süpürge" → "roborock-s8-pro-ultra"

Ürün: "${product.name}"

SADECE slug döndür, başka hiçbir şey yazma. Örnek: samsung-galaxy-s25`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      messages: [{ role: 'user', content: prompt }],
    });

    const slug = ((response.content[0] as any).text ?? '').trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    if (!slug) return null;
    return `https://www.epey.com/${epeyCategory}/${slug}.html`;
  } catch {
    return null;
  }
}

// ── Epey sayfasından spec çek ─────────────────────────────────────────────────
async function fetchEpeySpecs(
  url: string,
  categorySlug: string
): Promise<Record<string, any> | null> {
  const fields = EPEY_FIELD_MAP[categorySlug];
  if (!fields) return null;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Epey spec tablosu: <tr><td>RAM</td><td>8 GB</td></tr>
    const rows: Array<{ label: string; value: string }> = [];
    const rowMatches = html.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/gi);

    for (const match of rowMatches) {
      const cells = [...match[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
        .map(m => m[1].replace(/<[^>]+>/g, '').trim());
      if (cells.length >= 2) rows.push({ label: cells[0], value: cells[1] });
    }

    if (!rows.length) return null;

    const result: Record<string, any> = {};
    for (const fd of fields) {
      for (const searchLabel of fd.epeyLabel) {
        const found = rows.find(r =>
          r.label.toLowerCase().includes(searchLabel.toLowerCase())
        );
        if (!found?.value) continue;

        if (fd.type === 'number') {
          const numMatch = found.value.match(/(\d+[.,]?\d*)/);
          if (numMatch) {
            const num = parseFloat(numMatch[1].replace(',', '.'));
            if (!isNaN(num) && num > 0) { result[fd.ourKey] = num; break; }
          }
        } else {
          if (found.value && found.value !== '-') { result[fd.ourKey] = found.value; break; }
        }
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

// ── Fallback: Haiku ile title'dan spec çıkar ──────────────────────────────────
async function extractSpecsFromTitle(
  anthropic: Anthropic,
  product: AgentProduct
): Promise<Record<string, any> | null> {
  const categoryPrompts: Record<string, string> = {
    telefon:         `RAM (GB sayı), depolama (GB sayı), ekran (inç sayı), kamera (MP sayı), batarya (mAh sayı), 5G (true/false)\nAlan adları: ram, storage, screen_size, camera_mp, battery_mah, has_5g`,
    laptop:          `RAM (GB sayı), SSD (GB sayı), ekran (inç sayı), işlemci adı (metin), yenileme hızı (Hz sayı)\nAlan adları: ram_size, storage, screen_size, processor_gen, refresh_hz`,
    tablet:          `RAM (GB sayı), depolama (GB sayı), ekran (inç sayı), batarya (mAh sayı)\nAlan adları: ram, storage, screen_size, battery_mah`,
    saat:            `pil ömrü (gün sayı), kasa boyutu (mm sayı), GPS (true/false)\nAlan adları: battery_life, screen_size, has_gps`,
    kulaklik:        `pil ömrü (saat sayı), ANC (true/false), bluetooth (true/false)\nAlan adları: battery_life, has_anc, is_wireless`,
    'robot-supurge': `emme gücü (Pa sayı), batarya (mAh sayı), LiDAR (true/false)\nAlan adları: suctionPower, batteryCapacity, has_lidar`,
    tv:              `ekran (inç sayı), 4K (true/false), OLED (true/false), yenileme hızı (Hz sayı)\nAlan adları: screen_size, is_4k, is_oled, refresh_rate`,
  };

  const fields = categoryPrompts[product.category_slug];
  if (!fields) return null;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Ürün adından teknik özellikleri çıkar. SADECE adında yazan değerleri al, tahmin yapma.

Ürün adı: "${product.name}"

Çıkarılacak alanlar:
${fields}

SADECE JSON döndür: {"alan": değer}
Bulamazsan o alanı ekleme.`,
      }],
    });

    const text = (response.content[0] as any).text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

// ── Spec label'larını güncelle ────────────────────────────────────────────────
function buildSpecLabels(specs: Record<string, any>): Record<string, string | null> {
  const labels: Record<string, string | null> = {};
  if (specs.ram)              labels['RAM']           = `${specs.ram} GB`;
  if (specs.ram_size)         labels['RAM']           = `${specs.ram_size} GB`;
  if (specs.storage)          labels['Depolama']      = `${specs.storage} GB`;
  if (specs.screen_size)      labels['Ekran']         = `${specs.screen_size} inç`;
  if (specs.battery_mah)      labels['Batarya']       = `${specs.battery_mah} mAh`;
  if (specs.camera_mp)        labels['Kamera']        = `${specs.camera_mp} MP`;
  if (specs.battery_life)     labels['Pil Ömrü']      = `${specs.battery_life} saat`;
  if (specs.suctionPower)     labels['Emme Gücü']     = `${specs.suctionPower} Pa`;
  if (specs.resolution)       labels['Çözünürlük']    = specs.resolution;
  if (specs.refresh_hz)       labels['Yenileme']      = `${specs.refresh_hz} Hz`;
  if (specs.refresh_rate)     labels['Yenileme']      = `${specs.refresh_rate} Hz`;
  if (specs.display_refresh)  labels['Yenileme']      = `${specs.display_refresh} Hz`;
  if (specs.processor_gen)    labels['İşlemci']       = specs.processor_gen;
  if (specs.panel_type)       labels['Panel']         = specs.panel_type;
  if (specs.mappingTech)      labels['Navigasyon']    = specs.mappingTech;
  if (specs.has_5g === true)  labels['5G']            = 'Evet';
  if (specs.has_5g === false) labels['5G']            = 'Hayır';
  if (specs.has_anc === true) labels['ANC']           = 'Var';
  if (specs.is_4k === true)   labels['Çözünürlük']    = '4K UHD';
  if (specs.is_oled === true) labels['Panel']         = 'OLED';
  return labels;
}

// ── Ana Agent ─────────────────────────────────────────────────────────────────
export async function runSpecAgent(options?: {
  categorySlug?: string;
  batchSize?: number;
  maxProducts?: number;
}): Promise<AgentRunResult> {
  const {
    categorySlug,
    batchSize   = 10,
    maxProducts = 50,
  } = options || {};

  const result: AgentRunResult = {
    processed: 0, updated: 0, failed: 0,
    skipped: 0, epey_hits: 0, title_hits: 0, errors: [],
  };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY eksik');
  const anthropic = new Anthropic({ apiKey });

  // 1. Spec'i eksik ürünleri çek
  let query = supabase
    .from('products')
    .select('id, name, brand, model, source_url, specifications, categories!inner(slug)')
    .eq('is_active', true)
    .limit(maxProducts);

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories').select('id').eq('slug', categorySlug).single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  const { data: rawProducts, error: fetchError } = await query;
  if (fetchError || !rawProducts?.length) {
    result.errors.push(`Ürün çekilemedi: ${fetchError?.message || 'Boş liste'}`);
    return result;
  }

  const products: AgentProduct[] = rawProducts.map((p: any) => ({
    id:            p.id,
    name:          p.name || '',
    brand:         p.brand || '',
    model:         p.model || '',
    category_slug: p.categories?.slug || '',
    specifications: p.specifications || {},
    source_url:    p.source_url || '',
  }));

  const needsFilling = products.filter(needsSpecs);
  if (needsFilling.length === 0) return result;

  // 2. Her ürün için: Epey → fallback title parsing
  for (let i = 0; i < Math.min(needsFilling.length, batchSize); i++) {
    const product = needsFilling[i];
    result.processed++;

    try {
      const cleanedExisting = cleanSpecs(product.specifications);
      let newSpecs: Record<string, any> | null = null;
      let source = 'title-parsing';

      // ── Birincil: Epey ──────────────────────────────────────────────────
      const epeyUrl = await generateEpeyUrl(anthropic, product);
      if (epeyUrl) {
        newSpecs = await fetchEpeySpecs(epeyUrl, product.category_slug);
        if (newSpecs) {
          source = 'epey';
          result.epey_hits++;
          console.log(`✅ [epey]  ${product.name.substring(0, 50)}: ${Object.keys(newSpecs).join(', ')}`);
        }
      }

      // ── Fallback: Title parsing ──────────────────────────────────────────
      if (!newSpecs) {
        newSpecs = await extractSpecsFromTitle(anthropic, product);
        if (newSpecs) {
          result.title_hits++;
          console.log(`🔤 [title] ${product.name.substring(0, 50)}: ${Object.keys(newSpecs).join(', ')}`);
        }
      }

      if (!newSpecs || Object.keys(newSpecs).length === 0) {
        // Sadece temizlik yap
        if (JSON.stringify(cleanedExisting) !== JSON.stringify(product.specifications)) {
          await supabase.from('products').update({ specifications: cleanedExisting }).eq('id', product.id);
          result.updated++;
        } else {
          result.skipped++;
        }
        continue;
      }

      const merged = {
        ...cleanedExisting,
        ...newSpecs,
        spec_labels:     buildSpecLabels({ ...cleanedExisting, ...newSpecs }),
        spec_source:     source,
        spec_updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('products').update({ specifications: merged }).eq('id', product.id);

      if (updateError) {
        result.failed++;
        result.errors.push(`${product.name}: ${updateError.message}`);
      } else {
        result.updated++;
      }

      // Epey'e nazik davran
      await new Promise(r => setTimeout(r, source === 'epey' ? 700 : 200));

    } catch (err: any) {
      result.failed++;
      result.errors.push(`${product.name}: ${err.message}`);
    }
  }

  return result;
}
