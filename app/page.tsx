import { Metadata } from 'next';
import RatioRunApp from './RatioRunApp';
import { supabase, convertToVehicle, convertToVacuum } from '@/lib/supabase';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Ratio.Run - Ultimate Decision Engine',
    description: 'Akıllı ürün karşılaştırma platformu.',
  };
}

export default async function Page() {
  // Tüm kategorileri çek
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('display_order');

  console.log('📂 Kategoriler:', categories?.length);

  // Araba ve robot kategorilerini bul
  const carCategory = categories?.find(c => c.slug === 'otomobil');
  const vacuumCategory = categories?.find(c => c.slug === 'robot-supurge');

  // Arabaları çek
  const { data: carProducts } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', carCategory?.id || '');
  
  // Robot süpürgeleri çek
  const { data: vacuumProducts } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', vacuumCategory?.id || '');

  const vehicles = (carProducts || []).map(convertToVehicle);
  const vacuums = (vacuumProducts || []).map(convertToVacuum);

  console.log(`📊 ${vehicles.length} araba, ${vacuums.length} robot`);

  return <RatioRunApp initialVehicles={vehicles} initialVacuums={vacuums} />;
}