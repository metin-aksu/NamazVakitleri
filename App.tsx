import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import CitySelectionScreen from './src/screens/CitySelectionScreen';
import StorageService from './src/services/StorageService';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const settings = await StorageService.getUserSettings();
        if (settings && settings.isOnboardingCompleted && settings.selectedCity) {
          setIsOnboardingCompleted(true);
        }
      } catch (error) {
        console.error('Onboarding durumu kontrol edilirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  if (isLoading) {
    return null; // Splash screen yerine
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0F4C75" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={isOnboardingCompleted ? 'Home' : 'CitySelection'}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CitySelection" component={CitySelectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
