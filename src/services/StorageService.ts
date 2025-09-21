import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, PrayerTimes, City } from '../types';

class StorageService {
  private static readonly USER_SETTINGS_KEY = 'user_settings';
  private static readonly PRAYER_TIMES_CACHE_KEY = 'prayer_times_cache';

  // Kullanıcı ayarlarını getir
  async getUserSettings(): Promise<UserSettings | null> {
    try {
      const settingsJson = await AsyncStorage.getItem(StorageService.USER_SETTINGS_KEY);
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      return null;
    } catch (error) {
      console.error('Kullanıcı ayarları getirilirken hata:', error);
      return null;
    }
  }

  // Kullanıcı ayarlarını kaydet
  async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      const settingsJson = JSON.stringify(settings);
      await AsyncStorage.setItem(StorageService.USER_SETTINGS_KEY, settingsJson);
    } catch (error) {
      console.error('Kullanıcı ayarları kaydedilirken hata:', error);
      throw error;
    }
  }

  // Seçili şehri kaydet
  async saveSelectedCity(city: City): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const newSettings: UserSettings = {
        selectedCity: city,
        isOnboardingCompleted: true,
        notificationsEnabled: currentSettings?.notificationsEnabled ?? true,
        selectedCalculationMethod: currentSettings?.selectedCalculationMethod ?? 13, // Diyanet
      };
      await this.saveUserSettings(newSettings);
    } catch (error) {
      console.error('Şehir kaydedilirken hata:', error);
      throw error;
    }
  }

  // Seçili şehri getir
  async getSelectedCity(): Promise<City | null> {
    try {
      const settings = await this.getUserSettings();
      return settings?.selectedCity || null;
    } catch (error) {
      console.error('Seçili şehir getirilirken hata:', error);
      return null;
    }
  }

  // Namaz vakitlerini cache'le
  async cachePrayerTimes(cityId: string, prayerTimes: PrayerTimes): Promise<void> {
    try {
      const cacheKey = `${StorageService.PRAYER_TIMES_CACHE_KEY}_${cityId}`;
      const cacheData = {
        prayerTimes,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Namaz vakitleri cache edilirken hata:', error);
    }
  }

  // Cache'den namaz vakitlerini getir
  async getCachedPrayerTimes(cityId: string): Promise<PrayerTimes | null> {
    try {
      const cacheKey = `${StorageService.PRAYER_TIMES_CACHE_KEY}_${cityId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const today = new Date().toISOString().split('T')[0];
        
        // Eğer bugünün verisi ise döndür
        if (parsed.date === today) {
          return parsed.prayerTimes;
        }
      }
      return null;
    } catch (error) {
      console.error('Cache\'den namaz vakitleri getirilirken hata:', error);
      return null;
    }
  }

  // Onboarding tamamlandı olarak işaretle
  async markOnboardingCompleted(): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      if (currentSettings) {
        currentSettings.isOnboardingCompleted = true;
        await this.saveUserSettings(currentSettings);
      }
    } catch (error) {
      console.error('Onboarding durumu güncellenirken hata:', error);
      throw error;
    }
  }

  // Onboarding tamamlandı durumunu ayarla
  async setOnboardingCompleted(): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings();
      const newSettings: UserSettings = {
        selectedCity: currentSettings?.selectedCity || null,
        isOnboardingCompleted: true,
        notificationsEnabled: currentSettings?.notificationsEnabled ?? true,
        selectedCalculationMethod: currentSettings?.selectedCalculationMethod ?? 13, // Diyanet
      };
      await this.saveUserSettings(newSettings);
    } catch (error) {
      console.error('Onboarding durumu ayarlanırken hata:', error);
      throw error;
    }
  }

  // Son namaz vakitlerini kaydet
  async saveLastPrayerTimes(prayerTimes: PrayerTimes): Promise<void> {
    try {
      const cacheData = {
        prayerTimes,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      };
      await AsyncStorage.setItem('last_prayer_times', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Son namaz vakitleri kaydedilirken hata:', error);
      throw error;
    }
  }

  // Son namaz vakitlerini getir
  async getLastPrayerTimes(): Promise<PrayerTimes | null> {
    try {
      const cachedData = await AsyncStorage.getItem('last_prayer_times');
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return parsed.prayerTimes;
      }
      return null;
    } catch (error) {
      console.error('Son namaz vakitleri getirilirken hata:', error);
      return null;
    }
  }

  // Tüm verileri temizle
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Veriler temizlenirken hata:', error);
      throw error;
    }
  }
}

export default new StorageService();