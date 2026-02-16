"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabaseUrl = "https://srypulfxbckherkmrjgs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeXB1bGZ4YmNraGVya21yamdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE1NzMwNywiZXhwIjoyMDg2NzMzMzA3fQ.2k9r-KEWjTXmQjTkFm1wMztoquQGVhz2aiUD1R_UJz4";
const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { id: "laptop", label: "Laptop", icon: "💻", link: "laptop" },
  { id: "telefon", label: "Telefon", icon: "📱", link: "telefon" },
  { id: "tablet", label: "Tablet", icon: "📲", link: "tablet" },
  { id: "saat", label: "Akıllı Saat", icon: "⌚", link: "saat" },
  { id: "kulaklik", label: "Kulaklık", icon: "🎧", link: "kulaklik" },
  { id: "robot-supurge", label: "Robot Süpürge", icon: "🧹", link: "robot-supurge" },
  { id: "tv", label: "Televizyon", icon: "📺", link: "tv" },
  { id: "araba", label: "Otomobil", icon: "🚗", link: "araba" }
];

export default function Home() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchCounts();
  }, []);

  async function fetchCounts() {
    const { data: prodData } = await supabase.from("products").select("category_id");
    const { data: catData } = await supabase.from("categories").select("id, slug");

    if (prodData && catData) {
      const stats: Record<string, number> = {};
      const slugToId: Record<string, string> = {};
      catData.forEach(c => { if(c.slug) slugToId[c.slug.toLowerCase()] = c.id; });

      prodData.forEach((p) => {
        const pCatId = p.category_id;
        if (!pCatId) return;
        const foundSlug = Object.keys(slugToId).find(slug => slugToId[slug] === pCatId);
        let ourMenuId = foundSlug === "otomobil" ? "araba" : foundSlug;
        if (ourMenuId) stats[ourMenuId] = (stats[ourMenuId] || 0) + 1;
      });
      setCounts(stats);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Arama terimini URL'e basarak karşılaştırma sayfasına yönlendiriyoruz
      router.push(`/compare/all?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500 font-sans">
      <nav className="border-b border-gray-800 p-6 flex justify-between items-center bg-black/50 backdrop-blur fixed w-full z-50">
        <div className="text-2xl font-black tracking-tighter">RATIO<span className="text-blue-500">.RUN</span></div>
        <div className="text-sm text-gray-400 font-mono hidden md:block uppercase tracking-widest">Global Intelligence</div>
      </nav>

      <div className="relative pt-40 pb-20 px-6 flex flex-col items-center text-center max-w-6xl mx-auto">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Veriye Dayalı <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Karar Ver.</span>
        </h1>
        
        <form onSubmit={handleSearch} className="w-full max-w-2xl relative mb-20 group">
          <input 
            type="text" 
            placeholder="Model veya marka ara..."
            className="w-full bg-gray-900/50 border border-gray-800 text-white px-8 py-5 rounded-2xl outline-none focus:border-blue-500 transition-all text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="absolute right-3 top-3 bottom-3 bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-bold transition-all">
            Ara
          </button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/compare/${cat.link}`} className="group bg-gray-900/40 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all flex flex-col items-center gap-3">
              <span className="text-4xl">{cat.icon}</span>
              <div>
                <h3 className="font-bold text-gray-200">{cat.label}</h3>
                <p className="text-xs text-gray-500 font-mono mt-1">{counts[cat.id] || 0} Model</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}