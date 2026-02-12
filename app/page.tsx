import { Metadata } from 'next';
import RatioRunApp from './RatioRunApp';

// ============================================================================
// DYNAMIC SEO METADATA GENERATION
// ============================================================================

export async function generateMetadata(): Promise<Metadata> {
  // Default metadata (sayfa ilk yüklendiğinde)
  const defaultMetadata: Metadata = {
    title: 'Ratio.Run - Ultimate Decision Engine | Akıllı Ürün Karşılaştırma',
    description: 'Otomobil ve robot süpürge karşılaştırmalarını matematiksel analizle yapın. Ağırlıklı matris algoritması ile en doğru kararı verin. 50+ araba, 25+ robot süpürge.',
    keywords: ['otomobil karşılaştırma', 'araba kıyaslama', 'robot süpürge karşılaştırma', 'ürün karşılaştırma', 'karar motoru'],
    openGraph: {
      title: 'Ratio.Run - Ultimate Decision Engine',
      description: 'Akıllı ürün karşılaştırma platformu. Matematiksel analizle en doğru kararı verin.',
      type: 'website',
      locale: 'tr_TR',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Ratio.Run - Ultimate Decision Engine',
      description: 'Akıllı ürün karşılaştırma platformu',
    },
  };

  // TODO: URL parametrelerinden karşılaştırma bilgisi çekilirse dinamik metadata
  // Örnek: /compare?v1=bmw-320i&v2=mercedes-c200
  // Bu durumda title: "BMW 320i vs Mercedes C200 Kıyaslaması - Kazanan Kim?"
  
  return defaultMetadata;
}

export default function Page() {
  return <RatioRunApp />;
}