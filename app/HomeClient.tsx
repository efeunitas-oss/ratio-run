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

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('tr-TR'));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const best = topProducts[0];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
    * { box-sizing: border-box; }
    @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.2} }
    @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .mono { font-family:'IBM Plex Mono',monospace; }
    .ticker-wrap { overflow:hidden; flex:1; min-width:0; }
    .ticker-track { display:inline-flex; align-items:center; animation:ticker 50s linear infinite; white-space:nowrap; }
    .ticker-track:hover { animation-play-state:paused; }
    .panel { background:rgba(8,8,8,0.95); border:1px solid ${GOLD}28; border-radius:4px; overflow:hidden; }
    .panel-hd { background:${GOLD}10; border-bottom:1px solid ${GOLD}20; padding:8px 14px; display:flex; align-items:center; justify-content:space-between; }
    .cat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .cat-card { display:flex; flex-direction:column; align-items:center; gap:8px; padding:22px 10px; background:rgba(8,8,8,0.8); border:1px solid ${GOLD}18; border-radius:4px; text-decoration:none; transition:all 0.15s; }
    .cat-card:hover { border-color:${GOLD}55; background:${GOLD}07; }
    @media (max-width: 768px) {
      .cat-grid { grid-template-columns:repeat(2,1fr) !important; }
      .nav-extra { display:none !important; }
      .best-grid { grid-template-columns:1fr !important; }
    }
  `;

  return (
    <main style={{ minHeight: '100vh', background: '#030303', color: '#fff' }}>
      <style>{css}</style>

      {/* NAV */}
      <nav style={{ borderBottom: `1px solid ${GOLD}28`, padding: '11px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(3,3,3,0.97)', backdropFilter: 'blur(16px)', zIndex: 50 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 34, width: 'auto' }} />
          <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.5px', color: '#fff' }}>
            ratio<span style={{ color: GOLD_BRIGHT }}>.run</span>
          </span>
        </a>
        <div className="nav-extra" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span className="mono" style={{ fontSize: 10, color: GREEN, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, display: 'inline-block', animation: 'blink 2s infinite' }} />
            AKTİF
          </span>
          <span className="mono" style={{ fontSize: 10, color: DIM }}>{time}</span>
          <span className="mono" style={{ fontSize: 10, color: DIM }}>{totalProducts.toLocaleString('tr-TR')} ÜRÜN</span>
        </div>
        <span className="mono nav-extra" style={{ fontSize: 10, color: GOLD, letterSpacing: 2 }}>
          DON&apos;T BUY WITH EMOTIONS.
        </span>
      </nav>

      {/* TICKER */}
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

      {/* MAIN */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 0', animation: 'fadein 0.3s ease' }}>

        {/* GÜNÜN EN İYİSİ */}
        {best && (
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="panel-hd">
              <span className="mono" style={{ fontSize: 9, color: GOLD, letterSpacing: 2 }}>GÜNÜN EN İYİ RASYOSU</span>
              <span className="mono" style={{ fontSize: 9, color: DIM }}>{best.category.toUpperCase()} · {lastUpdated}</span>
            </div>
            <div className="best-grid" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center' }}>
              {/* Sol — Büyük skor */}
              <div style={{ padding: '28px 20px', textAlign: 'center', borderRight: `1px solid ${GOLD}18` }}>
                <div className="mono" style={{ fontSize: 88, fontWeight: 700, lineHeight: 1, color: GOLD_BRIGHT, letterSpacing: -4 }}>
                  <AnimatedScore target={Math.round(best.score)} delay={200} />
                </div>
                <div className="mono" style={{ fontSize: 9, color: DIM, marginTop: 4, letterSpacing: 1 }}>/ 100 RATIO SCORE</div>
                <div style={{ height: 3, background: '#111', borderRadius: 2, overflow: 'hidden', margin: '12px 0 0' }}>
                  <div style={{ height: '100%', width: `${best.score}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`, borderRadius: 2 }} />
                </div>
              </div>
              {/* Sağ — Ürün detayı */}
              <div style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#f3f4f6', lineHeight: 1.3, marginBottom: 6 }}>
                    {best.name}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: DIM }}>{best.brand} · {best.category}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 9, color: DIM, letterSpacing: 1, marginBottom: 3 }}>GÜNCEL FİYAT</div>
                    <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: GOLD_BRIGHT }}>{fmtPrice(best.price)}</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 9, color: DIM, letterSpacing: 1, marginBottom: 3 }}>DEĞİŞİM</div>
                    <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: best.delta >= 0 ? GREEN : RED }}>
                      {best.delta >= 0 ? '▲' : '▼'} {Math.abs(best.delta).toFixed(1)}
                    </div>
                  </div>
                </div>
                <Link href={`/compare/${best.categorySlug}/${best.id}`} style={{ display: 'inline-block', padding: '11px 28px', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: '#000', fontWeight: 800, fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1.5, borderRadius: 3, textDecoration: 'none', alignSelf: 'flex-start' }}>
                  ANALİZİ GÖR →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* KATEGORİLER */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 9, color: DIM, letterSpacing: 2 }}>KATEGORİ SEÇ</span>
            <span className="mono" style={{ fontSize: 9, color: DIM }}>{totalProducts.toLocaleString('tr-TR')} ÜRÜN ANALİZ EDİLDİ</span>
          </div>
          <div className="cat-grid">
            {categories.map(cat => (
              <Link key={cat.id} href={`/compare/${cat.link}`} className="cat-card">
                <span style={{ fontSize: 30 }}>{cat.icon}</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#e5e7eb', fontSize: 14 }}>{cat.label}</div>
                  <div className="mono" style={{ color: GOLD_BRIGHT, fontSize: 10, marginTop: 3 }}>
                    {(counts[cat.id] ?? 0).toLocaleString('tr-TR')} model
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: `1px solid ${GOLD}18`, margin: '20px 0 0', padding: '12px 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span className="mono" style={{ fontSize: 9, color: DIM }}>© 2026 RATIO.RUN · TÜRKİYE&apos;NİN MATEMATİKSEL ÜRÜN KARŞILAŞTIRMA PLATFORMU</span>
          <span className="mono" style={{ fontSize: 9, color: DIM }}>DON&apos;T BUY WITH EMOTIONS.</span>
        </div>
      </div>
    </main>
  );
}
