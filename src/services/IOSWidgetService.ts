import { NativeModules, Platform } from 'react-native';
import { PrayerTimes } from '../types';

interface IOSWidgetModule {
  updateWidgetData: (data: any) => void;
}

const { IOSWidgetModule } = NativeModules;

class IOSWidgetService {
  // Widget'ı namaz vakitleri ile güncelle
  static updateWidget(prayerTimes: PrayerTimes, cityName: string): void {
    try {
      if (IOSWidgetModule && IOSWidgetModule.updateWidgetData) {
        // Türkiye saat dilimi ile güncel tarihi al
        const now = new Date();
        const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
        const formattedDate = turkeyTime.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        const widgetData = {
          timings: {
            "Imsak": prayerTimes.fajr,
            "Sunrise": prayerTimes.sunrise,
            "Dhuhr": prayerTimes.dhuhr,
            "Asr": prayerTimes.asr,
            "Maghrib": prayerTimes.maghrib,
            "Isha": prayerTimes.isha
          },
          cityName: cityName,
          date: formattedDate
        };

        // Note: The native module exports 'updateWidgetData', not 'updateWidget'
        IOSWidgetModule.updateWidgetData(widgetData);
      } else {
        console.warn('IOSWidgetModule or updateWidgetData not found');
      }
    } catch (error) {
      console.error('iOS Widget güncellenirken hata:', error);
    }
  }

  static updateWidgetLegacy(prayerTimes: PrayerTimes, cityName: string): void {
    if (Platform.OS !== 'ios') {
      return;
    }

    if (!IOSWidgetModule) {
      console.warn('iOS Widget Module not available');
      return;
    }

    try {
      const widgetData = {
        timings: prayerTimes.timings,
        cityName: cityName,
        date: prayerTimes.date?.readable || new Date().toLocaleDateString('tr-TR'),
      };

      IOSWidgetModule.updateWidgetData(widgetData);
      console.log('iOS Widget updated successfully');
    } catch (error) {
      console.error('Error updating iOS widget:', error);
    }
  }
}

export default IOSWidgetService;