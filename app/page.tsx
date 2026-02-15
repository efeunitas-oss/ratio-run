import { Metadata } from 'next';
import RatioRunApp from './RatioRunApp';
import { supabase, convertToVehicle, convertToVacuum } from '@/lib/supabase';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Ratio.Run - Ultimate Decision Engine | Akıllı Ürün Karşılaştırma',
    description: 'Otomobil ve robot süpürge karşılaştırmalarını matematiksel analizle yapın.',
  };
}

export default async function Page() {
// Kategori ID'leri (Supabase'den hardcode - RLS sorununu bypass eder)
const carCategoryId = 'c173ed40-b7bb-4372-9a53-45fb972b850d';
const vacuumCategoryId = '74faa732-8f34-478c-9580-ab87bc63005e';

console.log('🔍 Using hardcoded category IDs');
console.log('   Car Category ID:', carCategoryId);
console.log('   Vacuum Category ID:', vacuumCategoryId);
  // DEBUG: Tüm ürünleri çek (kategori filtresi olmadan)
const { data: allProducts, error: allError } = await supabase
  .from('products')
  .select('*');

console.log('🔍 SUPABASE TEST:');
console.log('   Total products in DB:', allProducts?.length || 0);
console.log('   Error:', allError);
if (allProducts && allProducts.length > 0) {
  console.log('   First product:', allProducts[0]);
}
  // Arabaları çek
  const { data: carProducts } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', carCategoryId);
  
  // Robot süpürgeleri çek
  const { data: vacuumProducts } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', vacuumCategoryId);

  // Formatı çevir
  const vehicles = (carProducts || []).map(convertToVehicle);
  const vacuums = (vacuumProducts || []).map(convertToVacuum);

  console.log('📊 Supabase\'den çekilen ürünler:');
  console.log(`   - ${vehicles.length} araba`);
  console.log(`   - ${vacuums.length} robot süpürge`);

  return <RatioRunApp initialVehicles={vehicles} initialVacuums={vacuums} />;
}