import { NativeModules, Platform } from 'react-native';
import { PrayerTimes } from '../types';

interface IOSWidgetModule {
  updateWidgetData: (data: any) => void;
}

const { IOSWidgetModule } = NativeModules;

class IOSWidgetService {
  static updateWidget(prayerTimes: PrayerTimes, cityName: string): void {
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