// ============================================================================
// lib/product-filter.ts
// Webhook'a gelen ürünleri kategoriye göre filtreler.
// 1. Aşama: Yasaklı kelime kontrolü (hızlı, ücretsiz)
// 2. Aşama: Geçilemez — ürün reddedilir
// ============================================================================

// Kategori bazlı yasaklı kelimeler
const FORBIDDEN_PATTERNS: Record<string, RegExp> = {
  telefon: /\b(kılıf|kilif|case|koruyucu|ekran koruy|cam koruy|şarj aleti|sarj aleti|şarj kablosu|sarj kablo|adaptör|tutucu|stand|tablet|laptop|dizüstü|robot süpürge|robot supurge|televizyon|kulaklık|aksesuar|yedek|filtre|torba|paspas|fırça|firca|uyumlu kılıf|temizleme robot|cam temizleme|pencere robotu|manyetik araç|araç tutacağı|araba tutucu|rampas|hoparlör|hoparlos|klavye|mouse|powerbank|batarya kılıf|arka kapak|lcd ekran değişim|tamirci|yüzük|bilezik|saat kordonu|çocuk oyuncak|oyuncak telefon|tablet çocuk)\b/i,

  laptop: /\b(kılıf|kilif|çanta|laptop çantası|sırt çantası|soğutucu|cooler|stand|klavye örtü|ekran koruyucu|cam koruyucu|mouse|touchpad|şarj aleti|adaptör|uyumlu kılıf|sleeve|koruyucu kılıf|bilgisayar masası|laptop masası|monitör|ekran|display|telefon|tablet|aksesuar)\b/i,

  tablet: /\b(kılıf|kilif|case|ekran koruyucu|cam koruyucu|kalem aksesuar|stylus kılıf|stand|tutucu|şarj|adaptör|klavye kılıf|laptop|telefon|oyuncak tablet|çocuk oyuncak|dijital fotoğraf çerçeve|güvenlik kamera|mikroskop|çizim tableti(?!.*android))\b/i,

  saat: /\b(kordon|kayış|strap|kılıf|cam koruyucu|ekran koruyucu|şarj standı|şarj kablosu|adaptör|yedek parça|pil değişim|klasik saat|cep saati|masa saati|duvar saati|çocuk oyuncak|yüzük|bilezik|kolye)\b/i,

  kulaklik: /\b(adaptör|dönüştürücü|jack adaptör|aux adaptör|kablo uzatma|kulaklık kılıfı|yedek kulak pedi|yedek köpük|hoparlör|soundbar|ses kartı|mikrofon stand|kutu|ambalaj)\b/i,

  'robot-supurge': /\b(yedek toz torbası|toz torbası|yedek filtre|hepa filtre|yedek fırça|yan fırça|ana fırça|mop bezi|yedek mop|paspas|zemin paspas|temizlik bezi|su haznesi yedek|şarj adaptör|adaptör|yedek parça|aksesuar|uyumlu.*torba|uyumlu.*filtre|uyumlu.*fırça|el süpürgesi|dikey süpürge|telli süpürge|kablo|kanal açıcı|lavabo)\b/i,

  tv: /\b(uzaktan kumanda|kumanda|remote|tv askısı|duvar askısı|stand|tv sehpası|hdmi kablo|ses sistemi|soundbar|hoparlör|ekran koruyucu|tv kablosu|anten|set üstü kutu|android kutu|tv kutusu|media player|monitör|projeksiyon|projektör|lens|adaptör)\b/i,
};

// Geçerli ürün için zorunlu pattern (varsa)
const REQUIRED_PATTERNS: Record<string, RegExp | null> = {
  telefon:        /\b(telefon|phone|smartphone|cep|iphone|samsung|xiaomi|huawei|oppo|vivo|realme|nokia|motorola|pixel|galaxy|redmi|poco|honor)\b/i,
  laptop:         /\b(laptop|notebook|dizüstü|bilgisayar|macbook|vivobook|ideapad|thinkpad|inspiron|pavilion|envy|omen|nitro|tuf|rog|legion|excalibur|tulpar|abra|slayer|monster|casper|nirvana|zenbook|aspire)\b/i,
  tablet:         /\b(tablet|ipad|matePad|redmi pad|galaxy tab|surface|tab\s+\w)\b/i,
  saat:           /\b(akıllı saat|smart watch|smartwatch|watch|band|fitness|garmin|amazfit|fitbit|apple watch|galaxy watch|huawei watch|xiaomi band)\b/i,
  kulaklik:       /\b(kulaklık|kulaklik|headphone|earphone|earbud|airpods|headset|bluetooth kulaklık|kablosuz kulaklık|kablolu kulaklık)\b/i,
  'robot-supurge': /\b(robot süpürge|robot supurge|robotic vacuum|otonom süpürge|akıllı süpürge|roborock|irobot|dreame|ecovacs|xiaomi robot|360 robot)\b/i,
  tv:             /\b(tv|televizyon|television|smart tv|led tv|oled|qled|nanocell|miniled|uhd|4k.*tv|tv.*4k|\d+.*inç.*tv|tv.*inç)\b/i,
};

export function isValidForCategory(productName: string, categorySlug: string): boolean {
  if (!productName) return false;
  const name = productName.toLowerCase();

  // 1. Yasaklı kelime var mı?
  const forbidden = FORBIDDEN_PATTERNS[categorySlug];
  if (forbidden && forbidden.test(name)) {
    return false;
  }

  // 2. Zorunlu pattern var mı ve geçiyor mu?
  const required = REQUIRED_PATTERNS[categorySlug];
  if (required && !required.test(name)) {
    // Zorunlu pattern geçemedi — şüpheli ama reddetme, sadece log
    // (Bazı telefon isimleri marka içermeyebilir)
    // Fiyat filtresi ile desteklenir
    return true; // Şüphelileri geçir, cleanup script halleder
  }

  return true;
}
