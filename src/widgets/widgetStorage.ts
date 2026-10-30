import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimes } from '../types';

// Android widget'ı uygulama kapalıyken de çizebilsin diye son veriyi saklıyoruz
const WIDGET_DATA_KEY = 'widget_data';

export interface WidgetStoredData {
  prayerTimes: PrayerTimes;
  cityName: string;
  date: string;
}

export async function saveWidgetData(data: WidgetStoredData): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Widget verisi kaydedilirken hata:', error);
  }
}

export async function getWidgetData(): Promise<WidgetStoredData | null> {
  try {
    const json = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Widget verisi okunurken hata:', error);
    return null;
  }
}

// Widget'larda gösterilen tarih, örn. "30 Ekim 2026"
export function formatWidgetDate(date: Date = new Date()): string {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
