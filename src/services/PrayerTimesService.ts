import { PrayerTimes, City, ApiResponse } from '../types';

const API_BASE_URL = 'https://api.aladhan.com/v1';

interface CachedPrayerTimes {
  data: PrayerTimes;
  date: string;
  cityName: string;
}

class PrayerTimesService {
  private cachedTimes: CachedPrayerTimes | null = null;

  // Namaz vakitlerini getir
  async getPrayerTimes(cityOrName: string | City, date?: string): Promise<ApiResponse<PrayerTimes>> {
    try {
      let city: City | undefined;

      if (typeof cityOrName === 'string') {
        const cityName = cityOrName;
        city = this.getTurkishCities().find((c: any) => c.name === cityName);
      } else {
        city = cityOrName;
      }

      if (!city) {
        return {
          status: 'error',
          message: 'Şehir bulunamadı'
        };
      }

      const cityName = city.name;

      // Türkiye saat dilimi ile güncel tarihi al
      const currentDate = date || this.getCurrentDateInTurkey();

      // Cache kontrolü - eğer aynı şehir ve tarih için cache varsa kullan
      if (this.cachedTimes &&
        this.cachedTimes.cityName === cityName &&
        this.cachedTimes.date === currentDate) {
        return {
          status: 'success',
          data: this.cachedTimes.data,
          message: 'Namaz vakitleri başarıyla yüklendi (cache)'
        };
      }

      // Cache yoksa veya güncel değilse API'den çek
      const result = await this.fetchPrayerTimesFromAPI(city, currentDate);

      // Başarılı sonucu cache'le
      if (result.status === 'success' && result.data) {
        this.cachedTimes = {
          data: result.data,
          date: currentDate,
          cityName: cityName
        };
      }

      return result;
    } catch (error) {
      console.error('Tüm API\'ler başarısız:', error);

      let errorMessage = 'İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin.';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'İstek zaman aşımına uğradı. Tekrar deneyin.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.';
        }
      }

      return {
        status: 'error',
        message: errorMessage
      };
    }
  }

  // Türkiye saat dilimi ile güncel tarihi al
  private getCurrentDateInTurkey(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // API'den namaz vakitlerini çek
  private async fetchPrayerTimesFromAPI(city: City, date: string): Promise<ApiResponse<PrayerTimes>> {
    // Önce ana API'yi dene
    try {
      return await this.fetchFromMainAPI(city.latitude, city.longitude, date);
    } catch (apiError) {
      console.log('Ana API başarısız, fallback API deneniyor...');
      // Ana API başarısız olursa alternatif API dene
      return await this.fetchFromFallbackAPI(city.latitude, city.longitude, date);
    }
  }

  // Ana API'yi dene (HTTPS)
  private async fetchFromMainAPI(latitude: number, longitude: number, date: string): Promise<ApiResponse<PrayerTimes>> {
    // Türkiye Diyanet İşleri hesaplama yöntemi (method=13)
    // school parametresi kaldırıldı - Diyanet'in kendi hesaplaması kullanılacak
    const url = `${API_BASE_URL}/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=13`;

    console.log('API URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`API Hatası: ${response.status}`);
    }

    const data = await response.json();

    console.log('API Response:', JSON.stringify(data, null, 2));

    if (data.code === 200 && data.data && data.data.timings) {
      const timings = data.data.timings;

      return {
        status: 'success',
        data: {
          fajr: timings.Fajr,
          sunrise: timings.Sunrise,
          dhuhr: timings.Dhuhr,
          asr: timings.Asr,
          maghrib: timings.Maghrib,
          isha: timings.Isha,
        },
        message: 'Namaz vakitleri başarıyla yüklendi'
      };
    } else {
      throw new Error('API\'den geçersiz veri döndü');
    }
  }

  // Alternatif API (HTTP fallback)
  private async fetchFromFallbackAPI(latitude: number, longitude: number, date: string): Promise<ApiResponse<PrayerTimes>> {
    const httpUrl = API_BASE_URL.replace('https:', 'http:');
    const url = `${httpUrl}/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=13`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`Fallback API Hatası: ${response.status}`);
    }

    const data = await response.json();

    return {
      status: 'success',
      data: {
        fajr: data.data.timings.Fajr,
        sunrise: data.data.timings.Sunrise,
        dhuhr: data.data.timings.Dhuhr,
        asr: data.data.timings.Asr,
        maghrib: data.data.timings.Maghrib,
        isha: data.data.timings.Isha,
      },
      message: 'Yaklaşık vakitler (offline)'
    };
  }

  // Türkiye şehirlerini getir
  // Türkiye şehirlerini ve ilçelerini getir
  getTurkishCities(): any[] {
    const citiesData = require('./cities.json');
    return citiesData.map((city: any) => ({
      id: city.id.toString(),
      name: city.name,
      countryId: 'TR',
      latitude: city.latitude,
      longitude: city.longitude,
      districts: city.towns
    }));
  }

  // Cache'i temizle (gerekirse manuel temizlik için)
  clearCache(): void {
    this.cachedTimes = null;
  }
}

export default new PrayerTimesService();