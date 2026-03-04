// app/HomeClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const GOLD        = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';
const GREEN       = '#00ff88';
const RED         = '#ff4466';
const DIM         = '#4b5563';

interface TopProduct {
  id: string; name: string; brand: string; score: number;
  price: number; category: string; categorySlug: string; delta: number;
}
interface Category { id: string; label: string; icon: string; link: string; }
interface Props {
  categories: Category[]; counts: Record<string, number>;
  topProducts: TopProduct[]; totalProducts: number; lastUpdated: string;
}

function AnimatedScore({ target, delay = 0 }: { target: number; delay?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let cur = 0;
      const go = () => {
        cur += Math.max(1, Math.ceil((target - cur) / 10));
        if (cur >= target) { setVal(target); return; }
        setVal(cur); requestAnimationFrame(go);
      };
      requestAnimationFrame(go);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return <>{val}</>;
}

function fmtPrice(p: number) {
  return '₺' + Math.round(p).toLocaleString('tr-TR');
}

export default function HomeClient({ categories, counts, topProducts, totalProducts, lastUpdated }: Props) {
  const [time, setTime] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('tr-TR'));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const best = topProducts[0];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
    * { box-sizing: border-box; }
    @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.15} }
    @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .mono { font-family:'IBM Plex Mono',monospace; }
    .ticker-wrap { overflow:hidden; flex:1; min-width:0; }
    .ticker-track { display:inline-flex; align-items:center; animation:ticker 50s linear infinite; white-space:nowrap; }
    .ticker-track:hover { animation-play-state:paused; }
    .cat-card { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:22px 10px; background:rgba(8,8,8,0.8); border:1px solid ${GOLD}18; border-radius:4px; text-decoration:none; transition:all 0.15s; text-align:center; }
    .cat-card:hover { border-color:${GOLD}55; background:${GOLD}07; }
    .goto-btn { display:block; padding:13px; background:linear-gradient(135deg,${GOLD},${GOLD_BRIGHT}); color:#000; font-weight:800; font-size:13px; font-family:'IBM Plex Mono',monospace; letter-spacing:1.5px; border-radius:3px; text-decoration:none; text-align:center; width:100%; }
    .goto-btn:hover { opacity:0.9; }
  `;

  return (
    <main style={{ minHeight: '100vh', background: '#030303', color: '#fff' }}>
      <style>{css}</style>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: `1px solid ${GOLD}28`, padding: '11px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(3,3,3,0.97)', backdropFilter: 'blur(16px)', zIndex: 50 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 34, width: 'auto' }} />
          <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.5px', color: '#fff' }}>
            ratio<span style={{ color: GOLD_BRIGHT }}>.run</span>
          </span>
        </a>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span className="mono" style={{ fontSize: 10, color: GREEN, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, display: 'inline-block', animation: 'blink 2s infinite' }} />
              AKTİF
            </span>
            <span className="mono" style={{ fontSize: 10, color: DIM }}>{time}</span>
            <span className="mono" style={{ fontSize: 10, color: DIM }}>{totalProducts.toLocaleString('tr-TR')} ÜRÜN</span>
          </div>
        )}
        {!isMobile && (
          <span className="mono" style={{ fontSize: 10, color: GOLD, letterSpacing: 2 }}>
            DON&apos;T BUY WITH EMOTIONS.
          </span>
        )}
      </nav>

      {/* ── TICKER ── */}
      <div style={{ height: 34, borderBottom: `1px solid ${GOLD}20`, background: '#000', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ padding: '0 12px', borderRight: `1px solid ${GOLD}22`, flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 9, color: GOLD, letterSpacing: 2 }}>FEED</span>
        </div>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...topProducts, ...topProducts].map((p, i) => (
              <span key={`${p.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 18px', borderRight: `1px solid ${GOLD}15` }}>
                <span className="mono" style={{ fontSize: 9, color: '#6b7280' }}>{p.brand.slice(0, 5).toUpperCase()}</span>
                <span className="mono" style={{ fontSize: 10, color: '#d1d5db' }}>{p.name.split(' ').slice(0, 3).join(' ')}</span>
                <span className="mono" style={{ fontSize: 11, color: GOLD_BRIGHT, fontWeight: 600 }}>{p.score.toFixed(1)}</span>
                <span className="mono" style={{ fontSize: 10, color: p.delta >= 0 ? GREEN : RED }}>{p.delta >= 0 ? '▲' : '▼'}{Math.abs(p.delta).toFixed(1)}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 12px', borderLeft: `1px solid ${GOLD}20`, flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 9, color: DIM }}>{lastUpdated}</span>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 0', animation: 'fadein 0.3s ease' }}>

        {/* ── GÜNÜN KAZANANI ── */}
        {best && (
          <div style={{ background: 'rgba(8,8,8,0.95)', border: `1px solid ${GOLD}28`, borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>

            {/* Header */}
            <div style={{ background: `${GOLD}10`, borderBottom: `1px solid ${GOLD}20`, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: 9, color: GOLD, letterSpacing: 2 }}>🏆 GÜNÜN EN İYİ PUANI</span>
              <span className="mono" style={{ fontSize: 9, color: DIM }}>{best.category.toUpperCase()}</span>
            </div>

            {/* İçerik — tamamen ortalı, tek kolon */}
            <div style={{ padding: isMobile ? '28px 20px' : '36px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>

              {/* Büyük skor */}
              <div>
                <div className="mono" style={{ fontSize: isMobile ? 96 : 112, fontWeight: 700, lineHeight: 1, color: GOLD_BRIGHT, letterSpacing: -4 }}>
                  <AnimatedScore target={Math.round(best.score)} delay={200} />
                </div>
                <div className="mono" style={{ fontSize: 10, color: DIM, marginTop: 4, letterSpacing: 2 }}>/ 100 RATIO SCORE</div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', maxWidth: 320, height: 4, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${best.score}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`, borderRadius: 2 }} />
              </div>

              {/* Ürün adı */}
              <div>
                <div style={{ fontSize: isMobile ? 17 : 22, fontWeight: 800, color: '#f3f4f6', lineHeight: 1.3 }}>
                  {best.name}
                </div>
                <div className="mono" style={{ fontSize: 11, color: DIM, marginTop: 6 }}>{best.brand} · {best.category}</div>
              </div>

              {/* Fiyat + değişim */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
                <div>
                  <div className="mono" style={{ fontSize: 9, color: DIM, letterSpacing: 1, marginBottom: 4 }}>GÜNCEL FİYAT</div>
                  <div className="mono" style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: GOLD_BRIGHT }}>{fmtPrice(best.price)}</div>
                </div>
                <div style={{ width: 1, height: 40, background: `${GOLD}20` }} />
                <div>
                  <div className="mono" style={{ fontSize: 9, color: DIM, letterSpacing: 1, marginBottom: 4 }}>DEĞİŞİM</div>
                  <div className="mono" style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: best.delta >= 0 ? GREEN : RED }}>
                    {best.delta >= 0 ? '▲' : '▼'} {Math.abs(best.delta).toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Buton */}
              <div style={{ width: '100%', maxWidth: 320 }}>
                <Link href={`/compare/${best.categorySlug}/${best.id}`} className="goto-btn">
                  ANALİZİ GÖR →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── KATEGORİLER ── */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 9, color: DIM, letterSpacing: 2 }}>KATEGORİ SEÇ</span>
            <span className="mono" style={{ fontSize: 9, color: DIM }}>{totalProducts.toLocaleString('tr-TR')} ÜRÜN</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
            {categories.map(cat => (
              <Link key={cat.id} href={`/compare/${cat.link}`} className="cat-card">
                <span style={{ fontSize: 30 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#e5e7eb', fontSize: 14 }}>{cat.label}</div>
                  <div className="mono" style={{ color: GOLD_BRIGHT, fontSize: 10, marginTop: 3 }}>
                    {(counts[cat.id] ?? 0).toLocaleString('tr-TR')} model
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: `1px solid ${GOLD}18`, margin: '20px 0 0', padding: '12px 0', display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', flexWrap: 'wrap', gap: 8, textAlign: 'center' }}>
          <span className="mono" style={{ fontSize: 9, color: DIM }}>© 2026 RATIO.RUN</span>
          {!isMobile && <span className="mono" style={{ fontSize: 9, color: DIM }}>DON&apos;T BUY WITH EMOTIONS.</span>}
        </div>
      </div>
    </main>
  );
}
