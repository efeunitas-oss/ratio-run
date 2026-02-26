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
    <main style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${GOLD}35`,
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 40, width: 'auto' }} />
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            ratio<span style={{ color: GOLD_BRIGHT }}>.run</span>
          </span>
        </a>
        <div style={{ fontSize: 12, fontFamily: 'monospace', color: GOLD_BRIGHT, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          DON&apos;T BUY WITH EMOTIONS.
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        paddingTop: 160,
        paddingBottom: 80,
        paddingLeft: 24,
        paddingRight: 24,
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 400,
          borderRadius: '50%',
          filter: 'blur(150px)',
          background: `${GOLD}12`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 80px)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 32,
          position: 'relative',
          zIndex: 1,
        }}>
          Senin Yerine <br />
          <span style={{
            background: `linear-gradient(135deg, ${GOLD_BRIGHT} 0%, #EDD060 50%, ${GOLD} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Biz Hesapladık.
          </span>
        </h1>

        {/* Arama */}
        <form onSubmit={handleSearch} style={{
          width: '100%',
          maxWidth: 640,
          position: 'relative',
          marginBottom: 80,
          zIndex: 1,
        }}>
          <input
            type="text"
            placeholder="Model veya marka ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderColor = GOLD; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = '#1f2937'; }}
            style={{
              width: '100%',
              background: 'rgba(17,24,39,0.6)',
              border: '1px solid #1f2937',
              color: '#fff',
              padding: '18px 120px 18px 24px',
              borderRadius: 16,
              outline: 'none',
              fontSize: 16,
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
          <button
            type="submit"
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              bottom: 8,
              padding: '0 24px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              color: '#000',
              background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Ara
          </button>
        </form>

        {/* Kategori Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/compare/${cat.link}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(17,24,39,0.5)',
                border: '1px solid #1f2937',
                borderRadius: 20,
                padding: '28px 20px',
                textDecoration: 'none',
                transition: 'border-color 0.2s, background 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = `${GOLD}70`;
                (e.currentTarget as HTMLAnchorElement).style.background = `rgba(201,162,39,0.06)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1f2937';
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(17,24,39,0.5)';
              }}
            >
              <span style={{ fontSize: 40, lineHeight: 1 }}>{cat.icon}</span>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontWeight: 700, color: '#e5e7eb', margin: 0, fontSize: 15 }}>{cat.label}</h3>
                <p style={{ fontSize: 12, fontFamily: 'monospace', color: GOLD_BRIGHT, margin: '6px 0 0' }}>
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
