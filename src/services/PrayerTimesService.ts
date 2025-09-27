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
  async getPrayerTimes(cityName: string, date?: string): Promise<ApiResponse<PrayerTimes>> {
    try {
      const city = this.getTurkishCities().find(c => c.name === cityName);
      if (!city) {
        return {
          status: 'error',
          message: 'Şehir bulunamadı'
        };
      }

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
    // Türkiye saat dilimi: UTC+3
    const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    return turkeyTime.toISOString().split('T')[0];
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
    const url = `${API_BASE_URL}/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=13&tune=0,0,0,0,0,0,0,0,0`;
    
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
  getTurkishCities(): City[] {
    return [
      { id: '1', name: 'Adana', countryId: 'TR', latitude: 37.0000, longitude: 35.3213 },
      { id: '2', name: 'Adıyaman', countryId: 'TR', latitude: 37.7648, longitude: 38.2786 },
      { id: '3', name: 'Afyonkarahisar', countryId: 'TR', latitude: 38.7507, longitude: 30.5567 },
      { id: '4', name: 'Ağrı', countryId: 'TR', latitude: 39.7191, longitude: 43.0503 },
      { id: '5', name: 'Amasya', countryId: 'TR', latitude: 40.6499, longitude: 35.8353 },
      { id: '6', name: 'Ankara', countryId: 'TR', latitude: 39.9334, longitude: 32.8597 },
      { id: '7', name: 'Antalya', countryId: 'TR', latitude: 36.8969, longitude: 30.7133 },
      { id: '8', name: 'Artvin', countryId: 'TR', latitude: 41.1828, longitude: 41.8183 },
      { id: '9', name: 'Aydın', countryId: 'TR', latitude: 37.8560, longitude: 27.8416 },
      { id: '10', name: 'Balıkesir', countryId: 'TR', latitude: 39.6484, longitude: 27.8826 },
      { id: '11', name: 'Bilecik', countryId: 'TR', latitude: 40.1553, longitude: 29.9833 },
      { id: '12', name: 'Bingöl', countryId: 'TR', latitude: 38.8846, longitude: 40.4989 },
      { id: '13', name: 'Bitlis', countryId: 'TR', latitude: 38.4008, longitude: 42.1232 },
      { id: '14', name: 'Bolu', countryId: 'TR', latitude: 40.5760, longitude: 31.5788 },
      { id: '15', name: 'Burdur', countryId: 'TR', latitude: 37.7267, longitude: 30.2933 },
      { id: '16', name: 'Bursa', countryId: 'TR', latitude: 40.1826, longitude: 29.0665 },
      { id: '17', name: 'Çanakkale', countryId: 'TR', latitude: 40.1553, longitude: 26.4142 },
      { id: '18', name: 'Çankırı', countryId: 'TR', latitude: 40.6013, longitude: 33.6134 },
      { id: '19', name: 'Çorum', countryId: 'TR', latitude: 40.5506, longitude: 34.9556 },
      { id: '20', name: 'Denizli', countryId: 'TR', latitude: 37.7765, longitude: 29.0864 },
      { id: '21', name: 'Diyarbakır', countryId: 'TR', latitude: 37.9144, longitude: 40.2306 },
      { id: '22', name: 'Edirne', countryId: 'TR', latitude: 41.6818, longitude: 26.5623 },
      { id: '23', name: 'Elazığ', countryId: 'TR', latitude: 38.6810, longitude: 39.2264 },
      { id: '24', name: 'Erzincan', countryId: 'TR', latitude: 39.7500, longitude: 39.5000 },
      { id: '25', name: 'Erzurum', countryId: 'TR', latitude: 39.9000, longitude: 41.2700 },
      { id: '26', name: 'Eskişehir', countryId: 'TR', latitude: 39.7767, longitude: 30.5206 },
      { id: '27', name: 'Gaziantep', countryId: 'TR', latitude: 37.0662, longitude: 37.3833 },
      { id: '28', name: 'Giresun', countryId: 'TR', latitude: 40.9128, longitude: 38.3895 },
      { id: '29', name: 'Gümüşhane', countryId: 'TR', latitude: 40.4602, longitude: 39.5086 },
      { id: '30', name: 'Hakkari', countryId: 'TR', latitude: 37.5744, longitude: 43.7408 },
      { id: '31', name: 'Hatay', countryId: 'TR', latitude: 36.4018, longitude: 36.3498 },
      { id: '32', name: 'Isparta', countryId: 'TR', latitude: 37.7648, longitude: 30.5566 },
      { id: '33', name: 'Mersin', countryId: 'TR', latitude: 36.8000, longitude: 34.6333 },
      { id: '34', name: 'İstanbul', countryId: 'TR', latitude: 41.0082, longitude: 28.9784 },
      { id: '35', name: 'İzmir', countryId: 'TR', latitude: 38.4237, longitude: 27.1428 },
      { id: '36', name: 'Kars', countryId: 'TR', latitude: 40.6081, longitude: 43.0975 },
      { id: '37', name: 'Kastamonu', countryId: 'TR', latitude: 41.3887, longitude: 33.7827 },
      { id: '38', name: 'Kayseri', countryId: 'TR', latitude: 38.7312, longitude: 35.4787 },
      { id: '39', name: 'Kırklareli', countryId: 'TR', latitude: 41.7333, longitude: 27.2167 },
      { id: '40', name: 'Kırşehir', countryId: 'TR', latitude: 39.1425, longitude: 34.1709 },
      { id: '41', name: 'Kocaeli', countryId: 'TR', latitude: 40.8533, longitude: 29.8815 },
      { id: '42', name: 'Konya', countryId: 'TR', latitude: 37.8667, longitude: 32.4833 },
      { id: '43', name: 'Kütahya', countryId: 'TR', latitude: 39.4167, longitude: 29.9833 },
      { id: '44', name: 'Malatya', countryId: 'TR', latitude: 38.3552, longitude: 38.3095 },
      { id: '45', name: 'Manisa', countryId: 'TR', latitude: 38.6191, longitude: 27.4289 },
      { id: '46', name: 'Kahramanmaraş', countryId: 'TR', latitude: 37.5858, longitude: 36.9371 },
      { id: '47', name: 'Mardin', countryId: 'TR', latitude: 37.3212, longitude: 40.7245 },
      { id: '48', name: 'Muğla', countryId: 'TR', latitude: 37.2153, longitude: 28.3636 },
      { id: '49', name: 'Muş', countryId: 'TR', latitude: 38.9462, longitude: 41.7539 },
      { id: '50', name: 'Nevşehir', countryId: 'TR', latitude: 38.6939, longitude: 34.6857 },
      { id: '51', name: 'Niğde', countryId: 'TR', latitude: 37.9667, longitude: 34.6833 },
      { id: '52', name: 'Ordu', countryId: 'TR', latitude: 40.9839, longitude: 37.8764 },
      { id: '53', name: 'Rize', countryId: 'TR', latitude: 41.0201, longitude: 40.5234 },
      { id: '54', name: 'Sakarya', countryId: 'TR', latitude: 40.6940, longitude: 30.4358 },
      { id: '55', name: 'Samsun', countryId: 'TR', latitude: 41.2928, longitude: 36.3313 },
      { id: '56', name: 'Siirt', countryId: 'TR', latitude: 37.9333, longitude: 41.9500 },
      { id: '57', name: 'Sinop', countryId: 'TR', latitude: 42.0231, longitude: 35.1531 },
      { id: '58', name: 'Sivas', countryId: 'TR', latitude: 39.7477, longitude: 37.0179 },
      { id: '59', name: 'Tekirdağ', countryId: 'TR', latitude: 40.9833, longitude: 27.5167 },
      { id: '60', name: 'Tokat', countryId: 'TR', latitude: 40.3167, longitude: 36.5500 },
      { id: '61', name: 'Trabzon', countryId: 'TR', latitude: 41.0015, longitude: 39.7178 },
      { id: '62', name: 'Tunceli', countryId: 'TR', latitude: 39.5401, longitude: 39.4388 },
      { id: '63', name: 'Şanlıurfa', countryId: 'TR', latitude: 37.1591, longitude: 38.7969 },
      { id: '64', name: 'Uşak', countryId: 'TR', latitude: 38.6823, longitude: 29.4082 },
      { id: '65', name: 'Van', countryId: 'TR', latitude: 38.4891, longitude: 43.4089 },
      { id: '66', name: 'Yozgat', countryId: 'TR', latitude: 39.8181, longitude: 34.8147 },
      { id: '67', name: 'Zonguldak', countryId: 'TR', latitude: 41.4564, longitude: 31.7987 },
      { id: '68', name: 'Aksaray', countryId: 'TR', latitude: 38.3687, longitude: 34.0370 },
      { id: '69', name: 'Bayburt', countryId: 'TR', latitude: 40.2552, longitude: 40.2249 },
      { id: '70', name: 'Karaman', countryId: 'TR', latitude: 37.1759, longitude: 33.2287 },
      { id: '71', name: 'Kırıkkale', countryId: 'TR', latitude: 39.8468, longitude: 33.5153 },
      { id: '72', name: 'Batman', countryId: 'TR', latitude: 37.8812, longitude: 41.1351 },
      { id: '73', name: 'Şırnak', countryId: 'TR', latitude: 37.4187, longitude: 42.4918 },
      { id: '74', name: 'Bartın', countryId: 'TR', latitude: 41.5811, longitude: 32.4610 },
      { id: '75', name: 'Ardahan', countryId: 'TR', latitude: 41.1105, longitude: 42.7022 },
      { id: '76', name: 'Iğdır', countryId: 'TR', latitude: 39.8880, longitude: 44.0048 },
      { id: '77', name: 'Yalova', countryId: 'TR', latitude: 40.6500, longitude: 29.2667 },
      { id: '78', name: 'Karabük', countryId: 'TR', latitude: 41.2061, longitude: 32.6204 },
      { id: '79', name: 'Kilis', countryId: 'TR', latitude: 36.7184, longitude: 37.1212 },
      { id: '80', name: 'Osmaniye', countryId: 'TR', latitude: 37.2130, longitude: 36.1763 },
      { id: '81', name: 'Düzce', countryId: 'TR', latitude: 40.8438, longitude: 31.1565 }
    ];
  }

  // Cache'i temizle (gerekirse manuel temizlik için)
  clearCache(): void {
    this.cachedTimes = null;
  }
}

export default new PrayerTimesService();