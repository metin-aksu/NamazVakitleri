import { Platform } from 'react-native';
import { ExtensionStorage } from '@bacons/apple-targets';
import { PrayerTimes } from '../types';
import { formatWidgetDate } from '../widgets/widgetStorage';

// Widget eklentisi (targets/widget) bu App Group'taki UserDefaults'u okur
const APP_GROUP = 'group.com.metinaksu.namazvakitleri';

class IOSWidgetService {
  private static storage: ExtensionStorage | null = null;

  // Widget'ı namaz vakitleri ile güncelle
  static updateWidget(prayerTimes: PrayerTimes, cityName: string): void {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      IOSWidgetService.storage ??= new ExtensionStorage(APP_GROUP);
      const storage = IOSWidgetService.storage;

      // Anahtarlar PrayerTimesWidget.swift'teki loadPrayerTimesFromUserDefaults ile aynı olmalı
      storage.set('imsak', prayerTimes.fajr);
      storage.set('sunrise', prayerTimes.sunrise);
      storage.set('dhuhr', prayerTimes.dhuhr);
      storage.set('asr', prayerTimes.asr);
      storage.set('maghrib', prayerTimes.maghrib);
      storage.set('isha', prayerTimes.isha);
      storage.set('cityName', cityName);
      storage.set('date', formatWidgetDate());

      ExtensionStorage.reloadWidget();
    } catch (error) {
      console.error('❌ iOS Widget güncellenirken hata:', error);
    }
  }
}

export default IOSWidgetService;
