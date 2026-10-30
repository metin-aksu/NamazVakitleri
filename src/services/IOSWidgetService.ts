import { NativeModules, Platform } from 'react-native';
import { PrayerTimes } from '../types';

interface IOSWidgetModule {
  updateWidgetData: (data: any) => void;
}

const { IOSWidgetModule } = NativeModules;

class IOSWidgetService {
  // Widget'ı namaz vakitleri ile güncelle
  static updateWidget(prayerTimes: PrayerTimes, cityName: string): void {
    if (Platform.OS !== 'ios') {
      console.log('🕌 IOSWidgetService: Not iOS, skipping');
      return;
    }
    
    console.log('🕌 IOSWidgetService.updateWidget called with cityName:', cityName);
    console.log('🕌 IOSWidgetService.updateWidget prayerTimes:', JSON.stringify(prayerTimes));
    try {
      console.log('🕌 IOSWidgetModule available:', !!IOSWidgetModule);
      console.log('🕌 updateWidgetData available:', !!IOSWidgetModule?.updateWidgetData);
      console.log('🕌 IOSWidgetModule:', IOSWidgetModule);
      
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

        console.log('🕌 Sending widget data:', JSON.stringify(widgetData));
        // Note: The native module exports 'updateWidgetData', not 'updateWidget'
        IOSWidgetModule.updateWidgetData(widgetData);
        console.log('🕌 Widget data sent successfully');
      } else {
        console.warn('❌ IOSWidgetModule or updateWidgetData not found');
        console.warn('❌ NativeModules:', JSON.stringify(Object.keys(NativeModules)));
      }
    } catch (error) {
      console.error('❌ iOS Widget güncellenirken hata:', error);
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