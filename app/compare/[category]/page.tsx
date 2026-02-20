"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase        = createClient(supabaseUrl, supabaseAnonKey);

const GOLD        = "#C9A227";
const GOLD_BRIGHT = "#D4AF37";

const CATEGORIES = [
  { id: "laptop",        label: "Laptop",       icon: "💻", link: "laptop"        },
  { id: "telefon",       label: "Telefon",       icon: "📱", link: "telefon"       },
  { id: "tablet",        label: "Tablet",        icon: "📲", link: "tablet"        },
  { id: "saat",          label: "Akıllı Saat",   icon: "⌚", link: "saat"          },
  { id: "kulaklik",      label: "Kulaklık",      icon: "🎧", link: "kulaklik"      },
  { id: "robot-supurge", label: "Robot Süpürge", icon: "🤖", link: "robot-supurge" },
  { id: "tv",            label: "Televizyon",    icon: "📺", link: "tv"            },
  { id: "araba",         label: "Otomobil",      icon: "🚗", link: "araba"         },
];

export default function Home() {
  const [counts, setCounts]         = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading]       = useState(true);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { fetchCounts(); }, []);

  async function fetchCounts() {
    try {
      const [{ data: prodData }, { data: catData }] = await Promise.all([
        supabase.from("products").select("category_id").eq("is_active", true),
        supabase.from("categories").select("id, slug"),
      ]);
      if (!prodData || !catData) return;

      const slugToId: Record<string, string> = {};
      catData.forEach((c) => { if (c.slug) slugToId[c.slug.toLowerCase()] = c.id; });

      const dbIdToMenuId: Record<string, string> = {};
      CATEGORIES.forEach((cat) => {
        const slug = cat.id === "araba" ? "otomobil" : cat.id;
        if (slugToId[slug])   dbIdToMenuId[slugToId[slug]]   = cat.id;
        if (slugToId[cat.id]) dbIdToMenuId[slugToId[cat.id]] = cat.id;
      });

      const stats: Record<string, number> = {};
      prodData.forEach((p) => {
        const menuId = dbIdToMenuId[p.category_id];
        if (menuId) stats[menuId] = (stats[menuId] || 0) + 1;
      });
      setCounts(stats);
    } catch (err) {
      console.error("[Home] Sayım alınamadı:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (term) router.push(`/compare/all?search=${encodeURIComponent(term)}`);
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav
        className="border-b px-6 py-4 flex justify-between items-center bg-black/60 backdrop-blur fixed w-full z-50"
        style={{ borderColor: `${GOLD}35` }}
      >
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Ratio.Run" style={{ height: 40, width: "auto" }} />
          <span className="text-2xl font-black tracking-tighter">
            ratio<span style={{ color: GOLD_BRIGHT }}>.run</span>
          </span>
        </a>
        <div
          className="text-sm font-mono hidden md:block uppercase tracking-widest"
          style={{ color: GOLD_BRIGHT }}
        >
          DON&apos;T BUY WITH EMOTIONS.
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative pt-40 pb-20 px-6 flex flex-col items-center text-center max-w-6xl mx-auto">

        {/* Altın ambient glow */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] -z-10"
          style={{ background: `${GOLD}12` }}
        />

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Senin Yerine <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${GOLD_BRIGHT} 0%, #EDD060 50%, ${GOLD} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Biz Hesapladık.
          </span>
        </h1>

        {/* ── Arama ──────────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl relative mb-20">
          <input
            type="text"
            placeholder="Model veya marka ara..."
            className="w-full bg-gray-900/50 border border-gray-800 text-white px-8 py-5 rounded-2xl outline-none transition-all text-lg"
            style={{}}
            onFocus={(e)  => { e.currentTarget.style.borderColor = GOLD; }}
            onBlur={(e)   => { e.currentTarget.style.borderColor = ""; }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-3 top-3 bottom-3 px-6 rounded-xl font-bold text-black transition-all"
            style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}
          >
            Ara
          </button>
        </form>

        {/* ── Kategori Kartları ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/compare/${cat.link}`}
            >
              <div
                className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 transition-all duration-200 flex flex-col items-center gap-3 cursor-pointer"
                style={{
                  borderColor: hoveredCat === cat.id ? `${GOLD}70` : "",
                }}
                onMouseEnter={() => setHoveredCat(cat.id)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                <span className="text-4xl">{cat.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-200">{cat.label}</h3>
                  <p className="text-xs font-mono mt-1" style={{ color: GOLD_BRIGHT }}>
                    {loading ? "..." : `${counts[cat.id] ?? 0} Model`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
