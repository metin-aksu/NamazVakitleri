import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { City } from '../types';
import PrayerTimesService from '../services/PrayerTimesService';
import StorageService from '../services/StorageService';

interface CitySelectionScreenProps {
  navigation: any;
}

const CitySelectionScreen: React.FC<CitySelectionScreenProps> = ({ navigation }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const turkishCities = PrayerTimesService.getTurkishCities();
    setCities(turkishCities);
    setFilteredCities(turkishCities);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCities(cities);
      return;
    }

    const filtered = cities.filter(city =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCities(filtered);
  }, [searchQuery, cities]);

  const selectCity = async (city: City) => {
    try {
      // Şehri kaydet
      await StorageService.saveSelectedCity(city);
      
      // Kullanıcı ayarlarını güncelle
      const settings = {
        selectedCity: city,
        isOnboardingCompleted: true,
        notificationsEnabled: true,
        selectedCalculationMethod: 13, // Diyanet
      };
      
      await StorageService.saveUserSettings(settings);
      await StorageService.setOnboardingCompleted();

      // Ana ekrana geç
      navigation.replace('Home');
    } catch (error) {
      console.error('Şehir seçilirken hata:', error);
    }
  };

  const renderCityItem = ({ item }: { item: City }) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => selectCity(item)}
    >
      <Text style={styles.cityName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4C75" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Türkiye - Şehir Seçimi</Text>
        <Text style={styles.headerSubtitle}>
          Yaşadığınız şehri seçin
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Şehir ara..."
          placeholderTextColor="#BBE1FA"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredCities}
        renderItem={renderCityItem}
        keyExtractor={(item) => item.id}
        style={styles.cityList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F4C75',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#BBE1FA',
    fontSize: 16,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#BBE1FA',
  },
  cityList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cityItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3282B8',
  },
  cityName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CitySelectionScreen;