import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { PrayerTimes, UserSettings } from '../types';
import PrayerTimesService from '../services/PrayerTimesService';
import StorageService from '../services/StorageService';
import WidgetService from '../services/WidgetService';
import IOSWidgetService from '../services/IOSWidgetService';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const settings = await StorageService.getUserSettings();
        setUserSettings(settings);

        if (settings && settings.selectedCity) {
          await loadPrayerTimes(settings.selectedCity);
        } else {
          navigation.replace('CitySelection');
        }
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    updateCurrentDate();
  }, [navigation]);

  const updateCurrentDate = () => {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formattedDate);
  };

  const loadPrayerTimes = async (cityOrName: string | any) => {
    try {
      const cityName = typeof cityOrName === 'string' ? cityOrName : cityOrName.name;
      const response = await PrayerTimesService.getPrayerTimes(cityOrName);

      if (response.status === 'success' && response.data) {
        setPrayerTimes(response.data);
        await StorageService.saveLastPrayerTimes(response.data);

        // Widget'ları güncelle (Android & iOS)
        WidgetService.updateWidget(response.data, cityName);
        IOSWidgetService.updateWidget(response.data, cityName);
      } else {
        // Cache'den veri al
        const cachedTimes = await StorageService.getLastPrayerTimes();
        if (cachedTimes) {
          setPrayerTimes(cachedTimes);
          WidgetService.updateWidget(cachedTimes, cityName);
          IOSWidgetService.updateWidget(cachedTimes, cityName);
          // Alert.alert('Bilgi', 'Önbelleğe alınmış vakitler gösteriliyor.');
        } else {
          Alert.alert('Hata', response.message || 'Namaz vakitleri alınamadı.');
        }
      }
    } catch (error) {
      console.error('Namaz vakitleri yüklenirken hata:', error);
      Alert.alert('Hata', 'Namaz vakitleri yüklenirken bir hata oluştu.');
    }
  };

  const onRefresh = async () => {
    if (!userSettings?.selectedCity) return;

    setRefreshing(true);
    // Cache'i temizle
    PrayerTimesService.clearCache();
    await loadPrayerTimes(userSettings.selectedCity);
    // Widget'ı manuel yenile
    WidgetService.refreshWidget();
    setRefreshing(false);
  };

  const formatTime = (time: string): string => {
    return time.substring(0, 5);
  };

  // Sıradaki namaz vaktini bul
  const getNextPrayer = (): string | null => {
    if (!prayerTimes) return null;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'İmsak', time: prayerTimes.fajr },
      { name: 'Güneş', time: prayerTimes.sunrise },
      { name: 'Öğle', time: prayerTimes.dhuhr },
      { name: 'İkindi', time: prayerTimes.asr },
      { name: 'Akşam', time: prayerTimes.maghrib },
      { name: 'Yatsı', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;

      if (prayerMinutes > currentTime) {
        return prayer.name;
      }
    }

    return 'İmsak'; // Eğer günün son namazı geçtiyse, ertesi gün İmsak
  };

  // Vakite kalan süreyi hesapla
  const getTimeRemaining = (prayerTime: string): string => {
    const now = new Date();
    const [hours, minutes] = prayerTime.split(':').map(Number);

    const prayerDate = new Date();
    prayerDate.setHours(hours, minutes, 0, 0);

    // Eğer vakit geçmişse, ertesi güne ayarla
    if (prayerDate <= now) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }

    const diffMs = prayerDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${String(diffHours).padStart(2, '0')}:${String(
      diffMinutes,
    ).padStart(2, '0')}`;
  };

  const changeCity = () => {
    navigation.navigate('CitySelection');
  };

  const openWebsite = () => {
    Linking.openURL('https://www.metinaksu.com').catch(err => {
      console.error('Web sitesi açılırken hata:', err);
      Alert.alert('Hata', 'Web sitesi açılamadı.');
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3282B8" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4C75" />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.cityName}>
              {userSettings?.selectedCity?.name || 'Şehir Seçilmedi'}
            </Text>
            <TouchableOpacity
              onPress={changeCity}
              style={styles.changeCityButton}
            >
              <Text style={styles.changeCityText}>Değiştir</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.currentDate}>{currentDate}</Text>

          <TouchableOpacity style={styles.headerQiblaButton} onPress={() => navigation.navigate('QiblaCompass')}>
            <Text style={styles.qiblaButtonText}>🧭 Kıble'yi Bul</Text>
          </TouchableOpacity>
        </View>

        {/* Detaylı Vakitler */}
        {prayerTimes && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Detaylı Vakitler</Text>

            <View
              style={[
                styles.detailItem,
                getNextPrayer() === 'İmsak' && styles.nextPrayerItem,
              ]}
            >
              <Text
                style={[
                  styles.detailLabel,
                  getNextPrayer() === 'İmsak' && styles.nextPrayerLabel,
                ]}
              >
                İmsak
              </Text>
              <View style={styles.middleSection}>
                {getNextPrayer() === 'İmsak' && (
                  <Text style={styles.remainingTime}>
                    {getTimeRemaining(prayerTimes.fajr)}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.detailTime,
                  getNextPrayer() === 'İmsak' && styles.nextPrayerTime,
                ]}
              >
                {formatTime(prayerTimes.fajr)}
              </Text>
            </View>

            <View
              style={[
                styles.detailItem,
                getNextPrayer() === 'Güneş' && styles.nextPrayerItem,
              ]}
            >
              <Text
                style={[
                  styles.detailLabel,
                  getNextPrayer() === 'Güneş' && styles.nextPrayerLabel,
                ]}
              >
                Güneş
              </Text>
              <View style={styles.middleSection}>
                {getNextPrayer() === 'Güneş' && (
                  <Text style={styles.remainingTime}>
                    {getTimeRemaining(prayerTimes.sunrise)}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.detailTime,
                  getNextPrayer() === 'Güneş' && styles.nextPrayerTime,
                ]}
              >
                {formatTime(prayerTimes.sunrise)}
              </Text>
            </View>

            <View
              style={[
                styles.detailItem,
                getNextPrayer() === 'Öğle' && styles.nextPrayerItem,
              ]}
            >
              <Text
                style={[
                  styles.detailLabel,
                  getNextPrayer() === 'Öğle' && styles.nextPrayerLabel,
                ]}
              >
                Öğle
              </Text>
              <View style={styles.middleSection}>
                {getNextPrayer() === 'Öğle' && (
                  <Text style={styles.remainingTime}>
                    {getTimeRemaining(prayerTimes.dhuhr)}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.detailTime,
                  getNextPrayer() === 'Öğle' && styles.nextPrayerTime,
                ]}
              >
                {formatTime(prayerTimes.dhuhr)}
              </Text>
            </View>

            <View
              style={[
                styles.detailItem,
                getNextPrayer() === 'İkindi' && styles.nextPrayerItem,
              ]}
            >
              <Text
                style={[
                  styles.detailLabel,
                  getNextPrayer() === 'İkindi' && styles.nextPrayerLabel,
                ]}
              >
                İkindi
              </Text>
              <View style={styles.middleSection}>
                {getNextPrayer() === 'İkindi' && (
                  <Text style={styles.remainingTime}>
                    {getTimeRemaining(prayerTimes.asr)}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.detailTime,
                  getNextPrayer() === 'İkindi' && styles.nextPrayerTime,
                ]}
              >
                {formatTime(prayerTimes.asr)}
              </Text>
            </View>

            <View
              style={[
                styles.detailItem,
                getNextPrayer() === 'Akşam' && styles.nextPrayerItem,
              ]}
            >
              <Text
                style={[
                  styles.detailLabel,
                  getNextPrayer() === 'Akşam' && styles.nextPrayerLabel,
                ]}
              >
                Akşam
              </Text>
              <View style={styles.middleSection}>
                {getNextPrayer() === 'Akşam' && (
                  <Text style={styles.remainingTime}>
                    {getTimeRemaining(prayerTimes.maghrib)}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.detailTime,
                  getNextPrayer() === 'Akşam' && styles.nextPrayerTime,
                ]}
              >
                {formatTime(prayerTimes.maghrib)}
              </Text>
            </View>

            <View
              style={[
                styles.detailItem,
                getNextPrayer() === 'Yatsı' && styles.nextPrayerItem,
              ]}
            >
              <Text
                style={[
                  styles.detailLabel,
                  getNextPrayer() === 'Yatsı' && styles.nextPrayerLabel,
                ]}
              >
                Yatsı
              </Text>
              <View style={styles.middleSection}>
                {getNextPrayer() === 'Yatsı' && (
                  <Text style={styles.remainingTime}>
                    {getTimeRemaining(prayerTimes.isha)}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.detailTime,
                  getNextPrayer() === 'Yatsı' && styles.nextPrayerTime,
                ]}
              >
                {formatTime(prayerTimes.isha)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>



      <View style={styles.footer}>
        <TouchableOpacity onPress={openWebsite}>
          <Text style={styles.footerText}>Metin AKSU - metinaksu.com</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F4C75',
    paddingTop: StatusBar.currentHeight,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F4C75',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cityName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  changeCityButton: {
    backgroundColor: '#3282B8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeCityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  currentDate: {
    color: '#BBE1FA',
    fontSize: 16,
  },
  // Widget Styles
  widgetContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  widgetHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  prayerTimesGrid: {
    flex: 1,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prayerColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  prayerLabel: {
    color: '#BBE1FA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  prayerTime: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Details Styles
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  detailsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    color: '#BBE1FA',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  middleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingTime: {
    color: '#ECF0F1',
    fontSize: 14,
    fontWeight: '600',
  },
  detailTime: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#0F4C75',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 50,
  },
  footerText: {
    color: '#BBE1FA',
    fontSize: 14,
    opacity: 0.8,
  },
  // next prayer style start
  nextPrayerItem: {
    backgroundColor: 'rgba(9, 164, 241, 0.3)',
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderRadius: 8,
  },
  nextPrayerTime: {
    color: '#ECF0F1',
  },
  nextPrayerLabel: {
    color: '#ECF0F1',
    fontWeight: '600',
  },
  // next prayer style end
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerQiblaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  qiblaButtonText: {
    color: '#FFD700', // Gold color for visibility
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
