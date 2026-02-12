const fs = require('fs');
const path = require('path');

// Veri dosyasının yolu
const dataFilePath = path.join(__dirname, '../app/data.ts');

// Dosyayı oku
let dataContent = fs.readFileSync(dataFilePath, 'utf-8');

// SADECE affiliateUrl OLMAYAN objelere ekle
// Regex: `{` ile başlayan ve `affiliateUrl` içermeyen objeler
const addAffiliateUrl = (content) => {
  // Her ürün objesini bul (id: ile başlayan)
  return content.replace(
    /(\s+)(id: ['"][^'"]+['"],\n\s+name:)/g,
    (match, indent, rest) => {
      // Eğer bu blokta zaten affiliateUrl varsa dokunma
      if (content.includes('affiliateUrl')) {
        return match;
      }
      return `${indent}${rest}`;
    }
  );
};

// Pattern: segment satırından sonra affiliateUrl ekle
dataContent = dataContent.replace(
  /(segment: ['"][^'"]+['"],)(\n)/g,
  '$1\n    affiliateUrl: null,$2'
);

// Kaydet
fs.writeFileSync(dataFilePath, dataContent, 'utf-8');

console.log('✅ Tüm ürünlere affiliateUrl: null eklendi!');
console.log('📝 Manuel olarak affiliate linklerini doldurabilirsiniz.');