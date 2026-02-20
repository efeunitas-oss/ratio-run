// app/compare/[category]/loading.tsx
// Sayfa yüklenirken gösterilen skeleton — cold start'ı kamufle eder

const GOLD = '#C9A227';

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav skeleton */}
      <nav className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur z-50"
        style={{ borderColor: `${GOLD}30` }}>
        <div className="h-8 w-32 bg-gray-900 rounded-lg animate-pulse" />
        <div className="h-4 w-24 bg-gray-900 rounded animate-pulse" />
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Başlık skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-gray-900 rounded-lg animate-pulse mb-3" />
          <div className="h-4 w-24 bg-gray-900 rounded animate-pulse" />
        </div>

        {/* Kart skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="aspect-square bg-gray-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-full" />
                <div className="h-4 bg-gray-800 rounded w-3/4" />
                <div className="h-5 bg-gray-800 rounded w-1/2 mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
