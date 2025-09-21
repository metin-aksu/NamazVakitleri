import { NativeModules } from 'react-native';
import { PrayerTimes } from '../types';

const { WidgetModule } = NativeModules;

class WidgetService {
  // Widget'ı namaz vakitleri ile güncelle
  static updateWidget(prayerTimes: PrayerTimes, cityName: string): void {
    try {
      if (WidgetModule && WidgetModule.updateWidget) {
        WidgetModule.updateWidget(prayerTimes, cityName);
      }
    } catch (error) {
      console.error('Widget güncellenirken hata:', error);
    }
  }

  // Widget'ı manuel yenile
  static refreshWidget(): void {
    try {
      if (WidgetModule && WidgetModule.refreshWidget) {
        WidgetModule.refreshWidget();
      }
    } catch (error) {
      console.error('Widget yenilenirken hata:', error);
    }
  }

  // Widget'ın desteklenip desteklenmediğini kontrol et
  static isWidgetSupported(): boolean {
    return WidgetModule && WidgetModule.updateWidget ? true : false;
  }
}

export default WidgetService;