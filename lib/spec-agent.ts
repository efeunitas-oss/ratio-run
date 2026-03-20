// ============================================================================
// lib/spec-agent.ts
// ratio.run — Otonom Spec Tamamlama Ajanı
//
// Nasıl çalışır:
// 1. Supabase'den spec'i boş ürünleri çeker (batch olarak)
// 2. Her ürün için Claude Sonnet'e web_search tool ile araştırma yaptırır
// 3. Bulunan spec'leri normalize eder ve Supabase'e yazar
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ── Tip tanımları ─────────────────────────────────────────────────────────────
interface SpecResult {
  // Telefon
  ram?: number;
  storage?: number;
  screen_size?: number;
  camera_mp?: number;
  battery_mah?: number;
  display_refresh?: number;
  chipset?: string;
  // Laptop
  ram_size?: number;
  processor_gen?: string;
  display_brightness?: number;
  battery_life?: number;
  // Tablet
  processor?: string;
  // Saat
  os?: string;
  waterproof?: string;
  // Kulaklık
  driver_size?: number;
  noise_cancellation?: string;
  connection?: string;
  // Robot Süpürge
  suctionPower?: number;
  batteryCapacity?: number;
  noiseLevel?: number;
  mappingTech?: string;
  // TV
  resolution?: string;
  refresh_rate?: number;
  panel_type?: string;
}

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
  telefon:         ['ram', 'storage', 'battery_mah', 'screen_size'],
  laptop:          ['ram_size', 'storage', 'screen_size', 'processor_gen'],
  tablet:          ['ram', 'storage', 'battery_mah', 'screen_size'],
  saat:            ['battery_life', 'screen_size'],
  kulaklik:        ['battery_life', 'connection'],
  'robot-supurge': ['suctionPower', 'batteryCapacity'],
  tv:              ['screen_size', 'resolution'],
};

// ── Kategori → araştırma prompt'u ─────────────────────────────────────────────
function buildSearchPrompt(product: AgentProduct): string {
  const categoryPrompts: Record<string, string> = {
    telefon: `RAM (GB), depolama (GB), ekran boyutu (inç), ana kamera (MP), batarya (mAh), ekran yenileme hızı (Hz), işlemci/çipset adı`,
    laptop: `RAM (GB), SSD depolama (GB), ekran boyutu (inç), işlemci modeli, ekran parlaklığı (nits), pil ömrü (saat)`,
    tablet: `RAM (GB), depolama (GB), ekran boyutu (inç), batarya (mAh), işlemci modeli`,
    saat: `pil ömrü (gün), ekran boyutu (mm), işletim sistemi, su geçirmezlik derecesi`,
    kulaklik: `pil ömrü (saat), sürücü boyutu (mm), aktif gürültü engelleme (var/yok), bağlantı türü (bluetooth/kablolu)`,
    'robot-supurge': `emme gücü (Pa), batarya kapasitesi (mAh), ses seviyesi (dB), navigasyon/haritalama teknolojisi`,
    tv: `ekran boyutu (inç), çözünürlük (4K/1080p/8K), yenileme hızı (Hz), panel tipi (OLED/QLED/LED)`,
  };

  const fields = categoryPrompts[product.category_slug] || 'temel teknik özellikler';

  return `Ürün: "${product.name}" (Marka: ${product.brand})
  
Bu ürün için şu teknik özellikleri bul: ${fields}

Web'de ara ve kesin, doğru sayısal değerler bul. Tahmin yapma. 
Bulamazsan o alanı atla.

SADECE JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "found": true/false,
  "source": "hangi siteden bulduğun",
  "specs": {
    "alan_adı": değer
  }
}

Alan adları şunlar olmalı: ${Object.keys(SPEC_KEYS[product.category_slug] || {}).join(', ')}
Sayısal değerler number, metin değerler string olmalı.`;
}

// ── Spec'i boş mu kontrol et ─────────────────────────────────────────────────
function needsSpecs(product: AgentProduct): boolean {
  const keys = SPEC_KEYS[product.category_slug] || [];
  if (keys.length === 0) return false;
  const specs = product.specifications || {};
  // En az 1 kritik alan boşsa doldur
  return keys.some(k => specs[k] == null || specs[k] === '');
}

// ── Spec değerlerini normalize et ─────────────────────────────────────────────
function normalizeSpecs(rawSpecs: Record<string, any>, categorySlug: string): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(rawSpecs)) {
    if (value === null || value === undefined || value === '') continue;

    // Sayı beklenen alanlar
    const numberFields = [
      'ram', 'ram_size', 'storage', 'screen_size', 'camera_mp',
      'battery_mah', 'battery_life', 'batteryCapacity', 'display_refresh',
      'driver_size', 'suctionPower', 'noiseLevel', 'refresh_rate',
      'display_brightness'
    ];

    if (numberFields.includes(key)) {
      const num = parseFloat(String(value).replace(',', '.'));
      if (!isNaN(num) && num > 0) normalized[key] = num;
    } else {
      normalized[key] = String(value).trim();
    }
  }

  return normalized;
}

// ── Skoru güncelle (yeni spec'lere göre) ─────────────────────────────────────
function recalculateScores(
  existingSpecs: Record<string, any>,
  newSpecs: Record<string, any>,
  categorySlug: string
): Record<string, any> {
  const merged = { ...existingSpecs, ...newSpecs };
  const stars = Number(merged.stars || 3);

  if (categorySlug === 'telefon') {
    const mp = newSpecs.camera_mp || existingSpecs.camera_mp;
    const mAh = newSpecs.battery_mah || existingSpecs.battery_mah;

    if (mp) merged.camera_score = mp >= 108 ? 10 : mp >= 64 ? 8 : mp >= 48 ? 7 : 6;
    if (mAh) merged.battery_score = mAh >= 5000 ? 10 : mAh >= 4500 ? 9 : mAh >= 4000 ? 7 : 5;

    const cs = merged.camera_score || Math.round(stars * 1.9);
    const ps = merged.performance_score || Math.round(stars * 1.8);
    const bs = merged.battery_score || Math.round(stars * 1.7);
    const ds = merged.display_score || Math.round(stars * 1.8);
    merged.overall_score = Math.round(cs * 0.30 + ps * 0.30 + bs * 0.20 + ds * 0.20);
  }

  if (categorySlug === 'laptop') {
    const ram = newSpecs.ram_size || existingSpecs.ram_size;
    if (ram) merged.ram_score = ram >= 32 ? 10 : ram >= 16 ? 8 : ram >= 8 ? 6 : 4;

    const ps = merged.performance_score || Math.round(stars * 2);
    const rs = merged.ram_score || 5;
    const ds = merged.display_score || Math.round(stars * 1.8);
    const bq = merged.build_quality || 6;
    merged.overall_score = Math.round(ps * 0.35 + rs * 0.25 + ds * 0.25 + bq * 0.15);
  }

  if (categorySlug === 'robot-supurge') {
    const pa = newSpecs.suctionPower || existingSpecs.suctionPower;
    if (pa) merged.suction_score = pa >= 8000 ? 10 : pa >= 6000 ? 9 : pa >= 4000 ? 7 : pa >= 2000 ? 5 : 3;
  }

  return merged;
}

// ── Ana Agent Fonksiyonu ──────────────────────────────────────────────────────
export async function runSpecAgent(options?: {
  categorySlug?: string;
  batchSize?: number;
  maxProducts?: number;
}): Promise<AgentRunResult> {
  const {
    categorySlug,
    batchSize = 20,      // Her çalışmada kaç ürün işlensin
    maxProducts = 100,   // Toplam maksimum ürün sayısı
  } = options || {};

  const result: AgentRunResult = {
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Supabase ve Anthropic istemcileri
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
    .select(`
      id, name, brand, model, source_url, specifications,
      categories!inner(slug)
    `)
    .eq('is_active', true)
    .limit(maxProducts);

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  const { data: rawProducts, error: fetchError } = await query;

  if (fetchError || !rawProducts?.length) {
    result.errors.push(`Ürün çekilemedi: ${fetchError?.message || 'Boş liste'}`);
    return result;
  }

  // Ürünleri normalize et
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

  if (needsFilling.length === 0) {
    return result; // Yapılacak iş yok
  }

  // ── 2. Her ürün için Claude ile araştır ───────────────────────────────────
  for (let i = 0; i < Math.min(needsFilling.length, batchSize); i++) {
    const product = needsFilling[i];
    result.processed++;

    try {
      const prompt = buildSearchPrompt(product);

      // Claude Sonnet + web_search tool
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
        } as any],
        messages: [{ role: 'user', content: prompt }],
      });

      // Yanıttan JSON çıkar
      let rawText = '';
      for (const block of response.content) {
        if (block.type === 'text') rawText += block.text;
      }

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        result.skipped++;
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.found || !parsed.specs || Object.keys(parsed.specs).length === 0) {
        result.skipped++;
        continue;
      }

      // ── 3. Normalize et ve skoru güncelle ──────────────────────────────
      const normalizedSpecs = normalizeSpecs(parsed.specs, product.category_slug);

      if (Object.keys(normalizedSpecs).length === 0) {
        result.skipped++;
        continue;
      }

      const updatedSpecs = recalculateScores(
        product.specifications,
        normalizedSpecs,
        product.category_slug
      );

      // spec_labels güncelle
      const specLabels: Record<string, string | null> = {
        ...(updatedSpecs.spec_labels || {}),
      };
      if (normalizedSpecs.ram) specLabels['RAM'] = `${normalizedSpecs.ram} GB`;
      if (normalizedSpecs.ram_size) specLabels['RAM'] = `${normalizedSpecs.ram_size} GB`;
      if (normalizedSpecs.storage) specLabels['Depolama'] = `${normalizedSpecs.storage} GB`;
      if (normalizedSpecs.screen_size) specLabels['Ekran'] = `${normalizedSpecs.screen_size} inç`;
      if (normalizedSpecs.battery_mah) specLabels['Batarya'] = `${normalizedSpecs.battery_mah} mAh`;
      if (normalizedSpecs.camera_mp) specLabels['Kamera'] = `${normalizedSpecs.camera_mp} MP`;
      if (normalizedSpecs.battery_life) specLabels['Pil Ömrü'] = `${normalizedSpecs.battery_life} saat`;
      if (normalizedSpecs.suctionPower) specLabels['Emme Gücü'] = `${normalizedSpecs.suctionPower} Pa`;
      if (normalizedSpecs.resolution) specLabels['Çözünürlük'] = normalizedSpecs.resolution;
      if (normalizedSpecs.panel_type) specLabels['Panel'] = normalizedSpecs.panel_type;

      updatedSpecs.spec_labels = specLabels;
      updatedSpecs.spec_source = `agent:${parsed.source || 'web'}`;
      updatedSpecs.spec_updated_at = new Date().toISOString();

      // ── 4. Supabase'e yaz ──────────────────────────────────────────────
      const { error: updateError } = await supabase
        .from('products')
        .update({ specifications: updatedSpecs })
        .eq('id', product.id);

      if (updateError) {
        result.failed++;
        result.errors.push(`${product.name}: ${updateError.message}`);
      } else {
        result.updated++;
        console.log(`✅ [spec-agent] ${product.name}: ${Object.keys(normalizedSpecs).join(', ')}`);
      }

      // Rate limit koruması (Anthropic API için)
      await new Promise(r => setTimeout(r, 1500));

    } catch (err: any) {
      result.failed++;
      result.errors.push(`${product.name}: ${err.message}`);
      console.error(`❌ [spec-agent] ${product.name}:`, err.message);
    }
  }

  return result;
}
