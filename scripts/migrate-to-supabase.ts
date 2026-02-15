// Migration Script: data.ts -> Supabase
// Run: npx tsx scripts/migrate-to-supabase.ts

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { SAMPLE_VEHICLES, SAMPLE_VACUUMS } from '../app/data.js';

const supabaseUrl = 'https://srypulfxbckherkmrjgs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeXB1bGZ4YmNraGVya21yamdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE1NzMwNywiZXhwIjoyMDg2NzMzMzA3fQ.2k9r-KEWjTXmQjTkFm1wMztoquQGVhz2aiUD1R_UJz4';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables bulunamadı!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'MEVCUT' : 'YOK');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log('🚀 Migration başlıyor...\n');

  // 1. Kategori ID'lerini al
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, slug');

  if (catError) {
    console.error('❌ Kategoriler alınamadı:', catError);
    return;
  }

  const carCategoryId = categories?.find(c => c.slug === 'otomobil')?.id;
  const vacuumCategoryId = categories?.find(c => c.slug === 'robot-supurge')?.id;

  if (!carCategoryId || !vacuumCategoryId) {
    console.error('❌ Kategori ID\'leri bulunamadı!');
    return;
  }

  console.log('✅ Kategori ID\'leri alındı');
  console.log(`   Otomobil: ${carCategoryId}`);
  console.log(`   Robot Süpürge: ${vacuumCategoryId}\n`);

  // 2. Arabaları migrate et
  console.log(`📦 ${SAMPLE_VEHICLES.length} araba Supabase'e kopyalanıyor...`);

  const carProducts = SAMPLE_VEHICLES.map(car => ({
    category_id: carCategoryId,
    name: car.name,
    brand: car.brand,
    model: car.model,
    price: car.market.listPrice,
    currency: 'TRY',
    image_url: null, // Arabalar için resim yok
    source_url: car.sourceUrl,
    source_name: 'Manuel Data',
    specifications: {
      year: car.year,
      segment: car.segment,
      hp: car.engineering.hp,
      torque: car.engineering.torque,
      zeroToHundred: car.engineering.zeroToHundred,
      fuelConsumption: car.engineering.fuelConsumption,
      transmission: car.engineering.transmission,
      marketAverage: car.market.marketAverage,
      liquidityScore: car.market.liquidityScore,
      resaleValue: car.market.resaleValue,
      strengths: car.documentedStrengths,
      weaknesses: car.documentedWeaknesses
    },
    is_active: true,
    stock_status: 'in_stock',
    scraped_at: new Date().toISOString()
  }));

  const { data: insertedCars, error: carError } = await supabase
    .from('products')
    .upsert(carProducts, {
      onConflict: 'source_name,source_url',
      ignoreDuplicates: false
    });

  if (carError) {
    console.error('❌ Arabalar kaydedilemedi:', carError);
  } else {
    console.log(`✅ ${SAMPLE_VEHICLES.length} araba Supabase'e kaydedildi!\n`);
  }

  // 3. Robot süpürgeleri migrate et (sadece manuel olanlar)
  console.log(`📦 ${SAMPLE_VACUUMS.length} robot süpürge Supabase'e kopyalanıyor...`);

  const vacuumProducts = SAMPLE_VACUUMS.map(vacuum => ({
    category_id: vacuumCategoryId,
    name: vacuum.name,
    brand: vacuum.brand,
    model: vacuum.id,
    price: vacuum.market.listPrice,
    currency: 'TRY',
    image_url: null,
    source_url: vacuum.sourceUrl,
    source_name: 'Manuel Data',
    specifications: {
      suctionPower: vacuum.specs.suctionPower,
      batteryCapacity: vacuum.specs.batteryCapacity,
      noiseLevel: vacuum.specs.noiseLevel,
      dustCapacity: vacuum.specs.dustCapacity,
      mappingTech: vacuum.specs.mappingTech,
      mopFeature: vacuum.specs.mopFeature,
      marketAverage: vacuum.market.marketAverage,
      liquidityScore: vacuum.market.liquidityScore,
      resaleValue: vacuum.market.resaleValue,
      strengths: vacuum.documentedStrengths,
      weaknesses: vacuum.documentedWeaknesses
    },
    is_active: true,
    stock_status: 'in_stock',
    scraped_at: new Date().toISOString()
  }));

  const { data: insertedVacuums, error: vacuumError } = await supabase
    .from('products')
    .upsert(vacuumProducts, {
      onConflict: 'source_name,source_url',
      ignoreDuplicates: false
    });

  if (vacuumError) {
    console.error('❌ Robot süpürgeler kaydedilemedi:', vacuumError);
  } else {
    console.log(`✅ ${SAMPLE_VACUUMS.length} robot süpürge Supabase'e kaydedildi!\n`);
  }

  // 4. Özet
  console.log('🎉 === MIGRATION TAMAMLANDI ===');
  console.log(`✅ Toplam ${SAMPLE_VEHICLES.length + SAMPLE_VACUUMS.length} ürün Supabase'de!`);
  console.log(`   - ${SAMPLE_VEHICLES.length} Araba`);
  console.log(`   - ${SAMPLE_VACUUMS.length} Robot Süpürge\n`);
}

migrateData()
  .then(() => {
    console.log('✅ Script başarıyla tamamlandı!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  });