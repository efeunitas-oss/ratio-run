// app/HomeClient.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface Category {
  id: string;
  label: string;
  icon: string;
  link: string;
}

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
      const step = () => {
        cur += Math.max(1, Math.ceil((target - cur) / 10));
        if (cur >= target) { setVal(target); return; }
        setVal(cur);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return <>{val}</>;
}

function fmtPrice(p: number) {
  return '₺' + Math.round(p).toLocaleString('tr-TR');
}

export default function HomeClient({ categories, counts, topProducts, totalProducts, lastUpdated }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [flickerSet, setFlickerSet] = useState<Set<string>>(new Set());
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('tr-TR'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (topProducts.length === 0) return;
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * topProducts.length);
      const pid = topProducts[idx]?.id;
      if (!pid) return;
      setFlickerSet(prev => new Set([...prev, pid]));
      setTimeout(() => setFlickerSet(prev => { const n = new Set(prev); n.delete(pid); return n; }), 350);
    }, 1000);
    return () => clearInterval(id);
  }, [topProducts]);

  const filteredProducts = activeCategory === 'all'
    ? topProducts
    : topProducts.filter(p => p.categorySlug === activeCategory);

  const best = topProducts[0];
  const avgScore = topProducts.length > 0
    ? (topProducts.reduce((s, p) => s + p.score, 0) / topProducts.length).toFixed(1)
    : '0';

  const categoryTabs = [
    { id: 'all', label: 'TÜMÜ' },
    ...categories.slice(0, 4).map(c => ({ id: c.link, label: c.label.slice(0, 7).toUpperCase() })),
  ];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');
    @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    @keyframes scanline { 0% { top: -4px; } 100% { top: 100%; } }
    @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    .ticker-wrap { overflow: hidden; flex: 1; }
    .ticker-track { display: inline-flex; align-items: center; animation: ticker 50s linear infinite; }
    .ticker-track:hover { animation-play-state: paused; }
    .panel { background: rgba(8,8,8,0.9); border: 1px solid ${GOLD}28; border-radius: 3px; }
    .panel-hd { background: linear-gradient(90deg, ${GOLD}14, transparent); border-bottom: 1px solid ${GOLD}22; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; }
    .mono { font-family: 'IBM Plex Mono', monospace; }
    .terminal-grid { display: grid; grid-template-columns: 280px 1fr 240px; gap: 14px; }
    .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .cat-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 10px; background: rgba(8,8,8,0.7); border: 1px solid ${GOLD}18; border-radius: 3px; text-decoration: none; transition: all 0.15s; }
    .cat-card:hover { border-color: ${GOLD}55; background: ${GOLD}07; }
    .tab { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 1.5px; padding: 3px 8px; border-radius: 2px; border: 1px solid transparent; cursor: pointer; transition: all 0.1s; background: transparent; color: ${DIM}; }
    .tab.on { border-color: ${GOLD}55; color: ${GOLD_BRIGHT}; background: ${GOLD}14; }
    .tab:hover:not(.on) { color: #9ca3af; }
    .row { display: grid; grid-template-columns: 26px 1fr 72px 58px 48px; gap: 6px; padding: 8px 14px; border-bottom: 1px solid ${GOLD}0e; text-decoration: none; align-items: center; transition: background 0.1s; }
    .row:hover { background: ${GOLD}07; }
    @media (max-width: 960px) {
      .terminal-grid { grid-template-columns: 1fr !important; }
      .cat-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .right-panel { display: none !important; }
      .nav-extra { display: none !important; }
      .row { grid-template-columns: 24px 1fr 60px 46px !important; }
    }
    @media (max-width: 480px) {
      .row { grid-template-columns: 20px 1fr 54px 42px !important; font-size: 11px; }
      .cat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
    }
    @media (max-width: 960px) {
      .hide-mobile { display: none !important; }
    }
  `;

  return (
    <main style={{ minHeight: '100vh', background: '#030303', color: '#fff' }}>
      <style>{css}</style>

      {/* Scanline */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden', opacity: 0.025 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(transparent, #fff 50%, transparent)', animation: 'scanline 10s linear infinite' }} />
      </div>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: `1px solid ${GOLD}28`, padding: '11px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(3,3,3,0.96)', backdropFilter: 'blur(16px)', zIndex: 50 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 34, width: 'auto' }} />
          <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.5px', color: '#fff' }}>
            ratio<span style={{ color: GOLD_BRIGHT }}>.run</span>
          </span>
        </a>

        <div className="nav-extra" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span className="mono" style={{ fontSize: 10, color: GREEN, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            SİSTEM AKTİF
          </span>
          <span className="mono" style={{ fontSize: 10, color: DIM }}>{time}</span>
          <span className="mono" style={{ fontSize: 10, color: DIM }}>{totalProducts.toLocaleString('tr-TR')} ÜRÜN</span>
        </div>

        <span className="mono nav-extra" style={{ fontSize: 10, color: GOLD, letterSpacing: 2 }}>
          DON&apos;T BUY WITH EMOTIONS.
        </span>
      </nav>

      {/* ── TICKER ── */}
      <div style={{ height: 34, borderBottom: `1px solid ${GOLD}22`, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ padding: '0 14px', borderRight: `1px solid ${GOLD}25`, flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 9, color: GOLD, letterSpacing: 2 }}>RATIO FEED</span>
        </div>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...topProducts, ...topProducts].map((p, i) => (
              <span key={`${p.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0 22px', borderRight: `1px solid ${GOLD}1a`, whiteSpace: 'nowrap' }}>
                <span className="mono" style={{ fontSize: 10, color: '#6b7280', letterSpacing: 0.5 }}>{p.brand.slice(0, 6).toUpperCase()}</span>
                <span className="mono" style={{ fontSize: 10, color: '#d1d5db' }}>{p.name.split(' ').slice(0, 3).join(' ')}</span>
                <span className="mono" style={{ fontSize: 11, color: GOLD_BRIGHT, fontWeight: 600 }}>{p.score.toFixed(1)}</span>
                <span className="mono" style={{ fontSize: 10, color: p.delta >= 0 ? GREEN : RED }}>{p.delta >= 0 ? '▲' : '▼'}{Math.abs(p.delta).toFixed(1)}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 14px', borderLeft: `1px solid ${GOLD}25`, flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 9, color: DIM }}>{lastUpdated}</span>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 18px 0' }}>

        {/* ── TERMINAL GRID ── */}
        <div className="terminal-grid" style={{ marginBottom: 16, animation: 'fadein 0.35s ease' }}>

          {/* SOL — Best Score */}
          {best && (
            <div className="panel">
              <div className="panel-hd">
                <span className="mono" style={{ fontSize: 9, color: GOLD, letterSpacing: 2 }}>GÜNÜN EN İYİSİ</span>
                <span className="mono" style={{ fontSize: 9, color: DIM }}>{best.category.toUpperCase()}</span>
              </div>
              <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: 80, fontWeight: 700, lineHeight: 1, color: GOLD_BRIGHT, letterSpacing: -3 }}>
                    <AnimatedScore target={Math.round(best.score)} delay={200} />
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: DIM, marginTop: 2, letterSpacing: 1 }}>/ 100 RATIO SCORE</div>
                </div>

                <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}1e`, borderRadius: 3, padding: '11px 13px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb', lineHeight: 1.4, marginBottom: 4 }}>
                    {best.name.split(' ').slice(0, 5).join(' ')}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: DIM }}>{best.brand}</div>
                  <div className="mono" style={{ fontSize: 15, color: GOLD_BRIGHT, fontWeight: 700, marginTop: 7 }}>
                    {fmtPrice(best.price)}
                  </div>
                </div>

                <div>
                  <div style={{ height: 3, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${best.score}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`, borderRadius: 2 }} />
                  </div>
                </div>

                <Link href={`/compare/${best.categorySlug}/${best.id}`} style={{ display: 'block', textAlign: 'center', padding: '9px', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: '#000', fontWeight: 800, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1.5, borderRadius: 3, textDecoration: 'none' }}>
                  ANALİZİ GÖR →
                </Link>
              </div>
            </div>
          )}

          {/* ORTA — Sıralama Tablosu */}
          <div className="panel">
            <div className="panel-hd">
              <span className="mono" style={{ fontSize: 9, color: GOLD, letterSpacing: 2 }}>CANLI RATIO SIRALAMASI</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {categoryTabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveCategory(tab.id)} className={`tab ${activeCategory === tab.id ? 'on' : ''}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Başlık */}
            <div className="row" style={{ borderBottom: `1px solid ${GOLD}22`, padding: '6px 14px' }}>
              {['RNK', 'ÜRÜN', 'FİYAT', 'SCORE', 'DEĞ'].map(h => (
                <span key={h} className="mono" style={{ fontSize: 9, color: DIM, letterSpacing: 1 }}>{h}</span>
              ))}
            </div>

            {filteredProducts.slice(0, 5).map((p, i) => {
              const isFlicker = flickerSet.has(p.id);
              const up = p.delta >= 0;
              return (
                <Link key={p.id} href={`/compare/${p.categorySlug}/${p.id}`} className="row" style={{ background: isFlicker ? `${GOLD}07` : 'transparent' }}>
                  <span className="mono" style={{ fontSize: 11, color: i < 3 ? GOLD : DIM }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name.split(' ').slice(0, 4).join(' ')}
                    </div>
                    <div className="mono" style={{ fontSize: 9, color: DIM, marginTop: 1 }}>
                      {p.brand} · {p.category}
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: '#6b7280' }}>{fmtPrice(p.price)}</span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: isFlicker ? '#fff' : GOLD_BRIGHT, transition: 'color 0.2s' }}>
                    {p.score.toFixed(1)}
                  </span>
                  <span className="mono" style={{ fontSize: 10, color: up ? GREEN : RED }}>
                    {up ? '▲' : '▼'}{Math.abs(p.delta).toFixed(1)}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* SAĞ — Metrikler */}
          <div className="panel right-panel">
            <div className="panel-hd">
              <span className="mono" style={{ fontSize: 9, color: GOLD, letterSpacing: 2 }}>SİSTEM METRİKLERİ</span>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'ÜRÜN', value: totalProducts.toLocaleString('tr-TR'), color: GOLD_BRIGHT },
                  { label: 'KATEGORİ', value: '8', color: GOLD_BRIGHT },
                  { label: 'KAYNAK', value: '2', color: GREEN },
                  { label: 'ORT. SKOR', value: avgScore, color: '#e5e7eb' },
                ].map(s => (
                  <div key={s.label} style={{ background: `${GOLD}07`, border: `1px solid ${GOLD}1a`, borderRadius: 3, padding: '9px 11px' }}>
                    <div className="mono" style={{ fontSize: 8, color: DIM, letterSpacing: 1.5, marginBottom: 4 }}>{s.label}</div>
                    <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="mono" style={{ fontSize: 8, color: DIM, letterSpacing: 1.5, marginBottom: 10 }}>KATEGORİ DAĞILIMI</div>
              {categories.map(cat => {
                const count = counts[cat.id] ?? 0;
                const pct = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;
                return (
                  <Link key={cat.id} href={`/compare/${cat.link}`} style={{ display: 'block', textDecoration: 'none', marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span className="mono" style={{ fontSize: 9, color: '#9ca3af' }}>{cat.label.toUpperCase()}</span>
                      <span className="mono" style={{ fontSize: 9, color: DIM }}>{count}</span>
                    </div>
                    <div style={{ height: 2, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}80, ${GOLD_BRIGHT})`, borderRadius: 1 }} />
                    </div>
                  </Link>
                );
              })}

              <div style={{ borderTop: `1px solid ${GOLD}1a`, marginTop: 12, paddingTop: 10 }}>
                <div className="mono" style={{ fontSize: 8, color: DIM, lineHeight: 1.9, letterSpacing: 0.5 }}>
                  KAYNAK: AMAZON TR + TRENDYOL<br />
                  SON GÜNCELLEME: {lastUpdated}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KATEGORİLER ── */}
        <div style={{ borderTop: `1px solid ${GOLD}1a`, paddingTop: 16, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 9, color: DIM, letterSpacing: 2 }}>KATEGORİ SEÇ</span>
            <span className="mono" style={{ fontSize: 9, color: DIM }}>{categories.length} KATEGORİ</span>
          </div>
          <div className="cat-grid">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/compare/${cat.link}`} className="cat-card">
                <span style={{ fontSize: 30 }}>{cat.icon}</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#e5e7eb', fontSize: 13 }}>{cat.label}</div>
                  <div className="mono" style={{ color: GOLD_BRIGHT, fontSize: 10, marginTop: 3 }}>
                    {(counts[cat.id] ?? 0).toLocaleString('tr-TR')} model
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${GOLD}1a`, margin: '16px 0 0', padding: '12px 0', display: 'flex', justifyContent: 'space-between' }}>
          <span className="mono" style={{ fontSize: 9, color: DIM }}>© 2026 RATIO.RUN · TÜRKİYE&apos;NİN MATEMATİKSEL ÜRÜN KARŞILAŞTIRMA PLATFORMU</span>
          <span className="mono" style={{ fontSize: 9, color: DIM }}>DON&apos;T BUY WITH EMOTIONS.</span>
        </div>
      </div>
    </main>
  );
}
