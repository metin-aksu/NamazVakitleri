export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  latitude: number;
  longitude: number;
}

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface UserSettings {
  selectedCity: City | null;
  isOnboardingCompleted: boolean;
  notificationsEnabled: boolean;
  selectedCalculationMethod: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message: string;
}

export interface WidgetData {
  cityName: string;
  prayerTimes: PrayerTimes;
  nextPrayer: {
    name: string;
    time: string;
    remaining: string;
  };
  lastUpdated: string;
}