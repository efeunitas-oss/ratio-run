import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debug() {
  const url = 'https://www.epey.com/akilli-telefonlar/samsung-galaxy-s25.html';
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'tr-TR,tr;q=0.9',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  console.log('Status:', res.status);
  const html = await res.text();
  console.log('HTML uzunluğu:', html.length);
  
  // <tr> satırlarını bul
  const rows = [...html.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/gi)];
  console.log('TR sayısı:', rows.length);
  
  // İlk 10 satırı göster
  console.log('\n--- İLK 10 TR SATIRI ---');
  rows.slice(0, 10).forEach((r, i) => {
    const cells = [...r[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim());
    if (cells.length) console.log(`Row ${i}:`, cells);
  });

  // RAM kelimesi geçiyor mu?
  const ramIdx = html.indexOf('RAM');
  console.log('\nRAM pozisyonu:', ramIdx);
  if (ramIdx > 0) {
    console.log('RAM çevresindeki HTML:', html.slice(ramIdx - 100, ramIdx + 200));
  }

  // spec veya özellik içeren kısım
  const specIdx = html.indexOf('Ekran Boyutu');
  console.log('\nEkran Boyutu pozisyonu:', specIdx);
  if (specIdx > 0) {
    console.log('Çevresi:', html.slice(specIdx - 50, specIdx + 200));
  }
}

debug().catch(console.error);
