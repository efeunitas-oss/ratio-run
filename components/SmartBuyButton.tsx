'use client';

import React from 'react';
import { Product, isVehicle } from '../app/types';

interface SmartBuyButtonProps {
  product: Product;
  className?: string;
}

export const SmartBuyButton: React.FC<SmartBuyButtonProps> = ({ 
  product, 
  className = '' 
}) => {
  const handleClick = () => {
    if (product.affiliateUrl) {
      // Affiliate linki varsa direkt oraya git
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Type Guard ile kategori belirleme
      const searchQuery = `${product.brand} ${isVehicle(product) ? product.model : ''} fiyatları`.trim();
      
      let finalUrl: string;
      if (isVehicle(product)) {
        // Arabalar için: Genel Google Araması (Sahibinden vb.)
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      } else {
        // Robot Süpürgeler için: Google Shopping sekmesi
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=shop`;
      }
      
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        group relative inline-flex items-center justify-center gap-3 
        px-10 py-5 
        bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 
        hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700
        text-black font-black text-xl uppercase tracking-wider
        rounded-xl shadow-2xl shadow-emerald-500/30 
        hover:shadow-emerald-500/50
        border-2 border-emerald-400/50
        transform transition-all duration-300 
        hover:scale-105 active:scale-95
        overflow-hidden
        ${className}
      `}
      aria-label={
        product.affiliateUrl 
          ? `${product.brand} satın al` 
          : `${product.brand} fiyatlarını gör`
      }
    >
      {/* Animasyonlu arka plan efekti */}
      <span className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-green-300 opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
      
      {/* Işıltı efekti */}
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.3),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* İkon - Alışveriş Sepeti */}
      <svg 
        className="w-7 h-7 relative z-10 transition-transform group-hover:rotate-12 group-hover:scale-110" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
      
      {/* Metin */}
      <span className="relative z-10 drop-shadow-sm">
        {product.affiliateUrl ? 'Hemen Satın Al' : 'Fiyatları Gör'}
      </span>
      
      {/* Sağ ok animasyonu */}
      <svg 
        className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-2" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={3}
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M13 7l5 5m0 0l-5 5m5-5H6" 
        />
      </svg>

      {/* Alt köşe rozet (link varsa) */}
      {product.affiliateUrl && (
        <span className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-tl-lg uppercase tracking-widest">
          Partner
        </span>
      )}

      {/* Işık süzmesi efekti */}
      <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/20 opacity-40 group-hover:animate-shine" />
    </button>
  );
};

export default SmartBuyButton;