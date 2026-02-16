"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

// --- SUPABASE AYARLARI ---
const supabaseUrl = "https://srypulfxbckherkmrjgs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyeXB1bGZ4YmNraGVya21yamdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE1NzMwNywiZXhwIjoyMDg2NzMzMzA3fQ.2k9r-KEWjTXmQjTkFm1wMztoquQGVhz2aiUD1R_UJz4";
const supabase = createClient(supabaseUrl, supabaseKey);

const DB_MAPPING: Record<string, string> = {
  "laptop": "Laptop & Bilgisayar", "telefon": "Akıllı Telefon", "tablet": "Tablet",
  "saat": "Akıllı Saat", "kulaklik": "Kulaklık & Ses", "robot-supurge": "Robot Süpürge",
  "tv": "TV", "araba": "Otomobil"
};

export default function ComparePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlSlug = decodeURIComponent(params.category as string).toLowerCase();
  const searchQuery = searchParams.get("search");

  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vsMode, setVsMode] = useState(false);

  useEffect(() => { fetchProducts(); }, [urlSlug, searchQuery]);

  async function fetchProducts() {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*').limit(300);
      if (urlSlug !== "all") {
        const dbName = DB_MAPPING[urlSlug];
        const { data: cat } = await supabase.from('categories').select('id').eq('name', dbName).maybeSingle();
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
      const { data } = await query;
      setProducts((data || []).map(p => ({ ...p, title: p.name || p.title })));
    } finally { setLoading(false); }
  }

  const toggleSelect = (p: any) => {
    if (selected.find(s => s.id === p.id)) setSelected(selected.filter(s => s.id !== p.id));
    else if (selected.length < 2) setSelected([...selected, p]);
  };

  // --- KARAR VERİCİ MOTOR (VS EKRANI) ---
  if (vsMode && selected.length === 2) {
    const [p1, p2] = selected;
    
    // Skorları JSON'dan çekiyoruz
    const s1 = p1.specifications?.overall_score || 0;
    const s2 = p2.specifications?.overall_score || 0;
    
    // Kazananı Belirle
    const winner = s1 > s2 ? p1 : s2 > s1 ? p2 : null;

    return (
      <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
        <button onClick={() => setVsMode(false)} className="text-blue-500 mb-10 font-mono tracking-tighter hover:text-white transition-colors">
          ← SEÇİME GERİ DÖN
        </button>

        <div className="max-w-6xl mx-auto">
          {/* Karar Başlığı */}
          <div className="text-center mb-16">
            <h2 className="text-sm font-mono text-gray-500 uppercase tracking-[0.3em] mb-4">RATIO ANALİZ SONUCU</h2>
            <div className="text-4xl font-black">
              {winner ? (
                <span>RATIO SEÇİMİ: <span className="text-blue-500 underline decoration-2 underline-offset-8">{winner.title}</span></span>
              ) : (
                <span className="text-gray-400 italic">ANALİZ BAŞA BAŞ: İKİ ÜRÜN DE GÜÇLÜ</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:gap-16">
            {[p1, p2].map((p, i) => {
              const isWinner = winner?.id === p.id;
              const score = p.specifications?.overall_score || 0;
              
              return (
                <div key={i} className={`relative flex flex-col bg-[#0a0a0a] border-2 rounded-[2rem] p-8 transition-all duration-500 ${isWinner ? 'border-blue-500 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]' : 'border-gray-900 opacity-60'}`}>
                  
                  {isWinner && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-6 py-2 rounded-full tracking-[0.2em] shadow-xl">
                      ŞAMPİYON
                    </div>
                  )}

                  <div className="h-64 bg-white rounded-2xl mb-8 p-6 flex items-center justify-center relative overflow-hidden">
                    <img src={p.image || "https://placehold.co/400"} referrerPolicy="no-referrer" className="max-h-full object-contain" />
                  </div>

                  <h3 className="text-xl font-bold mb-6 line-clamp-2 min-h-[3.5rem]">{p.title}</h3>

                  {/* Skor Göstergesi */}
                  <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-mono text-gray-500 uppercase">Verimlilik Skoru</span>
                      <span className={`text-3xl font-black ${isWinner ? 'text-blue-500' : 'text-gray-600'}`}>{score}/10</span>
                    </div>
                    <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ease-out ${isWinner ? 'bg-blue-600' : 'bg-gray-800'}`} style={{ width: `${score * 10}%` }}></div>
                    </div>
                  </div>

                  {/* Teknik Detay Dump */}
                  <div className="flex-1 bg-black/50 border border-gray-800/50 rounded-xl p-4 mb-8">
                    <p className="text-[10px] font-mono text-gray-600 mb-3 uppercase tracking-widest">Analiz Verisi</p>
                    <div className="grid grid-cols-1 gap-2">
                        {p.specifications && Object.entries(p.specifications).slice(0, 6).map(([key, val]: any) => (
                           <div key={key} className="flex justify-between text-[11px] font-mono border-b border-gray-900 pb-1">
                               <span className="text-gray-500">{key.replace('_', ' ')}</span>
                               <span className="text-gray-300">{val}</span>
                           </div>
                        ))}
                    </div>
                  </div>

                  <a href={p.url} target="_blank" className={`block w-full py-4 rounded-xl font-black text-center transition-all ${isWinner ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {isWinner ? 'LİDERİ İNCELE' : 'ÜRÜNE GİT'}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto pt-10">
        <div className="flex justify-between items-end mb-12 border-b border-gray-800 pb-8">
           <Link href="/" className="text-xs font-mono text-gray-500 hover:text-white transition-colors tracking-widest uppercase">← Dashboard</Link>
           <div className="text-right">
              <h1 className="text-5xl font-black tracking-tighter text-white">{urlSlug.toUpperCase()}</h1>
              <p className="text-[10px] text-blue-500 font-mono mt-2 tracking-widest uppercase">Ratio Analiz Motoru Aktif</p>
           </div>
        </div>

        {loading ? (
            <div className="text-center py-40 font-mono text-gray-700 animate-pulse tracking-widest">SYNCHRONIZING DATABASE...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map(p => {
              const isSelected = selected.find(s => s.id === p.id);
              const score = p.specifications?.overall_score || 0;
              return (
                <div key={p.id} onClick={() => toggleSelect(p)} className={`cursor-pointer bg-[#0a0a0a] border rounded-3xl p-5 transition-all duration-300 ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-900 hover:border-gray-700'}`}>
                  <div className="h-40 bg-white rounded-2xl mb-5 p-4 flex items-center justify-center relative">
                    <img src={p.image || "https://placehold.co/200"} referrerPolicy="no-referrer" className="max-h-full object-contain" />
                    {score > 8 && <div className="absolute top-2 left-2 bg-green-500 text-black text-[8px] font-black px-2 py-0.5 rounded">HIGH RATIO</div>}
                  </div>
                  <h3 className="font-bold text-[11px] line-clamp-2 h-8 mb-4 text-gray-300 leading-snug">{p.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-white font-mono">{p.price > 0 ? `${p.price.toLocaleString()} ₺` : "-"}</span>
                    <span className="text-[10px] font-black text-blue-500 font-mono">★ {score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-5 rounded-full flex items-center gap-8 shadow-[0_20px_50px_rgba(255,255,255,0.1)] z-50 animate-in fade-in slide-in-from-bottom-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest">{selected.length}/2 SEÇİLDİ</span>
            <div className="flex -space-x-2">
                {selected.map(s => <div key={s.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200"><img src={s.image} className="object-cover w-full h-full"/></div>)}
            </div>
          </div>
          {selected.length === 2 ? (
            <button onClick={() => setVsMode(true)} className="bg-blue-600 text-white px-8 py-2.5 rounded-full font-black text-xs hover:bg-black transition-all">ANALİZİ BAŞLAT</button>
          ) : (
            <span className="text-[10px] font-bold text-gray-400">KARŞILAŞTIRMAK İÇİN BİR ÜRÜN DAHA SEÇ</span>
          )}
          <button onClick={() => setSelected([])} className="text-[10px] font-black hover:underline underline-offset-4">TEMİZLE</button>
        </div>
      )}
    </div>
  );
}