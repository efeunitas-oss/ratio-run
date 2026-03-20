// lib/spec-agent.ts v4
// ratio.run — web_search_20250305 tool ile gerçek web araması
// Fallback: title parsing

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
  web_hits: number;
  title_hits: number;
  errors: string[];
}

const REQUIRED_SPEC_KEYS: Record<string, string[]> = {
  telefon:         ['ram', 'storage', 'battery_mah', 'camera_mp'],
  laptop:          ['ram_size', 'storage', 'screen_size', 'processor_gen'],
  tablet:          ['ram', 'storage', 'battery_mah', 'screen_size'],
  saat:            ['battery_life', 'screen_size'],
  kulaklik:        ['battery_life', 'connection'],
  'robot-supurge': ['suctionPower', 'batteryCapacity'],
  tv:              ['screen_size', 'resolution'],
};

const CATEGORY_SPEC_PROMPTS: Record<string, string> = {
  telefon: `RAM (GB, sayi) -> "ram", Dahili depolama (GB, sayi) -> "storage", Batarya (mAh, sayi) -> "battery_mah", Ana kamera (MP, sayi) -> "camera_mp", Ekran (inc, sayi) -> "screen_size", Yenileme hizi (Hz, sayi) -> "display_refresh", Chipset (metin) -> "chipset", 5G (true/false) -> "has_5g"`,
  laptop: `RAM (GB, sayi) -> "ram_size", SSD (GB, sayi) -> "storage", Ekran (inc, sayi) -> "screen_size", Islemci (metin) -> "processor_gen", Yenileme hizi (Hz, sayi) -> "refresh_hz", Pil omru (saat, sayi) -> "battery_life"`,
  tablet: `RAM (GB, sayi) -> "ram", Depolama (GB, sayi) -> "storage", Ekran (inc, sayi) -> "screen_size", Batarya (mAh, sayi) -> "battery_mah", Islemci (metin) -> "processor"`,
  saat: `Pil omru (gun, sayi) -> "battery_life", Kasa boyutu (mm, sayi) -> "screen_size", GPS (true/false) -> "has_gps", AMOLED (true/false) -> "has_amoled"`,
  kulaklik: `Pil omru (saat, sayi) -> "battery_life", ANC (true/false) -> "has_anc", Baglanti (metin) -> "connection", Surucu boyutu (mm, sayi) -> "driver_size"`,
  'robot-supurge': `Emme gucu (Pa, sayi) -> "suctionPower", Batarya (mAh, sayi) -> "batteryCapacity", Ses (dB, sayi) -> "noiseLevel", Navigasyon (metin) -> "mappingTech", Paspas (true/false) -> "has_mop", LiDAR (true/false) -> "has_lidar"`,
  tv: `Ekran (inc, sayi) -> "screen_size", Cozunurluk (metin) -> "resolution", Panel (metin) -> "panel_type", Yenileme hizi (Hz, sayi) -> "refresh_rate", 4K (true/false) -> "is_4k", OLED (true/false) -> "is_oled"`,
};

function needsSpecs(product: AgentProduct): boolean {
  const keys = REQUIRED_SPEC_KEYS[product.category_slug] || [];
  if (!keys.length) return false;
  const specs = product.specifications || {};
  return keys.some(k => specs[k] == null || specs[k] === '');
}

function cleanSpecs(specs: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(specs)) {
    if (/^\d+$/.test(key)) continue;
    if (String(value) === '[object Object]') continue;
    cleaned[key] = value;
  }
  return cleaned;
}

async function fetchSpecsWithWebSearch(
  anthropic: Anthropic,
  product: AgentProduct
): Promise<Record<string, any> | null> {
  const specPrompt = CATEGORY_SPEC_PROMPTS[product.category_slug];
  if (!specPrompt) return null;

  const prompt = `"${product.name}" urunun teknik ozelliklerini web'de ara ve bul.

Bulmam gereken degerler: ${specPrompt}

SADECE gercek, dogrulanmis degerleri kullan, tahmin yapma.
Sonucu SADECE JSON olarak don, baska hicbir sey yazma:
{"ram": 8, "storage": 256}

Bulamazsan o alani JSON'a ekleme.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlocks = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    if (!textBlocks) return null;
    const jsonMatch = textBlocks.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch (err: any) {
    console.error(`[web-search] Hata: ${err.message}`);
    return null;
  }
}

async function fetchSpecsFromTitle(
  anthropic: Anthropic,
  product: AgentProduct
): Promise<Record<string, any> | null> {
  const specPrompt = CATEGORY_SPEC_PROMPTS[product.category_slug];
  if (!specPrompt) return null;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Urun adindan teknik ozellikleri cikar. SADECE adinda acikca yazan degerleri al, tahmin yapma.

Urun adi: "${product.name}"
Alanlar: ${specPrompt}

SADECE JSON don: {"alan": deger}
Bulamazsan o alani ekleme.`,
      }],
    });

    const text = (response.content[0] as any).text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function buildSpecLabels(specs: Record<string, any>): Record<string, string | null> {
  const labels: Record<string, string | null> = {};
  if (specs.ram)                labels['RAM']        = `${specs.ram} GB`;
  if (specs.ram_size)           labels['RAM']        = `${specs.ram_size} GB`;
  if (specs.storage)            labels['Depolama']   = `${specs.storage} GB`;
  if (specs.screen_size)        labels['Ekran']      = `${specs.screen_size} inc`;
  if (specs.battery_mah)        labels['Batarya']    = `${specs.battery_mah} mAh`;
  if (specs.camera_mp)          labels['Kamera']     = `${specs.camera_mp} MP`;
  if (specs.battery_life)       labels['Pil Omru']   = `${specs.battery_life} saat`;
  if (specs.suctionPower)       labels['Emme Gucu']  = `${specs.suctionPower} Pa`;
  if (specs.batteryCapacity)    labels['Batarya']    = `${specs.batteryCapacity} mAh`;
  if (specs.resolution)         labels['Cozunurluk'] = specs.resolution;
  if (specs.refresh_rate)       labels['Yenileme']   = `${specs.refresh_rate} Hz`;
  if (specs.refresh_hz)         labels['Yenileme']   = `${specs.refresh_hz} Hz`;
  if (specs.display_refresh)    labels['Yenileme']   = `${specs.display_refresh} Hz`;
  if (specs.processor_gen)      labels['Islemci']    = specs.processor_gen;
  if (specs.chipset)            labels['Chipset']    = specs.chipset;
  if (specs.panel_type)         labels['Panel']      = specs.panel_type;
  if (specs.mappingTech)        labels['Navigasyon'] = specs.mappingTech;
  if (specs.connection)         labels['Baglanti']   = specs.connection;
  if (specs.has_5g === true)    labels['5G']         = 'Evet';
  if (specs.has_5g === false)   labels['5G']         = 'Hayir';
  if (specs.has_anc === true)   labels['ANC']        = 'Var';
  if (specs.has_lidar === true) labels['Navigasyon'] = 'LiDAR';
  if (specs.is_4k === true)     labels['Cozunurluk'] = '4K UHD';
  if (specs.is_oled === true)   labels['Panel']      = 'OLED';
  if (specs.has_mop === true)   labels['Paspas']     = 'Var';
  return labels;
}

export async function runSpecAgent(options?: {
  categorySlug?: string;
  batchSize?: number;
  maxProducts?: number;
}): Promise<AgentRunResult> {
  const { categorySlug, batchSize = 5, maxProducts = 50 } = options || {};

  const result: AgentRunResult = {
    processed: 0, updated: 0, failed: 0,
    skipped: 0, web_hits: 0, title_hits: 0, errors: [],
  };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY eksik');
  const anthropic = new Anthropic({ apiKey });

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
    result.errors.push(`Urun cekilemedi: ${fetchError?.message || 'Bos liste'}`);
    return result;
  }

  const products: AgentProduct[] = rawProducts.map((p: any) => ({
    id: p.id, name: p.name || '', brand: p.brand || '',
    model: p.model || '', category_slug: p.categories?.slug || '',
    specifications: p.specifications || {}, source_url: p.source_url || '',
  }));

  const needsFilling = products.filter(needsSpecs);
  if (needsFilling.length === 0) return result;

  for (let i = 0; i < Math.min(needsFilling.length, batchSize); i++) {
    const product = needsFilling[i];
    result.processed++;

    try {
      const cleanedExisting = cleanSpecs(product.specifications);
      let newSpecs: Record<string, any> | null = null;
      let source = 'title-parsing';

      // Birincil: Web Search
      newSpecs = await fetchSpecsWithWebSearch(anthropic, product);
      if (newSpecs && Object.keys(newSpecs).length > 0) {
        source = 'web-search';
        result.web_hits++;
        console.log(`[web] ${product.name.substring(0, 50)}: ${Object.keys(newSpecs).join(', ')}`);
      }

      // Fallback: Title Parsing
      if (!newSpecs || Object.keys(newSpecs).length === 0) {
        newSpecs = await fetchSpecsFromTitle(anthropic, product);
        if (newSpecs && Object.keys(newSpecs).length > 0) {
          source = 'title-parsing';
          result.title_hits++;
          console.log(`[title] ${product.name.substring(0, 50)}: ${Object.keys(newSpecs).join(', ')}`);
        }
      }

      if (!newSpecs || Object.keys(newSpecs).length === 0) {
        if (JSON.stringify(cleanedExisting) !== JSON.stringify(product.specifications)) {
          await supabase.from('products').update({ specifications: cleanedExisting }).eq('id', product.id);
          result.updated++;
        } else {
          result.skipped++;
        }
        continue;
      }

      const merged = {
        ...cleanedExisting, ...newSpecs,
        spec_labels: buildSpecLabels({ ...cleanedExisting, ...newSpecs }),
        spec_source: source,
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

      await new Promise(r => setTimeout(r, source === 'web-search' ? 1000 : 300));

    } catch (err: any) {
      result.failed++;
      result.errors.push(`${product.name}: ${err.message}`);
    }
  }

  return result;
}
