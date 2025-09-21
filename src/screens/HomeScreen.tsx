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
          await loadPrayerTimes(settings.selectedCity.name);
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

  const loadPrayerTimes = async (cityName: string) => {
    try {
      const response = await PrayerTimesService.getPrayerTimes(cityName);
      
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
          Alert.alert('Bilgi', 'Önbelleğe alınmış vakitler gösteriliyor.');
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
    await loadPrayerTimes(userSettings.selectedCity.name);
    // Widget'ı manuel yenile
    WidgetService.refreshWidget();
    setRefreshing(false);
  };

  const formatTime = (time: string): string => {
    return time.substring(0, 5);
  };

  // const getNextPrayer = () => {
  //   if (!prayerTimes) return null;
    
  //   const now = new Date();
  //   const currentTime = now.getHours() * 60 + now.getMinutes();
    
  //   const prayers = [
  //     { name: 'İmsak', time: prayerTimes.fajr },
  //     { name: 'Öğle', time: prayerTimes.dhuhr },
  //     { name: 'İkindi', time: prayerTimes.asr },
  //     { name: 'Akşam', time: prayerTimes.maghrib },
  //     { name: 'Yatsı', time: prayerTimes.isha },
  //   ];
    
  //   for (const prayer of prayers) {
  //     const [hours, minutes] = prayer.time.split(':').map(Number);
  //     const prayerMinutes = hours * 60 + minutes;
      
  //     if (prayerMinutes > currentTime) {
  //       return prayer;
  //     }
  //   }
    
  //   // Eğer günün son namazı geçtiyse, ertesi gün İmsak
  //   return { name: 'İmsak', time: prayerTimes.fajr };
  // };

  const changeCity = () => {
    navigation.navigate('CitySelection');
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
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.cityName}>
              {userSettings?.selectedCity?.name || 'Şehir Seçilmedi'}
            </Text>
            <TouchableOpacity onPress={changeCity} style={styles.changeCityButton}>
              <Text style={styles.changeCityText}>Değiştir</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.currentDate}>{currentDate}</Text>
        </View>

        {/* Detaylı Vakitler */}
        {prayerTimes && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Detaylı Vakitler</Text>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>İmsak</Text>
              <Text style={styles.detailTime}>{formatTime(prayerTimes.fajr)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Güneş</Text>
              <Text style={styles.detailTime}>{formatTime(prayerTimes.sunrise)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Öğle</Text>
              <Text style={styles.detailTime}>{formatTime(prayerTimes.dhuhr)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>İkindi</Text>
              <Text style={styles.detailTime}>{formatTime(prayerTimes.asr)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Akşam</Text>
              <Text style={styles.detailTime}>{formatTime(prayerTimes.maghrib)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Yatsı</Text>
              <Text style={styles.detailTime}>{formatTime(prayerTimes.isha)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F4C75',
    paddingTop: StatusBar.currentHeight,
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
  nextPrayerHighlight: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
  },
  nextPrayerLabel: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  nextPrayerName: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  nextPrayerTime: {
    color: '#FFD700',
    fontSize: 15,
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
  },
  detailTime: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;