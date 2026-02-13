'use client';

import React, { useState } from 'react';
import { ChevronDown, ShoppingCart, ExternalLink, Search } from 'lucide-react';

interface AffiliateLink {
  provider: string;
  url: string;
  price?: string;
  isFeatured?: boolean;
}

interface SmartBuyButtonProps {
  product: {
    brand: string;
    model?: string;
    name?: string;
    category?: string;
    affiliateLinks?: AffiliateLink[];
  };
}

export default function SmartBuyButton({ product }: SmartBuyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const links = product.affiliateLinks || [];

  // Link yoksa Google Arama'ya yönlendirir
  const handleSearchClick = () => {
    const productModel = product.model || product.name || '';
    const searchQuery = `${product.brand} ${productModel} fiyatları`;
    const isVacuum = product.category === 'ROBOT_VACUUM' || product.name?.toLowerCase().includes('vacuum');
    const url = isVacuum
      ? `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=shop`
      : `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 1. DURUM: HİÇ LİNK YOKSA (GOOGLE ARAMA BUTONU)
  if (links.length === 0) {
    return (
      <button
        onClick={handleSearchClick}
        className="group relative inline-flex items-center justify-center gap-3 w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-black font-black text-lg uppercase tracking-wider rounded-xl shadow-xl transition-all duration-300 hover:scale-[1.02]"
      >
        <Search className="w-5 h-5" />
        <span>Fiyatları Gör</span>
      </button>
    );
  }

  const featuredLink = links.find(l => l.isFeatured) || links[0];
  const otherLinks = links.filter(l => l !== featuredLink);

  // 2. DURUM: LİNK VARSA (AFFILIATE BUTONU + DROPDOWN)
  return (
    <div className="relative w-full flex flex-col gap-2">
      <div className="flex w-full group">
        <a
          href={featuredLink.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-lg uppercase tracking-wider rounded-l-xl border-y border-l border-orange-400/30 transition-all duration-300"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>HEMEN SATIN AL</span>
        </a>

        {links.length > 1 && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-4 bg-orange-700 hover:bg-orange-800 text-white rounded-r-xl border-y border-r border-orange-400/30 transition-all duration-300"
          >
            <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Diğer Satıcılar Dropdown */}
      {isOpen && otherLinks.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-1">
          <div className="px-4 py-2 bg-zinc-800/50 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
            Diğer Satıcılar
          </div>
          {otherLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800 transition-colors border-t border-zinc-800/50"
            >
              <span className="text-zinc-300 font-bold uppercase text-sm">{link.provider}</span>
              <div className="flex items-center gap-3">
                {link.price && <span className="text-amber-400 font-bold">{link.price}</span>}
                <ExternalLink className="w-4 h-4 text-zinc-500" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}