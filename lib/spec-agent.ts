// ============================================================================
// lib/spec-agent.ts v2
// ratio.run — Otonom Spec Tamamlama Ajanı
// Değişiklikler:
//   - Claude Sonnet + web_search → Claude Haiku + title parsing (ucuz)
//   - Garip "0","1","2" alanları temizlendi
//   - Timeout sorunu çözüldü (batch 3, hızlı çalışır)
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
  errors: string[];
}

// ── Kategori → hangi spec alanları kontrol edilsin ───────────────────────────
const SPEC_KEYS: Record<string, string[]> = {
  telefon:         ['ram', 'storage', 'battery_mah', 'camera_mp'],
  laptop:          ['ram_size', 'storage', 'screen_size', 'processor_gen'],
  tablet:          ['ram', 'storage', 'battery_mah', 'screen_size'],
  saat:            ['battery_life', 'screen_size'],
  kulaklik:        ['battery_life', 'connection'],
  'robot-supurge': ['suctionPower', 'batteryCapacity'],
  tv:              ['screen_size', 'resolution'],
};

// ── Spec'i boş mu kontrol et ─────────────────────────────────────────────────
function needsSpecs(product: AgentProduct): boolean {
  const keys = SPEC_KEYS[product.category_slug] || [];
  if (keys.length === 0) return false;
  const specs = product.specifications || {};
  return keys.some(k => specs[k] == null || specs[k] === '');
}

// ── Garip alanları temizle ("0","1","2" gibi) ─────────────────────────────────
function cleanSpecs(specs: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(specs)) {
    // Sayısal key'leri at
    if (/^\d+$/.test(key)) continue;
    // [object Object] değerlerini at
    if (String(value) === '[object Object]') continue;
    cleaned[key] = value;
  }
  return cleaned;
}

// ── Haiku ile title'dan spec çıkar (ucuz yöntem) ─────────────────────────────
async function extractSpecsWithHaiku(
  anthropic: Anthropic,
  product: AgentProduct
): Promise<Record<string, any> | null> {
  const categoryPrompts: Record<string, string> = {
    telefon: `RAM (GB sayı), depolama (GB sayı), ekran boyutu (inç sayı), kamera (MP sayı), batarya (mAh sayı), 5G (true/false)
Alan adları: ram, storage, screen_size, camera_mp, battery_mah, has_5g`,
    laptop: `RAM (GB sayı), SSD (GB sayı), ekran boyutu (inç sayı), işlemci adı (metin), yenileme hızı (Hz sayı)
Alan adları: ram_size, storage, screen_size, processor_gen, refresh_hz`,
    tablet: `RAM (GB sayı), depolama (GB sayı), ekran boyutu (inç sayı), batarya (mAh sayı)
Alan adları: ram, storage, screen_size, battery_mah`,
    saat: `pil ömrü (gün sayı), kasa boyutu (mm sayı), GPS (true/false), AMOLED (true/false)
Alan adları: battery_life, screen_size, has_gps, has_amoled`,
    kulaklik: `pil ömrü (saat sayı), ANC (true/false), bluetooth (true/false)
Alan adları: battery_life, has_anc, is_wireless`,
    'robot-supurge': `emme gücü (Pa sayı), batarya (mAh sayı), LiDAR (true/false), paspas (true/false)
Alan adları: suctionPower, batteryCapacity, has_lidar, has_mop`,
    tv: `ekran boyutu (inç sayı), 4K (true/false), OLED (true/false), yenileme hızı (Hz sayı)
Alan adları: screen_size, is_4k, is_oled, refresh_rate`,
  };

  const fields = categoryPrompts[product.category_slug];
  if (!fields) return null;

  const prompt = `Ürün adından teknik özellikleri çıkar. SADECE ürün adında açıkça yazan değerleri al, tahmin yapma.

Ürün adı: "${product.name}"
Marka: ${product.brand}

Çıkarılacak alanlar:
${fields}

SADECE JSON döndür, başka hiçbir şey yazma:
{"alan_adı": değer, ...}

Bulamazsan o alanı JSON'a ekleme.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as any).text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (Object.keys(parsed).length === 0) return null;

    return parsed;
  } catch {
    return null;
  }
}

// ── Spec değerlerini normalize et ─────────────────────────────────────────────
function normalizeSpecs(rawSpecs: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  const numberFields = [
    'ram', 'ram_size', 'storage', 'screen_size', 'camera_mp',
    'battery_mah', 'battery_life', 'batteryCapacity', 'display_refresh',
    'driver_size', 'suctionPower', 'noiseLevel', 'refresh_rate',
    'display_brightness', 'refresh_hz'
  ];

  for (const [key, value] of Object.entries(rawSpecs)) {
    if (value === null || value === undefined || value === '') continue;
    if (/^\d+$/.test(key)) continue; // Sayısal key'leri atla

    if (numberFields.includes(key)) {
      const num = parseFloat(String(value).replace(',', '.'));
      if (!isNaN(num) && num > 0) normalized[key] = num;
    } else if (typeof value === 'boolean') {
      normalized[key] = value;
    } else {
      normalized[key] = String(value).trim();
    }
  }
  return normalized;
}

// ── Spec labels güncelle ──────────────────────────────────────────────────────
function updateSpecLabels(
  existing: Record<string, string | null>,
  newSpecs: Record<string, any>
): Record<string, string | null> {
  const labels = { ...existing };

  if (newSpecs.ram) labels['RAM'] = `${newSpecs.ram} GB`;
  if (newSpecs.ram_size) labels['RAM'] = `${newSpecs.ram_size} GB`;
  if (newSpecs.storage) labels['Depolama'] = `${newSpecs.storage} GB`;
  if (newSpecs.screen_size) labels['Ekran'] = `${newSpecs.screen_size} inç`;
  if (newSpecs.battery_mah) labels['Batarya'] = `${newSpecs.battery_mah} mAh`;
  if (newSpecs.camera_mp) labels['Kamera'] = `${newSpecs.camera_mp} MP`;
  if (newSpecs.battery_life) labels['Pil Ömrü'] = `${newSpecs.battery_life} saat`;
  if (newSpecs.suctionPower) labels['Emme Gücü'] = `${newSpecs.suctionPower} Pa`;
  if (newSpecs.resolution) labels['Çözünürlük'] = newSpecs.resolution;
  if (newSpecs.refresh_hz) labels['Yenileme Hızı'] = `${newSpecs.refresh_hz} Hz`;
  if (newSpecs.refresh_rate) labels['Yenileme Hızı'] = `${newSpecs.refresh_rate} Hz`;
  if (newSpecs.has_5g === true) labels['5G'] = 'Evet';
  if (newSpecs.has_5g === false) labels['5G'] = 'Hayır';
  if (newSpecs.has_anc === true) labels['ANC'] = 'Var';
  if (newSpecs.has_lidar === true) labels['Navigasyon'] = 'LiDAR';
  if (newSpecs.is_4k === true) labels['Çözünürlük'] = '4K UHD';
  if (newSpecs.is_oled === true) labels['Panel'] = 'OLED';

  return labels;
}

// ── Ana Agent Fonksiyonu ──────────────────────────────────────────────────────
export async function runSpecAgent(options?: {
  categorySlug?: string;
  batchSize?: number;
  maxProducts?: number;
}): Promise<AgentRunResult> {
  const {
    categorySlug,
    batchSize = 10,
    maxProducts = 50,
  } = options || {};

  const result: AgentRunResult = {
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY env eksik');
  const anthropic = new Anthropic({ apiKey });

  // ── 1. Spec'i eksik ürünleri çek ─────────────────────────────────────────
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
    id: p.id,
    name: p.name || '',
    brand: p.brand || '',
    model: p.model || '',
    category_slug: p.categories?.slug || '',
    specifications: p.specifications || {},
    source_url: p.source_url || '',
  }));

  // Spec'i eksik olanları filtrele
  const needsFilling = products.filter(needsSpecs);
  if (needsFilling.length === 0) return result;

  // ── 2. Her ürün için Haiku ile spec çıkar ─────────────────────────────────
  for (let i = 0; i < Math.min(needsFilling.length, batchSize); i++) {
    const product = needsFilling[i];
    result.processed++;

    try {
      // Önce mevcut spec'leri temizle
      const cleanedExisting = cleanSpecs(product.specifications);

      // Haiku ile title'dan spec çıkar
      const rawSpecs = await extractSpecsWithHaiku(anthropic, product);

      if (!rawSpecs || Object.keys(rawSpecs).length === 0) {
        // Spec bulunamadı ama mevcut garip alanları temizle
        if (JSON.stringify(cleanedExisting) !== JSON.stringify(product.specifications)) {
          await supabase.from('products').update({ specifications: cleanedExisting }).eq('id', product.id);
          result.updated++;
        } else {
          result.skipped++;
        }
        continue;
      }

      const normalized = normalizeSpecs(rawSpecs);
      if (Object.keys(normalized).length === 0) {
        result.skipped++;
        continue;
      }

      // Mevcut spec'lerle birleştir
      const merged = { ...cleanedExisting, ...normalized };
      merged.spec_labels = updateSpecLabels(cleanedExisting.spec_labels || {}, normalized);
      merged.spec_source = 'agent:title-parsing';
      merged.spec_updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('products').update({ specifications: merged }).eq('id', product.id);

      if (updateError) {
        result.failed++;
        result.errors.push(`${product.name}: ${updateError.message}`);
      } else {
        result.updated++;
        console.log(`✅ [spec-agent] ${product.name}: ${Object.keys(normalized).join(', ')}`);
      }

      // Haiku çok hızlı, küçük bekleme yeterli
      await new Promise(r => setTimeout(r, 200));

    } catch (err: any) {
      result.failed++;
      result.errors.push(`${product.name}: ${err.message}`);
    }
  }

  return result;
}
