// app/page.tsx — SERVER COMPONENT, sıfır client JS
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const revalidate = 300;

const GOLD        = '#C9A227';
const GOLD_BRIGHT = '#D4AF37';

const CATEGORIES = [
  { id: 'laptop',        label: 'Laptop',       icon: '💻', link: 'laptop'        },
  { id: 'telefon',       label: 'Telefon',       icon: '📱', link: 'telefon'       },
  { id: 'tablet',        label: 'Tablet',        icon: '📲', link: 'tablet'        },
  { id: 'saat',          label: 'Akıllı Saat',   icon: '⌚', link: 'saat'          },
  { id: 'kulaklik',      label: 'Kulaklık',      icon: '🎧', link: 'kulaklik'      },
  { id: 'robot-supurge', label: 'Robot Süpürge', icon: '🤖', link: 'robot-supurge' },
  { id: 'tv',            label: 'Televizyon',    icon: '📺', link: 'tv'            },
  { id: 'araba',         label: 'Otomobil',      icon: '🚗', link: 'araba'         },
];

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: catData } = await supabase.from('categories').select('id, slug');
  const counts: Record<string, number> = {};

  await Promise.all((catData ?? []).map(async (cat) => {
    const menuCat = CATEGORIES.find(c =>
      c.id === cat.slug?.toLowerCase() ||
      c.link === cat.slug?.toLowerCase() ||
      (c.id === 'araba' && cat.slug === 'otomobil') ||
      (c.id === 'tv' && cat.slug === 'televizyon') ||
      cat.slug?.toLowerCase().includes(c.id)
    );
    if (!menuCat) return;
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', cat.id)
      .eq('is_active', true);
    if (count) counts[menuCat.id] = count;
  }));

  return (
    <main className="min-h-screen bg-black text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── CSS ── */}
      <style>{`
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 768px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .nav-slogan { display: none; }
        }
        .cat-card {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 28px 16px;
          background: rgba(17,24,39,0.5);
          border: 1px solid #1F2937;
          border-radius: 20px;
          text-decoration: none;
          transition: border-color 0.15s;
        }
        .cat-card:hover { border-color: ${GOLD}99; }
        .search-input {
          width: 100%; box-sizing: border-box;
          background: rgba(17,24,39,0.6);
          border: 1px solid #374151;
          color: #fff;
          padding: 18px 120px 18px 24px;
          border-radius: 16px;
          font-size: 16px;
          outline: none;
        }
        .search-input:focus { border-color: ${GOLD}; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        borderBottom: `1px solid ${GOLD}35`,
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky', top: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 38, width: 'auto' }} />
          <span style={{ fontSize: 21, fontWeight: 900, letterSpacing: '-0.5px', color: '#fff' }}>
            ratio<span style={{ color: GOLD_BRIGHT }}>.run</span>
          </span>
        </a>
        <span className="nav-slogan" style={{
          fontSize: 12, fontFamily: 'monospace',
          color: GOLD_BRIGHT, letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          DON&apos;T BUY WITH EMOTIONS.
        </span>
      </nav>

      {/* ── Hero ── */}
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 20px 60px', textAlign: 'center' }}>

        <h1 style={{ fontSize: 'clamp(36px, 7vw, 68px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 32 }}>
          Senin Yerine<br />
          <span style={{
            background: `linear-gradient(135deg, ${GOLD_BRIGHT} 0%, #EDD060 50%, ${GOLD} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Biz Hesapladık.
          </span>
        </h1>

        {/* ── Arama ── */}
        <form action="/compare/all" method="GET" style={{ maxWidth: 560, margin: '0 auto 56px', position: 'relative' }}>
          <input
            type="text"
            name="search"
            placeholder="Model veya marka ara..."
            className="search-input"
          />
          <button type="submit" style={{
            position: 'absolute', right: 8, top: 8, bottom: 8,
            padding: '0 22px', borderRadius: 12,
            fontWeight: 700, fontSize: 15,
            background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
            color: '#000', border: 'none', cursor: 'pointer',
          }}>
            Ara
          </button>
        </form>

        {/* ── Kategori Grid ── */}
        <div className="cat-grid">
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} href={`/compare/${cat.link}`} className="cat-card">
              <span style={{ fontSize: 38 }}>{cat.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: '#e5e7eb', fontSize: 15 }}>{cat.label}</div>
                <div style={{ color: GOLD_BRIGHT, fontSize: 12, fontFamily: 'monospace', marginTop: 4 }}>
                  {counts[cat.id] ?? 0} Model
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
