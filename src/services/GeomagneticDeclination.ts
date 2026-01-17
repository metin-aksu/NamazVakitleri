// Basit manyetik sapma (declination) hesaplayıcı
// Not: Bu fonksiyon örnek olarak yaklaşık değer döndürür. Daha hassas için harici API veya güncel model gerekir.
// Türkiye için yaklaşık değerler kullanılmıştır. Gelişmiş için geomagnetic-declination gibi paketler entegre edilebilir.

export function getDeclination(latitude: number, longitude: number): number {
  // Türkiye için yaklaşık sapma değerleri (2026 civarı)
  // Batıdan doğuya: İstanbul ~4°, Ankara ~5°, Erzurum ~7°
  // Basit bir lineer yaklaşım
  if (latitude < 35 || latitude > 43 || longitude < 25 || longitude > 45) {
    // Türkiye dışı ise 0° döndür
    return 0;
  }
  // Batıdan doğuya lineer artış
  const minLong = 25, maxLong = 45;
  const minDecl = 4, maxDecl = 7;
  const decl = minDecl + ((longitude - minLong) / (maxLong - minLong)) * (maxDecl - minDecl);
  return decl;
}

export default { getDeclination };
