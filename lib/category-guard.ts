// ============================================================================
// RATIO.RUN — CATEGORY GUARD v1
// Her kategoriye giren ürünün başlığını doğrular.
// Yanlış kategorideki ürünler (TV box → TV, saat → telefon vb.) engellenir.
// ============================================================================

export interface GuardResult {
  valid:   boolean;
  reason?: string; // sadece geliştirme logları için
}

// ─── Kural Yapısı ─────────────────────────────────────────────────────────────
interface CategoryRule {
  // En az bir eşleşirse ürün geçersiz sayılır
  block: RegExp[];
  // Tanımlıysa en az bir eşleşmesi ZORUNLU — eşleşmezse geçersiz
  require?: RegExp[];
}

// ─── Kategori Kuralları ───────────────────────────────────────────────────────
const RULES: Record<string, CategoryRule> = {

  // ══════════════════════════════════════════════════════════════════════════
  // TELEFON
  // Engel: akıllı saat, tablet, laptop, aksesuar, tv kutusu, set top box
  // ══════════════════════════════════════════════════════════════════════════
  telefon: {
    block: [
      /akıllı\s*saat/i,
      /smart\s*watch/i,
      /\bwatch\s*(series|ultra|se|gt|pro)\b/i,
      /\bbileklik\b/i,
      /fitness\s*band/i,
      /\bkol\s*saati\b/i,
      /\btablet\b/i,
      /\bipad\b/i,
      /galaxy\s*tab/i,
      /\blaptop\b/i,
      /\bnotebook\b/i,
      /\bdizüstü\b/i,
      /\bmacbook\b/i,
      /\bkılıf\b/i,
      /\bkoruyucu\s*(cam|film|kılıf)\b/i,
      /\bşarj\s*(aleti|kablosu|cihazı)\b/i,
      /\bkulaklık\b/i,
      /tv\s*box/i,
      /android\s*box/i,
      /set\s*top\s*box/i,
    ],
    require: [
      /\btelefon\b/i,
      /\bsmartphone\b/i,
      /\biphone\b/i,
      /galaxy\s*(s|a|m|z|f)\d+/i,
      /\bpixel\s*\d/i,
      /\bxperia\b/i,
      /\bredmi\b/i,
      /\bpoco\b/i,
      /\bnote\s+\d+\b/i,         // Redmi Note 13 vb.
      /\b(5g|4g)\s*(telefon)?\b/i,
      /\bsim\s*kart\b/i,
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LAPTOP
  // Engel: tablet, telefon, fare, stand, çanta, soğutucu, klavye (tek başına)
  // ══════════════════════════════════════════════════════════════════════════
  laptop: {
    block: [
      /\btablet\b/i,
      /\bipad\b/i,
      /galaxy\s*tab/i,
      /\btelefon\b/i,
      /\bsmartphone\b/i,
      /\biphone\b/i,
      /\b(gaming\s*)?mouse\b/i,
      /\blaptop\s*(çantası|sırt\s*çantası|standı|soğutucusu|kilidi)\b/i,
      /\bsoğutucu\s*(stand|pad)\b/i,
      /\bklavye\s*(kapağı|kılıfı)?\b(?!\s*ve\s*\w)/i,  // tek başına klavye
      /\bdock\s*station\b/i,
      /\bhub\b/i,
      /\bram\s*bellek\b/i,       // RAM modülü — laptop değil
      /\bssd\s*disk\b/i,         // tek başına SSD
    ],
    require: [
      /\blaptop\b/i,
      /\bnotebook\b/i,
      /\bdizüstü\b/i,
      /\bmacbook\b/i,
      /\bchromebook\b/i,
      /\bgaming\s*(laptop|notebook)\b/i,
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ROBOT SÜPÜRGE
  // Engel: dik/el süpürge, aksesuar, yedek parça, filtre, toz torbası
  // ══════════════════════════════════════════════════════════════════════════
  'robot-supurge': {
    block: [
      /dik\s*süpürge/i,
      /el\s*süpürgesi/i,
      /toz\s*(torbası|filtresi)/i,
      /yedek\s*(fırça|filtre|aksesuarı|parça)/i,
      /mop\s*(bezi|aksesuarı)/i,
      /\bşarj\s*(istasyonu|ünitesi)\b(?!\s*(ile|dahil))/i, // şarj istasyonu tek
      /\bbu\s*robot\b/i,         // "Bu robot için yedek..."
    ],
    require: [
      /\brobot\b/i,
      /\brobotik\b/i,
      /\birobot\b/i,
      /\broomba\b/i,
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // KULAKLIK
  // Engel: hoparlör, subwoofer, soundbar, mikrofon (tek), aksesuar, kablo
  // ══════════════════════════════════════════════════════════════════════════
  kulaklik: {
    block: [
      /\bhoparlör\b/i,
      /\bsoundbar\b/i,
      /\bsubwoofer\b/i,
      /\bev\s*sinema\b/i,
      /\bmikrofon\b(?!\s*(özellikli|destekli|dahil))/i, // sadece mikrofon
      /\bkulaklık\s*(adaptörü|kılıfı|kablosu|yastığı|yedek)\b/i,
      /\baux\s*kablo\b/i,
      /\bbluetooth\s*hoparlör\b/i,
      /\bparty\s*box\b/i,
    ],
    require: [
      /\bkulaklık\b/i,
      /\bearphone\b/i,
      /\bearbuds?\b/i,
      /\bheadphone\b/i,
      /\bheadset\b/i,
      /\bin-ear\b/i,
      /\bover-ear\b/i,
      /\bairpods?\b/i,
      /\bgalaxy\s*buds\b/i,
      /\bwf-\d/i,               // Sony WF-1000XM5 vb.
      /\bwh-\d/i,               // Sony WH-1000XM5 vb.
      /\bqc\s*\d+\b/i,          // Bose QC45 vb.
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SAAT (SMARTWATCH)
  // Engel: telefon, tablet, laptop, fitness band (bileklik)
  // ══════════════════════════════════════════════════════════════════════════
  saat: {
    block: [
      /\btelefon\b/i,
      /\bsmartphone\b/i,
      /\biphone\b/i,
      /\btablet\b/i,
      /\blaptop\b/i,
      /\bkordon\s*değişimi\b/i,
      /\bkayış\b(?!\s*(ile|dahil))/i,  // yedek kayış
      /\bkoruyucu\s*(cam|film)\b/i,    // aksesuar
      /\bşarj\s*(kablosu|aleti)\b/i,   // şarj aksesuarı
    ],
    require: [
      /\bsaat\b/i,
      /\bwatch\b/i,
      /\bsmartwatch\b/i,
      /\bwearable\b/i,
      /\btracker\b/i,
      /\bfitness\s*saat/i,
      /\bapple\s*watch\b/i,
      /\bgalaxy\s*watch\b/i,
      /\bpixel\s*watch\b/i,
      /\bgarmin\b/i,
      /\bamazfit\b/i,
      /\bfenix\b/i,
      /\bfitbit\b/i,
      /\bhuawei\s*watch\b/i,
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TV (TELEVİZYON)
  // Engel: TV kutusu, android box, set top box, uydu alıcısı, projeksiyon
  //        HDMI dongle, streaming stick, monitor (bilgisayar)
  // ══════════════════════════════════════════════════════════════════════════
  tv: {
    block: [
      /tv\s*box/i,
      /android\s*box/i,
      /set\s*top\s*box/i,
      /media\s*player/i,
      /uydu\s*alıcı/i,
      /\bfireTV\s*stick\b/i,
      /\bchromecast\b/i,
      /\broku\b/i,
      /\bhdmi\s*(dongle|stick|adaptör)\b/i,
      /\bprojektor\b/i,
      /\bprojeksiyon\b/i,
      /\bmonitor\b(?!\s*(tv))/i,        // sadece monitor — "TV monitor" geçsin
      /\bgaming\s*monitor\b/i,
      /\bukd\s*player\b/i,
      /\bblu[\s-]?ray\b/i,
      /\bdvd\s*player\b/i,
      /\bkumanda\b(?!\s*(ile|dahil))/i, // yedek kumanda
      /\bduvar\s*braketi\b/i,           // TV askı aparatı
      /\btv\s*ünitesi\b/i,              // mobilya
    ],
    require: [
      /\btelevizy?on\b/i,
      /\b(qled|oled|neo\s*qled|mini\s*led|nanocell)\b/i,
      /\b\d{2,3}\s*(inç|inch|ekran|cm)\b/i,  // 55 inç vb.
      /\bsmart\s*tv\b/i,
      /\b4k\s*(ultra|uhd)?\s*(tv|televizyon)?\b/i,
      /\b8k\s*tv\b/i,
      /\bbravia\b/i,                    // Sony TV serisi
      /\bcrystal\s*uhd\b/i,
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TABLET
  // Engel: telefon, laptop, klavye kılıf (aksesuar olarak), ekran koruyucu
  // ══════════════════════════════════════════════════════════════════════════
  tablet: {
    block: [
      /\btelefon\b/i,
      /\bsmartphone\b/i,
      /\biphone\b/i,
      /\blaptop\b/i,
      /\bnotebook\b/i,
      /\bdizüstü\b/i,
      /\bkoruyucu\s*(cam|film)\b/i,
      /\bşarj\s*(kablosu|aleti|adaptörü)\b/i,
      /\bdijital\s*kalem\b(?!\s*(destekli|uyumlu))/i, // yedek kalem
      /\bapple\s*pencil\b(?!\s*(destekli|uyumlu))/i,  // aksesuar kalem
      /\btablet\s*(kılıfı|standı|klavyesi)\b/i,
    ],
    require: [
      /\btablet\b/i,
      /\bipad\b/i,
      /galaxy\s*tab/i,
      /\bmatebook\b/i,
      /\bsurface\s*(pro|go)\b/i,
      /\blenovo\s*(tab|yoga\s*tab)\b/i,
      /\bxiaomi\s*pad\b/i,
    ],
  },
};

// ─── Ana Guard Fonksiyonu ─────────────────────────────────────────────────────
export function isCategoryValid(
  title: string,
  categorySlug: string
): GuardResult {
  if (!title) return { valid: false, reason: 'Başlık boş' };

  const rule = RULES[categorySlug];

  // Kural tanımlanmamış kategoriler geçsin (automotive vb.)
  if (!rule) return { valid: true };

  const t = title.toLowerCase();

  // 1. Blocklist kontrolü — tek eşleşme yeterli
  for (const pattern of rule.block) {
    if (pattern.test(t)) {
      return {
        valid:  false,
        reason: `Engellendi: "${pattern.source}" eşleşti — kategori: ${categorySlug}`,
      };
    }
  }

  // 2. Require kontrolü — hiçbiri eşleşmezse geçersiz
  if (rule.require && rule.require.length > 0) {
    const hasRequiredKeyword = rule.require.some(p => p.test(t));
    if (!hasRequiredKeyword) {
      return {
        valid:  false,
        reason: `Zorunlu anahtar kelime yok — kategori: ${categorySlug}, başlık: "${title.substring(0, 60)}"`,
      };
    }
  }

  return { valid: true };
}

// ─── Toplu Filtreleme Yardımcısı ─────────────────────────────────────────────
// Webhook'larda tek satırda filtrelemek için
export function filterValidProducts<T extends { name?: string; title?: string }>(
  items: T[],
  categorySlug: string
): { valid: T[]; rejected: number; reasons: string[] } {
  const valid:   T[]      = [];
  const reasons: string[] = [];

  for (const item of items) {
    const productTitle = item.name || item.title || '';
    const result = isCategoryValid(productTitle, categorySlug);

    if (result.valid) {
      valid.push(item);
    } else {
      reasons.push(result.reason ?? 'Bilinmeyen neden');
    }
  }

  return { valid, rejected: items.length - valid.length, reasons };
}
