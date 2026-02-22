// app/HomeClient.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const GOLD        = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';

interface Category { id: string; label: string; icon: string; link: string; }
interface Props { categories: Category[]; counts: Record<string, number>; }

export default function HomeClient({ categories, counts }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (term) router.push('/compare/all');
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <nav className="border-b px-6 py-4 flex justify-between items-center bg-black/60 backdrop-blur fixed w-full z-50"
        style={{ borderColor: `${GOLD}35` }}>
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 40, width: 'auto' }} />
          <span className="text-2xl font-black tracking-tighter">
            ratio<span style={{ color: GOLD_BRIGHT }}>.run</span>
          </span>
        </a>
        <div className="text-sm font-mono hidden md:block uppercase tracking-widest"
          style={{ color: GOLD_BRIGHT }}>
          DON&apos;T BUY WITH EMOTIONS.
        </div>
      </nav>

      <div className="relative pt-40 pb-20 px-6 flex flex-col items-center text-center max-w-6xl mx-auto">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] -z-10"
          style={{ background: `${GOLD}12` }} />

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Senin Yerine <br />
          <span style={{
            background: `linear-gradient(135deg, ${GOLD_BRIGHT} 0%, #EDD060 50%, ${GOLD} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Biz Hesapladık.
          </span>
        </h1>

        <form onSubmit={handleSearch} className="w-full max-w-2xl relative mb-20">
          <input type="text" placeholder="Model veya marka ara..."
            className="w-full bg-gray-900/50 border border-gray-800 text-white px-8 py-5 rounded-2xl outline-none transition-all text-lg"
            onFocus={(e) => { e.currentTarget.style.borderColor = GOLD; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = ''; }}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button type="submit"
            className="absolute right-3 top-3 bottom-3 px-6 rounded-xl font-bold text-black"
            style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}>
            Ara
          </button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/compare/${cat.link}`}
              className="block bg-gray-900/40 border border-gray-800 rounded-2xl p-6 transition-all duration-200 flex flex-col items-center gap-3"
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = `${GOLD}70`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = ''; }}
            >
              <span className="text-4xl">{cat.icon}</span>
              <div>
                <h3 className="font-bold text-gray-200">{cat.label}</h3>
                <p className="text-xs font-mono mt-1" style={{ color: GOLD_BRIGHT }}>
                  {counts[cat.id] ?? 0} Model
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
