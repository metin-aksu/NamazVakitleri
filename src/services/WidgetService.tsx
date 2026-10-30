import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { PrayerTimes } from '../types';
import {
  PRAYER_TIMES_WIDGET_NAME,
  PrayerTimesWidget,
} from '../widgets/PrayerTimesWidget';
import {
  WidgetStoredData,
  formatWidgetDate,
  getWidgetData,
  saveWidgetData,
} from '../widgets/widgetStorage';

class WidgetService {
  // Widget'ı namaz vakitleri ile güncelle
  static async updateWidget(prayerTimes: PrayerTimes, cityName: string): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      const data: WidgetStoredData = {
        prayerTimes,
        cityName,
        date: formatWidgetDate(),
      };

      console.log('Widget güncelleniyor:', { cityName, date: data.date });
      await saveWidgetData(data);
      await WidgetService.render(data);
    } catch (error) {
      console.error('Widget güncellenirken hata:', error);
    }
  }

  // Widget'ı manuel yenile
  static async refreshWidget(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await WidgetService.render(await getWidgetData());
    } catch (error) {
      console.error('Widget yenilenirken hata:', error);
    }
  }

  private static render(data: WidgetStoredData | null): Promise<void> {
    return requestWidgetUpdate({
      widgetName: PRAYER_TIMES_WIDGET_NAME,
      renderWidget: () => <PrayerTimesWidget data={data} />,
    });
  }
}

export default WidgetService;
