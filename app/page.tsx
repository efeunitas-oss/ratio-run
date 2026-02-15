import { Metadata } from 'next';
import RatioRunApp from './RatioRunApp';
import { supabase } from '@/lib/supabase';
import { Vehicle, RobotVacuum, GenericProduct } from './types';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Ratio.Run - Ultimate Decision Engine',
    description: 'Akıllı ürün karşılaştırma platformu - Tüm kategoriler',
  };
}

// Supabase Product'tan Vehicle'a çevir
function convertToVehicle(product: any): Vehicle {
  return {
    id: product.id,
    category: 'VEHICLE',
    name: product.name,
    brand: product.brand,
    model: product.model,
    year: product.specifications?.year || 2024,
    segment: product.specifications?.segment || 'C',
    sourceUrl: product.source_url,
    verificationStatus: 'verified',
    affiliateLinks: [],
    engineering: {
      hp: product.specifications?.hp || 150,
      torque: product.specifications?.torque || 250,
      zeroToHundred: product.specifications?.zeroToHundred || 8.5,
      weight: product.specifications?.weight || 1500,
      transmission: product.specifications?.transmission || 'Otomatik',
      fuelConsumption: product.specifications?.fuelConsumption || 6.5,
      trunkCapacity: product.specifications?.trunkCapacity || 450,
      engineDisplacement: product.specifications?.engineDisplacement || 1500,
    },
    market: {
      listPrice: product.price || 2000000,
      marketAverage: product.specifications?.marketAverage || product.price || 2000000,
      liquidityScore: product.specifications?.liquidityScore || 8,
      resaleValue: product.specifications?.resaleValue || 8,
      serviceNetwork: product.specifications?.serviceNetwork || 8,
    },
    quality: {
      materialQuality: product.specifications?.materialQuality || 7,
      soundInsulation: product.specifications?.soundInsulation || 7,
      rideComfort: product.specifications?.rideComfort || 7,
      prestigeScore: product.specifications?.prestigeScore || 7,
      trimLevel: product.specifications?.trimLevel || 'Dolu',
    },
    risk: { 
      chronicIssueRisk: product.specifications?.chronicIssueRisk || 3 
    },
    documentedStrengths: product.specifications?.strengths || [],
    documentedWeaknesses: product.specifications?.weaknesses || [],
  };
}

// Supabase Product'tan RobotVacuum'a çevir
function convertToVacuum(product: any): RobotVacuum {
  return {
    id: product.id,
    category: 'ROBOT_VACUUM',
    name: product.name,
    brand: product.brand,
    sourceUrl: product.source_url,
    verificationStatus: 'verified',
    affiliateLinks: [],
    specs: {
      suctionPower: product.specifications?.suctionPower || product.specifications?.suction_score * 1000 || 5000,
      batteryCapacity: product.specifications?.batteryCapacity || product.specifications?.battery_score * 1000 || 5200,
      noiseLevel: product.specifications?.noiseLevel || 70 - (product.specifications?.noise_score || 5) * 2,
      dustCapacity: product.specifications?.dustCapacity || 0.4,
      mappingTech: product.specifications?.mappingTech || 'Lidar',
      mopFeature: product.specifications?.mopFeature !== false,
    },
    market: {
      listPrice: product.price || 20000,
      marketAverage: product.specifications?.marketAverage || product.price || 20000,
      liquidityScore: product.specifications?.liquidityScore || 8,
      resaleValue: product.specifications?.resaleValue || 7,
      serviceNetwork: product.specifications?.serviceNetwork || 7,
    },
    risk: { 
      chronicIssueRisk: product.specifications?.chronicIssueRisk || 3 
    },
    documentedStrengths: product.specifications?.strengths || [],
    documentedWeaknesses: product.specifications?.weaknesses || [],
  };
}

// Supabase Product'tan GenericProduct'a çevir
function convertToGeneric(product: any, categoryType: string): GenericProduct {
  return {
    id: product.id,
    category: categoryType.toUpperCase() as any,
    name: product.name,
    brand: product.brand,
    sourceUrl: product.source_url,
    verificationStatus: 'verified',
    affiliateLinks: [],
    specifications: product.specifications || {},
    market: {
      listPrice: product.price || 10000,
      marketAverage: product.specifications?.marketAverage || product.price || 10000,
      liquidityScore: product.specifications?.liquidityScore || 7,
      resaleValue: product.specifications?.resaleValue || 7,
      serviceNetwork: product.specifications?.serviceNetwork || 7,
    },
    risk: { 
      chronicIssueRisk: product.specifications?.chronicIssueRisk || 3 
    },
    documentedStrengths: product.specifications?.strengths || [],
    documentedWeaknesses: product.specifications?.weaknesses || [],
  };
}

export default async function Page() {
  console.log('📊 === RATIO.RUN PAGE LOADING ===');

  // 1. Kategorileri çek
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('display_order');

  if (catError) {
    console.error('❌ Kategori hatası:', catError);
  }

  console.log('📂 Kategoriler:', categories?.map(c => c.name));

  // 2. Tüm ürünleri çek
  const { data: allProducts, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true);

  if (prodError) {
    console.error('❌ Ürün hatası:', prodError);
  }

  console.log('📦 Toplam ürün:', allProducts?.length);

  // 3. Kategorilere göre ürünleri grupla ve çevir
  const productsByCategory: Record<string, any[]> = {};

  categories?.forEach(cat => {
    const rawProducts = allProducts?.filter(p => p.category_id === cat.id) || [];
    
    let convertedProducts: any[] = [];
    
    if (cat.slug === 'otomobil') {
      convertedProducts = rawProducts.map(convertToVehicle);
    } else if (cat.slug === 'robot-supurge') {
      convertedProducts = rawProducts.map(convertToVacuum);
    } else {
      // Laptop, Telefon, Kulaklık, Saat vb.
      convertedProducts = rawProducts.map(p => convertToGeneric(p, cat.slug));
    }
    
    productsByCategory[cat.slug] = convertedProducts;
    console.log(`   ${cat.name} (${cat.slug}): ${convertedProducts.length} ürün`);
  });

  console.log('✅ === PAGE LOADED ===');

  return (
    <RatioRunApp 
      categories={categories || []}
      productsByCategory={productsByCategory}
    />
  );
}