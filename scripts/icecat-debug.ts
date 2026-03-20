import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ICECAT_USER          = process.env.ICECAT_USERNAME!;
const ICECAT_API_TOKEN     = process.env.ICECAT_API_TOKEN!;
const ICECAT_CONTENT_TOKEN = process.env.ICECAT_CONTENT_TOKEN!;

async function test(label: string, brand: string, mpn: string) {
  const url = `https://live.icecat.biz/api?shopname=${ICECAT_USER}&lang=EN&brand=${encodeURIComponent(brand)}&productcode=${encodeURIComponent(mpn)}&content=`;
  const res = await fetch(url, {
    headers: { 'api-token': ICECAT_API_TOKEN, 'content-token': ICECAT_CONTENT_TOKEN },
  });
  const text = await res.text();
  console.log(`[${res.status}] ${label}: ${text.slice(0, 150)}`);
}

async function main() {
  // Farklı brand formatları dene
  await test('MSI exact',        'MSI',     'A2XWHG-091XTR');
  await test('MSI lowercase',    'msi',     'A2XWHG-091XTR');
  await test('ASUS exact',       'ASUS',    'FX608JHR-RV048');
  await test('ASUSTeK',          'ASUSTeK', 'FX608JHR-RV048');
  await test('Samsung SM-S25',   'Samsung', 'SM-S931B');  // Bilinen çalışan
  await test('Sony WH1000XM5',   'Sony',    'WH-1000XM5');
  await test('LG OLED55C3',      'LG',      'OLED55C3');
  await test('Apple MacBook M4', 'Apple',   'MYH33TU/A');
}

main().catch(console.error);
