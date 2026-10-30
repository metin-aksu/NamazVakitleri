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
  BackHandler,
} from 'react-native';
import { City, District } from '../types';
import PrayerTimesService from '../services/PrayerTimesService';
import StorageService from '../services/StorageService';

interface CitySelectionScreenProps {
  navigation: any;
}

const CitySelectionScreen: React.FC<CitySelectionScreenProps> = ({ navigation }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]); // Cities or Districts
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [step, setStep] = useState<'city' | 'district'>('city');

  useEffect(() => {
    const turkishCities = PrayerTimesService.getTurkishCities();
    setCities(turkishCities);
    setFilteredItems(turkishCities);
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      if (step === 'district') {
        setStep('city');
        setSelectedCity(null);
        setSearchQuery('');
        setFilteredItems(cities);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [step, cities]);

  useEffect(() => {
    let sourceData = step === 'city' ? cities : (selectedCity?.districts || []);

    if (!searchQuery.trim()) {
      setFilteredItems(sourceData);
      return;
    }

    const filtered = sourceData.filter((item: any) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchQuery, step, selectedCity, cities]);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setStep('district');
    setSearchQuery('');
    setFilteredItems(city.districts || []);
  };

  const handleDistrictSelect = async (district: District) => {
    if (!selectedCity) return;

    try {
      // Create a composite City object for the selected district
      const cityForStorage: City = {
        id: `${selectedCity.id}-${district.slug}`,
        name: `${selectedCity.name} / ${district.name}`,
        countryId: 'TR',
        latitude: district.latitude,
        longitude: district.longitude,
      };

      // Şehri kaydet
      await StorageService.saveSelectedCity(cityForStorage);

      // Kullanıcı ayarlarını güncelle
      const settings = {
        selectedCity: cityForStorage,
        isOnboardingCompleted: true,
        notificationsEnabled: true,
        selectedCalculationMethod: 13, // Diyanet
      };

      await StorageService.saveUserSettings(settings);
      await StorageService.setOnboardingCompleted();

      // Ana ekrana geç
      navigation.replace('Home');
    } catch (error) {
      console.error('İlçe seçilirken hata:', error);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => step === 'city' ? handleCitySelect(item) : handleDistrictSelect(item)}
    >
      <Text style={styles.cityName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4C75" />

      <View style={styles.header}>
        {step === 'district' && (
          <TouchableOpacity
            onPress={() => {
              setStep('city');
              setSelectedCity(null);
              setSearchQuery('');
              setFilteredItems(cities);
            }}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>{'< Ger '}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {step === 'city' ? 'Şehir Seçimi' : `${selectedCity?.name} - İlçe Seçimi`}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={step === 'city' ? "Şehir ara..." : "İlçe ara..."}
          placeholderTextColor="#BBE1FA"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.slug || item.id}
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
    paddingTop: StatusBar.currentHeight,
  },
  header: {
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 35,
    padding: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
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