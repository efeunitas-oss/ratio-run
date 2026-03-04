// app/HomeClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const GOLD        = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';
const GREEN       = '#00ff88';
const RED         = '#ff4466';
const DIM         = '#4b5563';

interface TopProduct {
  id: string;
  name: string;
  brand: string;
  score: number;
  price: number;
  category: string;
  categorySlug: string;
  delta: number;
}
interface Category { id: string; label: string; icon: string; link: string; }
interface Props {
  categories: Category[];
  counts: Record<string, number>;
  topProducts: TopProduct[];
  totalProducts: number;
  lastUpdated: string;
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
  const [activeTab, setActiveTab] = useState('all');
  const [flicker, setFlicker] = useState<Set<string>>(new Set());
  const [time, setTime]  = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('tr-TR'));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!topProducts.length) return;
    const id = setInterval(() => {
      const p = topProducts[Math.floor(Math.random() * topProducts.length)];
      if (!p) return;
      setFlicker(s => new Set([...s, p.id]));
      setTimeout(() => setFlicker(s => { const n = new Set(s); n.delete(p.id); return n; }), 350);
    }, 1100);
    return () => clearInterval(id);
  }, [topProducts]);

  const tabs = [
    { id: 'all', label: 'TÜMÜ' },
    ...categories.slice(0, 4).map(c => ({ id: c.link, label: c.label.toUpperCase() })),
  ];

  const filtered = (activeTab === 'all' ? topProducts : topProducts.filter(p => p.categorySlug === activeTab)).slice(0, 5);
  const best = topProducts[0];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
    * { box-sizing: border-box; }
    @keyframes ticker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.2} }
    @keyframes fadein  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    .mono { font-family: 'IBM Plex Mono', monospace; }
    .ticker-wrap { overflow:hidden; flex:1; min-width:0; }
    .ticker-track { display:inline-flex; align-items:center; animation:ticker 50s linear infinite; white-space:nowrap; }
    .ticker-track:hover { animation-play-state:paused; }

    /* ── Panel ── */
    .panel { background:rgba(8,8,8,0.95); border:1px solid ${GOLD}28; border-radius:4px; overflow:hidden; }
    .panel-hd { background:${GOLD}10; border-bottom:1px solid ${GOLD}20; padding:8px 14px; display:flex; align-items:center; justify-content:space-between; }

    /* ── Izgara ── */
    .main-grid {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 14px;
      align-items: start;
    }

    /* ── Tablo satırı ── */
    .trow {
      display: grid;
      grid-template-columns: 26px 1fr 74px 52px 44px;
      gap: 6px;
      padding: 9px 14px;
      border-bottom: 1px solid ${GOLD}0e;
      text-decoration: none;
      align-items: center;
      transition: background 0.1s;
    }
    .trow:hover { background: ${GOLD}08; }

    /* ── Kategori kartları ── */
    .cat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
    .cat-card { display:flex; flex-direction:column; align-items:center; gap:8px; padding:20px 10px; background:rgba(8,8,8,0.7); border:1px solid ${GOLD}18; border-radius:4px; text-decoration:none; transition:all 0.15s; }
    .cat-card:hover { border-color:${GOLD}55; background:${GOLD}07; }

    /* ── Tab butonları ── */
    .tab { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:1.5px; padding:3px 8px; border-radius:2px; border:1px solid transparent; cursor:pointer; transition:all 0.1s; background:transparent; color:${DIM}; }
    .tab.on { border-color:${GOLD}55; color:${GOLD_BRIGHT}; background:${GOLD}14; }
    .tab:hover:not(.on) { color:#9ca3af; }

    /* ── Mobil ── */
    @media (max-width: 768px) {
      .main-grid { grid-template-columns: 1fr !important; }
      .cat-grid   { grid-template-columns: repeat(2,1fr) !important; }
      .trow       { grid-template-columns: 22px 1fr 62px 46px !important; }
      .deg-col    { display: none !important; }
      .nav-extra  { display: none !important; }
    }
    @media (max-width: 400px) {
      .trow { grid-template-columns: 20px 1fr 56px 42px !important; padding: 8px 10px; }
      .cat-card { padding: 16px 8px; }
    }
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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* ── TERMINAL GRID ── */}
        <div className="main-grid" style={{ marginBottom: 20, animation: 'fadein 0.3s ease' }}>

          {/* SOL — Günün En İyisi */}
          {best && (
            <div className="panel">
              <div className="panel-hd">
                <span className="mono" style={{ fontSize: 9, color: GOLD, letterSpacing: 2 }}>GÜNÜN EN İYİSİ</span>
                <span className="mono" style={{ fontSize: 9, color: DIM }}>{best.category.toUpperCase()}</span>
              </div>
              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: 76, fontWeight: 700, lineHeight: 1, color: GOLD_BRIGHT, letterSpacing: -3 }}>
                    <AnimatedScore target={Math.round(best.score)} delay={200} />
                  </div>
                  <div className="mono" style={{ fontSize: 9, color: DIM, marginTop: 3, letterSpacing: 1 }}>/ 100 RATIO SCORE</div>
                </div>
                <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}1e`, borderRadius: 3, padding: '11px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', lineHeight: 1.4, marginBottom: 4 }}>
                    {best.name.split(' ').slice(0, 5).join(' ')}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: DIM }}>{best.brand}</div>
                  <div className="mono" style={{ fontSize: 15, color: GOLD_BRIGHT, fontWeight: 700, marginTop: 8 }}>{fmtPrice(best.price)}</div>
                </div>
                <div style={{ height: 3, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${best.score}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`, borderRadius: 2 }} />
                </div>
                <Link href={`/compare/${best.categorySlug}/${best.id}`} style={{ display: 'block', textAlign: 'center', padding: '10px', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: '#000', fontWeight: 800, fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: 1.5, borderRadius: 3, textDecoration: 'none' }}>
                  ANALİZİ GÖR →
                </Link>
              </div>
            </div>
          )}

          {/* ORTA — Top 5 */}
          <div className="panel">
            <div className="panel-hd">
              <span className="mono" style={{ fontSize: 9, color: GOLD, letterSpacing: 2 }}>CANLI RATIO SIRALAMASI</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab ${activeTab === t.id ? 'on' : ''}`}>{t.label}</button>
                ))}
              </div>
            </div>
            {/* Başlık */}
            <div className="trow" style={{ borderBottom: `1px solid ${GOLD}22`, padding: '6px 14px' }}>
              {[['RNK',''], ['ÜRÜN',''], ['FİYAT',''], ['SCORE',''], ['DEĞ','deg-col']].map(([h, cls]) => (
                <span key={h} className={`mono ${cls}`} style={{ fontSize: 9, color: DIM, letterSpacing: 1 }}>{h}</span>
              ))}
            </div>
            {filtered.map((p, i) => {
              const isF = flicker.has(p.id);
              const up  = p.delta >= 0;
              return (
                <Link key={p.id} href={`/compare/${p.categorySlug}/${p.id}`} className="trow" style={{ background: isF ? `${GOLD}07` : 'transparent' }}>
                  <span className="mono" style={{ fontSize: 11, color: i < 3 ? GOLD : DIM }}>{String(i+1).padStart(2,'0')}</span>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name.split(' ').slice(0, 4).join(' ')}
                    </div>
                    <div className="mono" style={{ fontSize: 9, color: DIM, marginTop: 1 }}>{p.brand} · {p.category}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: '#6b7280' }}>{fmtPrice(p.price)}</span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: isF ? '#fff' : GOLD_BRIGHT, transition: 'color 0.2s' }}>{p.score.toFixed(1)}</span>
                  <span className="mono deg-col" style={{ fontSize: 10, color: up ? GREEN : RED }}>{up ? '▲' : '▼'}{Math.abs(p.delta).toFixed(1)}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── KATEGORİLER ── */}
        <div style={{ borderTop: `1px solid ${GOLD}18`, paddingTop: 16, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 9, color: DIM, letterSpacing: 2 }}>KATEGORİ SEÇ</span>
            <span className="mono" style={{ fontSize: 9, color: DIM }}>{totalProducts.toLocaleString('tr-TR')} ÜRÜN</span>
          </div>
          <div className="cat-grid">
            {categories.map(cat => (
              <Link key={cat.id} href={`/compare/${cat.link}`} className="cat-card">
                <span style={{ fontSize: 28 }}>{cat.icon}</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#e5e7eb', fontSize: 13 }}>{cat.label}</div>
                  <div className="mono" style={{ color: GOLD_BRIGHT, fontSize: 10, marginTop: 3 }}>{(counts[cat.id] ?? 0).toLocaleString('tr-TR')} model</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: `1px solid ${GOLD}18`, margin: '16px 0 0', padding: '12px 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span className="mono" style={{ fontSize: 9, color: DIM }}>© 2026 RATIO.RUN · TÜRKİYE&apos;NİN MATEMATİKSEL ÜRÜN KARŞILAŞTIRMA PLATFORMU</span>
          <span className="mono" style={{ fontSize: 9, color: DIM }}>DON&apos;T BUY WITH EMOTIONS.</span>
        </div>
      </div>
    </main>
  );
}
